import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import worker from './worker.js';
const port=Number(process.env.PORT||8080);
if(!process.env.MISTRAL_API_KEY||!process.env.ORIGIN_SECRET){
 console.error('Faltan las variables de servidor MISTRAL_API_KEY u ORIGIN_SECRET.');process.exit(1);
}
function matchesSecret(value){const expected=Buffer.from(process.env.ORIGIN_SECRET),provided=Buffer.from(typeof value==='string'?value:'');return expected.length===provided.length&&timingSafeEqual(expected,provided);}
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://internal').pathname;
  if(pathname==='/api/ocr'&&!matchesSecret(req.headers['x-origin-secret'])){
   res.writeHead(403,{'content-type':'application/json;charset=utf-8','cache-control':'no-store'});
   res.end(JSON.stringify({error:'Accede a la extracción desde la web de la demo.'}));return;
  }
  const headers=new Headers(req.headers);
  headers.delete('oai-authenticated-user-id');headers.delete('cf-connecting-ip');
  if(matchesSecret(req.headers['x-origin-secret'])){
   const ip=req.headers['x-real-ip']||String(req.headers['x-forwarded-for']||'').split(',')[0].trim()||'demo';
   headers.set('cf-connecting-ip',String(ip));
  }
  headers.delete('x-origin-secret');
  const buffers=[];let size=0;
  for await(const part of req){size+=part.length;if(size>14500000){res.writeHead(413,{'content-type':'application/json'});res.end(JSON.stringify({error:'El archivo supera el límite de 10 MB.'}));return;}buffers.push(part);}
  const body=Buffer.concat(buffers);
  const protocol=req.headers['x-forwarded-proto']==='https'?'https':'http';
  const host=req.headers.host||'localhost:'+port;
  const request=new Request(protocol+'://'+host+req.url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body}: {})});
  const response=await worker.fetch(request,process.env,{});
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{if(!res.headersSent)res.writeHead(500,{'content-type':'application/json'});res.end(JSON.stringify({error:'No se pudo completar la petición.'}));}
});
server.requestTimeout=125000;
server.keepAliveTimeout=65000;
server.headersTimeout=66000;
server.listen(port,'0.0.0.0',()=>console.log('Servidor OCR listo en el puerto '+port));
const shutdown=()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),30000).unref();};
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);

