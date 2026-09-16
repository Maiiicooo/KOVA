/* Shared, dependency-free adapter. Capacitor injects its bridge before this script.
 * The website keeps browser APIs; Android and iOS use the official plugins. */
(() => {
  'use strict';
  const cap = window.Capacitor;
  const native = Boolean(cap?.isNativePlatform());
  const android = native && cap.getPlatform() === 'android';
  const plugin = (name) => native ? cap.registerPlugin(name) : null;
  const App = plugin('App');
  const Geo = plugin('Geolocation');
  const Network = plugin('Network');
  const Preferences = plugin('Preferences');
  const Camera = plugin('Camera');
  const Browser = plugin('Browser');
  const Share = plugin('Share');
  const Keyboard = plugin('Keyboard');
  const Splash = plugin('SplashScreen');
  const report = (error) => console.warn('KOVA device:', error?.message || error);
  const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

  function locationError(error) {
    const original = String(error?.code || '');
    let code = 2;
    let reason = 'unavailable';
    let message = 'No location available. Try outside or choose a place on the map.';
    if (original === 'OS-PLUG-GLOC-0003' || original === '1') {
      code = 1; reason = 'denied';
      message = 'Location access was denied. You can enable it in app settings or use the map manually.';
    } else if (original === 'OS-PLUG-GLOC-0008') {
      code = 1; reason = 'restricted';
      message = 'Location access is restricted on this device. You can still use the map manually.';
    } else if (['OS-PLUG-GLOC-0007', 'OS-PLUG-GLOC-0009', 'OS-PLUG-GLOC-0017'].includes(original)) {
      reason = 'disabled'; message = 'Location services are off. Enable Location on your phone or use the map manually.';
    } else if (original === 'OS-PLUG-GLOC-0010' || original === '3') {
      code = 3; reason = 'timeout'; message = 'Finding your location took too long. Try again outside.';
    }
    return { code, reason, message, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
  }

  async function currentPosition(options = {}) {
    let permission = await Geo.checkPermissions();
    const granted = () => permission.location === 'granted' || permission.coarseLocation === 'granted';
    if (!granted() && [permission.location, permission.coarseLocation].some(p => p === 'prompt' || p === 'prompt-with-rationale')) {
      permission = await Geo.requestPermissions({ permissions: ['location'] });
    }
    if (!granted()) throw { code: 'OS-PLUG-GLOC-0003' };
    const timeout = Number.isFinite(options.timeout) && options.timeout > 0 ? options.timeout : 15000;
    let timer;
    try {
      return await Promise.race([
        Geo.getCurrentPosition({ ...options, timeout, enableHighAccuracy: Boolean(options.enableHighAccuracy && permission.location === 'granted') }),
        new Promise((_, reject) => { timer = setTimeout(() => reject({ code: 'OS-PLUG-GLOC-0010' }), timeout + 2000); }),
      ]);
    } finally { clearTimeout(timer); }
  }

  const device = window.KovaDevice = {
    native,
    network: { connected: navigator.onLine, connectionType: 'unknown' },
    geolocation: native ? {
      getCurrentPosition(success, failure, options) {
        // Keep callback exceptions separate from location failures.
        currentPosition(options).then(success, error => {
          const normalized = locationError(error);
          emit('kova:location-error', normalized);
          failure?.(normalized);
        }).catch(report);
      },
    } : navigator.geolocation,
    async openExternal(value) {
      const url = new URL(value, location.href);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Unsupported external link');
      if (native) {
        if (url.protocol !== 'https:') throw new Error('KOVA only opens secure external web links.');
        await Browser.open({ url: url.href });
      } else window.open(url.href, '_blank', 'noopener,noreferrer');
    },
    async share(data) {
      if (native) return Share.share(data);
      if (navigator.share) return navigator.share(data);
      await navigator.clipboard.writeText(data.url || data.text);
    },
    locationError,
  };

  if (!native) return;
  document.documentElement.classList.add('kova-native');
  // Native-only preferences store transient photo/form recovery, not Firestore data.
  const draftKey = 'kova.native.photoDraft.v1';
  async function savePhotoDraft(input) {
    const values = {};
    input.form?.querySelectorAll('input, textarea, select').forEach(field => {
      if (field.id && !['file', 'password', 'hidden', 'submit', 'button'].includes(field.type)) {
        values[field.id] = ['radio', 'checkbox'].includes(field.type) ? field.checked : field.value;
      }
    });
    await Preferences.set({ key: draftKey, value: JSON.stringify({ path: location.pathname, inputId: input.id, values, at: Date.now() }) });
  }
  async function applyPhoto(photo, input) {
    const webPath = photo?.webPath || (photo?.uri && cap.convertFileSrc(photo.uri));
    if (!webPath || !input) throw new Error('No photo was returned. Please choose it again.');
    const response = await fetch(webPath);
    if (!response.ok) throw new Error('Unable to read the selected photo.');
    const blob = await response.blob();
    const files = new DataTransfer();
    files.items.add(new File([blob], `kova-${Date.now()}.${photo.format || 'jpeg'}`, { type: blob.type || 'image/jpeg' }));
    input.files = files.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function notice(message) {
    let box = document.getElementById('kovaDeviceNotice');
    if (!box) {
      box = document.createElement('button');
      box.id = 'kovaDeviceNotice'; box.type = 'button'; box.setAttribute('role', 'status');
      box.addEventListener('click', () => box.remove()); document.body.append(box);
    }
    box.textContent = message;
  }
  document.addEventListener('DOMContentLoaded', () => {
    const listen = (p, name, callback) => p.addListener(name, callback).catch(report);
    const updateNetwork = status => {
      device.network = status;
      document.documentElement.classList.toggle('kova-offline', !status.connected);
      let banner = document.getElementById('kovaNetworkStatus');
      if (!banner) {
        banner = document.createElement('div'); banner.id = 'kovaNetworkStatus';
        banner.setAttribute('role', 'status'); document.body.append(banner);
      }
      banner.hidden = status.connected;
      banner.textContent = 'Offline — maps and new spots need an internet connection.';
      emit('kova:network-change', status);
    };
    listen(Network, 'networkStatusChange', updateNetwork);
    Network.getStatus().then(updateNetwork).catch(report);
    listen(App, 'appStateChange', ({ isActive }) => {
      if (isActive) Network.getStatus().then(updateNetwork).catch(report);
    });
    if (android) listen(App, 'backButton', ({ canGoBack }) => {
      const event = new CustomEvent('kova:back', { cancelable: true });
      if (!window.dispatchEvent(event)) return;
      if (canGoBack) history.back();
      else if (!['/', '/index.html'].includes(location.pathname)) location.replace('/index.html');
      else App.minimizeApp().catch(report);
    });
    listen(Keyboard, 'keyboardDidShow', () => {
      document.activeElement?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    });
    if (android) listen(App, 'appRestoredResult', async result => {
      if (result.pluginId !== 'Camera') return;
      try {
        const { value } = await Preferences.get({ key: draftKey });
        const draft = value && JSON.parse(value);
        if (!result.success || !draft || Date.now() - draft.at > 3600000) {
          notice('Photo capture was interrupted. Please choose your photo again.'); return;
        }
        if (draft.path !== location.pathname) {
          notice('Photo capture was interrupted. Reopen the form and choose your photo again.'); return;
        }
        for (const [id, value] of Object.entries(draft.values)) {
          const field = document.getElementById(id);
          if (!field) continue;
          if (typeof value === 'boolean') field.checked = value; else field.value = value;
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
        await applyPhoto(result.data?.results?.[0] || result.data, document.getElementById(draft.inputId));
      } catch (error) { notice(error.message); }
      finally { await Preferences.remove({ key: draftKey }).catch(report); }
    });
    document.querySelectorAll('input[type="file"][accept*="image"]').forEach(input => {
      for (const source of ['camera', 'gallery']) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'kova-native-photo'; button.textContent = source === 'camera' ? 'Take photo' : 'Choose photo';
      input.after(button);
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await savePhotoDraft(input);
          // Android launches the system camera/picker: no CAMERA/storage permission needed.
          const photo = source === 'camera'
            ? await Camera.takePhoto({ quality: 90, saveToGallery: false, correctOrientation: true })
            : (await Camera.chooseFromGallery({ mediaType: 0, allowMultipleSelection: false })).results[0];
          await applyPhoto(photo, input);
        } catch (error) {
          if (!/cancel/i.test(error.message || '')) notice('Photo unavailable. You can retry or use the file chooser.');
        } finally {
          button.disabled = false;
          await Preferences.remove({ key: draftKey }).catch(report);
        }
      });
      }
    });
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link || event.defaultPrevented || link.hasAttribute('download')) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin && ['http:', 'https:'].includes(url.protocol)) {
        event.preventDefault(); device.openExternal(url.href).catch(error => notice(error.message));
      }
    });
    requestAnimationFrame(() => requestAnimationFrame(() => Splash.hide().catch(report)));
  });
})();
