'use strict';
// Group moderation: opt-in anti-spam, persistent warnings/rules and safe
// exact-match custom replies. No silent auto-kicks or mass messaging.
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { jid, isGroup } = require('../util');
const MOD_COMMANDS = new Set([
  'antispam','warn','unwarn','listwarn','warnings','resetwarn',
  'rules','setrules','delrules','addresponse','delresponse','listresponse',
  'setopen','setclose','changesetopen','changesetclose','delsetopen','delsetclose','listschedule'
]);
const PHONE = /^[1-9]\d{4,19}@(s\.whatsapp\.net|lid)$/;
const RESPONSE_KEY = /^[a-z0-9][a-z0-9_-]{0,29}$/;
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const MAX_GROUPS = 1500;
const MAX_WARNS = 50;
const MAX_RESPONSES = 20;
function defaults() {
  return { antispam: false, rules: '', warnings: {}, responses: {},
    openAt: '', closeAt: '', lastOpen: '', lastClose: '' };
}
function validGroupEntry(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
  if (typeof entry.antispam !== 'boolean' || typeof entry.rules !== 'string' ||
      entry.rules.length > 800 || !entry.warnings || typeof entry.warnings !== 'object' ||
      Array.isArray(entry.warnings) || Object.keys(entry.warnings).length > MAX_WARNS ||
      !entry.responses || typeof entry.responses !== 'object' || Array.isArray(entry.responses) ||
      Object.keys(entry.responses).length > MAX_RESPONSES) return false;
  if (Object.entries(entry.warnings).some(([id, n]) => !PHONE.test(id) ||
      !Number.isInteger(n) || n < 1 || n > 20)) return false;
  if (Object.entries(entry.responses).some(([key, text]) => !RESPONSE_KEY.test(key) ||
      typeof text !== 'string' || !text || text.length > 350)) return false;
  if (!['openAt','closeAt'].every(k => entry[k] === '' || TIME.test(entry[k]))) return false;
  if (!['lastOpen','lastClose'].every(k => entry[k] === '' ||
      /^\d{4}-\d{2}-\d{2}$/.test(entry[k]))) return false;
  return true;
}
class ModerationStore {
  constructor(file) {
    this.file = file;
    this.groups = {};
    this.pending = Promise.resolve();
  }
  async init() {
    await fs.mkdir(path.dirname(this.file), {recursive:true,mode:0o700});
    try {
      const data = await fs.readFile(this.file,'utf8');
      if (data.length > 2_000_000) throw new Error('Moderation file is too large');
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) ||
          !parsed.groups || typeof parsed.groups !== 'object' ||
          Array.isArray(parsed.groups) || Object.keys(parsed.groups).length > MAX_GROUPS ||
          Object.entries(parsed.groups).some(([chat, value]) => !isGroup(chat) ||
            !validGroupEntry({...defaults(),...value}))) {
        throw new Error('Invalid moderation database');
      }
      this.groups = parsed.groups;
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error('Moderation file unreadable; refusing overwrite: '+error.message);
      await this.write({});
    }
  }
  get(chat) {
    if (!isGroup(chat)) return defaults();
    return structuredClone({...defaults(),...(this.groups[chat] || {})});
  }
  async write(data) {
    const temp=this.file+'.'+process.pid+'.'+randomUUID()+'.tmp';
    try {
      await fs.writeFile(temp,JSON.stringify({groups:data},null,2)+'\n',{mode:0o600,flag:'wx'});
      await fs.rename(temp,this.file);
    } finally { await fs.rm(temp,{force:true}).catch(()=>{}); }
  }
  change(chat,fn) {
    if (!isGroup(chat)) throw new Error('Only groups can configure moderation.');
    const task=this.pending.then(async()=>{
      const copy=structuredClone(this.groups);
      if (!Object.hasOwn(copy,chat)) {
        if (Object.keys(copy).length>=MAX_GROUPS) throw new Error('Group limit reached.');
        Object.defineProperty(copy,chat,{value:defaults(),enumerable:true,writable:true,configurable:true});
      }
      const result=fn(copy[chat]);
      if (!validGroupEntry(copy[chat])) throw new Error('Invalid moderation entry.');
      await this.write(copy);
      this.groups=copy;
      return result;
    });
    this.pending=task.catch(()=>{});
    return task;
  }
  toggleSpam(chat,enabled){return this.change(chat,g=>{g.antispam=enabled;});}
  setRules(chat,text){
    if (typeof text!=='string' || text.length>800) throw new Error('Rules max 800 characters.');
    return this.change(chat,g=>{g.rules=text;});
  }
  warn(chat,account,delta) {
    account=jid(account);
    if (!PHONE.test(account) || ![-1,1,0].includes(delta)) throw new Error('Invalid warning target.');
    return this.change(chat,g=>{
      const current=g.warnings[account] || 0;
      const next=delta===0 ? 0 : Math.max(0,Math.min(20,current+delta));
      if (next) Object.defineProperty(g.warnings,account,{value:next,writable:true,enumerable:true,configurable:true});
      else delete g.warnings[account];
      if (Object.keys(g.warnings).length>MAX_WARNS) throw new Error('Warning list full.');
      return next;
    });
  }
  response(chat,key,value) {
    if (!RESPONSE_KEY.test(key)) throw new Error('Key must be 1–30 letters/numbers/underscores.');
    if (value!==null && (typeof value!=='string'||!value||value.length>350))
      throw new Error('Response must be 1–350 characters.');
    return this.change(chat,g=>{
      if (value===null) delete g.responses[key];
      else {
        if (!Object.hasOwn(g.responses,key) && Object.keys(g.responses).length>=MAX_RESPONSES)
          throw new Error('Max 20 responses per group.');
        Object.defineProperty(g.responses,key,{value,writable:true,enumerable:true,configurable:true});
      }
    });
  }
  schedule(chat,kind,time) {
    if (!['open','close'].includes(kind) || (time!==''&&!TIME.test(time))) throw new Error('Invalid HH:MM time.');
    return this.change(chat,g=>{
      g[kind+'At']=time;
      g[kind==='open'?'lastOpen':'lastClose']='';
    });
  }
  markRan(chat,kind,day) {
    if (!['open','close'].includes(kind)||!/^\d{4}-\d{2}-\d{2}$/.test(day))
      throw new Error('Invalid scheduled event.');
    return this.change(chat,g=>{g[kind==='open'?'lastOpen':'lastClose']=day;});
  }
}
class SpamDetector {
  constructor(now=()=>Date.now()){this.now=now;this.history=new Map();}
  hit(chat,sender){
    const key=chat+'|'+jid(sender);
    const time=this.now();
    const window=(this.history.get(key)||[]).filter(at=>time-at<10000);
    window.push(time);
    if (this.history.size>5000) this.history.clear();
    this.history.set(key,window);
    return window.length>=6;
  }
}
function mentionedAccount(message){
  const context=message.message?.extendedTextMessage?.contextInfo ||
    message.message?.imageMessage?.contextInfo || {};
  const target=(context.mentionedJid || [])[0] || context.participant;
  return jid(target || '');
}
async function inspectModeration(ctx,detector) {
  const { moderation,chat,text,cmd,owner,sender,accountSender,roles,sock,message,lang }=ctx;
  if (!moderation || !isGroup(chat) || !text) return false;
  const state=moderation.get(chat);
  if (state.antispam && !owner && detector.hit(chat,accountSender||sender)) {
    const role=await roles();
    if (!role.senderAdmin && role.botAdmin) {
      await sock.sendMessage(chat,{delete:message.key});
      return true;
    }
  }
  // Only non-command exact-keyword responses; no substring spam or arbitrary URLs.
  if (!cmd) {
    const key=text.trim().toLowerCase();
    if (RESPONSE_KEY.test(key) && Object.hasOwn(state.responses,key)) {
      await sock.sendMessage(chat,{text:state.responses[key].slice(0,350)},{quoted:message});
      return true;
    }
  }
  return false;
}
async function handleModeration(ctx){
  const {cmd,chat,owner,roles,reply,moderation,message,accountSender,lang}=ctx;
  if (!MOD_COMMANDS.has(cmd.name)) return false;
  if (!isGroup(chat)) {
    await reply(lang==='en'?'Only available in groups.':'Khusus grup.');
    return true;
  }
  if (!moderation){await reply('Moderation not configured.');return true;}
  const state=moderation.get(chat);
  const adminOnly=!['rules','listwarn','warnings','listresponse','listschedule'].includes(cmd.name);
  if (adminOnly && !owner && !(await roles()).senderAdmin){
    await reply(lang==='en'?'Group admins only.':'Khusus admin grup.');return true;
  }
  const arg=cmd.args.join(' ').trim();
  if (cmd.name==='rules'){
    await reply(state.rules || (lang==='en'?'No group rules set.':'Peraturan grup belum diatur.'));
  } else if(cmd.name==='setrules'){
    if (!arg || arg.length>800){await reply('setrules <text> (max 800)');return true;}
    await moderation.setRules(chat,arg);await reply(lang==='en'?'Rules saved.':'Peraturan disimpan.');
  } else if(cmd.name==='delrules'){
    await moderation.setRules(chat,'');await reply(lang==='en'?'Rules removed.':'Peraturan dihapus.');
  } else if(cmd.name==='antispam'){
    const choice=cmd.args[0]?.toLowerCase();
    if (!['on','off'].includes(choice)){await reply('antispam on|off');return true;}
    await moderation.toggleSpam(chat,choice==='on');await reply('Anti-spam: '+choice);
  } else if(['warn','unwarn','resetwarn','listwarn','warnings'].includes(cmd.name)){
    const target=mentionedAccount(message) ||
      (!['warn','unwarn','resetwarn'].includes(cmd.name) && !arg ? (accountSender||'') : '');
    if (!PHONE.test(target)){await reply(lang==='en'?'Mention the target user.':'Tag pengguna terlebih dahulu.');return true;}
    if (['warn','unwarn','resetwarn'].includes(cmd.name)) {
      if (target===ctx.config.ownerJid || target===jid(ctx.sock.user?.id)) {
        await reply(lang==='en'?'Owner and bot are protected.':'Owner dan bot dilindungi.');return true;
      }
      const delta=cmd.name==='warn'?1:cmd.name==='unwarn'?-1:0;
      const count=await moderation.warn(chat,target,delta);
      await reply('Warnings @'+target.split('@')[0]+': '+count+'/20');
    } else {
      await reply('Warnings @'+target.split('@')[0]+': '+(state.warnings[target]||0)+'/20');
    }
  } else if(cmd.name==='listresponse'){
    const keys=Object.keys(state.responses).sort();
    await reply((lang==='en'?'Custom replies:':'Balasan otomatis:')+'\n'+
      (keys.join('\n')||(lang==='en'?'None.':'Belum ada.')));
  } else if(cmd.name==='addresponse'){
    const pos=arg.indexOf('|'),key=arg.slice(0,pos).trim().toLowerCase();
    const value=pos<0?'':arg.slice(pos+1).trim();
    if (pos<0||!RESPONSE_KEY.test(key)||!value||value.length>350){
      await reply('addresponse keyword | reply (max 350)');return true;
    }
    await moderation.response(chat,key,value);
    await reply(lang==='en'?'Custom reply saved.':'Balasan otomatis disimpan.');
  } else if(cmd.name==='delresponse'){
    const key=arg.toLowerCase();
    if (!RESPONSE_KEY.test(key)){await reply('delresponse keyword');return true;}
    await moderation.response(chat,key,null);
    await reply(lang==='en'?'Custom reply deleted.':'Balasan otomatis dihapus.');
  } else if(cmd.name==='listschedule'){
    await reply((lang==='en'?'Daily schedule (Jakarta/WIB):':'Jadwal harian (WIB):')+
      '\nOpen: '+(state.openAt||'-')+'\nClose: '+(state.closeAt||'-'));
  } else if(['setopen','setclose','changesetopen','changesetclose','delsetopen','delsetclose'].includes(cmd.name)){
    const kind=cmd.name.includes('open')?'open':'close';
    const clear=cmd.name.startsWith('del');
    if (!clear&&!TIME.test(arg)){await reply('Format: '+cmd.name+' 08:00 (WIB)');return true;}
    await moderation.schedule(chat,kind,clear?'':arg);
    await reply((lang==='en'?'Schedule saved: ':'Jadwal tersimpan: ')+kind+' '+(clear?'-':arg));
  }
  return true;
}
function wibMinute(when){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(when).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  return {day:parts.year+'-'+parts.month+'-'+parts.day,time:parts.hour+':'+parts.minute};
}
async function runGroupSchedules({moderation,socket,logger,now=()=>new Date(),inProgress=new Set()}){
  if (!socket||!moderation) return 0;
  const {day,time}=wibMinute(now());
  let count=0;
  for (const [chat,entry] of Object.entries(moderation.groups).slice(0,MAX_GROUPS)){
    for (const kind of ['open','close']){
      const g={...defaults(),...entry};
      const lastKey=kind==='open'?'lastOpen':'lastClose';
      if (g[kind+'At']!==time || g[lastKey]===day) continue;
      const key=chat+'|'+kind+'|'+day;
      if (inProgress.has(key)) continue;
      inProgress.add(key);
      try {
        const meta=await socket.groupMetadata(chat);
        const participants=meta?.participants||[];
        const bot=jid(socket.user?.id);
        const isBotAdmin=participants.some(p=>
          [p.id,p.phoneNumber,p.lid].some(x=>jid(x)===bot)&&
          ['admin','superadmin'].includes(p.admin));
        if (!isBotAdmin) continue;
        await socket.groupSettingUpdate(chat,kind==='open'?'not_announcement':'announcement');
        await moderation.markRan(chat,kind,day);
        count++;
      } catch (error) {
        logger?.warn?.({chat,error:error.message},'Scheduled group change failed');
      } finally {inProgress.delete(key);}
    }
  }
  return count;
}
module.exports={ModerationStore,SpamDetector,MOD_COMMANDS,inspectModeration,
  handleModeration,runGroupSchedules,wibMinute,mentionedAccount,RESPONSE_KEY};
