import {readFile,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import { createServer } from "node:http";
import { createLocalRuntime } from "../adapters/local/runtime";
import { createCoreApi } from "../core/api";
import { DevOneAuthService, authErrorStatus } from "../core/auth";
import { DevOnePermissions } from "../core/auth/permissions";
import { DevOneMailService } from "../core/mail";
import { LocalSmtpTransport } from "../adapters/local/mail";

process.umask(0o077);
const production=process.env.NODE_ENV==='production';
const canonical=production?new URL(process.env.DEVONE_SITE_URL??''):null;
if(canonical&&(canonical.protocol!=='https:'||canonical.origin!==process.env.DEVONE_SITE_URL))throw Error('Production requires a canonical HTTPS site URL.');
const publicDir=resolve(process.env.DEVONE_PUBLIC_DIR??fileURLToPath(new URL('./web/',import.meta.url)));
if(import.meta.url.endsWith('/runtime.mjs')&&!process.env.DEVONE_MIGRATIONS_DIR)process.env.DEVONE_MIGRATIONS_DIR=fileURLToPath(new URL('./migrations/',import.meta.url));
const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? "127.0.0.1";
if(production&&host!=="127.0.0.1")throw Error("Production CMS must listen on loopback behind a trusted proxy.");
const services = await createLocalRuntime({
  dataDir: process.env.DEVONE_DATA_DIR ?? "./data",
  mediaDir: process.env.DEVONE_MEDIA_DIR,
  environment: process.env.NODE_ENV ?? "development",
});
const auth = new DevOneAuthService(services.db, { secureCookies: production,passwordHashIterations:production?600000:10000 });
if(production&&!(await services.db.first("SELECT setting_value FROM settings WHERE setting_key='installation_complete' AND setting_value='1'")))throw Error('Initialize the production CMS offline before starting the web service.');
const permissions = new DevOnePermissions(services.db);
let mail: DevOneMailService;
const mailTransport = new LocalSmtpTransport(async () => mail.config());
mail = new DevOneMailService(services, mailTransport);
const core = createCoreApi({
  services,
  authenticate: request => auth.getCurrentUser(request),
  authorize: (user, permission, siteId) => permissions.has(user, permission, siteId),
  resolveSite: async request => {
    const value = request.headers.get("x-devone-site-id");
    return value && /^\d+$/.test(value) ? Number(value) : null;
  },
  mailTransport,
  mailTransportFactory: config => new LocalSmtpTransport(config),
  validateCsrf: async request => {
    try { await auth.requireCsrf(request); return true; } catch { return false; }
  },
});

function json(value: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}
async function readBody(request: Request): Promise<Record<string, unknown>> {
  const value = await request.json().catch(() => null);
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
async function routeAuth(request: Request, path: string): Promise<Response | null> {
  if (path === "/api/auth/login" && request.method === "POST") {
    const body = await readBody(request);
    try {
      const result = await auth.login(request, String(body.username ?? ""), String(body.password ?? ""));
      return json({ ok: true, user: result.user, csrf_token: result.csrfToken, expires_at: result.expiresAt }, 200, { "set-cookie": result.sessionCookie });
    } catch (error) {
      return json({ ok: false, error: error instanceof Error ? error.message : "Invalid credentials." }, authErrorStatus(error));
    }
  }
  if (path === "/api/auth/logout" && request.method === "POST") {
    try {
      const cookie = await auth.logout(request);
      return json({ ok: true }, 200, { "set-cookie": cookie });
    } catch (error) {
      return json({ ok: false, error: error instanceof Error ? error.message : "Authentication failed." }, authErrorStatus(error));
    }
  }
  if (path === "/api/auth/me" && request.method === "GET") {
    const session = await auth.restoreSession(request);
    return json({ ok: true, authenticated: Boolean(session.user), user: session.user, csrf_token: session.csrfToken });
  }
  return null;
}
async function staticAsset(request:Request,path:string):Promise<Response>{
 if(!['GET','HEAD'].includes(request.method))return json({ok:false,error:'Method not allowed.'},405);
 let decoded:string;try{decoded=decodeURIComponent(path);}catch{return json({ok:false,error:'Invalid path.'},400);}
 if(decoded.includes('\\')||decoded.split('/').some(p=>p==='..'||p.startsWith('.')))return json({ok:false,error:'Not found.'},404);
 const asset=decoded.startsWith('/assets/');
 if(!asset&&decoded!=='/'&&decoded!=='/index.html')return json({ok:false,error:'Not found.'},404);
 const file=resolve(publicDir,'.'+(decoded==='/'?'/index.html':decoded));
 if(!file.startsWith(publicDir+'/'))return json({ok:false,error:'Not found.'},404);
 try{
  const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{const stat=await handle.stat();if(!stat.isFile()||stat.size>5*1024*1024)throw Error();const types:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};const type=types[extname(file)];if(!type)throw Error();return new Response(request.method==='HEAD'?null:new Uint8Array(await handle.readFile()),{headers:{'Content-Type':type,'Cache-Control':asset?'public, max-age=31536000, immutable':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'}});}finally{await handle.close();}
 }catch{return json({ok:false,error:'Not found.'},404);}
}
async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if(production&&!['GET','HEAD'].includes(request.method)){
    if(path.startsWith('/api/install'))return json({ok:false,error:'Production setup is disabled.'},403);
    if(request.headers.get('x-forwarded-proto')!=='https')return json({ok:false,error:'HTTPS is required.'},426);
    if(request.headers.get('origin')!==canonical!.origin)return json({ok:false,error:'Same-origin confirmation is required.'},403);
  }
  const authResponse = await routeAuth(request, path);
  if (authResponse) return authResponse;
  if (path.startsWith("/api/core/") || path.startsWith("/api/install")) return core.api.handle(request);
  if (path === "/api/health" && request.method === "GET") return json({ ok: true, product: "DevOne CMS", version: "2.0.0-alpha.5", runtime: "local", database: "sqlite", media: "filesystem", cache: "memory" });
  if (path === "/api/runtime/status" && request.method === "GET") {
    if(production&&!await auth.getCurrentUser(request))return json({ok:false,error:"Authentication required."},401);
    const migrations = await services.db.all("SELECT name, applied_at FROM devone_migrations ORDER BY name");
    return json({ ok: true, runtime: services.config.runtime, migrations });
  }
  if(!path.startsWith("/api/"))return staticAsset(request,path);
  return json({ ok: false, error: "API route not found." }, 404);
}
const loginAttempts=new Map<string,{count:number;until:number}>();
const rateTimer=setInterval(()=>{for(const [key,value] of loginAttempts)if(value.until<Date.now())loginAttempts.delete(key);},60000);rateTimer.unref();
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://" + (req.headers.host ?? "localhost"));
    if(production&&url.pathname==='/api/auth/login'&&req.method==='POST'){
      const ip=String(req.headers['x-real-ip']??req.socket.remoteAddress??'local');
      const now=Date.now(),attempt=loginAttempts.get(ip)??{count:0,until:now+60000};
      if(attempt.until<=now){attempt.count=0;attempt.until=now+60000;}
      if(attempt.count>=10||(!loginAttempts.has(ip)&&loginAttempts.size>=1000)){res.writeHead(429,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({ok:false,error:'Try again later.'}));return;}
      attempt.count++;loginAttempts.set(ip,attempt);
    }
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    const maxBytes = 2 * 1024 * 1024;
    for await (const chunk of req) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buffer.length;
      if (totalBytes > maxBytes) {
        res.writeHead(413, { "content-type": "application/json", "cache-control": "no-store" });
        res.end(JSON.stringify({ ok: false, error: "Request body is too large.", code: "body_too_large" }));
        req.destroy();
        return;
      }
      chunks.push(buffer);
    }
    const request = new Request(url, {
      method: req.method,
      headers: Object.fromEntries(Object.entries(req.headers).flatMap(([key, value]) => value === undefined ? [] : [[key, Array.isArray(value) ? value.join(", ") : value]])),
      body: chunks.length && req.method !== "GET" && req.method !== "HEAD" ? Buffer.concat(chunks) : undefined,
    });
    const response = await handle(request);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(response.body ? Buffer.from(await response.arrayBuffer()) : undefined);
  } catch (error) {
    console.error("cms_request_failed");
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Internal server error." }));
  }
});
server.listen(port, host, () => console.log("DevOne local runtime: http://" + host + ":" + port));
