import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

await import(`./rebuild.mjs?run=${Date.now()}`);

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(dist, { recursive: true });

const pathsToCopy = [
  "index.html",
  "styles.css",
  "app.js",
  "data/exercise-notes.js",
  "data/training-data.js",
  "data/current-plan.js",
  "data/current-plan.md",
  "data/training-log.csv",
  "media"
];

for (const relativePath of pathsToCopy) {
  const source = path.join(root, relativePath);
  const target = path.join(dist, relativePath);
  try {
    const stat = await fs.stat(source);
    await fs.mkdir(path.dirname(target), { recursive: true });
    if (stat.isDirectory()) {
      await fs.cp(source, target, { recursive: true });
    } else {
      await fs.copyFile(source, target);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await fs.writeFile(path.join(dist, ".nojekyll"), "");

console.log(`Built site artifact at ${dist}`);
