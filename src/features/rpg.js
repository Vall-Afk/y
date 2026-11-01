'use strict';
// Persistent virtual RPG; no real-money gambling, external API, or arbitrary eval.
const {randomInt}=require('node:crypto');
const {userFrom,validUser}=require('./economy');
const {englishRpg}=require('./english-output');
const RPG_COMMANDS=new Set([
  'joinrpg','inventory','rpgshop','level','mining','mine','nebang','mancing',
  'hunt','adventure','jelajah','heal','buy','sell','jualikan','jualkayu',
  'jualcoal','jualstone','sellikan','sellbesi','sellemas',
  'jualingot','lebur','craft','equip','unequip','equipment',
  'killslime','killgoblin','killdevil','killbehemoth','killdemon','killdemonking',
  'goplanet','luckyday','rpgboard','toprpg'
]);
const ITEMS=Object.freeze({
  wood:{buy:15,sell:6},stone:{buy:20,sell:8},
  coal:{buy:50,sell:22},ore:{buy:80,sell:35},
  fish:{buy:22,sell:10},meat:{buy:30,sell:12},
  ingot:{buy:250,sell:95},gold:{buy:650,sell:240},gem:{buy:1600,sell:600},
  sword:{buy:2500,sell:500},pickaxe:{buy:1600,sell:350}
});
const RECIPES=Object.freeze({
  sword:Object.freeze({wood:3,ore:4,stone:2}),
  pickaxe:Object.freeze({wood:4,ore:3,stone:3})
});
const BOSSES=Object.freeze({
  killslime:{level:1,hp:10,xp:20,item:'coal'},
  killgoblin:{level:2,hp:15,xp:35,item:'ore'},
  killdevil:{level:4,hp:20,xp:55,item:'gold'},
  killbehemoth:{level:6,hp:25,xp:90,item:'gold'},
  killdemon:{level:8,hp:30,xp:120,item:'gem'},
  killdemonking:{level:12,hp:40,xp:200,item:'gem'}
});
function initialRpg(){
  return {hp:100,xp:0,items:Object.fromEntries(Object.keys(ITEMS).map(name=>[name,0])),
    actions:{},equipped:''};
}
function normalize(r){
  if(!r||typeof r!=='object')return r;
  if(!r.items || typeof r.items!=='object')r.items={};
  for(const item of Object.keys(ITEMS))if(!Number.isSafeInteger(r.items[item])||r.items[item]<0)r.items[item]=0;
  if(!r.actions||typeof r.actions!=='object')r.actions={};
  if(typeof r.equipped!=='string')r.equipped='';
  return r;
}
function level(r){return 1+Math.floor(r.xp/100);}
function status(r){
  const items={...initialRpg().items,...r.items};
  return '*Inventory RPG*\nHP: '+r.hp+'/100 | Level: '+level(r)+
    ' | XP: '+r.xp+'\n'+Object.entries(items).map(([k,v])=>k+': '+v).join('\n')+
    '\nEquipped: '+(r.equipped||'-');
}
function itemAliases(name){
  return ({ikan:'fish',kayu:'wood',batu:'stone',besi:'ore',emas:'gold',
    daging:'meat',batu_bara:'coal'})[name]||name;
}
class RpgService {
  constructor(economy,random=randomInt){this.economy=economy;this.random=random;}
  snapshot(id){return this.economy.state.users[id]?.rpg||null;}
  async join(id){
    if(!validUser(id))throw new Error('Identitas pengguna tidak didukung.');
    return this.economy.transact(db=>{
      const user=userFrom(db,id);
      if(user.rpg)return 'Kamu sudah terdaftar RPG.\n'+status(normalize(user.rpg));
      user.rpg=initialRpg();
      return 'Berhasil bergabung RPG!\n'+status(user.rpg);
    });
  }
  async action(id,name){
    const rules={
      mining:{cooldown:300000,hp:8,xp:12,item:'stone',chance:'coal'},
      nebang:{cooldown:300000,hp:6,xp:10,item:'wood'},
      mancing:{cooldown:300000,hp:5,xp:10,item:'fish'},
      hunt:{cooldown:300000,hp:12,xp:16,item:'meat'},
      adventure:{cooldown:900000,hp:20,xp:28,item:'ore'}
    };
    const rule=rules[name];
    if(!rule)throw new Error('Aksi tidak tersedia.');
    return this.economy.transact((db,time)=>{
      const user=userFrom(db,id),r=user.rpg&&normalize(user.rpg);
      if(!r)return 'Daftar dulu: !joinrpg';
      const wait=rule.cooldown-(time-(r.actions[name]||0));
      if(wait>0)return 'Cooldown: tunggu '+Math.ceil(wait/60000)+' menit.';
      if(r.hp<rule.hp)return 'HP tidak cukup. Gunakan !heal atau !buy meat 2.';
      const amount=this.random(1,4);
      r.hp-=rule.hp;r.xp+=rule.xp;
      r.items[rule.item]+=amount;
      if(rule.chance&&this.random(0,100)<25)r.items[rule.chance]++;
      r.actions[name]=time;
      return 'Berhasil '+name+': +'+amount+' '+rule.item+
        '\nHP: '+r.hp+'/100, XP: '+r.xp+'.';
    });
  }
  async heal(id){
    return this.economy.transact(db=>{
      const r=userFrom(db,id).rpg;
      if(!r)return 'Daftar dulu: !joinrpg';
      normalize(r);
      if(r.hp>=100)return 'HP masih penuh.';
      if(r.items.meat<2)return 'Butuh 2 meat. Dapatkan dengan !hunt atau !buy meat 2.';
      r.items.meat-=2;r.hp=Math.min(100,r.hp+45);
      return 'HP pulih menjadi '+r.hp+'/100.';
    });
  }
  async trade(id,kind,item,amount){
    item=itemAliases(item);
    if(!Object.hasOwn(ITEMS,item)||!['buy','sell'].includes(kind)||
       !Number.isInteger(amount)||amount<1||amount>100)
      throw new Error('Barang / jumlah tidak valid. Contoh: !sell fish 2');
    return this.economy.transact(db=>{
      const user=userFrom(db,id),r=user.rpg&&normalize(user.rpg);
      if(!r)return 'Daftar dulu: !joinrpg';
      const price=ITEMS[item][kind]*amount;
      if(kind==='buy'){
        if(user.balance<price)return 'Koin kurang. Butuh '+price+'.';
        if(r.items[item]+amount>1_000_000)return 'Batas inventaris tercapai.';
        user.balance-=price;r.items[item]+=amount;
      }else{
        if(r.items[item]<amount)return 'Barang tidak cukup.';
        if(user.balance+price>100_000_000)return 'Saldo mencapai batas maksimal.';
        r.items[item]-=amount;user.balance+=price;
        if(r.equipped===item && r.items[item]===0)r.equipped='';
      }
      return (kind==='buy'?'Membeli ':'Menjual ')+amount+' '+item+
        ' seharga '+price+' koin. Saldo: '+user.balance+'.';
    });
  }
  async smelt(id,quantity=1){
    if(!Number.isInteger(quantity)||quantity<1||quantity>20)throw new Error('Jumlah lebur 1–20.');
    return this.economy.transact(db=>{
      const r=userFrom(db,id).rpg;
      if(!r)return 'Daftar dulu: !joinrpg';
      normalize(r);
      if(r.items.ore<3*quantity||r.items.coal<quantity)
        return 'Butuh '+3*quantity+' ore dan '+quantity+' coal.';
      r.items.ore-=3*quantity;r.items.coal-=quantity;
      r.items.ingot+=quantity;r.xp+=5*quantity;
      return 'Berhasil lebur: +'+quantity+' ingot dan +'+5*quantity+' XP.';
    });
  }
  async craft(id,item,quantity=1){
    const recipe=RECIPES[item];
    if(!recipe||!Number.isInteger(quantity)||quantity<1||quantity>10)
      throw new Error('Gunakan craft sword|pickaxe [1-10].');
    return this.economy.transact(db=>{
      const r=userFrom(db,id).rpg;
      if(!r)return 'Daftar dulu: !joinrpg';
      normalize(r);
      if(Object.entries(recipe).some(([name,need])=>r.items[name]<need*quantity))
        return 'Bahan kurang: '+Object.entries(recipe).map(([k,n])=>k+' '+n*quantity).join(', ')+'.';
      for(const [name,need] of Object.entries(recipe))r.items[name]-=need*quantity;
      r.items[item]+=quantity;r.xp+=20*quantity;
      return 'Berhasil craft '+quantity+' '+item+'. XP +'+20*quantity+'.';
    });
  }
  async equip(id,item){
    if(!['sword','pickaxe','none'].includes(item))throw new Error('Gunakan equip sword|pickaxe|none.');
    return this.economy.transact(db=>{
      const r=userFrom(db,id).rpg;
      if(!r)return 'Daftar dulu: !joinrpg';
      normalize(r);
      if(item!=='none'&&r.items[item]<1)return 'Kamu belum punya '+item+'. Gunakan craft '+item+'.';
      r.equipped=item==='none'?'':item;
      return 'Equipped: '+(r.equipped||'-')+'.';
    });
  }
  async boss(id,name){
    const rule=BOSSES[name];
    if(!rule)throw new Error('Boss tidak tersedia.');
    return this.economy.transact((db,time)=>{
      const r=userFrom(db,id).rpg;
      if(!r)return 'Daftar dulu: !joinrpg';
      normalize(r);
      if(level(r)<rule.level)return 'Butuh level '+rule.level+'.';
      if(r.hp<=rule.hp)return 'HP terlalu rendah (butuh di atas '+rule.hp+').';
      const key='boss:'+name;
      if(time-(r.actions[key]||0)<600000)return 'Cooldown boss: 10 menit.';
      r.hp-=rule.hp;
      r.xp+=rule.xp+(r.equipped==='sword'?10:0);
      r.items[rule.item]++;
      r.actions[key]=time;
      return 'Boss '+name.slice(4)+' berhasil dikalahkan! +'+rule.xp+
        ' XP, +1 '+rule.item+'. HP: '+r.hp+'.';
    });
  }
  async extras(id,name){
    if(!['goplanet','luckyday'].includes(name))throw new Error('Aksi tidak tersedia.');
    return this.economy.transact((db,time)=>{
      const r=userFrom(db,id).rpg;
      if(!r)return 'Daftar dulu: !joinrpg';
      normalize(r);
      const wait=86400000-(time-(r.actions[name]||0));
      if(wait>0)return 'Cooldown: tunggu '+Math.ceil(wait/3600000)+' jam.';
      if(name==='goplanet'){
        if(level(r)<8)return 'Butuh level 8 untuk goplanet.';
        if(r.hp<30)return 'HP tidak cukup untuk goplanet.';
        r.hp-=25;r.xp+=80;r.items.gem++;
      }else{
        r.hp=Math.min(100,r.hp+20);
        r.xp+=15;
      }
      r.actions[name]=time;
      return name+' berhasil! XP +'+(name==='goplanet'?80:15)+'.';
    });
  }
  leaderboard(){
    return Object.entries(this.economy.state.users).filter(([,u])=>
      u.rpg&&Number.isFinite(u.rpg.xp)&&u.rpg.xp>=0)
      .sort((a,b)=>b[1].rpg.xp-a[1].rpg.xp).slice(0,10)
      .map(([id,u],i)=>(i+1)+'. ****'+id.split('@')[0].slice(-4)+
        ': Level '+level(u.rpg)+' | XP '+u.rpg.xp);
  }
}
async function handleRpg(ctx){
  const {cmd,rpg,sender,accountSender,reply,lang}=ctx;
  const account=accountSender||sender;
  if(!RPG_COMMANDS.has(cmd.name))return false;
  if(!rpg){await reply(lang==='en'?'RPG is unavailable.':'RPG belum aktif.');return true;}
  const en=text=>englishRpg(text,lang);
  if(cmd.name==='joinrpg'){await reply(en(await rpg.join(account)));return true;}
  if(['inventory','level','equipment'].includes(cmd.name)){
    const current=rpg.snapshot(account);
    await reply(en(current?status(current):'Daftar dulu: !joinrpg'));return true;
  }
  if(cmd.name==='rpgshop'){
    await reply('*RPG Shop*\n'+Object.entries(ITEMS).map(([k,p])=>k+
      (lang==='en'?' buy ':' beli ')+p.buy+(lang==='en'?', sell ':', jual ')+p.sell).join('\n')+
      '\nbuy <item> <qty> / sell <item> <qty>');return true;
  }
  if(['mining','mine','nebang','mancing','hunt','adventure','jelajah'].includes(cmd.name)){
    const kind=cmd.name==='mine'?'mining':cmd.name==='jelajah'?'adventure':cmd.name;
    await reply(en(await rpg.action(account,kind)));return true;
  }
  if(cmd.name==='heal'){await reply(en(await rpg.heal(account)));return true;}
  if(cmd.name==='lebur'){await reply(en(await rpg.smelt(account,cmd.args.length?Number(cmd.args[0]):1)));return true;}
  if(cmd.name==='craft'){await reply(en(await rpg.craft(account,(cmd.args[0]||'').toLowerCase(),
    cmd.args.length>1?Number(cmd.args[1]):1)));return true;}
  if(cmd.name==='equip'||cmd.name==='unequip'){
    await reply(en(await rpg.equip(account,cmd.name==='unequip'?'none':(cmd.args[0]||'').toLowerCase())));return true;
  }
  if(Object.hasOwn(BOSSES,cmd.name)){await reply(en(await rpg.boss(account,cmd.name)));return true;}
  if(['goplanet','luckyday'].includes(cmd.name)){await reply(en(await rpg.extras(account,cmd.name)));return true;}
  if(['toprpg','rpgboard'].includes(cmd.name)){
    await reply('*RPG TOP*\n'+(rpg.leaderboard().join('\n')||'Belum ada.'));return true;
  }
  const named={jualikan:'fish',sellikan:'fish',jualkayu:'wood',jualcoal:'coal',
    jualstone:'stone',jualingot:'ingot',sellbesi:'ore',sellemas:'gold'};
  if(Object.hasOwn(named,cmd.name)){
    await reply(en(await rpg.trade(account,'sell',named[cmd.name],cmd.args.length?Number(cmd.args[0]):1)));return true;
  }
  if(['buy','sell'].includes(cmd.name)){
    await reply(en(await rpg.trade(account,cmd.name,cmd.args[0]||'',Number(cmd.args[1]))));
  }
  return true;
}
module.exports={RpgService,RPG_COMMANDS,handleRpg,initialRpg,ITEMS,RECIPES,BOSSES};
