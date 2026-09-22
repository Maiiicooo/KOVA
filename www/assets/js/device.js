/*! Capacitor: https://capacitorjs.com/ - MIT License */
var capacitorExports=function(e){"use strict";var t;e.ExceptionCode=void 0,(t=e.ExceptionCode||(e.ExceptionCode={})).Unimplemented="UNIMPLEMENTED",t.Unavailable="UNAVAILABLE";class n extends Error{constructor(e,t,n){super(e),this.message=e,this.code=t,this.data=n}}const s=t=>{const s=t.CapacitorCustomPlatform||null,r=t.Capacitor||{},i=r.Plugins=r.Plugins||{},a=()=>null!==s?s.name:(e=>{var t,n;return(null==e?void 0:e.androidBridge)?"android":(null===(n=null===(t=null==e?void 0:e.webkit)||void 0===t?void 0:t.messageHandlers)||void 0===n?void 0:n.bridge)?"ios":"web"})(t),o=e=>{var t;return null===(t=r.PluginHeaders)||void 0===t?void 0:t.find(t=>t.name===e)},c=new Map;return r.convertFileSrc||(r.convertFileSrc=e=>e),r.getPlatform=a,r.handleError=e=>t.console.error(e),r.isNativePlatform=()=>"web"!==a(),r.isPluginAvailable=e=>{const t=c.get(e);return!!(null==t?void 0:t.platforms.has(a()))||!!o(e)},r.registerPlugin=(t,l={})=>{const d=c.get(t);if(d)return console.warn(`Capacitor plugin "${t}" already registered. Cannot register plugins twice.`),d.proxy;const u=a(),p=o(t);let m;const h=i=>{let a;const o=(...o)=>{const c=(async()=>(!m&&u in l?m=m="function"==typeof l[u]?await l[u]():l[u]:null!==s&&!m&&"web"in l&&(m=m="function"==typeof l.web?await l.web():l.web),m))().then(s=>{const c=((s,i)=>{var a,o;if(!p){if(s)return null===(o=s[i])||void 0===o?void 0:o.bind(s);throw new n(`"${t}" plugin is not implemented on ${u}`,e.ExceptionCode.Unimplemented)}{const e=null==p?void 0:p.methods.find(e=>i===e.name);if(e)return"promise"===e.rtype?e=>r.nativePromise(t,i.toString(),e):(e,n)=>r.nativeCallback(t,i.toString(),e,n);if(s)return null===(a=s[i])||void 0===a?void 0:a.bind(s)}})(s,i);if(c){const e=c(...o);return a=null==e?void 0:e.remove,e}throw new n(`"${t}.${i}()" is not implemented on ${u}`,e.ExceptionCode.Unimplemented)});return"addListener"===i&&(c.remove=async()=>a()),c};return o.toString=()=>`${i.toString()}() { [capacitor code] }`,Object.defineProperty(o,"name",{value:i,writable:!1,configurable:!1}),o},w=h("addListener"),g=h("removeListener"),v=(e,t)=>{const n=w({eventName:e},t),s=async()=>{const s=await n;g({eventName:e,callbackId:s},t)},r=new Promise(e=>n.then(()=>e({remove:s})));return r.remove=async()=>{console.warn("Using addListener() without 'await' is deprecated."),await s()},r},y=new Proxy({},{get(e,t){switch(t){case"$$typeof":return;case"toJSON":return()=>({});case"addListener":return p?v:w;case"removeListener":return g;default:return h(t)}}});return i[t]=y,c.set(t,{name:t,proxy:y,platforms:new Set([...Object.keys(l),...p?[u]:[]])}),y},r.Exception=n,r.DEBUG=!!r.DEBUG,r.isLoggingEnabled=!!r.isLoggingEnabled,r},r=(e=>e.Capacitor=s(e))("undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{}),i=r.registerPlugin;class a{constructor(){this.listeners={},this.retainedEventArguments={},this.windowListeners={}}addListener(e,t){let n=!1;this.listeners[e]||(this.listeners[e]=[],n=!0),this.listeners[e].push(t);const s=this.windowListeners[e];s&&!s.registered&&this.addWindowListener(s),n&&this.sendRetainedArgumentsForEvent(e);return Promise.resolve({remove:async()=>this.removeListener(e,t)})}async removeAllListeners(){this.listeners={};for(const e in this.windowListeners)this.removeWindowListener(this.windowListeners[e]);this.windowListeners={}}notifyListeners(e,t,n){const s=this.listeners[e];if(s)s.forEach(e=>e(t));else if(n){let n=this.retainedEventArguments[e];n||(n=[]),n.push(t),this.retainedEventArguments[e]=n}}hasListeners(e){var t;return!!(null===(t=this.listeners[e])||void 0===t?void 0:t.length)}registerWindowListener(e,t){this.windowListeners[t]={registered:!1,windowEventName:e,pluginEventName:t,handler:e=>{this.notifyListeners(t,e)}}}unimplemented(t="not implemented"){return new r.Exception(t,e.ExceptionCode.Unimplemented)}unavailable(t="not available"){return new r.Exception(t,e.ExceptionCode.Unavailable)}async removeListener(e,t){const n=this.listeners[e];if(!n)return;const s=n.indexOf(t);-1!==s&&this.listeners[e].splice(s,1),this.listeners[e].length||this.removeWindowListener(this.windowListeners[e])}addWindowListener(e){window.addEventListener(e.windowEventName,e.handler),e.registered=!0}removeWindowListener(e){e&&(window.removeEventListener(e.windowEventName,e.handler),e.registered=!1)}sendRetainedArgumentsForEvent(e){const t=this.retainedEventArguments[e];t&&(delete this.retainedEventArguments[e],t.forEach(t=>{this.notifyListeners(e,t)}))}}const o=i("WebView"),c=e=>encodeURIComponent(e).replace(/%(2[346B]|5E|60|7C)/g,decodeURIComponent).replace(/[()]/g,escape),l=e=>e.replace(/(%[\dA-F]{2})+/gi,decodeURIComponent);class d extends a{async getCookies(){const e=document.cookie,t={};return e.split(";").forEach(e=>{if(e.length<=0)return;let[n,s]=e.replace(/=/,"CAP_COOKIE").split("CAP_COOKIE");n=l(n).trim(),s=l(s).trim(),t[n]=s}),t}async setCookie(e){try{const t=c(e.key),n=c(e.value),s=e.expires?`; expires=${e.expires.replace("expires=","")}`:"",r=(e.path||"/").replace("path=",""),i=null!=e.url&&e.url.length>0?`domain=${e.url}`:"";document.cookie=`${t}=${n||""}${s}; path=${r}; ${i};`}catch(e){return Promise.reject(e)}}async deleteCookie(e){try{document.cookie=`${e.key}=; Max-Age=0`}catch(e){return Promise.reject(e)}}async clearCookies(){try{const e=document.cookie.split(";")||[];for(const t of e)document.cookie=t.replace(/^ +/,"").replace(/=.*/,`=;expires=${(new Date).toUTCString()};path=/`)}catch(e){return Promise.reject(e)}}async clearAllCookies(){try{await this.clearCookies()}catch(e){return Promise.reject(e)}}}const u=i("CapacitorCookies",{web:()=>new d}),p=(e,t={})=>{const n=Object.assign({method:e.method||"GET",headers:e.headers},t),s=((e={})=>{const t=Object.keys(e);return Object.keys(e).map(e=>e.toLocaleLowerCase()).reduce((n,s,r)=>(n[s]=e[t[r]],n),{})})(e.headers)["content-type"]||"";if("string"==typeof e.data)n.body=e.data;else if(s.includes("application/x-www-form-urlencoded")){const t=new URLSearchParams;for(const[n,s]of Object.entries(e.data||{}))t.set(n,s);n.body=t.toString()}else if(s.includes("multipart/form-data")||e.data instanceof FormData){const t=new FormData;if(e.data instanceof FormData)e.data.forEach((e,n)=>{t.append(n,e)});else for(const n of Object.keys(e.data))t.append(n,e.data[n]);n.body=t;const s=new Headers(n.headers);s.delete("content-type"),n.headers=s}else(s.includes("application/json")||"object"==typeof e.data)&&(n.body=JSON.stringify(e.data));return n};class m extends a{async request(e){const t=p(e,e.webFetchExtra),n=((e,t=!0)=>e?Object.entries(e).reduce((e,n)=>{const[s,r]=n;let i,a;return Array.isArray(r)?(a="",r.forEach(e=>{i=t?encodeURIComponent(e):e,a+=`${s}=${i}&`}),a.slice(0,-1)):(i=t?encodeURIComponent(r):r,a=`${s}=${i}`),`${e}&${a}`},"").substr(1):null)(e.params,e.shouldEncodeUrlParams),s=n?`${e.url}?${n}`:e.url,r=await fetch(s,t),i=r.headers.get("content-type")||"";let a,o,{responseType:c="text"}=r.ok?e:{};switch(i.includes("application/json")&&(c="json"),c){case"arraybuffer":case"blob":o=await r.blob(),a=await(async e=>new Promise((t,n)=>{const s=new FileReader;s.onload=()=>{const e=s.result;t(e.indexOf(",")>=0?e.split(",")[1]:e)},s.onerror=e=>n(e),s.readAsDataURL(e)}))(o);break;case"json":a=await r.json();break;default:a=await r.text()}const l={};return r.headers.forEach((e,t)=>{l[t]=e}),{data:a,headers:l,status:r.status,url:r.url}}async get(e){return this.request(Object.assign(Object.assign({},e),{method:"GET"}))}async post(e){return this.request(Object.assign(Object.assign({},e),{method:"POST"}))}async put(e){return this.request(Object.assign(Object.assign({},e),{method:"PUT"}))}async patch(e){return this.request(Object.assign(Object.assign({},e),{method:"PATCH"}))}async delete(e){return this.request(Object.assign(Object.assign({},e),{method:"DELETE"}))}}const h=i("CapacitorHttp",{web:()=>new m});var w,g;e.SystemBarsStyle=void 0,(w=e.SystemBarsStyle||(e.SystemBarsStyle={})).Dark="DARK",w.Light="LIGHT",w.Default="DEFAULT",e.SystemBarType=void 0,(g=e.SystemBarType||(e.SystemBarType={})).StatusBar="StatusBar",g.NavigationBar="NavigationBar";class v extends a{async setStyle(){this.unavailable("not available for web")}async setAnimation(){this.unavailable("not available for web")}async show(){this.unavailable("not available for web")}async hide(){this.unavailable("not available for web")}}const y=i("SystemBars",{web:()=>new v});return e.Capacitor=r,e.CapacitorCookies=u,e.CapacitorException=n,e.CapacitorHttp=h,e.SystemBars=y,e.WebPlugin=a,e.WebView=o,e.buildRequestInit=p,e.registerPlugin=i,Object.defineProperty(e,"__esModule",{value:!0}),e}({});


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
      if (isActive) {
        Network.getStatus().then(updateNetwork).catch(report);
        emit('kova:resume');
      }
    });
    window.addEventListener('kova:location-error', event => notice(event.detail.message));
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
