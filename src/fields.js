export const FIELD_TYPES = [
 ['text','Texto'],['integer','Número entero'],['number','Número decimal'],
 ['date','Fecha'],['time','Hora'],['list','Lista'],['multi','Lista de varios valores']
];
export const DEFAULT_FIELDS = [
 {key:'fecha_texto',label:'Fecha',scope:'header',type:'date',options:[]},
 {key:'operario_texto',label:'Operario',scope:'header',type:'multi',options:['ANA','BEA']},
 {key:'turno',label:'Turno',scope:'header',type:'list',options:['M','T','N']},
 {key:'maquina_texto',label:'Máquina',scope:'header',type:'text',options:[]},
 {key:'observaciones',label:'Observaciones',scope:'header',type:'text',options:[]},
 {key:'orden',label:'Orden de trabajo',scope:'job',type:'text',options:[],required:true},
 {key:'tipo',label:'Tipo de trabajo',scope:'job',type:'list',options:['N','RC','RS']},
 {key:'troquel',label:'Troquel',scope:'job',type:'text',options:[]},
 {key:'unidades_buenas',label:'Unidades buenas',scope:'job',type:'integer',options:[],min:0},
 {key:'mermas',label:'Mermas',scope:'job',type:'integer',options:[],min:0},
 {key:'codigo',label:'Actividad',scope:'activity',type:'list',options:['PRE','TIR']},
 {key:'inicio',label:'Hora de inicio',scope:'activity',type:'time',options:[]},
 {key:'fin',label:'Hora de fin',scope:'activity',type:'time',options:[]}
];
const normalized=value=>String(value).trim().toLocaleLowerCase('es');
export const listValues=value=>value==null?[]:String(value).split(/[\/,]/).map(x=>x.trim()).filter(Boolean);
export function normalizeFieldConfig(raw){
 if(raw==null)return structuredClone(DEFAULT_FIELDS);
 if(!Array.isArray(raw)||raw.length>DEFAULT_FIELDS.length)throw new Error('La configuración de campos no es válida.');
 const seen=new Set();
 for(const item of raw){
  if(!item||!DEFAULT_FIELDS.some(f=>f.key===item.key)||seen.has(item.key))throw new Error('Hay campos desconocidos o repetidos.');
  if(!FIELD_TYPES.some(([type])=>type===item.type))throw new Error('Tipo de campo no válido.');
  if(!Array.isArray(item.options)||item.options.length>100||item.options.some(x=>typeof x!=='string'||x.length>100))throw new Error('Cada lista admite hasta 100 opciones de 100 caracteres.');
  seen.add(item.key);
 }
 return DEFAULT_FIELDS.map(base=>{
  const item=raw.find(x=>x.key===base.key);if(!item)return structuredClone(base);
  const options=[...new Map(item.options.map(x=>[normalized(x),x.trim()])).values()].filter(Boolean);
  if(['list','multi'].includes(item.type)&&!options.length)throw new Error(base.label+': añade al menos una opción a la lista.');
  if(item.type==='multi'&&options.some(x=>/[\/,]/.test(x)))throw new Error(base.label+': escribe un valor por línea, sin barras ni comas.');
  return {...base,type:item.type,options};
 });
}
export const fieldDefinition=(key,config)=>config.find(f=>f.key===key);
export function isoDate(value){
 const s=String(value||'').trim();let year,month,day;
 let match=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
 if(match){year=+match[1];month=+match[2];day=+match[3];}
 else{match=s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2}|\d{4})$/);if(!match)return null;day=+match[1];month=+match[2];year=+match[3];if(year<100)year+=2000;}
 if(year<1900||year>2200)return null;
 const date=new Date(Date.UTC(year,month-1,day));
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
 return String(year)+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
}
export function parseFieldNumber(value,type='number'){
 if(typeof value==='number')return Number.isFinite(value)?value:null;
 let text=String(value??'').trim().replace(/[\u00a0\u202f]/g,' ');
 if(/^[+-]?\d{1,3}(?: \d{3})+(?:[.,]\d+)?$/.test(text))text=text.replaceAll(' ','');
 if(/^[+-]?\d{1,3}(?:\.\d{3})+,\d+$/.test(text))text=text.replaceAll('.','').replace(',','.');
 else if(/^[+-]?\d{1,3}(?:,\d{3})+\.\d+$/.test(text))text=text.replaceAll(',','');
 else if(type==='integer'&&(/^[+-]?\d{1,3}(?:\.\d{3})+$/.test(text)||/^[+-]?\d{1,3}(?:,\d{3})+$/.test(text)))text=text.replace(/[.,]/g,'');
 else if(/^[+-]?\d+(?:[.,]\d+)?$/.test(text))text=text.replace(',','.');
 else return null;
 const number=Number(text);return Number.isFinite(number)?number:null;
}
export function fieldError(key,value,config){
 const def=fieldDefinition(key,config);if(!def)return null;
 if(value==null||String(value).trim()==='')return def.required?'Completa '+def.label.toLowerCase()+'.':null;
 const text=String(value).trim();
 if(['integer','number'].includes(def.type)){
  const number=parseFieldNumber(value,def.type);
  if(number==null)return def.label+': debe ser un número.';
  if(!Number.isFinite(number)||(def.type==='integer'&&!Number.isInteger(number)))return def.label+': debe ser un número entero.';
  if(def.min!=null&&number<def.min)return def.label+': no puede ser negativo.';
 }
 if(def.type==='date'&&!isoDate(value))return def.label+': introduce una fecha válida.';
 if(def.type==='time'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(text))return def.label+': introduce una hora válida.';
 if(['list','multi'].includes(def.type)){
  const values=def.type==='multi'?listValues(value):[text];
  const unknown=values.filter(v=>!def.options.some(option=>normalized(option)===normalized(v)));
  if(unknown.length)return def.label+': '+unknown.join(', ')+' no está en la lista.';
 }
 return null;
}
export function coerceField(key,value,config){
 if(value==null||String(value).trim()==='')return null;
 const def=fieldDefinition(key,config);
 if(!def||fieldError(key,value,config))return value;
 if(['integer','number'].includes(def.type))return parseFieldNumber(value,def.type);
 if(def.type==='date')return isoDate(value);
 if(['list','multi'].includes(def.type)){
  const values=def.type==='multi'?listValues(value):[String(value).trim()];
  return values.map(v=>def.options.find(x=>normalized(x)===normalized(v))).join('/');
 }
 return String(value).trim();
}
export function fieldOcrSchema(key,config){
 const def=fieldDefinition(key,config);
 return {type:[def?.type==='integer'?'integer':def?.type==='number'?'number':'string','null']};
}

