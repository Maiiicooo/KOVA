// The root web app is the source of truth; www is Capacitor's generated copy.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const config = require('../capacitor.config.json');
if (config.webDir !== 'www' || config.server?.url || config.server?.cleartext) {
  throw new Error('Production requires webDir www and no development server/cleartext override.');
}
const output = path.join(root, 'www');
fs.mkdirSync(output, { recursive: true });
// Explicit public allowlist: never package admin tools, credentials or firebase-admin.
for (const name of ['index.html', 'manifest.json', 'assets', 'images', 'app', 'web', 'spot']) {
  const source = path.join(root, name);
  if (fs.existsSync(source)) fs.cpSync(source, path.join(output, name), { recursive: true });
}
console.log('Production web assets copied to www. No admin/server code included.');
// Capacitor injects the native transport, not the registerPlugin JS client.
// Prepend the official local core bundle; the plain website needs no native runtime.
const client = fs.readFileSync(path.join(root, 'node_modules/@capacitor/core/dist/capacitor.js'), 'utf8')
  .replace(/^\/\/# sourceMappingURL=.*$/gm, '');
const adapter = fs.readFileSync(path.join(root, 'assets/js/device.js'), 'utf8');
fs.writeFileSync(path.join(output, 'assets/js/device.js'), client + '\n' + adapter);
