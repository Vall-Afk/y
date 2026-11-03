'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {loadConfig}=require('../src/config');
const {jid,getText,getCommand,roleFromMeta}=require('../src/util');
const {Store}=require('../src/store');
const {createRouter}=require('../src/commands');
const cfg=loadConfig({OWNER_NUMBER:'6281234567890'}),log={warn(){}};
test('validates owner',()=>{assert.throws(()=>loadConfig({}),/OWNER_NUMBER/);assert.equal(cfg.ownerJid,'6281234567890@s.whatsapp.net')});
test('parses incoming command',()=>{assert.equal(getText({message:{ephemeralMessage:{message:{conversation:'!ping'}}}}),'!ping');assert.equal(getCommand('!PING','!').name,'ping');assert.equal(jid('6281234567890:23@s.whatsapp.net'),cfg.ownerJid)});
test('group rights',()=>{assert.equal(roleFromMeta({participants:[{id:cfg.ownerJid,admin:'admin'}]},cfg.ownerJid,'none').senderAdmin,true)});
test('store persists and fails closed on corruption',async t=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'beaute-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const file=path.join(dir,'db.json'),a=new Store(file);await a.init();await a.setMode('private');await a.setGroupFlag('123@g.us','welcome',true);const b=new Store(file);await b.init();assert.equal(b.mode,'private');assert.equal(b.group('123@g.us').welcome,true);await fs.writeFile(file,'not-json');await assert.rejects(new Store(file).init(),/Cannot read store/)});
test('non owner cannot set private',async()=>{let texts=[],s={mode:'public',group:()=>({}),setMode:async()=>{throw Error('unauthorized mutation')}};const sock={user:{id:'x@s.whatsapp.net'},sendMessage:async(c,o)=>texts.push(o.text)};await createRouter(cfg,s,log,{now:()=>3000}).handle(sock,{key:{remoteJid:'999@s.whatsapp.net'},message:{conversation:'!mode private'}});assert.equal(s.mode,'public');assert.match(texts[0],/Khusus owner/)});

test('no-prefix commands are opt-in and non-commands are ignored', () => { const allowed=new Set(['menu','ping']); assert.equal(getCommand('menu','!',allowed).name,'menu'); assert.equal(getCommand('PING','!',allowed).name,'ping'); assert.equal(getCommand('!PING','!',allowed).name,'ping'); assert.equal(getCommand('halo semuanya','!',allowed),null); assert.equal(getCommand('menuju ke rumah','!',allowed),null); assert.equal(getCommand('menu','!'),null); });
