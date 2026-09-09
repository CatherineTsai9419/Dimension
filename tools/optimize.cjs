// Run from the repository root. Originals are never overwritten.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const baseline = Object.fromEntries(pages.map(f => [f, fs.readFileSync(f,'utf8')]));
const cardNames = new Set(['Banner_02.png','Banner_03.png','TaoyuanGo_App_2023@4x.png','Onedegree_img_0.png','website_work_eo@4x-8.png','TakeCareBus@4x.png']);
async function main() {
  fs.mkdirSync('img/optimized',{recursive:true});
  fs.mkdirSync('reports',{recursive:true});
  const names = [...new Set(Object.values(baseline).flatMap(s => [...s.matchAll(/src="\.\/img\/([^"<>]+\.(?:png|jpg|jpeg))"/gi)].map(m => m[1])))];
  const entries=[];
  for (const name of names) {
    const input=path.join('img',name), bytes=fs.statSync(input).size;
    if(bytes<30000) continue;
    const meta=await sharp(input).metadata();
    if(meta.orientation && meta.orientation!==1) continue;
    const output='img/optimized/'+name+'.webp';
    await sharp(input).webp({lossless:true,effort:4}).toFile(output);
    const after=fs.statSync(output).size;
    const a=await sharp(input).ensureAlpha().raw().toBuffer();
    const b=await sharp(output).ensureAlpha().raw().toBuffer();
    // Transparent RGB may be normalised by WebP; compare visible channels and alpha.
    for(let i=0;i<a.length;i+=4) if(a[i+3]!==b[i+3] || (a[i+3] && (a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]))) throw Error('Pixel mismatch: '+name);
    const row={name,width:meta.width,height:meta.height,before:bytes,after,output,used:after<bytes,variants:[]};
    // Square card thumbnails have a CSS-defined height on desktop and width on mobile.
    if(cardNames.has(name) && meta.width===meta.height) for(const width of [480,960,1920]) {
      if(width>=meta.width) continue;
      const file='img/optimized/'+name+'.'+width+'.webp';
      await sharp(input).resize({width,withoutEnlargement:true}).webp({lossless:true,effort:4}).toFile(file);
      row.variants.push({width,file,bytes:fs.statSync(file).size});
    }
    entries.push(row);
    console.log(name+': '+bytes+' -> '+after);
  }
  fs.writeFileSync('reports/images.json',JSON.stringify(entries,null,2)+'\n');
  for(const page of pages) {
    let html=baseline[page], count=0;
    html=html.replace(/<img\b[^>]*>/gi,tag=>{
      const match=tag.match(/src="\.\/img\/([^"<>]+)"/);
      if(!match)return tag;
      const name=match[1], entry=entries.find(x=>x.name===name && x.used);
      const first=count++===0;
      if(entry) tag=tag.replace(match[0],'src="./'+entry.output+'"');
      if(page==='works.html' && entry?.variants.length) {
        const variants=[...entry.variants,{file:entry.output,width:entry.width}];
        tag=tag.replace(/>$/, ' srcset="'+variants.map(x=>'./'+x.file+' '+x.width+'w').join(', ')+'" sizes="(max-width: 540px) 78vw, 46vw">');
      }
      // Keep the homepage reveal portrait ready for immediate interaction.
      const eager=page==='index.html'||first||/banner/i.test(name);
      if(!eager)tag=tag.replace(/>$/,' loading="lazy" decoding="async">');
      if(first)tag=tag.replace(/>$/,' fetchpriority="high">');
      return tag;
    });
    fs.writeFileSync(page,html);
  }
  execFileSync('git',['diff','--check'],{stdio:'inherit'});
  console.log('IMAGE CATEGORY COMPLETE');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
