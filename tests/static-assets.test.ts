import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { serveFrontend } from "../runtime/static-assets";

test("local frontend serves root, navigation, assets and HEAD without exposing private files", async () => {
  const dir = await mkdtemp(join(tmpdir(), "devone-static-"));
  const publicDir = join(dir, "public");
  await mkdir(join(publicDir, "assets"), { recursive: true });
  await writeFile(join(publicDir, "index.html"), "<h1>DevOne</h1>");
  await writeFile(join(publicDir, "assets/app.js"), "console.log('DevOne')");
  await writeFile(join(dir, "private.txt"), "secret");
  await symlink(join(dir, "private.txt"), join(publicDir, "leak.txt"));
  const get = (path: string, method = "GET") => serveFrontend(new Request("http://localhost" + path, { method }), publicDir);
  try {
    for (const path of ["/", "/admin", "/admin/settings"]) {
      const response = await get(path);
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type")!, /text\/html/);
      assert.equal(await response.text(), "<h1>DevOne</h1>");
    }
    assert.match((await get("/assets/app.js")).headers.get("content-type")!, /javascript/);
    assert.equal(await (await get("/", "HEAD")).text(), "");
    for (const path of ["/.env", "/%2eenv", "/assets/missing.js", "/leak.txt", "/%2e%2e%2fprivate.txt", "/foo%5cbar"]) {
      assert.equal((await get(path)).status, 404, path);
    }
    assert.equal((await get("/%zz")).status, 400);
    assert.equal((await get("/", "POST")).status, 405);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
