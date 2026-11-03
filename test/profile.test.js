'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const sharp=require('sharp');
const {createRouter}=require('../src/commands');
const {loadConfig}=require('../src/config');
const {extractInvite,prepareAvatar,handleProfile}=require('../src/features/profile');
const owner='6287721373781@s.whatsapp.net',member='6281111111111@s.whatsapp.net';
const group='12345678@g.us',bot='6289999999999@s.whatsapp.net';
const img=()=>sharp({create:{width:320,height:180,channels:3,background:'#ee5522'}}).png().toBuffer();
test('invitation parser blocks arbitrary/unsafe URLs',()=>{
  assert.equal(extractInvite('https://chat.whatsapp.com/ABCDEFGHIJKLMNOPQRSTUV'),'ABCDEFGHIJKLMNOPQRSTUV');
  assert.equal(extractInvite('ABCDEFGHIJKLMNOPQRSTUV'),'ABCDEFGHIJKLMNOPQRSTUV');
  for(const wrong of ['https://evil.com/ABCDEFGHIJKLMNOPQRSTUV',
    'http://chat.whatsapp.com/ABCDEFGHIJKLMNOPQRSTUV',
    'https://chat.whatsapp.com.evil.com/ABCDEFGHIJKLMNOPQRSTUV',
    'https://chat.whatsapp.com/ABC?redirect=http://localhost','../file'])
    assert.throws(()=>extractInvite(wrong),/valid/);
});
test('local avatar converter enforces square JPEG format with bounded dimensions',async()=>{
  const avatar=await prepareAvatar(await img());
  const meta=await sharp(avatar).metadata();
  assert.equal(meta.format,'jpeg');
  assert.equal(meta.width,640);
  assert.equal(meta.height,640);
});
test('profile updates require main owner or authorized group admin',async()=>{
  const sent=[],calls=[];
  const socket={
    user:{id:bot},
    sendMessage:async(_to,body)=>sent.push(body),
    updateProfileName:async name=>calls.push(['name',name]),
    updateProfileStatus:async text=>calls.push(['status',text]),
    updateProfilePicture:async(...args)=>calls.push(['pic',...args]),
    removeProfilePicture:async id=>calls.push(['remove',id]),
    groupAcceptInvite:async code=>{calls.push(['join',code]);return group},
    groupLeave:async id=>calls.push(['leave',id]),
    groupMetadata:async()=>({participants:[
      {id:owner,admin:'admin'},{id:member,admin:'admin'},{id:bot,admin:'admin'}]})
  };
  const logger={warn(){}},config=loadConfig({OWNER_NUMBER:'6287721373781'});
  let time=1000;
  const router=createRouter(config,{mode:'public',group:()=>({})},logger,
    {now:()=>time+=2200});
  const msg=(from,text,inGroup)=>({key:inGroup?{remoteJid:group,participant:from}:{remoteJid:from},
    message:{conversation:text}});
  await router.handle(socket,msg(member,'setnamebot Stolen',false));
  assert.equal(calls.length,0);
  await router.handle(socket,msg(owner,'setnamebot Beauté. 2',false));
  assert.deepEqual(calls.at(-1),['name','Beauté. 2']);
  await router.handle(socket,msg(owner,'join https://chat.whatsapp.com/ABCDEFGHIJKLMNOPQRSTUV',false));
  assert.deepEqual(calls.at(-1),['join','ABCDEFGHIJKLMNOPQRSTUV']);
  await router.handle(socket,msg(member,'delppgc',true));
  assert.deepEqual(calls.at(-1),['remove',group]);
  await router.handle(socket,msg(owner,'leavegc',true));
  assert.deepEqual(calls.at(-1),['leave',group]);
});
test('group profile picture enforces admin and passes processed jpeg buffer',async()=>{
  const photo=await img();
  const sent=[],calls=[];
  const message={
    key:{remoteJid:group,participant:member},
    message:{extendedTextMessage:{text:'setppgc',contextInfo:{stanzaId:'123',
      participant:member,quotedMessage:{imageMessage:{fileLength:photo.length}}}}}
  };
  const context={
    cmd:{name:'setppgc',args:[]},owner:false,group:true,chat:group,
    reply:async text=>sent.push(text),sock:{
      user:{id:bot},
      updateProfilePicture:async(...args)=>calls.push(args)
    },roles:async()=>({senderAdmin:true,botAdmin:true}),
    logger:{warn(){}},lang:'en',message
  };
  await handleProfile(context,async()=>photo);
  assert.equal(calls.length,1);
  assert.equal(calls[0][0],group);
  assert.equal((await sharp(calls[0][1]).metadata()).format,'jpeg');
  assert.match(sent[0],/updated/);
});
