import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,rm,readFile,stat,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {createServer} from 'node:net';
const exec=promisify(execFile);
async function port(){const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function start(env){const child=spawn(process.execPath,['dist-local/runtime.mjs'],{env,stdio:'ignore'});for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error('CMS exited');try{if((await fetch('http://127.0.0.1:'+env.PORT+'/api/health')).ok)return child;}catch{}await new Promise(r=>setTimeout(r,100));}child.kill();throw Error('CMS not ready');}
async function stop(child){if(child.exitCode!==null)return;await new Promise(r=>{child.once('exit',r);child.kill('SIGTERM');});}
test('built local CMS bootstraps privately and serves authenticated production UI/API with persisted state',async()=>{
 const data=await mkdtemp(join(tmpdir(),'devone-cms-package-')),password='bc'.repeat(32);
 const env={...process.env,NODE_ENV:'production',HOST:'127.0.0.1',PORT:String(await port()),DEVONE_SITE_URL:'https://cms.example.test',DEVONE_DATA_DIR:data,DEVONE_MIGRATIONS_DIR:resolve('dist-local/migrations')};
 let child;
 try{
  await assert.rejects(exec(process.execPath,['dist-local/runtime.mjs'],{env,timeout:5000}));
  await new Promise((resolve,reject)=>{const c=execFile(process.execPath,['dist-local/bootstrap.mjs'],{env,timeout:10000},(error,out)=>error?reject(Error('bootstrap failed')):resolve(JSON.parse(out)));c.stdin.end(JSON.stringify({title:'Managed CMS',email:'admin@example.test',password,url:env.DEVONE_SITE_URL}));});
  assert.equal((await stat(join(data,'devone.sqlite'))).mode&0o777,0o600);assert.equal((await stat(join(data,'devone.secret'))).mode&0o777,0o600);
  const db=new DatabaseSync(join(data,'devone.sqlite'));assert.match(db.prepare('SELECT password_hash FROM users').get().password_hash,/^pbkdf2\$sha256\$600000\$/);db.close();
  child=await start(env);const base='http://127.0.0.1:'+env.PORT;
  const page=await fetch(base+'/');assert.equal(page.status,200);assert.ok((await page.text()).includes('/assets/'));
  for(const path of ['/data/devone.sqlite','/devone.secret','/runtime.mjs','/assets/../data/devone.sqlite'])assert.equal((await fetch(base+path)).status,404);
  const headers={'content-type':'application/json',origin:env.DEVONE_SITE_URL,'x-forwarded-proto':'https'};
  const post=(url,body,h=headers)=>fetch(base+url,{method:'POST',headers:h,body:JSON.stringify(body)});
  assert.equal((await post('/api/install',{})).status,403);assert.equal((await post('/api/auth/login',{username:'devone_admin',password},{...headers,origin:'https://evil.test'})).status,403);
  assert.equal((await post('/api/auth/login',{username:'devone_admin',password},{...headers,'x-forwarded-proto':'http'})).status,426);
  const login=await post('/api/auth/login',{username:'devone_admin',password});assert.equal(login.status,200);assert.match(login.headers.get('set-cookie'),/Secure/);const cookie=login.headers.get('set-cookie').split(';')[0],body=await login.json();
  const get=await fetch(base+'/api/core/settings',{headers:{cookie}});assert.equal(get.status,200);
  assert.equal((await fetch(base+'/api/core/settings',{method:'PATCH',headers:{...headers,cookie},body:'{}'})).status,403);
  const content=await post('/api/core/content',{title:'Persistent page',slug:'persistent',content:'<p>saved</p>'},{...headers,cookie,'x-devone-csrf':body.csrf_token});assert.equal(content.status,201);
  await stop(child);child=await start(env);
  const restored=await fetch(base+'/api/core/content',{headers:{cookie}});assert.equal(restored.status,200);assert.ok((await restored.json()).pages.some(p=>p.slug==='persistent'));
  const key=await readFile(join(data,'devone.secret'),'utf8');await stop(child);child=null;await writeFile(join(data,'devone.secret'),'invalid');
  await assert.rejects(exec(process.execPath,['dist-local/runtime.mjs'],{env,timeout:5000}));assert.equal(await readFile(join(data,'devone.secret'),'utf8'),'invalid');assert.notEqual(key,'invalid');
 }finally{if(child)await stop(child);await rm(data,{recursive:true,force:true});}
});
