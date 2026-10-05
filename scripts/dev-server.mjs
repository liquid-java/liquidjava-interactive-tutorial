import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = 8000;
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".mjs": "text/javascript; charset=utf-8",
  ".wasm": "application/wasm",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function safePath(pathname) {
  const target = resolve(root, `.${pathname}`);
  return target === root || target.startsWith(`${root}${sep}`) ? target : null;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  let pathname;

  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  let target = pathname === "/" ? resolve(root, "index.html") : safePath(pathname);
  let file;

  if (target) {
    try {
      file = await stat(target);
    } catch {
      file = null;
    }
  }

  if (!file?.isFile()) {
    if (request.method === "GET" && !extname(pathname)) {
      target = resolve(root, "index.html");
      file = await stat(target);
    } else {
      response.writeHead(404).end("Not found");
      return;
    }
  }

  const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if (range) {
    const start = Number(range[1]);
    const end = Math.min(range[2] ? Number(range[2]) : file.size - 1, file.size - 1);
    if (start > end || start >= file.size) {
      response.writeHead(416, { "Content-Range": `bytes */${file.size}` }).end();
      return;
    }
    response.writeHead(206, {
      "Content-Type": mimeTypes[extname(target).toLowerCase()] || "application/octet-stream",
      "Content-Range": `bytes ${start}-${end}/${file.size}`,
      "Content-Length": end - start + 1,
      "Accept-Ranges": "bytes",
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(target, { start, end }).pipe(response);
    return;
  }
  response.writeHead(200, {
    "Accept-Ranges": "bytes",
    "Content-Length": file.size,
    "Cache-Control": "no-store",
    "Content-Type": mimeTypes[extname(target).toLowerCase()] || "application/octet-stream",
  });

  if (request.method === "HEAD") response.end();
  else createReadStream(target).pipe(response);
});

server.listen(port, () => {
  console.log(`LiquidJava Interactive Tutorial: http://localhost:${port}/`);
});
