'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {handleAcademic}=require('../src/features/academic');
async function invoke(name,args){let output='';await handleAcademic({cmd:{name,args},reply:async text=>{output=text;}});return output;}
test('NPV discounted cash flows',async()=>{const s=await invoke('npv',['0.1','-1000','400','400','400']);assert.match(s,/NPV = /);assert.ok(!s.startsWith('⚠'));});
test('IRR simple cash flow',async()=>{const s=await invoke('irr',['-100','110']);assert.match(s,/IRR perkiraan/);assert.match(s,/0.1/);});
test('portfolio risk return',async()=>{const s=await invoke('portofolio',['0.5','0.1','0.2','0.2','0.1','0']);assert.match(s,/E\[R\] = 0.15/);});
test('KJV fetch mock returns exact verse',async()=>{let output='';await handleAcademic({cmd:{name:'alkitab',args:['Matius','1:1']},reply:async t=>{output=t;},fetcher:async()=>({ok:true,json:async()=>({text:'The book of the generation of Jesus Christ, the son of David, the son of Abraham.'})})});assert.match(output,/KJV Matthew 1:1/);});
