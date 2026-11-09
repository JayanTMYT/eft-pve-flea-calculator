import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SEEDS, DEFAULT_RATES, formulaFee, rawUnitFee, quote, optimise, inferBase, mergeItems, parseSavedItems} from '../src/lib/calculator.ts';
import {normaliseCatalogue} from '../src/lib/catalogue.ts';

test('the single shared formula reproduces all 10 independent game fee observations without fee overrides',()=>{
  const fixture = [[3544,30000,1,5435],[3544,100000,1,39710],[3544,182600,1,108785],[3544,200000,1,126749],[8508,10000,1,927],[8508,50000,1,7249],[8508,100000,1,22319],[8508,10000,3,2781],[8508,50000,3,21746],[8508,100000,3,66956]];
  for(const [base,price,quantity,fee] of fixture) assert.equal(formulaFee(base,price,quantity),fee);
  assert.equal(quote(SEEDS[0],3544,182600,1).net,73815);
  assert.equal(formulaFee(8508,50000,3),21746); assert.equal(3*formulaFee(8508,50000,1),21747);
});
test('generic items use the same formula above, below and at base price',()=>{
  assert.equal(formulaFee(10000,10000,1),1000);
  for(const base of [1234,8508,50000]) for(const price of [100,1000,10000,100000]) assert.ok(Number.isFinite(formulaFee(base,price,7)));
  const arbitrary={id:'new',name:'A new item',short:'New',basePrice:1234,source:'manual'};
  assert.equal(quote(arbitrary,1234,10000,1).kind,'manualBase');
  assert.equal(quote(SEEDS[0],9999,182600,1).kind,'manualBase');
});
test('unknown base inference works on suggested and arbitrary observed price points',()=>{
  for(const base of [123,3544,8508,72000,1200000]) {
    const points=[100,1000,10000].map(price=>({price,quantity:1,fee:formulaFee(base,price)}));
    const result=inferBase(points); assert.equal(result.maxError,0); assert.equal(result.matches,3);
    assert.ok(Math.abs(result.basePrice-base)<=1,`${base} inferred as ${result.basePrice}`);
  }
  for(const item of SEEDS) {const result=inferBase(item.observations);assert.equal(result.basePrice,item.basePrice);assert.equal(result.maxError,0);}
  assert.throws(()=>inferBase([{price:100,quantity:1,fee:100}]),RangeError);
  assert.throws(()=>inferBase([{price:100,quantity:1,fee:100},{price:100,quantity:2,fee:200}]),RangeError);
  const mismatch=inferBase([{price:100,quantity:1,fee:100},{price:1000,quantity:1,fee:100000}]);assert.ok(mismatch.maxError>1);
});
test('exhaustive optimiser agrees with independent quotes for different bases and quantities',()=>{
  for(const item of SEEDS) for(const quantity of [1,3]) {
    const best=optimise(item,item.basePrice,quantity,1000,220000);let independent=quote(item,item.basePrice,1000,quantity);
    for(let price=1001;price<=220000;price++){const q=quote(item,item.basePrice,price,quantity);if(q.net>independent.net)independent=q;}
    assert.deepEqual(best,independent);
  }
  assert.equal(optimise(SEEDS[0],3544,1,1000,2000).price,2000);
  assert.equal(optimise(SEEDS[0],3544,1,182600,182600).fee,108785);
  const manual=optimise(SEEDS[0],3544,1,1000,260000,DEFAULT_RATES,{price:250000,fee:0});assert.equal(manual.price,250000);assert.equal(manual.kind,'manual');
});
test('catalogue and local corrections merge without losing observed seeds',()=>{
  const snapshot=JSON.parse(fs.readFileSync('public/catalogue.json','utf8'));assert.ok(snapshot.items.length>5000);
  assert.deepEqual(snapshot.rates,DEFAULT_RATES);
  for(const seed of SEEDS) assert.equal(snapshot.items.find(i=>i.id===seed.id).basePrice,seed.basePrice);
  const saved={...SEEDS[0],basePrice:4000,source:'manual',observations:[]};const merged=mergeItems(snapshot.items,[saved]);
  assert.equal(merged.find(i=>i.id===saved.id).basePrice,4000);assert.equal(merged.find(i=>i.id===saved.id).observations.length,4);
  assert.equal(parseSavedItems([saved]).length,1);assert.equal(parseSavedItems([{name:'broken',basePrice:NaN}]).length,0);
});
test('upstream normalisation rejects incomplete responses and resolves names and rates',()=>{
  const items=Object.fromEntries(Array.from({length:1001},(_,i)=>[String(i),{id:i.toString(16).padStart(24,'0'),name:'name',shortName:'short',basePrice:1000,types:[]}]))
  const result=normaliseCatalogue({data:{items,fleaMarket:{sellOfferFeeRate:.05,sellRequirementFeeRate:.05}}},{data:{name:'Test name',short:'Test'}});
  assert.equal(result.items[0].name,'Test name');assert.equal(result.items.length,1001);
  assert.throws(()=>normaliseCatalogue({data:{items:{},fleaMarket:{sellOfferFeeRate:.05,sellRequirementFeeRate:.05}}},{data:{}}));
});
test('input validation rejects invalid prices, quantities, bases and tax rates',()=>{
  for(const base of [0,-1,NaN,Infinity,1e9]) assert.throws(()=>formulaFee(base,10000),RangeError);
  for(const price of [0,-1,1.5,5000001,NaN]) assert.throws(()=>formulaFee(1000,price),RangeError);
  for(const q of [0,1.5,1001]) assert.throws(()=>formulaFee(1000,10000,q),RangeError);
  assert.throws(()=>formulaFee(1000,10000,1,{offer:0,requirement:.05}),RangeError);
  assert.throws(()=>optimise(SEEDS[0],3544,1,1000,999),RangeError);
});

test('Intelligence Centre levels 0–2 keep base fees and level 3 discounts before rounding',()=>{
 for(const intelligenceCentre of [0,1,2]) assert.equal(formulaFee(3544,30000,1,{...DEFAULT_RATES,intelligenceCentre}),5435);
 assert.equal(formulaFee(10000,10000,1,{...DEFAULT_RATES,intelligenceCentre:3}),700);
 assert.equal(formulaFee(3544,30000,1,{...DEFAULT_RATES,intelligenceCentre:3}),3804); // round(5435 * .7) would incorrectly give 3805.
 assert.equal(formulaFee(8508,50000,3,{...DEFAULT_RATES,intelligenceCentre:3}),15222);
 assert.notEqual(quote(SEEDS[0],3544,30000,1,{...DEFAULT_RATES,intelligenceCentre:3}).kind,'known');
 for(const intelligenceCentre of [-1,4,1.5,NaN]) assert.throws(()=>formulaFee(3544,30000,1,{...DEFAULT_RATES,intelligenceCentre}),RangeError);
});
test('level 3 optimum is recomputed from discounted fees and agrees with an independent scan',()=>{
 const rates={...DEFAULT_RATES,intelligenceCentre:3};const item=SEEDS[0];
 const best=optimise(item,item.basePrice,1,1000,350000,rates);let expected=quote(item,item.basePrice,1000,1,rates);
 for(let price=1001;price<=350000;price++){const q=quote(item,item.basePrice,price,1,rates);if(q.net>expected.net)expected=q;}
 assert.deepEqual(best,expected);assert.equal(best.intelligenceCentre,3);
 assert.ok(best.price>optimise(item,item.basePrice,1,1000,350000).price);
});
test('base calibration and saved fee observations retain their recorded Intelligence Centre levels',()=>{
 const points=[100,1000,10000].map(price=>({price,quantity:1,fee:formulaFee(3544,price,1,{...DEFAULT_RATES,intelligenceCentre:3}),intelligenceCentre:3}));
 const result=inferBase(points);assert.equal(result.matches,3);assert.equal(result.maxError,0);assert.ok(Math.abs(result.basePrice-3544)<=1);
 const entry={...SEEDS[0],source:'manual',isKey:true,observations:[...SEEDS[0].observations,points[0],{price:100,quantity:1,fee:10,intelligenceCentre:99}]};
 const parsed=parseSavedItems([entry])[0];assert.equal(parsed.isKey,true);assert.equal(parsed.observations.length,5);assert.equal(parsed.observations[0].intelligenceCentre,1);assert.equal(parsed.observations[4].intelligenceCentre,3);
 const both=mergeItems(SEEDS,[{...entry,observations:[{price:30000,quantity:1,fee:3804,intelligenceCentre:3}]}]).find(i=>i.id===entry.id);
 assert.equal(both.observations.filter(p=>p.price===30000).length,2);
});
