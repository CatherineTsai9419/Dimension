const fs=require('node:fs'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const sharp=require(process.env.SHARP_MODULE||'sharp');
async function main(){
 let refs=0;
 for(const file of fs.readdirSync('.').filter(x=>x.endsWith('.html'))){
  const html=fs.readFileSync(file,'utf8');
  for(const m of html.matchAll(/src="\.\/([^"<>]+)"/g)){if(!fs.existsSync(m[1]))throw Error('Missing '+m[1]);refs++;}
  for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
  const original=execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'});
  if((original.match(/<img\b/g)||[]).length!==(html.match(/<img\b/g)||[]).length)throw Error('Image count changed');
  if(/<img[^>]*(?:banner|portfolio_title|block0[1-5])[^>]*loading="lazy"/.test(html))throw Error('Lazy hero');
 }
 const rows=JSON.parse(fs.readFileSync('reports/images.json'));
 for(const row of rows.filter((item)=>item.used)){const m=await sharp(row.output).metadata();if(m.width!==row.width||m.height!==row.height)throw Error('Dimensions changed: '+row.name);}
 const used=rows.filter(x=>x.used),before=used.reduce((n,x)=>n+x.before,0),after=used.reduce((n,x)=>n+x.after,0);
 fs.writeFileSync('reports/image-sizes.md','# Image conversion sizes\n\nOriginals retained. Lossless full-size WebP; thumbnails separately listed. Bytes are file sizes, not a single-page transfer measurement.\n\n| Original | Dimensions | Before bytes | Full-size WebP bytes | Used |\n|---|---|---:|---:|---|\n'+rows.map(x=>`| ${x.name} | ${x.width}×${x.height} | ${x.before} | ${x.after} | ${x.used} |`).join('\n')+'\n\n'+used.flatMap(x=>x.variants.map(v=>`${v.file}: ${v.width}px, ${v.bytes} bytes`)).join('\n')+'\n');
 console.log(JSON.stringify({localReferences:refs,converted:used.length,before,after,savedPercent:100*(1-after/before)},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
