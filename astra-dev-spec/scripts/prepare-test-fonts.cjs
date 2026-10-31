const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const fontRoot = path.resolve(root, "backend/fixtures/fonts");
const css = JSON.parse(fs.readFileSync(path.resolve(root, "backend/fixtures/fonts/css.json"), "utf8"));
const output = path.resolve(root, "artifacts/font-responses.cjs");
fs.mkdirSync(path.dirname(output), { recursive: true });
const assets = new Map();
const responses = Object.fromEntries(Object.entries(css).map(([url, value]) => [url,
  value.replace(/font-family:([^;]+);/g, (_, family) => `font-family: '${family.trim()}';`)
    // Inline original WOFF2 bytes: the browser loads the exact font offline.
    // Keep data URLs outside Next's remote-font downloader in this test fixture.
    .replace(/src: url\(__FONT_ROOT__\/([^\)]+)\)/g, (_, name) => {
      if (!assets.has(name)) assets.set(name, fs.readFileSync(path.resolve(fontRoot, name)).toString("base64"));
      return `src:url(data:font/woff2;base64,${assets.get(name)})`;
    })
]));
fs.writeFileSync(output, "module.exports = " + JSON.stringify(responses) + ";\n");
module.exports = output;
if (require.main === module) process.stdout.write(output);
