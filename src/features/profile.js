'use strict';
// Admin-controlled profile/group operations through supported Baileys methods.
// Media is processed locally and no account verification/enumeration occurs.
const sharp=require('sharp');
const {jid,isGroup}=require('../util');
const {imageInput}=require('./image-studio');
const PROFILE_COMMANDS=new Set([
  'join','leavegc','setppbot','setppbot2','delppbot','setnamebot',
  'setbiobot','setppgc','setppgc2','pppanjanggc','delppgc'
]);
const INVITE=/^(?:https:\/\/chat\.whatsapp\.com\/)?([A-Za-z0-9]{18,32})\/?$/;
function extractInvite(value){
  const match=INVITE.exec(value||'');
  if(!match)throw new Error('Use a valid chat.whatsapp.com group invitation.');
  return match[1];
}
async function prepareAvatar(buffer){
  const output=await sharp(buffer,{limitInputPixels:20_000_000,animated:false})
    .resize(640,640,{fit:'cover',position:'attention'})
    .jpeg({quality:83,mozjpeg:false}).toBuffer();
  if(output.length>1024*1024)throw new Error('Profile photo exceeds 1 MB.');
  return output;
}
async function handleProfile(ctx,download) {
  const {cmd,owner,group,chat,reply,lang,sock,roles,message}=ctx;
  if(!PROFILE_COMMANDS.has(cmd.name))return false;
  const mode=cmd.name;
  const groupProfile=['setppgc','setppgc2','pppanjanggc','delppgc'].includes(mode);
  if(groupProfile){
    if(!group){await reply(lang==='en'?'Group only.':'Hanya untuk grup.');return true;}
    const role=await roles();
    if(!owner&&!role.senderAdmin){
      await reply(lang==='en'?'Group admins only.':'Khusus admin grup.');return true;
    }
    if(!role.botAdmin){
      await reply(lang==='en'?'Make the bot a group admin first.':
        'Jadikan bot admin grup dahulu.');return true;
    }
  }else if(!owner){
    await reply(lang==='en'?'Bot owner only.':'Khusus owner bot.');return true;
  }
  if(mode==='join'){
    if(group){await reply(lang==='en'?'Send group invitations in a private chat.':
      'Kirim tautan undangan lewat chat pribadi.');return true;}
    const code=extractInvite(cmd.args[0]);
    const joined=await sock.groupAcceptInvite(code);
    await reply((lang==='en'?'Joined group: ':'Bergabung ke grup: ')+String(joined||'-').slice(0,90));
    return true;
  }
  if(mode==='leavegc'){
    if(!group){await reply(lang==='en'?'Run leavegc in the group you want to leave.':
      'Ketik leavegc di grup yang ingin ditinggalkan.');return true;}
    // Tell the group before departing so no further send is attempted afterwards.
    await reply(lang==='en'?'Owner requested the bot to leave this group.':
      'Owner meminta bot keluar dari grup ini.');
    await sock.groupLeave(chat);
    return true;
  }
  if(mode==='setnamebot'||mode==='setbiobot'){
    const text=cmd.args.join(' ').trim();
    if(!text||text.length>(mode==='setnamebot'?50:139))
      throw new Error('Text must be 1–'+(mode==='setnamebot'?50:139)+' characters.');
    if(mode==='setnamebot')await sock.updateProfileName(text);
    else await sock.updateProfileStatus(text);
    await reply(lang==='en'?'Bot profile updated.':'Profil bot diperbarui.');
    return true;
  }
  const target=groupProfile?chat:jid(sock.user?.id);
  if(!target)throw new Error('Bot account not connected.');
  if(mode==='delppbot'||mode==='delppgc'){
    await sock.removeProfilePicture(target);
    await reply(lang==='en'?'Profile image removed.':'Foto profil dihapus.');
    return true;
  }
  const raw=await imageInput(sock,message,ctx.logger,download);
  const buffer=await prepareAvatar(raw);
  await sock.updateProfilePicture(target,buffer);
  await reply(lang==='en'?'Profile picture updated.':'Foto profil diperbarui.');
  return true;
}
module.exports={PROFILE_COMMANDS,extractInvite,prepareAvatar,handleProfile};
