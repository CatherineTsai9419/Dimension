const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
async function main(){
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const p=await browser.newPage({viewport:{width:390,height:900},deviceScaleFactor:2});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  for(const version of ['original','current']){
   await p.goto('http://127.0.0.1:8123/'+version+'/index.html',{waitUntil:'load'});
   await p.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));await document.fonts.ready;});
   // Capture after the introductory one-second zoom animation has finished.
   await p.waitForTimeout(2200);
   await p.screenshot({path:'reports/'+version+'-home-settled.png'});
  }
  await p.locator('.navbar-toggler').click();
  await p.locator('#navbarSupportedContent.show').waitFor();
  await p.locator('#title_next_btn').click();
  if(await p.locator('#self_picture').evaluate(e=>getComputedStyle(e).display)==='none')throw Error('Reveal portrait hidden');
  if(!await p.locator('#dynamic-text-wrapper').textContent())throw Error('Typewriter did not start');
  await p.goto('http://127.0.0.1:8123/current/works.html',{waitUntil:'load'});
  await p.locator('[data-rel="App"]').click();
  await p.waitForTimeout(900);
  const appCards=await p.locator('.ds.App:visible').count();
  if(!appCards)throw Error('App filter hides all app cards');
  if(errors.length)throw Error(errors.join('; '));
  fs.writeFileSync('reports/interactions.json',JSON.stringify({mobileDpr:2,navigation:'passed',homepageReveal:'passed',typewriter:'passed',worksAppFilter:'passed',scriptErrors:errors},null,2));
  console.log('Navigation, reveal, Typewriter and App filtering passed.');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
