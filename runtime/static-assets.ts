import { readFile, realpath } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
};

// Only the dedicated client build is public. Never serve the repository or data directory.
export async function serveFrontend(request: Request, directory = process.env.DEVONE_STATIC_DIR ?? "dist/local"): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }
  let path: string;
  try { path = decodeURIComponent(new URL(request.url).pathname); }
  catch { return new Response("Bad path", { status: 400 }); }
  const segments = path.split("/");
  if (segments.some(segment => segment.startsWith(".")) || /[\\\0]/.test(path)) {
    return new Response("Not found", { status: 404 });
  }
  const root = resolve(directory);
  const target = resolve(root, "." + path);
  if (target !== root && !target.startsWith(root + sep)) return new Response("Not found", { status: 404 });
  // SPA fallback is reserved for extensionless navigation, never missing assets.
  const candidate = path === "/" || !extname(path) ? resolve(root, "index.html") : target;
  try {
    const [actualRoot, actualFile] = await Promise.all([realpath(root), realpath(candidate)]);
    if (!actualFile.startsWith(actualRoot + sep)) return new Response("Not found", { status: 404 });
    const bytes = await readFile(actualFile);
    return new Response(request.method === "HEAD" ? null : bytes, { headers: {
      "content-type": mime[extname(candidate)] ?? "application/octet-stream",
      "content-length": String(bytes.byteLength),
      "cache-control": candidate.endsWith("index.html") ? "no-cache" : "public, max-age=3600",
      "x-content-type-options": "nosniff",
    } });
  } catch (error) {
    if (!["ENOENT", "ENOTDIR", "EISDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
    return new Response("Frontend unavailable. Run npm run build:local.", { status: 404 });
  }
}
