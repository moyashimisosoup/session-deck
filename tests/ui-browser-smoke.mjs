/**
 * Headless Chromium viewport regression smoke. The browser is a PC/mobile-width
 * simulation, NOT an iPhone Safari real-device certification.
 * Run on GitHub-hosted Ubuntu with installed Chrome and playwright-core.
 */
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const assets=new Set(['index.html','styles.css','motion.js','motion.css','app.js',
  'portfolio.html','portfolio-ui.css','portfolio-polish.css','portfolio-ui.js',
  'portfolio-shortcuts.js','repo-hygiene-ui.js']);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';
  if(!assets.has(pathname)){res.writeHead(404);res.end();return;}
  try {
    const body=await fs.readFile(path.join(root,pathname));
    res.writeHead(200,{'Content-Type':mime[path.extname(pathname)]||'text/plain'});
    res.end(body);
  }catch{res.writeHead(500);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const bin=process.env.CHROME_BIN || '/usr/bin/google-chrome';
let browser;
try{
  browser=await chromium.launch({executablePath:bin,headless:true});
  for(const viewport of [{width:1366,height:768},{width:1280,height:600},{width:390,height:844}]){
    const page=await browser.newPage({viewport,deviceScaleFactor:1,reducedMotion:'reduce'});
    try{
      await page.goto(base+'/index.html',{waitUntil:'load'});
      if(viewport.width<950)await page.locator('#menuToggle').click();
      const avatar=page.locator('.sidebar-bottom .avatar');
      const rect=await avatar.boundingBox();
      assert.ok(rect && rect.y>=-1 && rect.y+rect.height<=viewport.height+1,
        'sidebar avatar clips in '+JSON.stringify(viewport)+': '+JSON.stringify(rect));
      if(viewport.width<950){
        await page.keyboard.press('Escape');
      }else{
        const scroller=page.locator('.sidebar-scroll');
        assert.equal(await scroller.evaluate(el=>getComputedStyle(el).overflowY),'auto');
      }

      const opener=page.locator('.work-row').first();
      await opener.click();
      assert.equal(await page.locator('#detailDrawer').isVisible(),true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#detailDrawer').isVisible(),false);
      assert.equal(await opener.evaluate(el=>document.activeElement===el),true,'drawer focus did not return');

      await opener.click();
      const nested=page.locator('#detailDrawer [data-action="add-linked-session"]');
      await nested.click();
      assert.equal(await page.locator('#formModal').isVisible(),true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#formModal').isVisible(),false);
      assert.equal(await nested.evaluate(el=>document.activeElement===el),true,'modal focus did not return');
      await page.keyboard.press('Escape');

      await page.locator('[data-view="works"]').click();
      const search=page.locator('#searchInput');
      await search.fill('セッション');
      assert.equal(await search.inputValue(),'セッション');
      assert.equal(await search.evaluate(el=>document.activeElement===el),true,'search focus lost during rerender');
      console.log('PASS demo viewport and keyboard:',viewport.width+'x'+viewport.height);
    }finally{await page.close();}
  }
  const p=await browser.newPage({viewport:{width:1280,height:600}});
  try{
    await p.goto(base+'/portfolio.html',{waitUntil:'domcontentloaded'});
    const foot=await p.locator('.side-foot').boundingBox();
    assert.ok(foot && foot.y>=-1 && foot.y+foot.height<=601,'portfolio footer clips: '+JSON.stringify(foot));
    console.log('PASS portfolio sidebar footer at 1280x600');
  }finally{await p.close();}
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
