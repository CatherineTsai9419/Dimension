const fs=require('node:fs'), http=require('node:http'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pages=fs.readdirSync('.').filter(x=>x.endsWith('.html')&&(!process.env.TEST_PAGE||x===process.env.TEST_PAGE));
async function main(){
 const server=http.createServer((req,res)=>{
  let file=decodeURIComponent(req.url.split('?')[0]).slice(1), original=file.startsWith('original/');
  file=file.replace(/^(original|current)\//,'');
  if(!file||file.includes('..')){res.writeHead(404).end();return;}
  try{const data=original && /\.(html|css)$/.test(file)?execFileSync('git',['show','HEAD:'+file]):fs.readFileSync(file);
   res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.webp')?'image/webp':'application/octet-stream');res.end(data);
  }catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results=[];
 const context=await browser.newContext();
 try{
 for(const width of [390,768,1440]) for(const file of pages){
  const captures=[];
  for(const version of ['original','current']){
   const p=await context.newPage();
   await p.setViewportSize({width,height:900});
   const errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.goto('http://127.0.0.1:'+server.address().port+'/'+version+'/'+file,{waitUntil:'load',timeout:60000});
   await p.evaluate(async()=>{document.querySelectorAll('img').forEach(x=>x.loading='eager');await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));await document.fonts.ready;});
   await p.addStyleTag({content:'*,*::before,*::after { animation:none!important; transition:none!important; }'});
   await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const data=await p.evaluate(()=>[...document.images].map(i=>{const s=getComputedStyle(i),r=i.getBoundingClientRect();return {width:parseFloat(s.width),height:parseFloat(s.height),x:r.x,y:r.y+scrollY,display:s.display,loaded:i.naturalWidth>0};}));
   if(file==='index.html' && width===390)await p.screenshot({path:'reports/'+version+'-home-mobile.png'});
   captures.push(data);if(errors.length)console.log(version+' script errors: '+errors.join('; '));await p.close();
  }
  const failures=[];
  captures[0].forEach((x,i)=>{const y=captures[1][i];if(!y||!y.loaded||['width','height','x','y'].some(k=>Math.abs(x[k]-y[k])>1)||x.display!==y.display)failures.push({index:i,before:x,after:y});});
  results.push({file,width,images:captures[0].length,failures});console.log(file+' '+width+': '+failures.length+' differences');
 }
 fs.writeFileSync('reports/'+(process.env.TEST_PAGE?'layout-home':'layout')+'.json',JSON.stringify(results,null,2));
 if(results.some(x=>x.failures.length))process.exitCode=1;
 }finally{await browser.close();server.close();}
}
main().catch(e=>{console.error(e);process.exit(1);});
