import fs from 'node:fs/promises';
import {normaliseCatalogue,parsePublishedCatalogue,readBoundedJson} from '../src/lib/catalogue.ts';
const output=new URL('../public/catalogue.json',import.meta.url);
const urls=['https://json.tarkov.dev/pve/items_en','https://json.tarkov.dev/pve/items'];
try{
  const documents=[];
  for(const url of urls){
    const response=await fetch(url,{headers:{Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(30000)});
    documents.push(await readBoundedJson(response,url.endsWith('_en')?5_000_000:32_000_000));
  }
  const catalogue=normaliseCatalogue(documents[1],documents[0]);
  await fs.writeFile(output,JSON.stringify(catalogue));
  console.log(`Published catalogue refreshed: ${catalogue.items.length} items, ${catalogue.fetchedAt}.`);
}catch{
  const fallback=parsePublishedCatalogue(JSON.parse(await fs.readFile(output,'utf8')));
  console.warn(`Upstream refresh unavailable. Keeping validated snapshot from ${fallback.fetchedAt} (${fallback.items.length} items).`);
}
