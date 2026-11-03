'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Store } = require('../src/store');
const { GroupCatalog } = require('../src/features/catalog');
const { createRouter, menu } = require('../src/commands');
const { loadConfig } = require('../src/config');
const { englishGame, englishRpg } = require('../src/features/english-output');
const config = loadConfig({ OWNER_NUMBER: '6287721373781', OWNER_NAME: 'Vall',
  OWNER_INSTAGRAM: 'v4lonenonly' });
const logger = { warn() {}, info() {}, error() {} };
const admin = '6281111111111@s.whatsapp.net', member = '6282222222222@s.whatsapp.net';
const group = '12345678@g.us';
async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'beaute-legacy-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const store = new Store(path.join(dir, 'settings.json'));
  const catalog = new GroupCatalog(path.join(dir, 'catalog.json'));
  await store.init(); await catalog.init();
  const calls = [];
  const socket = {
    user: { id: '6283333333333@s.whatsapp.net' },
    sendMessage: async (chat,payload,options) => { calls.push({chat,payload,options}); },
    groupMetadata: async () => ({subject:'Test Store',participants:[
      {id:admin,admin:'admin'},{id:member,admin:null},
      {id:'6283333333333@s.whatsapp.net',admin:'admin'}
    ]})
  };
  let now = 999999999;
  const router = createRouter(config,store,logger,{ catalog, now:()=>(now+=2000) });
  return { dir,store,catalog,calls,socket,router };
}
function message(sender, text, inGroup=false, quoted=null) {
  return {
    key: inGroup ? {remoteJid:group,participant:sender} : {remoteJid:sender},
    message: {
      extendedTextMessage: {text, contextInfo: quoted || {}}
    }
  };
}
test('language preference survives restart and remains per account', async t => {
  const h=await fixture(t);
  assert.equal(h.store.language(admin),'id');
  await h.store.setLanguage(admin,'en');
  assert.equal(h.store.language(admin),'en');
  assert.equal(h.store.language(member),'id');
  const restored = new Store(path.join(h.dir,'settings.json'));
  await restored.init();
  assert.equal(restored.language(admin),'en');
  await assert.rejects(restored.setLanguage(member,'fr'), /Invalid language/);
  await assert.rejects(restored.setLanguage('__proto__','en'), /Invalid language/);
});
test('complete menu displays free Jadibot and all categories without truncation', () => {
  const full = menu(config,'menu',{lang:'en', premium:false, balance:120});
  assert.match(full,/FREE JADIBOT/);
  assert.match(full,/OWNER COMMANDS/);
  for (const name of ['jadibot qr','promote','tictactoe','gitclone','calc','sticker']) {
    assert.ok(full.includes(name), name);
  }
  assert.ok(full.length > 3700);
  assert.match(full,/Beauté/);
  assert.doesNotMatch(full,/BeautÃ/);
  const id = menu(config,'menu',{lang:'id',premium:true});
  assert.match(id,/JADIBOT GRATIS/);
  assert.match(menu(config,'menustore'),/addlist/);
  assert.match(menu(config,'menupremium',{lang:'en'}),/jadibot qr/);
});
test('English language persists and menu is delivered in multiple complete messages', async t => {
  const h=await fixture(t);
  await h.router.handle(h.socket,message(member,'language en'));
  assert.equal(h.store.language(member),'en');
  assert.match(h.calls.at(-1).payload.text,/Language saved/);
  const start = h.calls.length;
  await h.router.handle(h.socket,message(member,'menu'));
  const parts = h.calls.slice(start).map(c => c.payload.text);
  assert.ok(parts.length > 1);
  assert.match(parts.join('\n'),/FREE JADIBOT/);
  assert.match(parts.join('\n'),/REGISTERED/);
  assert.doesNotMatch(parts.join('\n'),/autoblok212/);
  assert.ok(parts.every(part => part.length <= 3500));
  await h.router.handle(h.socket,message(member,'status'));
  assert.match(h.calls.at(-1).payload.text,/seconds/);
  await h.router.handle(h.socket,message(member,'listbahasa'));
  assert.match(h.calls.at(-1).payload.text,/Available languages/);
  await h.router.handle(h.socket,message(member,'language id'));
  assert.equal(h.store.language(member),'id');
  const startId = h.calls.length;
  await h.router.handle(h.socket,message(member,'menu'));
  assert.match(h.calls.slice(startId).map(c => c.payload.text).join('\n'),/JADIBOT GRATIS/);
});
test('group store is persistent and ordinary members cannot change it', async t => {
  const h=await fixture(t);
  await h.router.handle(h.socket,message(member,'addlist harga | Burger 20k',true));
  assert.equal(h.catalog.entries(group).length,0);
  assert.match(h.calls.at(-1).payload.text,/admin/i);
  await h.router.handle(h.socket,message(admin,'addlist harga | Burger 20k',true));
  assert.equal(h.catalog.get(group,'harga'),'Burger 20k');
  await h.router.handle(h.socket,message(member,'list',true));
  assert.match(h.calls.at(-1).payload.text,/harga/);
  await h.router.handle(h.socket,message(member,'list harga',true));
  assert.match(h.calls.at(-1).payload.text,/Burger 20k/);
  await h.router.handle(h.socket,message(member,'update harga | Burger gratis',true));
  assert.equal(h.catalog.get(group,'harga'),'Burger 20k');
  await h.router.handle(h.socket,message(admin,'update harga | Burger 22k',true));
  assert.equal(h.catalog.get(group,'harga'),'Burger 22k');
  const restored = new GroupCatalog(path.join(h.dir,'catalog.json'));
  await restored.init();
  assert.equal(restored.get(group,'harga'),'Burger 22k');
  await h.router.handle(h.socket,message(admin,'dellist harga',true));
  assert.equal(h.catalog.entries(group).length,0);
});
test('catalog rejects oversized content, invalid keys and duplicate entries', async t => {
  const h=await fixture(t);
  assert.throws(() => h.catalog.change(group,'invalid-key','x','add'),/Invalid/);
  assert.throws(() => h.catalog.change(group,'item','x'.repeat(1001),'add'),/Invalid/);
  assert.equal(await h.catalog.change(group,'item','first','add'),'ok');
  assert.equal(await h.catalog.change(group,'item','second','add'),'exists');
  assert.equal(await h.catalog.change(group,'other','value','update'),'missing');
  assert.equal(h.catalog.get(group,'item'),'first');
  await fs.writeFile(path.join(h.dir,'catalog.json'),'{bad json');
  await assert.rejects(new GroupCatalog(path.join(h.dir,'catalog.json')).init(), /cannot be loaded safely/);
});
test('admins can customize process/done replies to quoted group orders', async t => {
  const h=await fixture(t);
  await h.router.handle(h.socket,message(member,'setdone ✅ {order}',true));
  assert.equal(h.store.group(group).doneText,'');
  await h.router.handle(h.socket,message(admin,'setdone ✅ Pesanan: {order} untuk {user}',true));
  assert.match(h.store.group(group).doneText,/Pesanan/);
  const quoted={stanzaId:'quoted123',participant:member,quotedMessage:{conversation:'Burger keju satu'}};
  await h.router.handle(h.socket,message(admin,'done',true,quoted));
  const packet=h.calls.at(-1).payload;
  assert.match(packet.text,/Burger keju satu/);
  assert.match(packet.text,/6282222222222/);
  assert.deepEqual(packet.mentions,[member]);
  await h.router.handle(h.socket,message(admin,'delsetdone',true));
  assert.equal(h.store.group(group).doneText,'');
});
test('legacy arithmetic is safe and English game/RPG output is localized', async t => {
  const h=await fixture(t);
  await h.router.handle(h.socket,message(member,'language en'));
  await h.router.handle(h.socket,message(member,'tambah 7 5'));
  assert.match(h.calls.at(-1).payload.text,/7\+5 = 12/);
  await h.router.handle(h.socket,message(member,'bagi 10 0'));
  assert.match(h.calls.at(-1).payload.text,/Invalid input/);
  assert.match(englishGame('Benar! Jawaban: 42','en'),/Correct! Answer/);
  assert.match(englishRpg('Daftar dulu: !joinrpg','en'),/Register first/);
  await h.router.handle(h.socket,message(member,'tebakangka'));
  assert.match(h.calls.at(-1).payload.text,/Guess a number/);
});
test('English wiki requests English Wikipedia and returns original summary', async t => {
  const h=await fixture(t);
  await h.store.setLanguage(member,'en');
  const urls=[];
  const mockFetch=async url=>{
    urls.push(url);
    return new Response(JSON.stringify({query:{pages:{42:{extract:'Earth is the third planet.'}}}}),
      {status:200,headers:{'content-type':'application/json'}});
  };
  const router=createRouter(config,h.store,logger,{ catalog:h.catalog, fetcher:mockFetch, now:()=>100000 });
  await router.handle(h.socket,message(member,'wiki Earth'));
  assert.match(urls[0],/^https:\/\/en\.wikipedia\.org\//);
  assert.match(h.calls.at(-1).payload.text,/Earth is the third planet/);
});

test('script and credits show the correct identity; react only targets quoted messages', async t => {
  const h=await fixture(t);
  await h.router.handle(h.socket,message(member,'script'));
  assert.match(h.calls.at(-1).payload.text,/owner/);
  assert.doesNotMatch(h.calls.at(-1).payload.text,/github\\.com/);
  await h.router.handle(h.socket,message(member,'credits'));
  assert.match(h.calls.at(-1).payload.text,/Tritunggal Mahakudus/);
  await h.router.handle(h.socket,message(member,'react ❤️'));
  assert.match(h.calls.at(-1).payload.text,/Balas pesan/);
  const quoted={stanzaId:'react123',participant:admin,quotedMessage:{conversation:'hello'}};
  await h.router.handle(h.socket,message(member,'react ❤️',true,quoted));
  const reaction=h.calls.at(-1).payload.react;
  assert.equal(reaction.key.id,'react123');
  assert.equal(reaction.text,'❤️');
  assert.equal(reaction.key.remoteJid,group);
  await h.router.handle(h.socket,message(member,'react hello',true,quoted));
  assert.equal(h.calls.at(-1).payload.react,undefined);
});
