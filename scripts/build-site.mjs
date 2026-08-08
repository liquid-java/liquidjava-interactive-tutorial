import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");
const clientOutput = resolve(output, "client");
const staticEntries = [
  "index.html",
  "app.js",
  "tutorial-data.js",
  "styles.css",
  "images",
  "vendor",
];

await access(resolve(root, "index.html"));
await rm(output, { recursive: true, force: true });
await mkdir(clientOutput, { recursive: true });
await mkdir(resolve(output, "server"), { recursive: true });

for (const entry of staticEntries) {
  await cp(resolve(root, entry), resolve(clientOutput, entry), { recursive: true });
}

await writeFile(
  resolve(output, "server", "index.js"),
  `export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
`,
);

console.log("Built LiquidJava Interactive Tutorial in dist/");
