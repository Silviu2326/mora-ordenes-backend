function quantityText(value){
 if(value==null)return null;
 const text=String(value).replace(/<[^>]*>/g,' ').replace(/[*_]/g,'').replaceAll(String.fromCharCode(96),'').replace(/\u00a0|\u202f/g,' ').trim().replace(/\s+(?:uds?\.?|unidades?|piezas?)$/i,'').trim();
 return text&&/^[+\d][\d., ]*$/.test(text)&&parseFieldNumber(text,'number')!=null?text:null;
}
function quantityMarkdown(source){
 return String(source||'').replace(/<tr\b[^>]*>/gi,'\n').replace(/<\/tr>/gi,'|\n').replace(/<t[dh]\b[^>]*>/gi,'|').replace(/<\/t[dh]>/gi,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\r/g,'');
}
const quantityLabel=/\b(?:UDS?\.?\s*BUENAS|UNIDADES\s*BUENAS)\b/i;
function tableCells(line){return line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(x=>x.trim());}
function labeledQuantity(section){
 const lines=section.split('\n');const positions=lines.map((line,index)=>quantityLabel.test(line)?index:-1).filter(index=>index>=0);
 if(positions.length!==1)return null;
 const row=positions[0],line=lines[row];
 if(line.includes('|')){
  const cells=tableCells(line),column=cells.findIndex(cell=>quantityLabel.test(cell));if(column<0)return null;
  const sameCell=cells[column].replace(quantityLabel,'').replace(/^\s*[:=-]\s*/,'').trim();
  const inline=quantityText(sameCell);if(inline)return inline;
  if(column+1<cells.length){const beside=quantityText(cells[column+1]);if(beside)return beside;if(!cells[column+1])return null;}
  for(let i=row+1;i<Math.min(lines.length,row+5);i++){
   if(!lines[i].trim())continue;const next=tableCells(lines[i]);
   if(next.every(cell=>/^:?-+:?$/.test(cell)))continue;
   return quantityText(next[column]);
  }
  return null;
 }
 const inline=quantityText(line.replace(quantityLabel,'').replace(/^\s*[:=-]\s*/,'').trim());if(inline)return inline;
 for(let i=row+1;i<Math.min(lines.length,row+5);i++){if(!lines[i].trim())continue;return quantityText(lines[i]);}
 return null;
}
function regexEscape(text){return text.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');}
export function recoverQuantityFromOcr(order,orders,pages){
 if(order==null||String(order).trim()==='')return null;
 const source=quantityMarkdown((pages||[]).map(p=>p.markdown||'').join('\n'));const anchors=[];
 for(const item of orders){if(item==null||String(item).trim()==='')continue;const id=String(item).trim(),escaped=regexEscape(id);
  const pattern=new RegExp('(?:\\|\\s*'+escaped+'\\s*(?=\\|)|^\\s*'+escaped+'\\s*$|Orden\\s+(?:de\\s+)?trabajo\\s*[:：]\\s*'+escaped+'(?=\\s|$|\\|))','gim');
  for(const match of source.matchAll(pattern))anchors.push({id,index:match.index});
 }
 anchors.sort((a,b)=>a.index-b.index);const matches=anchors.filter(a=>a.id===String(order).trim());if(matches.length!==1)return null;
 const start=matches[0].index,next=anchors.find(a=>a.index>start&&a.id!==matches[0].id);
 return labeledQuantity(source.slice(start,next?.index??source.length));
}
export function recoverGoodUnits(extraction,pages,config){
 const jobs=extraction.trabajos||[],orders=jobs.map(w=>w.orden),alerts=Array.isArray(extraction.dudas)?extraction.dudas:[];
 for(const job of jobs){
  const original=job.unidades_buenas,absent=original==null||String(original).trim()==='';let raw=original;
  if(absent){const found=recoverQuantityFromOcr(job.orden,orders,pages);if(found!=null)raw=found;}
  job.unidades_buenas=coerceField('unidades_buenas',raw,config);
  if(job.unidades_buenas==null)alerts.push('Orden '+String(job.orden||job.bloque)+': no se ha podido leer la casilla UDS BUENAS; revisar el documento.');
  else if(fieldError('unidades_buenas',job.unidades_buenas,config))alerts.push('Orden '+String(job.orden||job.bloque)+': revisar el formato de UDS BUENAS.');
 }
 extraction.dudas=[...new Set(alerts)];return extraction;
}

