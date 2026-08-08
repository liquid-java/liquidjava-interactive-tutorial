import { access, copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const prismRoot = resolve(root, "node_modules", "prismjs");
const codeMirrorRoot = resolve(root, "node_modules", "codemirror");
const vendorRoot = resolve(root, "vendor");

await Promise.all([
  access(resolve(prismRoot, "prism.js")),
  access(resolve(codeMirrorRoot, "lib", "codemirror.js")),
]);
await mkdir(vendorRoot, { recursive: true });

await Promise.all([
  copyFile(resolve(prismRoot, "prism.js"), resolve(vendorRoot, "prism.js")),
  copyFile(
    resolve(prismRoot, "components", "prism-java.min.js"),
    resolve(vendorRoot, "prism-java.min.js"),
  ),
  copyFile(resolve(prismRoot, "LICENSE"), resolve(vendorRoot, "PRISM-LICENSE.txt")),
  copyFile(resolve(codeMirrorRoot, "lib", "codemirror.js"), resolve(vendorRoot, "codemirror.js")),
  copyFile(resolve(codeMirrorRoot, "lib", "codemirror.css"), resolve(vendorRoot, "codemirror.css")),
  copyFile(resolve(codeMirrorRoot, "mode", "clike", "clike.js"), resolve(vendorRoot, "codemirror-clike.js")),
  copyFile(
    resolve(codeMirrorRoot, "addon", "edit", "matchbrackets.js"),
    resolve(vendorRoot, "codemirror-matchbrackets.js"),
  ),
  copyFile(
    resolve(codeMirrorRoot, "addon", "edit", "closebrackets.js"),
    resolve(vendorRoot, "codemirror-closebrackets.js"),
  ),
  copyFile(resolve(codeMirrorRoot, "LICENSE"), resolve(vendorRoot, "CODEMIRROR-LICENSE.txt")),
]);

console.log("Prepared PrismJS and CodeMirror browser assets in vendor/");
