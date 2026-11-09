import {MAX_BASE, type Item, type Settings} from './calculator.ts';
export type Catalogue = {items:Item[];rates:Settings;fetchedAt:string;source:string;status?:'snapshot'|'live';error?:string};
export const CATALOGUE_SOURCE='https://json.tarkov.dev/pve/items';
function record(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
function validRates(v:unknown):v is Settings{return record(v)&&[v.offer,v.requirement].every(r=>typeof r==='number'&&Number.isFinite(r)&&r>0&&r<=1);}
export function parsePublishedCatalogue(payload:unknown):Catalogue{
  if(!record(payload)||!Array.isArray(payload.items)||payload.items.length<1000||payload.items.length>10000||!validRates(payload.rates)||typeof payload.fetchedAt!=='string'||!Number.isFinite(Date.parse(payload.fetchedAt)))throw new Error('Invalid catalogue metadata.');
  const ids=new Set<string>();
  const items:Item[]=payload.items.map((raw:unknown)=>{
    if(!record(raw)||typeof raw.id!=='string'||!/^[a-z0-9]{1,64}$/.test(raw.id)||ids.has(raw.id)||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>140||typeof raw.short!=='string'||raw.short.length>64||typeof raw.basePrice!=='number'||!Number.isFinite(raw.basePrice)||raw.basePrice<1||raw.basePrice>MAX_BASE||typeof raw.noFlea!=='boolean'||(raw.isKey!==undefined&&typeof raw.isKey!=='boolean'))throw new Error('Invalid catalogue item.');
    ids.add(raw.id);
    return {id:raw.id,name:raw.name.trim(),short:raw.short,basePrice:raw.basePrice,noFlea:raw.noFlea,...(typeof raw.isKey==='boolean'?{isKey:raw.isKey}:{})};
  });
  return {items,rates:{offer:payload.rates.offer,requirement:payload.rates.requirement},fetchedAt:payload.fetchedAt,source:CATALOGUE_SOURCE};
}
export function normaliseCatalogue(payload:unknown,english:unknown):Catalogue{
  if(!record(payload)||!record(payload.data)||!record(payload.data.items)||!record(payload.data.fleaMarket)||!record(english)||!record(english.data))throw new Error('Invalid source data.');
  const names=english.data,market=payload.data.fleaMarket;
  const entries=Object.values(payload.data.items);
  if(entries.length>15000)throw new Error('Unexpected source size.');
  const items=entries.filter((i):i is Record<string,unknown>=>record(i)&&typeof i.basePrice==='number'&&Number.isFinite(i.basePrice)&&i.basePrice>0).map(i=>({id:i.id,name:typeof i.name==='string'?(names[i.name]??i.name):null,short:typeof i.shortName==='string'?(names[i.shortName]??i.shortName):null,basePrice:i.basePrice,noFlea:Array.isArray(i.types)&&i.types.includes('noFlea'),isKey:Array.isArray(i.types)&&i.types.includes('keys')})).filter(i=>typeof i.name==='string'&&!i.name.endsWith(' Name'));
  return parsePublishedCatalogue({items,rates:{offer:market.sellOfferFeeRate,requirement:market.sellRequirementFeeRate},fetchedAt:new Date().toISOString()});
}
export async function readBoundedJson(response:Response,maxBytes:number):Promise<unknown>{
  if(!response.ok||!response.body)throw new Error('Catalogue unavailable.');
  const length=Number(response.headers.get('Content-Length'));
  if(Number.isFinite(length)&&length>maxBytes)throw new Error('Catalogue exceeds size limit.');
  const reader=response.body.getReader();let bytes=0;const chunks:Uint8Array[]=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>maxBytes){await reader.cancel();throw new Error('Catalogue exceeds size limit.');}chunks.push(value);}}
  finally{reader.releaseLock();}
  const joined=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.byteLength;}
  return JSON.parse(new TextDecoder().decode(joined));
}
export async function loadPublishedCatalogue(refresh=false):Promise<Catalogue>{
  const url=new URL(`${import.meta.env.BASE_URL}catalogue.json`,document.baseURI);
  if(url.origin!==location.origin)throw new Error('Catalogue must be same-origin.');
  if(refresh)url.searchParams.set('v',String(Date.now()));
  const response=await fetch(url,{cache:refresh?'no-store':'default',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(15000)});
  return parsePublishedCatalogue(await readBoundedJson(response,2_000_000));
}
