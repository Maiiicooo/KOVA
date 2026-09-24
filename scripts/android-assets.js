// Reuse the original KOVA mark, without redrawing it.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const platform = process.argv[2] || 'android';
if (!['android', 'ios'].includes(platform)) throw new Error('Expected android or ios');
const target = path.join(root, '.generated-native-assets');
fs.mkdirSync(target, { recursive: true });
fs.copyFileSync(path.join(root, 'images/kova_alleen_x_png.png'), path.join(target, 'logo.png'));
const cli = path.join(root, 'node_modules/@capacitor/assets/bin/capacitor-assets');
const result = spawnSync(process.execPath, [cli, 'generate', '--' + platform, '--assetPath', '.generated-native-assets',
  '--iconBackgroundColor', '#0b0b0b', '--iconBackgroundColorDark', '#0b0b0b',
  '--splashBackgroundColor', '#0b0b0b', '--splashBackgroundColorDark', '#0b0b0b'], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
if (process.exitCode === 0 && platform === 'android') {
  for (const name of ['ic_launcher', 'ic_launcher_round']) {
    const file = path.join(root, 'android/app/src/main/res/mipmap-anydpi-v26', name + '.xml');
    let xml = fs.readFileSync(file, 'utf8');
    if (!xml.includes('<monochrome>')) {
      xml = xml.replace('</adaptive-icon>', '    <monochrome>\n        <inset android:drawable="@mipmap/ic_launcher_foreground" android:inset="16.7%" />\n    </monochrome>\n</adaptive-icon>');
      fs.writeFileSync(file, xml);
    }
  }
}

// Give the iOS home-screen mark more breathing room inside Apple's rounded mask.
// The generator above starts from the original each time, so padding never accumulates.
if (process.exitCode === 0 && platform === 'ios') {
  const sharp = require('sharp');
  const file = path.join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
  sharp(file)
    .resize(870, 870)
    .extend({ top: 77, bottom: 77, left: 77, right: 77, background: '#0b0b0b' })
    .removeAlpha()
    .png()
    .toBuffer()
    .then(buffer => fs.writeFileSync(file, buffer))
    .catch(error => {
      console.error('Could not apply iOS app icon padding:', error);
      process.exitCode = 1;
    });
}
