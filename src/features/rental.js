'use strict';
// Manual group rental registry with no payment processor, no automatic leaving,
// and optional explicit access gating controlled by REQUIRE_SEWA.
const fs=require('node:fs/promises');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {isGroup}=require('../util');
const RENTAL_COMMANDS=new Set(['addsewa','delsewa','listsewa','checksewa','ceksewa','sewa','hargasewa','joinsewa']);
const JAKARTA_OFFSET=7*60*60*1000;
const PRICES=Object.freeze({minggu:10000,bulan:30000});
function midnightJakarta(year,month,day){return Date.UTC(year,month,day)-JAKARTA_OFFSET;}
function rentalExpiry(start,plan){if(!['minggu','bulan'].includes(plan))throw Error('Paket sewa tidak valid');const local=new Date(start+JAKARTA_OFFSET);const y=local.getUTCFullYear(),m=local.getUTCMonth(),d=local.getUTCDate();if(plan==='minggu')return midnightJakarta(y,m,d+7);return midnightJakarta(y,m+1,Math.min(d,new Date(Date.UTC(y,m+2,0)).getUTCDate()));}
function formatJakarta(ms){return new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(ms))+' WIB';}
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
  async setPlan(id,plan){if(!GROUP.test(id||''))throw Error('Invalid group JID.');if(!Object.hasOwn(PRICES,plan))throw Error('Paket tidak valid');const task=this.pending.then(async()=>{const next=structuredClone(this.groups);if(!Object.hasOwn(next,id)&&Object.keys(next).length>=2000)throw Error('Rental registry full.');const start=Math.max(this.now(),next[id]||0);const until=rentalExpiry(start,plan);Object.defineProperty(next,id,{value:until,enumerable:true,writable:true,configurable:true});await this.write(next);this.groups=next;return this.get(id);});this.pending=task.catch(()=>{});return task;}
  expired(){return Object.entries(this.groups).filter(([,end])=>end<=this.now()).map(([id,until])=>({id,until}));}
  async clearExpired(id,until){if(!GROUP.test(id))return false;const task=this.pending.then(async()=>{if(this.groups[id]!==until||until>this.now())return false;const next=structuredClone(this.groups);delete next[id];await this.write(next);this.groups=next;return true;});this.pending=task.catch(()=>{});return task;}
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
  if(cmd.name==='hargasewa'||(cmd.name==='sewa'&&!cmd.args.length&&!isGroup(chat))){await reply('Tarif sewa Beauté.\n• 7 hari: Rp10.000\n• 1 bulan kalender: Rp30.000\nPembayaran dan aktivasi melalui owner. Ketik owner.\nMasa sewa berakhir pukul 00.00 WIB pada tanggal jatuh tempo.');return true;}
  const isCheck=['checksewa','ceksewa','sewa'].includes(cmd.name);
  if(isCheck){
    const id=rentalGroup(ctx,cmd.args[0]);
    if(!id){await reply('Use checksewa in a group, or checksewa <group@g.us>.');return true;}
    const info=rentals.get(id);
    await reply((lang==='en'?'Group rental: ':'Sewa grup: ')+
      (info.active?(lang==='en'?'active until ':'aktif sampai ')+formatJakarta(info.until):
        lang==='en'?'not registered/expired':'tidak terdaftar/kedaluwarsa'));
    return true;
  }
  if(!owner){await reply(lang==='en'?'Main owner only.':'Khusus owner utama.');return true;}
  if(cmd.name==='joinsewa'){
    const [link,plan]=cmd.args;
    const match=/^https:\/\/chat\.whatsapp\.com\/([a-zA-Z0-9]{20,24})\/?$/.exec(link||'');
    if(!match||!Object.hasOwn(PRICES,plan||'')){await reply('Format: joinsewa https://chat.whatsapp.com/KODE bulan|minggu. Aktifkan hanya setelah pembayaran dikonfirmasi.');return true;}
    if(typeof ctx.sock?.groupAcceptInvite!=='function'){await reply('Fitur bergabung grup tidak tersedia pada koneksi ini.');return true;}
    const id=await ctx.sock.groupAcceptInvite(match[1]);
    if(!GROUP.test(id||'')){await reply('Bot bergabung, tetapi ID grup tidak valid untuk registrasi. Periksa grup secara manual.');return true;}
    try{const state=await rentals.setPlan(id,plan);await reply('Sewa aktif: '+id+'\nPaket: '+plan+' Rp'+PRICES[plan].toLocaleString('id-ID')+'\nBerakhir: '+formatJakarta(state.until));}
    catch(err){await ctx.sock.groupLeave?.(id).catch(()=>{});throw err;}
    return true;
  }
  if(cmd.name==='listsewa'){
    const rows=rentals.list();
    await reply('Group rentals:\n'+(rows.length?rows.map(x=>x.id+' — '+
      formatJakarta(x.until)).join('\n'):'-'));
    return true;
  }
  const tokens=cmd.args;
  const explicit=GROUP.test(tokens[0]||'');
  const id=rentalGroup(ctx,explicit?tokens[0]:null);
  if(!id){await reply('Use addsewa <group@g.us> 30 / delsewa <group@g.us>.');return true;}
  if(cmd.name==='addsewa'){
    const input=String(explicit?tokens[1]:tokens[0]||'').toLowerCase();
    if(Object.hasOwn(PRICES,input)){const state=await rentals.setPlan(id,input);await reply('Sewa '+input+' (Rp'+PRICES[input].toLocaleString('id-ID')+') aktif sampai '+formatJakarta(state.until));return true;}
    const days=Number(input);
    if(!Number.isInteger(days)||days<1||days>365){
      await reply('Usage: addsewa <group@g.us> <days 1–365>.');return true;
    }
    const state=await rentals.change(id,days);
    await reply((lang==='en'?'Rental extended until ':'Sewa diperpanjang sampai ')+
      formatJakarta(state.until));
  }else if(cmd.name==='delsewa'){
    await rentals.change(id,0);
    await reply(lang==='en'?'Group rental removed.':'Sewa grup dihapus.');
  }
  return true;
}
async function expireRentals({rentals,socket,logger}){if(!rentals||!socket?.groupLeave)return;for(const {id,until} of rentals.expired().slice(0,30)){try{await socket.groupLeave(id);await rentals.clearExpired(id,until);logger?.info?.({id},'Rental expired; bot left group');}catch(err){logger?.warn?.({id,error:err.message},'Could not leave expired rental group; retrying');}}}
module.exports={RENTAL_COMMANDS,RentalRegistry,handleRental,GROUP,PRICES,rentalExpiry,formatJakarta,expireRentals};
