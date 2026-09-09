const fs=require('node:fs');
for(const file of fs.readdirSync('.').filter(x=>x.endsWith('.html'))){
 let html=fs.readFileSync(file,'utf8');
 html=html.replace(/<iframe\b(?![^>]*loading=)/g,'<iframe loading="lazy"');
 let keptJquery=false;
 html=html.replace(/\s*<script[^>]+src="[^"]*jquery[^"<>]+"[^>]*><\/script>/g,tag=>{
  if(file==='works.html' && tag.includes('https://cdnjs.cloudflare.com')&&!keptJquery){keptJquery=true;return tag;}
  return '';
 });
 if(file==='index.html'||file==='works.html'){
  html=html.replace(/\s*<link[^>]+href="[^"]*aos[^"<>]*"[^>]*>/g,'');
  html=html.replace(/\s*<script[^>]+src="[^"]*aos[^"<>]*"[^>]*><\/script>/g,'');
  html=html.replace(/<script>\s*AOS\.init\(\);\s*<\/script>/g,'');
 }else{
  html=html.replace(/<script src="([^"]*aos[^"<>]*)"/g,'<script defer src="$1"');
  html=html.replace('AOS.init();',"document.addEventListener('DOMContentLoaded', function () {\n        AOS.init();\n        document.querySelectorAll('img[loading=lazy]').forEach(function (img) { img.addEventListener('load', function () { AOS.refresh(); }); });\n      });");
 }
 if(file==='index.html'){
  html=html.replace('<script src="https://unpkg.com/typewriter-effect@latest/dist/core.js"','<script defer src="https://unpkg.com/typewriter-effect@latest/dist/core.js"');
  html=html.replace("var app = document.getElementById('dynamic-text-wrapper');","document.addEventListener('DOMContentLoaded', function () {\n        var app = document.getElementById('dynamic-text-wrapper');");
  html=html.replace('.start();','.start();\n        });');
 }
 html=html.replace(/<script src="([^"]*bootstrap[^"<>]*)"/g,'<script defer src="$1"');
 // Keep normal and italic variants through 700, including inherited italic 200/500.
 html=html.replace(/;0,800;0,900/g,'').replace(/;1,800;1,900/g,'');
 html=html.replace(/[ \t]+(?=\r?\n)/g,'');
 fs.writeFileSync(file,html);
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new Function(m[1]);
}
console.log('All inline scripts parse successfully.');
