const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/js/device.js'), 'utf8');

function boot({ native = true, platform = 'android', geo = {}, inputs = [], preloadLocation = false } = {}) {
  const events = {}, listeners = {}, nodes = {}, calls = [];
  const window = new EventTarget();
  window.Capacitor = { isNativePlatform: () => native, getPlatform: () => platform, registerPlugin: name => plugins[name] };
  const element = () => ({ handlers: {}, classList: { add() {}, toggle() {} }, setAttribute() {}, addEventListener(name, fn) { this.handlers[name] = fn; }, append() {}, remove() {} });
  const document = {
    currentScript: { hasAttribute: () => preloadLocation },
    documentElement: element(),
    body: { append: node => { nodes[node.id] = node; } },
    addEventListener: (name, fn) => { events[name] = fn; },
    getElementById: id => nodes[id], querySelector: () => null, querySelectorAll: () => inputs,
    createElement: element,
  };
  const plugins = Object.fromEntries(['App', 'Network', 'Keyboard', 'Preferences', 'Camera', 'Browser', 'Share', 'SplashScreen'].map(name => [name, {
    addListener: async (event, fn) => { listeners[event] = fn; },
  }]));
  plugins.Geolocation = geo;
  Object.assign(plugins.App, { minimizeApp: async () => calls.push('minimize') });
  plugins.Network.getStatus = async () => ({ connected: true, connectionType: 'wifi' });
  plugins.Browser.open = async data => calls.push(data.url);
  plugins.Share.share = async data => calls.push(data);
  plugins.SplashScreen.hide = async () => {};
  plugins.Preferences.set = async () => {};
  plugins.Preferences.remove = async () => {};
  const browserGeo = { getCurrentPosition() {} };
  const context = {
    window, document, navigator: { onLine: true, geolocation: browserGeo },
    location: { href: 'https://localhost/index.html', pathname: '/index.html', origin: 'https://localhost' },
    history: { back: () => calls.push('back') }, CustomEvent, URL, console, setTimeout, clearTimeout,
    requestAnimationFrame: fn => fn(), File, Blob, Event,
    fetch: async () => ({ ok: true, blob: async () => new Blob(['photo'], { type: 'image/jpeg' }) }),
    DataTransfer: class { constructor() { this.files = []; this.items = { add: file => this.files.push(file) }; } },
  };
  vm.runInNewContext(source, context);
  return { device: window.KovaDevice, window, events, listeners, calls, nodes, browserGeo, plugins };
}
function position(device, options) {
  return new Promise(resolve => device.geolocation.getCurrentPosition(
    value => resolve({ value }), error => resolve({ error }), options));
}
test('website keeps the original browser location API', () => {
  const { device, browserGeo } = boot({ native: false });
  assert.equal(device.geolocation, browserGeo);
});
test('denied location returns promptly without invoking GPS', async () => {
  const { device } = boot({ geo: {
    checkPermissions: async () => ({ location: 'denied', coarseLocation: 'denied' }),
    getCurrentPosition: () => assert.fail('Must not invoke GPS'),
  } });
  const { error } = await position(device);
  assert.equal(error.code, 1); assert.equal(error.reason, 'denied');
});
test('a new permission request can be refused without hanging', async () => {
  const { device } = boot({ geo: {
    checkPermissions: async () => ({ location: 'prompt', coarseLocation: 'prompt' }),
    requestPermissions: async () => ({ location: 'denied', coarseLocation: 'denied' }),
  } });
  assert.equal((await position(device)).error.reason, 'denied');
});
test('approximate permission works without requesting precise access again', async () => {
  const { device } = boot({ geo: {
    checkPermissions: async () => ({ location: 'denied', coarseLocation: 'granted' }),
    getCurrentPosition: async options => {
      assert.equal(options.enableHighAccuracy, false);
      return { coords: { latitude: 50, longitude: 4 } };
    },
  } });
  assert.equal((await position(device, { enableHighAccuracy: true })).value.coords.latitude, 50);
});
for (const [code, reason] of [['0007', 'disabled'], ['0009', 'disabled'], ['0010', 'timeout'], ['0002', 'unavailable']]) {
  test(`native location ${reason} is normalized`, async () => {
    const { device } = boot({ geo: {
      checkPermissions: async () => ({ location: 'granted' }),
      getCurrentPosition: async () => { throw { code: `OS-PLUG-GLOC-${code}` }; },
    } });
    assert.equal((await position(device)).error.reason, reason);
  });
}
test('back dismisses a handled overlay, then navigates history, then minimizes at root', () => {
  const b = boot(); b.events.DOMContentLoaded();
  const prevent = event => event.preventDefault();
  b.window.addEventListener('kova:back', prevent);
  b.listeners.backButton({ canGoBack: true }); assert.deepEqual(b.calls, []);
  b.window.removeEventListener('kova:back', prevent);
  b.listeners.backButton({ canGoBack: true });
  b.listeners.backButton({ canGoBack: false });
  assert.deepEqual(b.calls, ['back', 'minimize']);
});
test('offline/online events expose state and update the banner', async () => {
  const b = boot(); b.events.DOMContentLoaded(); await Promise.resolve();
  b.listeners.networkStatusChange({ connected: false, connectionType: 'none' });
  assert.equal(b.device.network.connected, false); assert.equal(b.nodes.kovaNetworkStatus.hidden, false);
  b.listeners.networkStatusChange({ connected: true, connectionType: 'wifi' });
  assert.equal(b.nodes.kovaNetworkStatus.hidden, true);
});

test('iOS starts shared listeners without Android-only app events', async () => {
  const b = boot({ platform: 'ios' });
  b.events.DOMContentLoaded(); await Promise.resolve();
  assert.equal(b.listeners.backButton, undefined);
  assert.equal(b.listeners.appRestoredResult, undefined);
  assert.equal(typeof b.listeners.appStateChange, 'function');
  assert.equal(typeof b.listeners.keyboardDidShow, 'function');
  assert.equal(b.device.network.connected, true);
});

test('iOS restricted location remains a recoverable permission error', async () => {
  const b = boot({ platform: 'ios', geo: {
    checkPermissions: async () => { throw { code: 'OS-PLUG-GLOC-0008' }; },
  } });
  const { error } = await position(b.device);
  assert.equal(error.code, 1);
  assert.equal(error.reason, 'restricted');
});
test('native browser rejects script and cleartext URLs and opens HTTPS externally', async () => {
  const b = boot();
  await assert.rejects(b.device.openExternal('javascript:alert(1)'));
  await assert.rejects(b.device.openExternal('http://example.com'));
  await b.device.openExternal('https://www.kova.spot');
  assert.deepEqual(b.calls, ['https://www.kova.spot/']);
});
for (const platform of ['android', 'ios']) test(`official JS client registers plugins over the injected ${platform} transport`, async () => {
  const core = fs.readFileSync(require('node:path').join(__dirname, '../node_modules/@capacitor/core/dist/capacitor.js'), 'utf8');
  const calls = [];
  const context = {
    console, URL, CustomEvent, setTimeout, clearTimeout,
    ...(platform === 'android' ? { androidBridge: {} } : { webkit: { messageHandlers: { bridge: {} } } }),
    navigator: { onLine: true },
    document: { documentElement: { classList: { add() {} } }, querySelector: () => null, addEventListener() {} },
    Capacitor: {
      getPlatform: () => platform,
      PluginHeaders: [{ name: 'Geolocation', methods: [
        { name: 'checkPermissions', rtype: 'promise' }, { name: 'getCurrentPosition', rtype: 'promise' },
      ] }],
      nativePromise: async (plugin, method, options) => {
        calls.push([plugin, method]);
        return method === 'checkPermissions' ? { location: 'granted' } : { coords: { latitude: 50 } };
      },
    },
  };
  context.window = context; context.dispatchEvent = () => true;
  vm.runInNewContext(core + '\n' + source, context);
  assert.equal(context.KovaDevice.native, true);
  assert.equal((await position(context.KovaDevice)).value.coords.latitude, 50);
  assert.deepEqual(calls, [['Geolocation', 'checkPermissions'], ['Geolocation', 'getCurrentPosition']]);
});
test('native photo selection feeds the existing file input without permission requests', async () => {
  const buttons = []; let changes = 0;
  const input = { id: 'photoFile', after: b => buttons.push(b), dispatchEvent: () => changes++ };
  const b = boot({ inputs: [input] });
  b.plugins.Camera.chooseFromGallery = async options => {
    assert.equal(options.mediaType, 0); assert.equal(options.allowMultipleSelection, false);
    return { results: [{ webPath: 'https://localhost/_capacitor_file_/photo.jpg' }] };
  };
  b.plugins.Camera.requestPermissions = () => assert.fail('System picker must not request broad media permissions');
  b.events.DOMContentLoaded();
  await buttons[1].handlers.click();
  assert.equal(input.files[0].type, 'image/jpeg'); assert.equal(changes, 1);
  assert.equal(buttons[1].disabled, false);
});
test('cancelled camera releases the button without changing the selected file', async () => {
  const buttons = []; let changes = 0;
  const input = { id: 'photoFile', after: b => buttons.push(b), dispatchEvent: () => changes++ };
  const b = boot({ inputs: [input] });
  b.plugins.Camera.takePhoto = async options => {
    assert.equal(options.saveToGallery, false);
    throw new Error('User cancelled');
  };
  b.events.DOMContentLoaded(); await buttons[0].handlers.click();
  assert.equal(changes, 0); assert.equal(buttons[0].disabled, false);
});


test('iOS first launch requests permission and then returns the native position', async () => {
  let requests = 0;
  const b = boot({ platform: 'ios', geo: {
    checkPermissions: async () => ({ location: 'prompt' }),
    requestPermissions: async () => { requests++; return { location: 'granted' }; },
    getCurrentPosition: async () => ({ coords: { latitude: 50, longitude: 4 } }),
  } });
  assert.equal((await position(b.device)).value.coords.latitude, 50);
  assert.equal(requests, 1);
});

test('iOS resume emits a recovery event and location errors are visible', () => {
  const b = boot({ platform: 'ios' });
  let resumed = 0;
  b.window.addEventListener('kova:resume', () => resumed++);
  b.events.DOMContentLoaded();
  b.listeners.appStateChange({ isActive: false });
  assert.equal(resumed, 0);
  b.listeners.appStateChange({ isActive: true });
  assert.equal(resumed, 1);
  b.window.dispatchEvent(new CustomEvent('kova:location-error', { detail: { message: 'Location services are off.' } }));
  assert.equal(b.nodes.kovaDeviceNotice.textContent, 'Location services are off.');
});

const mapSource = fs.readFileSync(require('node:path').join(__dirname, '../assets/js/index.js'), 'utf8');
const startupFunctions = mapSource.slice(
  mapSource.indexOf('        async function getStartupPreloadCenter()'),
  mapSource.indexOf('        async function maybeLoadInitialNearbySpots()'),
);
for (const mode of ['denied', 'pending', 'stored', 'live']) {
  test(`startup loads a region with ${mode} location`, async () => {
    const queries = [], jumps = [];
    const context = {
      userLat: mode === 'live' ? 51 : null,
      userLng: mode === 'live' ? 5 : null,
      startupStoredLocation: mode === 'stored' ? { lat: 50, lng: 4 } : null,
      userLocationRequestPromise: mode === 'pending' ? new Promise(() => {}) : Promise.resolve(false),
      wait: async () => {}, STARTUP_GPS_GRACE_MS: 1200,
      mapLoaded: true, startupRegionLoaded: false, initialNearbyLoaded: false,
      map: { getCenter: () => ({ lat: 49, lng: 3 }), jumpTo: value => jumps.push(value) },
      setStartupProgress() {}, syncUserMarker() {}, USER_START_ZOOM: 11,
      STARTUP_PRELOAD_RADIUS_KM: 25, STARTUP_THUMB_PREFETCH_LIMIT: 8, KOVA_MOBILE_LIKE: true,
      currentBaseSpotFeatures: [], preloadStartupSpotImages: async () => {},
      fetchSpotsInRadius: async (...args) => queries.push(args),
    };
    vm.createContext(context);
    vm.runInContext(startupFunctions, context);
    assert.equal(await context.preloadStartupRegion(), true);
    assert.equal(queries.length, 1);
    assert.equal(queries[0][0], mode === 'live' ? 51 : mode === 'stored' ? 50 : 49);
    assert.equal(jumps.length, ['live', 'stored'].includes(mode) ? 1 : 0);
    assert.equal(context.initialNearbyLoaded, mode === 'live');
    await context.preloadStartupRegion();
    assert.equal(queries.length, 1, 'the same startup region is not fetched twice');
  });
}


test('iOS starts a fast location request before DOMContentLoaded', async () => {
  const calls = [];
  const b = boot({ platform: 'ios', preloadLocation: true, geo: {
    checkPermissions: async () => ({ location: 'granted' }),
    getCurrentPosition: async options => {
      calls.push(options);
      return { coords: { latitude: 50, longitude: 4 } };
    },
  } });
  const result = await b.device.startupLocation;
  assert.equal(result.position.coords.latitude, 50);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].enableHighAccuracy, false);
});

test('denied startup location resolves safely without requesting GPS', async () => {
  const b = boot({ platform: 'ios', preloadLocation: true, geo: {
    checkPermissions: async () => ({ location: 'denied' }),
    getCurrentPosition: () => assert.fail('Denied permission must not request GPS'),
  } });
  const result = await b.device.startupLocation;
  assert.equal(result.error.code, 'OS-PLUG-GLOC-0003');
});

test('website, Android and other iOS pages do not preload location', () => {
  for (const options of [
    { native: false, platform: 'ios', preloadLocation: true },
    { platform: 'android', preloadLocation: true },
    { platform: 'ios' },
  ]) assert.equal(boot(options).device.startupLocation, undefined);
});
