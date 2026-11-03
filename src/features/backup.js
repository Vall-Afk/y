'use strict';
// Owner-only export of non-credential data. NEVER includes .env, data/auth,
// Jadibot auth, session/pairing codes or user-uploaded media.
const fs=require('node:fs/promises');
const path=require('node:path');
const BACKUP_COMMANDS=new Set(['backup','backupbot']);
const FILES=Object.freeze({
  settings:'settings.json',
  economy:'economy.json',
  catalog:'group-catalog.json',
  moderation:'moderation.json',
  rentals:'rentals.json',
  jadibotSettings:'jadibot/settings.json',
  jadibotCatalog:'jadibot/group-catalog.json',
  jadibotModeration:'jadibot/moderation.json',
  jadibotRentals:'jadibot/rentals.json'
});
const MAX_FILE=3*1024*1024,MAX_TOTAL=8*1024*1024;
class BackupService{
  constructor(dataDir,now=()=>new Date()){this.dataDir=path.resolve(dataDir);this.now=now;}
  async snapshot(){
    const files={};
    let total=0;
    for(const [key,relative] of Object.entries(FILES)){
      const full=path.join(this.dataDir,relative);
      let item;
      try{
        const stat=await fs.lstat(full);
        if(!stat.isFile()||stat.size>MAX_FILE)
          throw new Error('Refusing oversized/non-file data: '+relative);
        item=await fs.readFile(full);
      }catch(err){
        if(err.code==='ENOENT')continue;
        throw err;
      }
      if(item.length>MAX_FILE)throw new Error('Backup entry too large: '+relative);
      total+=item.length;
      if(total>MAX_TOTAL)throw new Error('Backup size exceeded 8 MB.');
      try{files[key]=JSON.parse(item.toString('utf8'));}
      catch{throw new Error('Cannot back up corrupt JSON: '+relative);}
    }
    const archive={
      format:'beaute-data-backup',schemaVersion:1,
      createdAt:this.now().toISOString(),
      excludes:['auth','tokens','.env','jadibot/auth','jadibot/session.json'],
      files
    };
    const bytes=Buffer.from(JSON.stringify(archive,null,2)+'\n','utf8');
    if(bytes.length>MAX_TOTAL)throw new Error('Backup size exceeded 8 MB.');
    return{bytes,fileName:'beaute-backup-'+archive.createdAt.slice(0,10)+'.json'};
  }
}
async function handleBackup(ctx){
  if(!BACKUP_COMMANDS.has(ctx.cmd.name))return false;
  const {owner,group,backup,sock,chat,message,reply,lang}=ctx;
  if(!owner||group){
    await reply(lang==='en'?'Only the main owner in private chat may export a backup.':
      'Backup hanya untuk owner utama melalui chat pribadi.');
    return true;
  }
  if(!backup){await reply('Backup available only on the main bot.');return true;}
  const {bytes,fileName}=await backup.snapshot();
  await sock.sendMessage(chat,{
    document:bytes,mimetype:'application/json',fileName,
    caption:lang==='en'
      ?'Private Beauté. data backup. Contains user data; do not forward. Auth and API keys excluded.'
      :'Backup privat data Beauté. Berisi data pengguna; jangan sebarkan. Sesi dan API key tidak disertakan.'
  },{quoted:message});
  return true;
}
module.exports={BackupService,BACKUP_COMMANDS,handleBackup,FILES,MAX_FILE,MAX_TOTAL};
