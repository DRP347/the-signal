import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const b=await chromium.launch({headless:true,executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'});
const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://127.0.0.1:3100',{waitUntil:'networkidle'});
await p.screenshot({path:'artifacts/redesign-2/before/home-1440.png',fullPage:true});
const stories=await p.locator('main article h1 a, main article h2 a, main article h3 a').evaluateAll(xs=>xs.map(x=>({title:x.textContent,href:x.getAttribute('href')})));
console.log(JSON.stringify(stories));
await fs.writeFile('artifacts/redesign-2/before/stories.json',JSON.stringify(stories,null,2));
await p.setViewportSize({width:390,height:844});await p.screenshot({path:'artifacts/redesign-2/before/home-390.png',fullPage:true});
for(const [n,s] of stories.filter(s=>/DNS|datacenter/i.test(s.title)).entries()) { await p.goto('http://127.0.0.1:3100'+s.href,{waitUntil:'networkidle'});await p.setViewportSize({width:1440,height:1000});await p.screenshot({path:`artifacts/redesign-2/before/story-${n}.png`,fullPage:true});console.log((await p.locator('main').innerText()).slice(0,1600)); }
await b.close();
