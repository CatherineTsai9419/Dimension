const fs=require('node:fs');
const sharp=require(process.env.SHARP_MODULE||'sharp');
async function main(){
 const rows=JSON.parse(fs.readFileSync('reports/images.json'));
 let html=fs.readFileSync('index.html','utf8');
 for(const row of rows.filter(x=>/^block0[1-5]\.png$/.test(x.name))){
  for(const width of [640,1280]){
   const file='img/optimized/'+row.name+'.'+width+'.webp';
   await sharp('img/'+row.name).resize(width,width,{fit:'inside'}).webp({lossless:true,effort:4}).toFile(file);
   row.variants.push({width,file,bytes:fs.statSync(file).size});
  }
  const set=[...row.variants,{width:row.width,file:row.output}].map(x=>'./'+x.file+' '+x.width+'w').join(', ');
  html=html.replace('src="./'+row.output+'"','src="./'+row.output+'" srcset="'+set+'" sizes="'+(row.name==='block04.png'?'120vw':'100vw')+'"');
 }
 fs.writeFileSync('index.html',html);
 fs.writeFileSync('reports/images.json',JSON.stringify(rows,null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
