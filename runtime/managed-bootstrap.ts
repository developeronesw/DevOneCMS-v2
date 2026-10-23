// Offline initialization as the site's OS user, before the public service starts.
import {createLocalRuntime} from '../adapters/local/runtime';
import {DevOneInstaller} from '../core/installer';
import {DevOneAuthService} from '../core/auth';
process.umask(0o077);
try{
 let raw='';for await(const b of process.stdin){raw+=b;if(Buffer.byteLength(raw)>4096)throw Error();}
 const b=JSON.parse(raw) as {title:string;email:string;password:string;url:string};
 if(Object.keys(b).some(k=>!['title','email','password','url'].includes(k))||! /^[a-f0-9]{64}$/.test(b.password)||!process.env.DEVONE_DATA_DIR)throw Error();
 const url=new URL(b.url);if(url.protocol!=='https:'||url.origin!==b.url)throw Error();
 const services=await createLocalRuntime({dataDir:process.env.DEVONE_DATA_DIR,environment:'production'});
 const installer=new DevOneInstaller(services);
 await installer.install({deployment:'local',admin:{username:'devone_admin',email:b.email,displayName:'Administrator',password:b.password},site:{name:b.title,slug:'main',url:b.url},smtp:{enabled:false}});
 const auth=new DevOneAuthService(services.db,{secureCookies:true,passwordHashIterations:600000});
 await auth.login(new Request(b.url),'devone_admin',b.password);
 await services.db.run('DELETE FROM sessions');
 process.stdout.write(JSON.stringify({ok:true,version:'2.0.0-alpha.4'}));
}catch{process.stderr.write('cms_bootstrap_requires_inspection\n');process.exitCode=1;}
