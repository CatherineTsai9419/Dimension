const http=require('node:http'),fs=require('node:fs');
const {execFileSync}=require('node:child_process');
http.createServer((req,res)=>{
 let file=decodeURIComponent(req.url.split('?')[0]).slice(1)||'index.html';
 const original=file.startsWith('original/');file=file.replace(/^(original|current)\//,'');
 if(file.includes('..')){res.writeHead(403).end();return;}
 try{
  const data=original&&/\.(html|css)$/.test(file)?execFileSync('git',['show','HEAD:'+file]):fs.readFileSync(file);
  const ext=file.split('.').pop();
  res.setHeader('Content-Type',({html:'text/html',css:'text/css',js:'application/javascript',png:'image/png',jpg:'image/jpeg',gif:'image/gif',webp:'image/webp'})[ext]||'application/octet-stream');
  res.end(data);
 }catch{res.writeHead(404).end();}
}).listen(8123,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:8123/current/index.html'));
