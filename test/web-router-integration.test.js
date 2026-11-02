'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {WEB_COMMANDS,handleWeb}=require('../src/features/web-extras');
const {ALL_COMMANDS}=require('../src/commands');
test('internet commands registered in router',()=>{for(const cmd of WEB_COMMANDS)assert.ok(ALL_COMMANDS.has(cmd),cmd);});
test('Vatican RSS command uses official feed URL',async()=>{let url='',output='';await handleWeb({cmd:{name:'vatican',args:[]},fetcher:async u=>{url=u;return {ok:true,text:async()=>'<rss><item><title>Vatican</title><link>https://www.vaticannews.va/en.html</link></item></rss>'};},reply:async x=>output=x});assert.equal(url,'https://www.vaticannews.va/en.rss.xml');assert.match(output,/Vatican/);});
test('Catholic news command uses XML feed',async()=>{let url='';await handleWeb({cmd:{name:'katoliknews',args:[]},fetcher:async u=>{url=u;return {ok:true,text:async()=>'<rss></rss>'};},reply:async()=>{}});assert.equal(url,'https://www.catholicnewsagency.com/rss/news.xml');});
