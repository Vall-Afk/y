'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {Economy}=require('../src/features/economy');
const {RpgService,RECIPES,BOSSES}=require('../src/features/rpg');
const alice='6281111111111@s.whatsapp.net',bob='6282222222222@s.whatsapp.net';
async function fixture(t){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'beaute-rpg-advanced-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const file=path.join(dir,'economy.json');
  let time=Date.UTC(2026,10,1);
  const economy=new Economy(file,()=>time);
  await economy.init();
  const rpg=new RpgService(economy,min=>min);
  await rpg.join(alice);
  return{economy,rpg,file,advance:ms=>{time+=ms}};
}
test('crafting and smelting never create items without ingredients',async t=>{
  const h=await fixture(t);
  assert.match(await h.rpg.smelt(alice,1),/Butuh/);
  assert.match(await h.rpg.craft(alice,'sword'),/Bahan kurang/);
  await h.economy.transact(db=>{
    const r=db.users[alice].rpg;r.items.ore=10;r.items.coal=4;
    r.items.wood=10;r.items.stone=10;
  });
  assert.match(await h.rpg.smelt(alice,2),/lebur/);
  assert.equal(h.rpg.snapshot(alice).items.ingot,2);
  assert.match(await h.rpg.craft(alice,'sword'),/craft/);
  assert.equal(h.rpg.snapshot(alice).items.sword,1);
  assert.equal(h.rpg.snapshot(alice).items.ore,0);
  assert.match(await h.rpg.equip(alice,'sword'),/Equipped: sword/);
  assert.equal(h.rpg.snapshot(alice).equipped,'sword');
  assert.match(await h.rpg.equip(alice,'none'),/Equipped: -/);
  assert.ok(RECIPES.sword.ore>0);
});
test('simultaneous craft requests share atomic transaction and cannot double spend',async t=>{
  const h=await fixture(t);
  await h.economy.transact(db=>Object.assign(db.users[alice].rpg.items,{ore:4,wood:3,stone:2}));
  const results=await Promise.all([h.rpg.craft(alice,'sword'),h.rpg.craft(alice,'sword')]);
  assert.equal(results.filter(x=>/Berhasil craft/.test(x)).length,1);
  assert.equal(h.rpg.snapshot(alice).items.sword,1);
  assert.equal(h.rpg.snapshot(alice).items.ore,0);
});
test('bosses enforce HP, level and cooldown, persist XP and earned items',async t=>{
  const h=await fixture(t);
  assert.match(await h.rpg.boss(alice,'killgoblin'),/Butuh level 2/);
  assert.match(await h.rpg.boss(alice,'killslime'),/berhasil dikalahkan/);
  assert.equal(h.rpg.snapshot(alice).items.coal,1);
  assert.match(await h.rpg.boss(alice,'killslime'),/Cooldown/);
  await h.economy.transact(db=>{db.users[alice].rpg.xp=300;});
  assert.match(await h.rpg.boss(alice,'killgoblin'),/berhasil/);
  assert.equal(h.rpg.snapshot(alice).items.ore,1);
  assert.ok(BOSSES.killdemonking.level>BOSSES.killslime.level);
  const reloaded=new Economy(h.file,()=>Date.UTC(2026,10,1));
  await reloaded.init();
  assert.equal(reloaded.state.users[alice].rpg.items.ore,1);
});
test('older RPG saves are extended in place without resetting existing items',async t=>{
  const h=await fixture(t);
  await h.economy.transact(db=>{
    db.users[alice].rpg.items={wood:5,stone:2,coal:0,ore:3,fish:0,meat:0};
    delete db.users[alice].rpg.equipped;
  });
  assert.match(await h.rpg.craft(alice,'pickaxe'),/Bahan kurang/);
  await h.economy.transact(db=>{db.users[alice].rpg.items.stone=3;});
  assert.match(await h.rpg.craft(alice,'pickaxe'),/Berhasil craft/);
  assert.equal(h.rpg.snapshot(alice).items.pickaxe,1);
  assert.equal(h.rpg.snapshot(alice).items.wood,1);
});
test('daily RPG extras and public leaderboards are bounded',async t=>{
  const h=await fixture(t);
  assert.match(await h.rpg.extras(alice,'goplanet'),/Butuh level 8/);
  assert.match(await h.rpg.extras(alice,'luckyday'),/berhasil/);
  assert.match(await h.rpg.extras(alice,'luckyday'),/Cooldown/);
  await h.economy.transact(db=>db.users[alice].rpg.xp=720);
  assert.match(await h.rpg.extras(alice,'goplanet'),/berhasil/);
  assert.equal(h.rpg.snapshot(alice).items.gem,1);
  await h.rpg.join(bob);
  const board=h.rpg.leaderboard();
  assert.equal(board.length,2);
  assert.ok(board[0].includes('Level'));
  assert.ok(!board[0].includes(alice.split('@')[0]),'full number redacted');
});
