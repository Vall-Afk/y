'use strict';
// Explicit owner-only opt-in controls. No blanket blocking by country code,
// no unsolicited mass messages and no credential exposure.
const fs=require('node:fs/promises'),path=require('node:path');
const {randomUUID}=require('node:crypto');
const OWNER_AUTOMATION_COMMANDS=new Set(['autoread','autobio','autorespond','anticall','autoblok212']);
const SWITCHES=new Set(['autoread','autobio','autorespond','anticall']);
const DEFAULTS=Object.freeze({autoread:false,autobio:false,autorespond:false,anticall:false});
class OwnerPreferences {
  constructor(file){this.file=file;this.settings={...DEFAULTS};this.pending=Promise.resolve();}
  get(){return {...this.settings};}
  async init(){
    await fs.mkdir(path.dirname(this.file),{recursive:true,mode:0o700});
    try{
      const body=await fs.readFile(this.file,'utf8');
      if(body.length>4096)throw new Error('Owner settings too large.');
      const parsed=JSON.parse(body);
      if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||
        Object.keys(parsed).some(k=>!SWITCHES.has(k))||
        Object.values(parsed).some(v=>typeof v!=='boolean'))
        throw new Error('Invalid owner settings schema.');
      this.settings={...DEFAULTS,...parsed};
    }catch(err){
      if(err.code!=='ENOENT')throw new Error('Owner settings corrupt; refusing overwrite: '+err.message);
      await this.write(this.settings);
    }
  }
  async write(value){
    const temp=this.file+'.'+randomUUID()+'.tmp';
    try{
      await fs.writeFile(temp,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
      await fs.rename(temp,this.file);
    }finally{await fs.rm(temp,{force:true}).catch(()=>{});}
  }
  set(key,value){
    if(!SWITCHES.has(key)||typeof value!=='boolean')throw new Error('Invalid owner automation setting.');
    const task=this.pending.then(async()=>{
      const next={...this.settings,[key]:value};
      await this.write(next);
      this.settings=next;
    });
    this.pending=task.catch(()=>{});
    return task;
  }
}
function bioText(config){
  return String(config.name||'Beauté.').slice(0,40)+' • Online';
}
async function handleOwnerAutomation(ctx){
  const {cmd,owner,group,reply,lang,ownerPreferences,sock,config}=ctx;
  if(!OWNER_AUTOMATION_COMMANDS.has(cmd.name))return false;
  if(!owner||group){
    await reply(lang==='en'?'Main bot owner only, in private chat.':
      'Khusus owner bot utama, lewat chat pribadi.');return true;
  }
  if(cmd.name==='autoblok212'){
    await reply(lang==='en'
      ? 'Automatic blocking by country code is not supported. Block individual abusive accounts using WhatsApp controls.'
      : 'Pemblokiran otomatis berdasarkan kode negara tidak didukung. Blokir akun yang mengganggu secara individual melalui WhatsApp.');
    return true;
  }
  if(!ownerPreferences){await reply('Owner automation storage unavailable.');return true;}
  const value=cmd.args[0]?.toLowerCase();
  if(!['on','off'].includes(value)){
    const enabled=ownerPreferences.get()[cmd.name];
    await reply(cmd.name+': '+(enabled?'on':'off')+'\n'+cmd.name+' on|off');
    return true;
  }
  await ownerPreferences.set(cmd.name,value==='on');
  if(cmd.name==='autobio'&&value==='on'&&typeof sock.updateProfileStatus==='function'){
    try{await sock.updateProfileStatus(bioText(config));}
    catch(err){await reply('autobio on saved; profile update needs live WhatsApp permission.');return true;}
  }
  await reply(cmd.name+': '+value+
    (cmd.name==='autorespond'&&value==='on'?
      '\nDM non-commands only, maximum one reply per contact every 6 hours.':''));
  return true;
}
function autoRespondText(lang,name){
  return lang==='en'?'Hello! '+name+' is online. Type menu for commands.':
    'Halo! '+name+' sedang aktif. Ketik menu untuk daftar perintah.';
}
async function rejectIncomingCalls(sock,calls,preferences,logger){
  if(!preferences?.get().anticall||!Array.isArray(calls)||typeof sock.rejectCall!=='function')return 0;
  let rejected=0;
  for(const call of calls.slice(0,5)){
    if(call?.status!=='offer'||typeof call.id!=='string'||
      typeof call.from!=='string')continue;
    try{await sock.rejectCall(call.id,call.from);rejected++;}
    catch(err){logger?.warn?.({error:err.message},'Failed to reject incoming call');}
  }
  return rejected;
}
module.exports={OWNER_AUTOMATION_COMMANDS,SWITCHES,DEFAULTS,OwnerPreferences,
  bioText,handleOwnerAutomation,autoRespondText,rejectIncomingCalls};
