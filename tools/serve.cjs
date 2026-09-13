const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw Error("PORT deve ser uma porta válida.");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
};
const files = new Set(["index.html", "style.css", "engine.js", "game.js"]);
const folders = new Set([
  "assets",
  "content",
  "domain",
  "infrastructure",
  "application",
  "rendering",
  "ui",
]);
const server = http.createServer((req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }
  let relative;
  try {
    relative =
      decodeURIComponent(new URL(req.url, "http://localhost").pathname).replace(
        /^\/+/,
        "",
      ) || "index.html";
  } catch {
    res.writeHead(400);
    return res.end();
  }
  const parts = relative.split("/"),
    target = path.resolve(root, relative),
    extension = path.extname(target);
  if (
    relative.includes("\\") ||
    parts.some((p) => p.startsWith(".")) ||
    !target.startsWith(root + path.sep) ||
    !(files.has(relative) || folders.has(parts[0])) ||
    !mime[extension]
  ) {
    res.writeHead(404);
    return res.end("Não encontrado");
  }
  fs.stat(target, (error, stat) => {
    if (error || !stat.isFile()) {
      res.writeHead(404);
      return res.end("Não encontrado");
    }
    res.writeHead(200, {
      "Content-Type": mime[extension],
      "Content-Length": stat.size,
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(target)
      .on("error", () => res.destroy())
      .pipe(res);
  });
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    `O Labirinto Burocrático: http://localhost:${port}\nCtrl+C encerra o servidor.`,
  ),
);
