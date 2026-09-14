// Reuse the original KOVA mark, without redrawing it.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const target = path.join(root, '.generated-native-assets');
fs.mkdirSync(target, { recursive: true });
fs.copyFileSync(path.join(root, 'images/kova_alleen_x_png.png'), path.join(target, 'logo.png'));
const cli = path.join(root, 'node_modules/@capacitor/assets/bin/capacitor-assets');
const result = spawnSync(process.execPath, [cli, 'generate', '--android', '--assetPath', '.generated-native-assets',
  '--iconBackgroundColor', '#0b0b0b', '--iconBackgroundColorDark', '#0b0b0b',
  '--splashBackgroundColor', '#0b0b0b', '--splashBackgroundColorDark', '#0b0b0b'], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
if (process.exitCode === 0) {
  for (const name of ['ic_launcher', 'ic_launcher_round']) {
    const file = path.join(root, 'android/app/src/main/res/mipmap-anydpi-v26', name + '.xml');
    let xml = fs.readFileSync(file, 'utf8');
    if (!xml.includes('<monochrome>')) {
      xml = xml.replace('</adaptive-icon>', '    <monochrome>\n        <inset android:drawable="@mipmap/ic_launcher_foreground" android:inset="16.7%" />\n    </monochrome>\n</adaptive-icon>');
      fs.writeFileSync(file, xml);
    }
  }
}
