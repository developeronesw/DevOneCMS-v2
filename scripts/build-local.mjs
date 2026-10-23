import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdir,cp,writeFile,rm} from 'node:fs/promises';
await rm('dist-local',{recursive:true,force:true});await mkdir('dist-local',{recursive:true});
for(const [entry,out] of [['runtime/local-server.ts','runtime.mjs'],['runtime/managed-bootstrap.ts','bootstrap.mjs']])await build({entryPoints:[entry],outfile:'dist-local/'+out,bundle:true,platform:'node',format:'esm',target:'node22',sourcemap:false});
execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--config','vite.local.config.ts'],{stdio:'inherit'});
await cp('migrations','dist-local/migrations',{recursive:true});
for(const file of ['DEVONE-CMS-2.0-LICENSE.md','NOTICE.txt'])await cp(file,'dist-local/'+file);
await writeFile('dist-local/release.json',JSON.stringify({product:'DevOne CMS',version:'2.0.0-alpha.4',sourceRepository:'developeronesw/DevOneCMS-v2',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),profile:'local-node-sqlite',preview:true},null,2)+'\n');
