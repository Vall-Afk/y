'use strict';
// Manual group rental registry with no payment processor, no automatic leaving,
// and optional explicit access gating controlled by REQUIRE_SEWA.
const fs=require('node:fs/promises');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {isGroup}=require('../util');
const RENTAL_COMMANDS=new Set(['addsewa','delsewa','listsewa','checksewa','ceksewa','sewa']);
const GROUP=/^[a-zA-Z0-9_-]{8,64}@g\.us$/;
const DAY=86400000;
class RentalRegistry {
  constructor(file,now=()=>Date.now()){
    this.file=file;this.now=now;this.groups={};this.pending=Promise.resolve();
  }
  async init(){
    await fs.mkdir(path.dirname(this.file),{recursive:true,mode:0o700});
    try{
      const text=await fs.readFile(this.file,'utf8');
      if(text.length>1000000)throw new Error('Rental file too large.');
      const data=JSON.parse(text);
      if(!data||typeof data!=='object'||!data.groups||
        typeof data.groups!=='object'||Array.isArray(data.groups)||
        Object.keys(data.groups).length>2000||
        Object.entries(data.groups).some(([id,end])=>!GROUP.test(id)||
          !Number.isSafeInteger(end)||end<0))throw new Error('Invalid rental metadata.');
      this.groups=data.groups;
    }catch(err){
      if(err.code!=='ENOENT')throw new Error('Rental metadata unreadable (not overwritten): '+err.message);
      await this.write({});
    }
  }
  async write(groups){
    const tmp=this.file+'.'+process.pid+'.'+randomUUID()+'.tmp';
    try{
      await fs.writeFile(tmp,JSON.stringify({groups},null,2)+'\n',{mode:0o600,flag:'wx'});
      await fs.rename(tmp,this.file);
    }finally{await fs.rm(tmp,{force:true}).catch(()=>{});}
  }
  get(id){
    if(!GROUP.test(id||''))return {active:false,until:0};
    const until=Object.hasOwn(this.groups,id)?this.groups[id]:0;
    return {active:until>this.now(),until};
  }
  list(){
    return Object.entries(this.groups).filter(([,end])=>end>this.now())
      .sort((a,b)=>a[1]-b[1]).slice(0,100)
      .map(([id,until])=>({id,until}));
  }
  change(id,days){
    if(!GROUP.test(id||''))throw new Error('Invalid group JID.');
    if(days!==0&&(!Number.isInteger(days)||days<1||days>365))
      throw new Error('Rental days must be 1–365.');
    const task=this.pending.then(async()=>{
      const next=structuredClone(this.groups);
      if(days===0)delete next[id];
      else{
        if(!Object.hasOwn(next,id)&&Object.keys(next).length>=2000)
          throw new Error('Rental registry full.');
        const until=Math.max(this.now(),next[id]||0)+days*DAY;
        if(!Number.isSafeInteger(until))throw new Error('Expiry out of range.');
        Object.defineProperty(next,id,{value:until,enumerable:true,writable:true,configurable:true});
      }
      await this.write(next);this.groups=next;return this.get(id);
    });
    this.pending=task.catch(()=>{});
    return task;
  }
}
function rentalGroup(ctx,token){
  if(GROUP.test(token||''))return token;
  if(isGroup(ctx.chat))return ctx.chat;
  return '';
}
async function handleRental(ctx){
  const {cmd,owner,chat,reply,rentals,lang}=ctx;
  if(!RENTAL_COMMANDS.has(cmd.name))return false;
  if(!rentals){await reply('Group rental database is unavailable.');return true;}
  const isCheck=['checksewa','ceksewa','sewa'].includes(cmd.name);
  if(isCheck){
    const id=rentalGroup(ctx,cmd.args[0]);
    if(!id){await reply('Use checksewa in a group, or checksewa <group@g.us>.');return true;}
    const info=rentals.get(id);
    await reply((lang==='en'?'Group rental: ':'Sewa grup: ')+
      (info.active?(lang==='en'?'active until ':'aktif sampai ')+new Date(info.until).toISOString().slice(0,10):
        lang==='en'?'not registered/expired':'tidak terdaftar/kedaluwarsa'));
    return true;
  }
  if(!owner){await reply(lang==='en'?'Main owner only.':'Khusus owner utama.');return true;}
  if(cmd.name==='listsewa'){
    const rows=rentals.list();
    await reply('Group rentals:\n'+(rows.length?rows.map(x=>x.id+' — '+
      new Date(x.until).toISOString().slice(0,10)).join('\n'):'-'));
    return true;
  }
  const tokens=cmd.args;
  const explicit=GROUP.test(tokens[0]||'');
  const id=rentalGroup(ctx,explicit?tokens[0]:null);
  if(!id){await reply('Use addsewa <group@g.us> 30 / delsewa <group@g.us>.');return true;}
  if(cmd.name==='addsewa'){
    const days=Number(explicit?tokens[1]:tokens[0]);
    if(!Number.isInteger(days)||days<1||days>365){
      await reply('Usage: addsewa <group@g.us> <days 1–365>.');return true;
    }
    const state=await rentals.change(id,days);
    await reply((lang==='en'?'Rental extended until ':'Sewa diperpanjang sampai ')+
      new Date(state.until).toISOString().slice(0,10));
  }else if(cmd.name==='delsewa'){
    await rentals.change(id,0);
    await reply(lang==='en'?'Group rental removed.':'Sewa grup dihapus.');
  }
  return true;
}
module.exports={RENTAL_COMMANDS,RentalRegistry,handleRental,GROUP};
