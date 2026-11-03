'use strict';
// Explicit group-admin-managed media library. Group-scoped storage, bounded
// disk quotas, no network fetches and no implicit retention of incoming media.
const fs=require('node:fs/promises');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {downloadMediaMessage}=require('@whiskeysockets/baileys');
const {mediaTarget,mediaKind}=require('./transcode');
const {isGroup}=require('../util');
const KINDS=Object.freeze({stik:'sticker',vn:'audio',img:'image',vid:'video'});
const LIB_COMMANDS=new Set([
  'addstik','addvn','addimg','addvid',
  'liststik','listvn','listimg','listvid',
  'getstik','getvn','getimg','getvid',
  'delstik','delvn','delimg','delvid'
]);
const KEY=/^[a-z0-9_-]{1,30}$/;
const GROUP=/^[a-zA-Z0-9_-]{8,64}@g\.us$/;
const LIMITS=Object.freeze({sticker:1024*1024,audio:3*1024*1024,image:3*1024*1024,video:8*1024*1024});
const EXT=Object.freeze({sticker:'.webp',audio:'.bin',image:'.bin',video:'.mp4'});
function kindOf(command){
  const suffix=command.replace(/^(?:add|list|get|del)/,'');
  if(!Object.hasOwn(KINDS,suffix))throw new Error('Unknown media category.');
  return KINDS[suffix];
}
function metadataMime(kind,sourceMime){
  if(kind==='sticker')return'image/webp';
  const value=String(sourceMime||'').split(';')[0].trim().toLowerCase();
  if(kind==='image'&&['image/png','image/jpeg','image/webp'].includes(value))return value;
  if(kind==='audio'&&['audio/mpeg','audio/ogg','audio/mp4','audio/aac'].includes(value))return value;
  if(kind==='video'&&['video/mp4','video/webm'].includes(value))return value;
  return{image:'image/jpeg',audio:'audio/ogg',video:'video/mp4'}[kind];
}
function validEntry(row){
  return row&&typeof row==='object'&&!Array.isArray(row)&&
    Object.hasOwn(LIMITS,row.kind)&&KEY.test(row.key)&&
    typeof row.mime==='string'&&row.mime.length<=64&&
    Number.isSafeInteger(row.size)&&row.size>0&&row.size<=LIMITS[row.kind];
}
class MediaLibrary {
  constructor(dir){
    this.dir=path.resolve(dir);
    this.indexFile=path.join(this.dir,'index.json');
    this.index={};this.pending=Promise.resolve();
  }
  async init(){
    await fs.mkdir(this.dir,{recursive:true,mode:0o700});
    try{
      const data=await fs.readFile(this.indexFile,'utf8');
      if(data.length>500000)throw new Error('Media index too large');
      const parsed=JSON.parse(data);
      if(!parsed||!parsed.groups||typeof parsed.groups!=='object'||
        Array.isArray(parsed.groups)||Object.keys(parsed.groups).length>300)
        throw new Error('Invalid media library schema.');
      for(const [chat,records] of Object.entries(parsed.groups)){
        if(!GROUP.test(chat)||!records||typeof records!=='object'||
          Array.isArray(records)||Object.keys(records).length>60)
          throw new Error('Invalid group media index.');
        for(const [compound,row] of Object.entries(records)){
          if(!validEntry(row)||compound!==row.kind+':'+row.key)
            throw new Error('Invalid media index entry.');
        }
      }
      this.index=parsed.groups;
    }catch(err){
      if(err.code!=='ENOENT')throw new Error('Cannot load media library without risking data loss: '+err.message);
      await this.write({});
    }
  }
  folder(chat){if(!GROUP.test(chat||''))throw new Error('Only group IDs are supported.');return path.join(this.dir,chat.slice(0,-5));}
  file(chat,kind,key){return path.join(this.folder(chat),kind,key+EXT[kind]);}
  entries(chat,kind){
    if(!GROUP.test(chat||''))throw new Error('Invalid group.');
    return Object.values(this.index[chat]||{}).filter(row=>row.kind===kind)
      .sort((a,b)=>a.key.localeCompare(b.key));
  }
  record(chat,kind,key){
    if(!KEY.test(key||''))throw new Error('Invalid media name.');
    const name=kind+':'+key;
    return Object.hasOwn(this.index[chat]||{},name)?this.index[chat][name]:null;
  }
  async write(groups){
    const tmp=this.indexFile+'.'+randomUUID()+'.tmp';
    try{
      await fs.writeFile(tmp,JSON.stringify({groups},null,2)+'\n',{flag:'wx',mode:0o600});
      await fs.rename(tmp,this.indexFile);
    }finally{await fs.rm(tmp,{force:true}).catch(()=>{});}
  }
  update(action){
    const task=this.pending.then(async()=>{
      const copy=structuredClone(this.index);
      const result=await action(copy);
      await this.write(copy);
      this.index=copy;
      return result;
    });
    this.pending=task.catch(()=>{});
    return task;
  }
  async put(chat,kind,key,data,mime){
    if(!Object.hasOwn(LIMITS,kind)||!KEY.test(key||'')||!Buffer.isBuffer(data)||
      !data.length||data.length>LIMITS[kind])throw new Error('Media invalid or too large.');
    if(!GROUP.test(chat))throw new Error('Group not supported.');
    const validated=metadataMime(kind,mime);
    if(Object.hasOwn(this.index[chat]||{},kind+':'+key))return false;
    return this.update(async groups=>{
      if(!Object.hasOwn(groups,chat)){
        if(Object.keys(groups).length>=300)throw new Error('Maximum groups reached.');
        groups[chat]={};
      }
      const records=groups[chat];
      if(Object.hasOwn(records,kind+':'+key))return false;
      const category=Object.values(records).filter(row=>row.kind===kind);
      if(category.length>=15)throw new Error('Maximum 15 saved '+kind+' messages per group.');
      const total=Object.values(records).reduce((n,row)=>n+row.size,0);
      if(total+data.length>30*1024*1024)throw new Error('Group storage limit: 30 MB.');
      const filename=this.file(chat,kind,key);
      await fs.mkdir(path.dirname(filename),{recursive:true,mode:0o700});
      await fs.writeFile(filename,data,{flag:'wx',mode:0o600});
      try{
        Object.defineProperty(records,kind+':'+key,{
          value:{kind,key,mime:validated,size:data.length},enumerable:true,
          configurable:true,writable:true});
      }catch(error){await fs.rm(filename,{force:true});throw error;}
      return true;
    });
  }
  async fetch(chat,kind,key){
    const record=this.record(chat,kind,key);
    if(!record)return null;
    const data=await fs.readFile(this.file(chat,kind,key));
    if(data.length!==record.size||data.length>LIMITS[kind])
      throw new Error('Media file size mismatch; refusing to send.');
    return{data,mime:record.mime};
  }
  async remove(chat,kind,key){
    if(!KEY.test(key||''))throw new Error('Invalid media key.');
    return this.update(groups=>{
      const entries=groups[chat];
      if(!entries||!Object.hasOwn(entries,kind+':'+key))return false;
      delete entries[kind+':'+key];
      if(!Object.keys(entries).length)delete groups[chat];
      return true;
    }).then(async existed=>{
      if(existed)await fs.rm(this.file(chat,kind,key),{force:true});
      return existed;
    });
  }
}
function mediaAttachment(body,kind){
  if(kind==='sticker')return body.stickerMessage;
  if(kind==='audio')return body.audioMessage;
  if(kind==='image')return body.imageMessage;
  if(kind==='video')return body.videoMessage;
}
async function handleLibrary(ctx,download=downloadMediaMessage){
  const {cmd,group,chat,owner,roles,library,sock,message,reply,logger,lang}=ctx;
  if(!LIB_COMMANDS.has(cmd.name))return false;
  if(!group){await reply(lang==='en'?'Group only.':'Khusus grup.');return true;}
  if(!library){await reply('Media library unavailable.');return true;}
  const kind=kindOf(cmd.name);
  const mode=cmd.name.slice(0,cmd.name.length-(['stik','vn','img','vid'].find(x=>cmd.name.endsWith(x))||'').length);
  const key=(cmd.args[0]||'').toLowerCase();
  if(mode==='list'){
    const rows=library.entries(chat,kind);
    await reply('*'+kind.toUpperCase()+'*\n'+(rows.map(x=>'• '+x.key).join('\n')||'-'));
    return true;
  }
  if(!KEY.test(key)){await reply('Use '+cmd.name+' <name> (letters/numbers/underscore, max 30).');return true;}
  if(mode==='get'){
    const item=await library.fetch(chat,kind,key);
    if(!item){await reply(lang==='en'?'Item not found.':'Media tidak ditemukan.');return true;}
    const payload=kind==='sticker'?{sticker:item.data}:
      kind==='audio'?{audio:item.data,mimetype:item.mime,ptt:false}:
        kind==='image'?{image:item.data,mimetype:item.mime,caption:key}:
          {video:item.data,mimetype:item.mime,caption:key};
    await sock.sendMessage(chat,payload,{quoted:message});
    return true;
  }
  if(!owner&&!(await roles()).senderAdmin){
    await reply(lang==='en'?'Group admins only.':'Khusus admin grup.');return true;
  }
  if(mode==='del'){
    const result=await library.remove(chat,kind,key);
    await reply(result?'Media deleted.':'Item not found.');return true;
  }
  const target=mediaTarget(message);
  const actual=mediaKind(target);
  if(!actual||actual[0]!==kind){
    await reply(lang==='en'?'Reply to the correct media type first.':
      'Balas jenis media yang sesuai terlebih dahulu.');
    return true;
  }
  const media=mediaAttachment(target.message,kind);
  const stated=Number(media?.fileLength||0);
  if(stated>LIMITS[kind]){await reply('File too large.');return true;}
  const bytes=await download(target,'buffer',{},{
    logger,reuploadRequest:sock.updateMediaMessage
  });
  if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>LIMITS[kind]){
    await reply('Media invalid or exceeds storage limit.');return true;
  }
  const ok=await library.put(chat,kind,key,bytes,media?.mimetype);
  await reply(ok?'Media stored.':'Name already exists; delete it first.');
  return true;
}
module.exports={LIB_COMMANDS,MediaLibrary,handleLibrary,KEY,LIMITS,metadataMime};
