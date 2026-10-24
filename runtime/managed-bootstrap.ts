// Offline initialization as the site's OS user, before the public service starts.
import {createLocalRuntime} from '../adapters/local/runtime';
import {DevOneInstaller} from '../core/installer';
import {DevOneAuthService} from '../core/auth';
process.umask(0o077);
try{
 let raw='';for await(const b of process.stdin){raw+=b;if(Buffer.byteLength(raw)>4096)throw Error();}
 const b=JSON.parse(raw) as {title:string;email:string;password:string;url:string;username?:string};
 if(Object.keys(b).some(k=>!['title','email','password','url','username'].includes(k))||typeof b.password!=='string'||b.password.length<12||b.password.length>128||/[\x00-\x1f\x7f]/.test(b.password)||!process.env.DEVONE_DATA_DIR)throw Error();
 const username=b.username??'devone_admin';if(!/^[a-z0-9][a-z0-9._-]{2,59}$/.test(username))throw Error();
 const url=new URL(b.url);if(url.protocol!=='https:'||url.origin!==b.url)throw Error();
 const services=await createLocalRuntime({dataDir:process.env.DEVONE_DATA_DIR,environment:'production'});
 const installer=new DevOneInstaller(services);
 await installer.install({deployment:'local',admin:{username,email:b.email,displayName:'Administrator',password:b.password},site:{name:b.title,slug:'main',url:b.url},smtp:{enabled:false}});
 const auth=new DevOneAuthService(services.db,{secureCookies:true,passwordHashIterations:600000});
 await auth.login(new Request(b.url),username,b.password);
 await services.db.run('DELETE FROM sessions');
 process.stdout.write(JSON.stringify({ok:true,version:'2.0.0-alpha.5'}));
}catch{process.stderr.write('cms_bootstrap_requires_inspection\n');process.exitCode=1;}
