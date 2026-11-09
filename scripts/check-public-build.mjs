import fs from 'node:fs/promises';
import path from 'node:path';
const root=new URL('../dist/',import.meta.url);
const blocked=[/appgprj_[a-z0-9]+/i,/appgdep_[a-z0-9]+/i,/\.chatgpt\.site\b/i,/OAI-Sites-Authorization/i,/siwc_bypass/i,/github_pat_[A-Za-z0-9_]+/,/gh[pousr]_[A-Za-z0-9_]{20,}/,/-----BEGIN [A-Z ]*PRIVATE KEY-----/];
let count=0;
async function scan(directory){for(const entry of await fs.readdir(directory,{withFileTypes:true})){const file=new URL(entry.name+(entry.isDirectory()?'/':''),directory);if(entry.isSymbolicLink())throw new Error('Symlink in public build.');if(entry.isDirectory()){await scan(file);continue;}if(!/\.(?:html|js|css|json|svg|txt)$/.test(entry.name))throw new Error(`Unexpected public file: ${entry.name}`);const text=await fs.readFile(file,'utf8');for(const rule of blocked)if(rule.test(text))throw new Error(`Private metadata or credential pattern in ${entry.name}`);count++;}}
await scan(root);
const html=await fs.readFile(new URL('index.html',root),'utf8');
if(!html.includes('Content-Security-Policy')||!html.includes("script-src 'self'")||html.includes('unsafe-inline')||html.includes('unsafe-eval')||/<script[^>]*>\s*[^<\s]/.test(html))throw new Error('CSP or script policy check failed.');
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(match[1].startsWith('/')||match[1].startsWith('http'))throw new Error('Assets must use relative same-origin paths.');}
console.log(`Public build checked: ${count} static files, relative assets, restrictive CSP, no private deployment metadata or credential patterns.`);
