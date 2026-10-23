import {constants} from 'node:fs';
import {mkdir,lstat,open,chmod} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createLocalServices} from './providers';
import {runLocalMigrations} from './migrations';
export interface LocalRuntimeOptions {dataDir:string;mediaDir?:string;environment?:string;database?:DatabaseSync;secretKey?:string;}
async function loadSecret(dataDir:string,supplied?:string){
 if(supplied){if(!/^[a-zA-Z0-9_-]{43}$/.test(supplied))throw Error('Invalid runtime key.');return supplied;}
 const path=resolve(dataDir,'devone.secret');
 try{
  const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{const s=await file.stat();if(!s.isFile()||s.uid!==process.getuid?.()||s.size>128)throw Error('Unsafe runtime key.');if(s.mode&0o077)await file.chmod(0o600);const value=(await file.readFile('utf8')).trim();if(!/^[a-zA-Z0-9_-]{43}$/.test(value))throw Error('Invalid runtime key.');return value;}finally{await file.close();}
 }catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 const file=await open(path,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600),value=randomBytes(32).toString('base64url');
 try{await file.writeFile(value+'\n');await file.sync();}finally{await file.close();}return value;
}
export async function createLocalRuntime(options:LocalRuntimeOptions){
 const dataDir=resolve(options.dataDir);await mkdir(dataDir,{recursive:true,mode:0o700});
 const directory=await lstat(dataDir);if(!directory.isDirectory()||directory.isSymbolicLink()||directory.uid!==process.getuid?.())throw Error('Runtime data must be a private owned directory.');if(directory.mode&0o077)await chmod(dataDir,0o700);
 const mediaDir=resolve(options.mediaDir??dataDir+'/media');await mkdir(mediaDir,{recursive:true,mode:0o700});
 const path=resolve(dataDir,'devone.sqlite');
 if(!options.database){
  try{const f=await open(path,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);await f.close();}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;}
  const s=await lstat(path);if(!s.isFile()||s.isSymbolicLink()||s.uid!==process.getuid?.())throw Error('Unsafe runtime database.');if(s.mode&0o077)await chmod(path,0o600);
 }
 const Database=DatabaseSync as unknown as new(path:string)=>DatabaseSync;
 const database=options.database??new Database(path);database.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 await runLocalMigrations(database);const secretKey=await loadSecret(dataDir,options.secretKey??process.env.DEVONE_SECRET_KEY);
 return createLocalServices({...options,dataDir,mediaDir,database,secretKey});
}
