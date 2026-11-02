'use strict';
// Explicit opt-in, anonymous text-only matching. No message logging, media,
// identities or session persistence. Contact links require mutual consent.
const {jid}=require('../util');
const ANON_COMMANDS=new Set(['anonymous','start','next','stop','sendprofile']);
const SESSION_MS=30*60*1000;
const QUEUE_MS=15*60*1000;
function validDM(chat){return typeof chat==='string' && /^[1-9]\d{4,19}@(s\.whatsapp\.net|lid)$/.test(jid(chat));}
function phoneLink(account){
  const id=jid(account||'');
  return /^[1-9]\d{7,14}@s\.whatsapp\.net$/.test(id)?
    'https://wa.me/'+id.split('@')[0]:'';
}
class AnonymousHub {
  constructor(now=()=>Date.now()){
    this.now=now;this.waiting=new Map();this.peers=new Map();
    this.consent=new Map();this.rate=new Map();this.expires=new Map();
  }
  cleanup(){
    const now=this.now();
    for(const [chat,time] of this.waiting)if(now-time>QUEUE_MS)this.waiting.delete(chat);
    for(const [chat,time] of this.expires)if(now>time){
      const peer=this.peers.get(chat);
      this.peers.delete(chat);this.consent.delete(chat);this.expires.delete(chat);
      if(peer && this.peers.get(peer)===chat){
        this.peers.delete(peer);this.consent.delete(peer);this.expires.delete(peer);
      }
    }
    if(this.rate.size>4000)this.rate.clear();
  }
  partner(chat){this.cleanup();return this.peers.get(chat)||'';}
  status(chat){
    this.cleanup();
    return this.peers.has(chat)?'connected':this.waiting.has(chat)?'waiting':'idle';
  }
  start(chat){
    this.cleanup();
    if(!validDM(chat))throw new Error('Only private accounts can use anonymous chat.');
    if(this.peers.has(chat))return{status:'connected'};
    if(this.waiting.has(chat))return{status:'waiting'};
    if(this.waiting.size>100)throw new Error('Anonymous waiting queue is full.');
    const another=[...this.waiting.keys()].find(other=>other!==chat && validDM(other));
    if(!another){this.waiting.set(chat,this.now());return{status:'waiting'};}
    this.waiting.delete(another);
    this.peers.set(chat,another);this.peers.set(another,chat);
    this.consent.delete(chat);this.consent.delete(another);
    this.expires.set(chat,this.now()+SESSION_MS);
    this.expires.set(another,this.now()+SESSION_MS);
    return{status:'paired',peer:another};
  }
  stop(chat){
    this.cleanup();
    if(this.waiting.delete(chat))return{status:'leftQueue'};
    const peer=this.peers.get(chat);
    if(!peer)return{status:'idle'};
    this.peers.delete(chat);this.consent.delete(chat);this.expires.delete(chat);
    if(this.peers.get(peer)===chat){
      this.peers.delete(peer);this.consent.delete(peer);this.expires.delete(peer);
    }
    return{status:'disconnected',peer};
  }
  next(chat){
    const previous=this.stop(chat);
    const current=this.start(chat);
    return{previous,current};
  }
  allowMessage(chat){
    const now=this.now();
    const prior=this.rate.get(chat);
    if(prior!==undefined&&now-prior<1500)return false;
    this.rate.set(chat,now);
    const peer=this.peers.get(chat);
    if(peer){
      this.expires.set(chat,now+SESSION_MS);
      this.expires.set(peer,now+SESSION_MS);
    }
    return true;
  }
  profile(chat,account){
    this.cleanup();
    const partner=this.peers.get(chat);
    if(!partner)return{status:'idle'};
    const url=phoneLink(account);
    if(!url)return{status:'noPhone'};
    this.consent.set(chat,url);
    const other=this.consent.get(partner);
    if(!other)return{status:'pending'};
    this.consent.delete(chat);this.consent.delete(partner);
    return{status:'mutual',partner,yourUrl:url,theirUrl:other};
  }
}
async function handleAnonymous(ctx){
  const {cmd,anonymous:hub,chat,group,reply,sock,accountSender,lang}=ctx;
  if(!ANON_COMMANDS.has(cmd.name))return false;
  if(group||!validDM(chat)){await reply(lang==='en'?'Use private chat.':'Gunakan chat pribadi.');return true;}
  if(!hub){await reply('Anonymous chat unavailable.');return true;}
  if(cmd.name==='anonymous'){
    await reply(lang==='en'
      ?'Anonymous text chat (opt-in). start = find partner, next = skip, stop = leave, sendprofile = mutual contact consent. Text only; sessions are not stored.'
      :'Chat anonim (sukarela). start = cari teman, next = ganti teman, stop = keluar, sendprofile = izin berbagi kontak dua pihak. Hanya teks; sesi tidak disimpan.');
    return true;
  }
  const inform=async(to,body)=>{try{await sock.sendMessage(to,{text:body});}catch{}};
  const pairedNotice=lang==='en'?'Anonymous partner found! Text only. next / stop / sendprofile.':
    'Teman anonim ditemukan! Hanya teks. Gunakan next / stop / sendprofile.';
  if(cmd.name==='start'){
    const result=hub.start(chat);
    if(result.status==='paired'){
      await inform(result.peer,pairedNotice);
      await reply(pairedNotice);
    }else if(result.status==='waiting'){
      await reply(lang==='en'?'Waiting for another opt-in user. Send stop to cancel.':
        'Menunggu pengguna lain. Ketik stop untuk membatalkan.');
    }else await reply(lang==='en'?'Already in anonymous chat.':'Sudah berada di chat anonim.');
  }else if(cmd.name==='next'){
    const {previous,current}=hub.next(chat);
    if(previous.peer)await inform(previous.peer,lang==='en'?'Your partner left. Send start to find another.':
      'Teman anonim keluar. Ketik start untuk mencari lagi.');
    if(current.status==='paired'){
      await inform(current.peer,pairedNotice);
      await reply(pairedNotice);
    }else await reply(lang==='en'?'Looking for a new anonymous partner.':
      'Mencari teman anonim baru.');
  }else if(cmd.name==='stop'){
    const result=hub.stop(chat);
    if(result.peer)await inform(result.peer,lang==='en'?'Your partner ended this session.':
      'Teman anonim mengakhiri sesi.');
    await reply(lang==='en'?'Anonymous session ended.':'Sesi anonim selesai.');
  }else if(cmd.name==='sendprofile'){
    const result=hub.profile(chat,accountSender);
    if(result.status==='idle'){await reply(lang==='en'?'Connect to a partner first.':
      'Temukan teman anonim dulu.');return true;}
    if(result.status==='noPhone'){await reply(lang==='en'?'Phone number unavailable: cannot share contact safely.':
      'Nomor tidak tersedia sehingga kontak tidak dapat dibagikan.');return true;}
    if(result.status==='pending'){
      await inform(hub.partner(chat),lang==='en'?
        'Partner requested mutual contact exchange. Send sendprofile ONLY if you agree.':
        'Teman meminta pertukaran kontak. Ketik sendprofile HANYA jika kamu setuju.');
      await reply(lang==='en'?'Waiting for partner consent.':'Menunggu persetujuan teman.');
      return true;
    }
    await inform(result.partner,'Mutual contact exchange: '+result.yourUrl);
    await reply('Mutual contact exchange: '+result.theirUrl);
  }
  return true;
}
async function relayAnonymous(ctx){
  const {anonymous:hub,chat,text,sock,lang,reply}=ctx;
  if(!hub||!validDM(chat))return false;
  const peer=hub.partner(chat);
  if(!peer)return false;
  if(!text || [...text].length>1000){
    await reply(lang==='en'?'Text only (max 1000 characters).':'Hanya teks (maksimal 1000 karakter).');
    return true;
  }
  if(!hub.allowMessage(chat))return true;
  try{await sock.sendMessage(peer,{text:'✦ Anonymous\n'+text});}
  catch{await reply(lang==='en'?'Message could not be sent.':'Pesan gagal dikirim.');}
  return true;
}
module.exports={ANON_COMMANDS,AnonymousHub,handleAnonymous,relayAnonymous,phoneLink,validDM};
