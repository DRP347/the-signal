import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const b=await chromium.launch({headless:true,executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'});
const p=await b.newPage({viewport:{width:1440,height:1000}});
const base='http://127.0.0.1:3102';
await p.goto(base,{waitUntil:'networkidle'});await p.screenshot({path:'artifacts/redesign-2/after/home-1440.png',fullPage:true});
await p.screenshot({path:'artifacts/redesign-2/after/home-first-screen.png'});
const detail=await p.locator('.front-lead h1 a').getAttribute('href');
console.log(await p.locator('main').innerText());
await p.setViewportSize({width:390,height:844});await p.screenshot({path:'artifacts/redesign-2/after/home-390.png',fullPage:true});
await p.goto(base+detail,{waitUntil:'networkidle'});await p.screenshot({path:'artifacts/redesign-2/after/source-390.png',fullPage:true});
await p.setViewportSize({width:1440,height:1000});await p.screenshot({path:'artifacts/redesign-2/after/source-1440.png',fullPage:true});
const refs=[];
for(const [name,url] of [['picnic','https://picnicpost.com'],['funday','https://thefundaypress.com'],['mic','https://www.mic.com'],['pudding','https://pudding.cool'],['nyt','https://www.nytimes.com']]){
 try{await p.goto(url,{waitUntil:'domcontentloaded',timeout:20000});await p.screenshot({path:`artifacts/redesign-2/reference-${name}.png`});refs.push({name,url,title:await p.title()});}catch(e){refs.push({name,url,error:e.message.slice(0,200)});}
}
await fs.writeFile('artifacts/redesign-2/reference-access.json',JSON.stringify(refs,null,2));
await b.close();
