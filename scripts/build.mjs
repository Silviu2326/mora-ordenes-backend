import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [server,fields,quantities,example,photo]=await Promise.all([read('src/server.js'),read('src/fields.js'),read('src/quantities.js'),read('src/example.json'),readFile(new URL('assets/example.png',root))]);
const prefix='const EXAMPLE_DATA='+JSON.stringify(JSON.parse(example))+';\nconst EXAMPLE_IMAGE='+JSON.stringify(photo.toString('base64'))+';\n'+fields+'\n'+quantities+'\n';
await writeFile(new URL('worker.js',root),prefix+server);
console.log('API OCR construida.');
