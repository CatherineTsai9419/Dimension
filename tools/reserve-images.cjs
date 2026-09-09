const fs=require('node:fs');
const sharp=require(process.env.SHARP_MODULE||'sharp');
async function main(){
 for(const page of fs.readdirSync('.').filter(x=>x.endsWith('.html'))){
  if(page==='index.html')continue; // Fixed, intentionally stretched decorative images.
  let html=fs.readFileSync(page,'utf8');
  const matches=[...html.matchAll(/<img\b[^>]*>/g)];
  for(const match of matches){
   const tag=match[0],src=tag.match(/src="\.\/([^"<>]+)"/);
   if(!src)continue;
   const m=await sharp(src[1]).metadata(),height=m.pageHeight||m.height;
   const rule='aspect-ratio: auto '+m.width+' / '+height+';';
   const updated=/style="/.test(tag)?tag.replace(/style="([^"]*)"/,(_,s)=>'style="'+s+'; '+rule+'"'):tag.replace(/>$/,' style="'+rule+'">');
   html=html.replace(tag,updated);
  }
  fs.writeFileSync(page,html);
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
