/* Shared, dependency-free adapter. Capacitor injects its bridge before this script.
 * The website keeps browser APIs; Android and iOS use the official plugins. */
(() => {
  'use strict';
  const pageHost = window.parent && window.parent !== window && window.parent.KovaPageNavigation;
  const cap = pageHost ? window.parent.Capacitor : window.Capacitor;
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

  if (pageHost) {
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link || event.defaultPrevented || link.target || link.hasAttribute('download') || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      if (pageHost.open(url.href)) event.preventDefault();
    });
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') pageHost.back();
    });
  }

  // Begin GPS while the map SDK and page are still loading. Resolve failures
  // here so an unavailable location cannot produce an unhandled rejection.
  if (native && cap.getPlatform() === 'ios' && document.currentScript?.hasAttribute('data-preload-location')) {
    device.startupLocation = currentPosition({
      enableHighAccuracy: false, timeout: 15000, maximumAge: 60000,
    }).then(position => ({ position }), error => ({ error }));
  }

  if (!native) return;
  document.documentElement.classList.add('kova-native');
  if (cap.getPlatform() === 'ios') {
    document.documentElement.classList.add('kova-ios');
    // Expose WKWebView's safe-area insets before the page is laid out.
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && !/viewport-fit\s*=/.test(viewport.content)) {
      viewport.content += ', viewport-fit=cover';
    }
  }
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
    // Edge swipe for the native WebView. Browsers keep their own back gesture.
    let swipe = null;
    let navigatingBack = false;
    const cancelSwipe = () => { swipe = null; };
    document.addEventListener('touchstart', event => {
      cancelSwipe();
      if (navigatingBack || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (touch.clientX > 28) return;
      if (event.target.closest('input, textarea, select, [contenteditable], canvas, .maplibregl-canvas-container, .mapboxgl-canvas-container')) return;
      // Leave horizontal galleries and other scrolling controls alone.
      for (let node = event.target; node && node !== document.body; node = node.parentElement) {
        if (node.scrollWidth > node.clientWidth && /auto|scroll/.test(getComputedStyle(node).overflowX)) return;
      }
      swipe = { id: touch.identifier, x: touch.clientX, y: touch.clientY, claimed: false };
    }, { passive: true });
    document.addEventListener('touchmove', event => {
      if (!swipe) return;
      if (event.touches.length !== 1) return cancelSwipe();
      const touch = event.touches[0];
      const dx = touch.clientX - swipe.x;
      const dy = Math.abs(touch.clientY - swipe.y);
      if (touch.identifier !== swipe.id || dx < -8 || (!swipe.claimed && dy > 10 && dy > dx)) return cancelSwipe();
      if (dx > 12 && dx > dy * 2) swipe.claimed = true;
      if (swipe.claimed && event.cancelable) event.preventDefault();
    }, { passive: false });
    document.addEventListener('touchcancel', cancelSwipe, { passive: true });
    document.addEventListener('touchend', event => {
      const gesture = swipe;
      cancelSwipe();
      if (!gesture?.claimed || event.touches.length) return;
      const touch = Array.from(event.changedTouches).find(t => t.identifier === gesture.id);
      if (!touch) return;
      const dx = touch.clientX - gesture.x;
      if (dx < 80 || dx < Math.abs(touch.clientY - gesture.y) * 2) return;
      if (event.cancelable) event.preventDefault();
      if (!window.dispatchEvent(new CustomEvent('kova:back', { cancelable: true }))) return;
      const menu = document.querySelector('.nav-right.open .hamburger-toggle');
      if (menu) { menu.click(); return; }
      if (pageHost) { pageHost.back(); return; }
      // Swiping on the home screen must never leave or minimize KOVA.
      if (['/', '/index.html'].includes(location.pathname)) return;
      navigatingBack = true;
      if (history.length > 1 && document.referrer && new URL(document.referrer).origin === location.origin) history.back();
      else location.replace('/index.html');
    }, { passive: false });
    window.addEventListener('pagehide', cancelSwipe);
    window.addEventListener('pageshow', () => { navigatingBack = false; cancelSwipe(); });
    const handles = [];
    let disposed = false;
    const listen = (p, name, callback) => p.addListener(name, callback).then(handle => {
      if (!pageHost) return;
      if (disposed) handle.remove();
      else handles.push(handle);
    }).catch(report);
    if (pageHost) window.addEventListener('pagehide', () => {
      disposed = true;
      handles.splice(0).forEach(handle => handle.remove().catch(report));
    }, { once: true });
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
      if (isActive) {
        Network.getStatus().then(updateNetwork).catch(report);
        emit('kova:resume');
      }
    });
    window.addEventListener('kova:location-error', event => notice(event.detail.message));
    if (android && !pageHost) listen(App, 'backButton', ({ canGoBack }) => {
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
