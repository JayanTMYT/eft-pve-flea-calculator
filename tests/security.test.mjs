import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseSavedItems,SEEDS,inferBase} from '../src/lib/calculator.ts';
import {parsePublishedCatalogue,readBoundedJson} from '../src/lib/catalogue.ts';
const snapshot=()=>JSON.parse(fs.readFileSync('public/catalogue.json','utf8'));
test('untrusted browser storage is rebuilt from allowed fields and cannot crash on malformed points',()=>{
 const input=JSON.parse(JSON.stringify({...SEEDS[0],source:'manual',extra:'must be removed',observations:[null,{},'bad',{price:100,quantity:1,fee:10}]}));
 const parsed=parseSavedItems([null,{},[],input]);assert.equal(parsed.length,1);assert.equal(parsed[0].observations.length,1);assert.equal('extra' in parsed[0],false);assert.equal(parseSavedItems(Array(400).fill(input)).length,300);
 const hostile={...input,name:'<img src=x onerror=alert(1)>'};assert.equal(parseSavedItems([hostile])[0].name,hostile.name); // React displays this as text, never HTML.
});
test('catalogue schema rejects hostile or malformed values instead of trusting a type assertion',()=>{
 assert.ok(parsePublishedCatalogue(snapshot()).items.length>5000);
 for(const mutation of [d=>d.items[0].basePrice=-1,d=>d.items[0].name={html:'bad'},d=>d.items[0].id='__proto__',d=>d.items[0].noFlea='false',d=>d.rates.offer=Infinity,d=>d.items[1].id=d.items[0].id]){const d=snapshot();mutation(d);assert.throws(()=>parsePublishedCatalogue(d));}
 assert.throws(()=>parsePublishedCatalogue(null));assert.throws(()=>inferBase([null,null]));
});
test('JSON size limits work with declared or streaming response bodies',async()=>{
 await assert.rejects(readBoundedJson(new Response('123456',{headers:{'Content-Length':'999999'}}),10));
 await assert.rejects(readBoundedJson(new Response('123456'),5));
 assert.deepEqual(await readBoundedJson(new Response('{"ok":true}'),100),{ok:true});
});
test('public app does not contain unsafe HTML sinks, tracking scripts or an API server path',()=>{
 const app=fs.readFileSync('src/App.tsx','utf8');
 assert.doesNotMatch(app,/dangerouslySetInnerHTML|\.innerHTML|\beval\(|new Function\(|\/api\/catalogue|appgprj_|\.chatgpt\.site/);
 assert.match(app,/id="privacy"/);assert.match(app,/Clear saved calculator data/);
});

test('creator subscription link uses the requested channel and a safe new-tab relationship',()=>{
 const app=fs.readFileSync('src/App.tsx','utf8');
 assert.match(app,/https:\/\/www\.youtube\.com\/@Jayan_TM\?sub_confirmation=1/);
 assert.match(app,/rel="noopener noreferrer"/);
});

test('catalogue key classification covers keycards while excluding non-key containers',async()=>{
 const {isKeyItem}=await import('../src/lib/calculator.ts');
 const d=parsePublishedCatalogue(snapshot());
 assert.equal(isKeyItem(d.items.find(i=>/Factory emergency exit key/i.test(i.name))),true);
 assert.equal(isKeyItem(d.items.find(i=>/TerraGroup Labs keycard \(Red\)/i.test(i.name))),true);
 const keytool=d.items.find(i=>/^Key tool$/i.test(i.name));if(keytool)assert.equal(isKeyItem(keytool),false);
 assert.equal(isKeyItem({id:'custom',name:'My keycard',short:'',basePrice:1000}),true);
 assert.equal(isKeyItem({id:'custom',name:'Wrench',short:'',basePrice:1000}),false);
 const bad=snapshot();bad.items[0].isKey='true';assert.throws(()=>parsePublishedCatalogue(bad));
});
