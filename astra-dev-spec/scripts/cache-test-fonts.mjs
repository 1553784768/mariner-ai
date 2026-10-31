import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "backend/fixtures/fonts");
mkdirSync(out, { recursive: true });
const familyWeights = { "Archivo": [500, 600, 700, 800, 900], "Hanken Grotesk": [400, 500, 600, 700], "Space Mono": [400, 700], "Noto Sans SC": [400, 500, 700, 900] };
const css = readdirSync(resolve(root, "frontend/.next/static/chunks")).filter(f => f.endsWith(".css")).map(f => readFileSync(resolve(root, "frontend/.next/static/chunks", f), "utf8")).join("\n");
const mapping = {}, hashes = {};
for (const [family, weights] of Object.entries(familyWeights)) {
  const blocks = [...css.matchAll(/@font-face\{[^}]+\}/g)].map(m => m[0]).filter(b => b.includes(`font-family:${family};`) && b.includes("../media/"));
  if (!blocks.length) throw new Error(`Missing production font: ${family}`);
  const text = blocks.join("\n").replaceAll(";", ";\n  ").replaceAll("src:url", "src: url").replace(/url\(\.\.\/media\/([^\)]+)\)/g, (_, file) => {
    const source = resolve(root, "frontend/.next/static/media", file), dest = resolve(out, file);
    copyFileSync(source, dest);
    hashes[file] = createHash("sha256").update(readFileSync(source)).digest("hex");
    return `url(__FONT_ROOT__/${file})`;
  });
  mapping[`https://fonts.googleapis.com/css2?family=${family.replaceAll(" ", "+")}:wght@${weights.join(";")}&display=swap`] = text;
}
writeFileSync(resolve(out, "css.json"), JSON.stringify(mapping));
writeFileSync(resolve(out, "sha256.json"), JSON.stringify(hashes, null, 2));
console.log(`Cached ${Object.keys(hashes).length} original font files for offline tests.`);
