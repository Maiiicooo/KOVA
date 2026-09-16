// Check static local URLs, including literal paths inside JavaScript templates.
// Remote services and paths supplied at runtime are outside this check.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
let checked = 0;
const errors = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", "node_modules", "android", "ios", "scripts", "www"].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function verify(site, file, value, relativeTo = file) {
  if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) return;
  if (value.includes("${") && !value.split(/[?#]/)[0].includes("${")) value = value.split(/[?#]/)[0];
  if (value.includes("${")) return;
  const mount = "/KOVA/";
  const base = new URL(mount + path.relative(site, relativeTo).split(path.sep).join("/"), "https://local.invalid");
  const url = new URL(value, base);
  const label = `${path.relative(root, file)}: ${value}`;
  if (!url.pathname.startsWith(mount)) {
    errors.push(`${label} escapes the site root`);
    return;
  }
  const parts = decodeURIComponent(url.pathname.slice(mount.length)).split("/").filter(Boolean);
  let target = site;
  for (const part of parts) {
    if (!fs.existsSync(target) || !fs.statSync(target).isDirectory() || !fs.readdirSync(target).includes(part)) {
      errors.push(`${label} missing or incorrect filename case`);
      return;
    }
    target = path.join(target, part);
  }
  checked++;
}

for (const site of [root, path.join(root, "www")]) {
  for (const file of walk(site)) {
    if (!/\.(html|css|js)$/.test(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    // The main script was extracted from index.html; DOM URLs retain that base.
    const base = file === path.join(site, "assets", "js", "index.js") ? path.join(site, "index.html") : file;
    for (const match of source.matchAll(/(?<![\w-])(?:href|src|action)\s*=\s*["']([^"']+)["']/g)) verify(site, file, match[1], base);
    for (const match of source.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) verify(site, file, match[1], base);
    // Also includes navigation strings, image assignments and module imports.
    for (const match of source.matchAll(/["'`]((?:\.\.?\/|\/KOVA\/|images\/)[^"'`\s]*?\.(?:html|png|jpg|jpeg|gif|json|js|css)(?:[?#][^"'`]*)?)["'`]/gi)) {
      verify(site, file, match[1], base);
    }
  }
  const manifestFile = path.join(site, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  verify(site, manifestFile, manifest.start_url);
  for (const icon of manifest.icons || []) verify(site, manifestFile, icon.src);
}
if (errors.length) {
  console.error([...new Set(errors)].join("\n"));
  process.exitCode = 1;
} else {
  console.log(`OK: ${checked} static local URL checks passed for website and www, including filename case and subdirectory hosting.`);
}
