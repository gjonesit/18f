const $=s=>document.querySelector(s),f=$('#f'),sheet=$('#sheet'),L=$('#lh').dataset;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TPL={
 lettera:{ogg:'',corpo:'Gentile ...,\n\ncon la presente desidero ...\n\nResto a disposizione per ogni chiarimento.'},
 circolare:{ogg:'Comunicazione',corpo:'Si comunica a tutti gli interessati che ...\n\nPer informazioni è possibile contattarci ai recapiti indicati in intestazione.'},
 dichiarazione:{ogg:'Dichiarazione',corpo:'Il sottoscritto Gabriel Jones dichiara che ...\n\nLa presente viene rilasciata per gli usi consentiti dalla legge.'},
 libero:{ogg:'',corpo:''}};
const KEY='gj_doc_draft';
const fmtDate=v=>v?new Date(v+'T12:00').toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}):'';
const v=()=>Object.fromEntries(new FormData(f));
function html(d){
  const body=esc(d.corpo).split(/\n{2,}/).map(p=>`<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
  const contact=[L.address,L.email,L.phone,L.web].filter(Boolean).map(esc).join('<br>');
  return `<div class="lh-head"><div><div class="lh-name">${esc(L.name)}</div><div class="lh-tag">${esc(L.tagline)}</div></div><div class="lh-contact">${contact}</div></div>
  <div class="meta">${esc(d.luogo)}${d.luogo&&d.data?', ':''}${fmtDate(d.data)}</div>
  ${d.dest?`<p class="dest">${esc(d.dest)}</p>`:''}
  ${d.ogg?`<div class="ogg">Oggetto: ${esc(d.ogg)}</div>`:''}
  <div class="body">${body}</div>
  <div class="sign">${esc(d.saluti)}<b>${esc(d.firma)}</b></div>
  <div class="lh-foot"><div class="bar"></div><p>${esc(L.name)} · ${esc(L.vat)}</p></div>`;
}
function render(){sheet.innerHTML=html(v());localStorage.setItem(KEY,JSON.stringify(v()));}
function load(){
  f.data.value=new Date().toISOString().slice(0,10);
  try{const s=JSON.parse(localStorage.getItem(KEY));if(s)for(const k in s)if(f[k])f[k].value=s[k];}catch(e){}
  if(!f.corpo.value){f.corpo.value=TPL.lettera.corpo;}
  render();
}
f.addEventListener('input',render);
f.tpl.addEventListener('change',()=>{const t=TPL[f.tpl.value];f.ogg.value=t.ogg;f.corpo.value=t.corpo;render();});
$('#pdf').onclick=()=>{document.title=`${f.ogg.value||'Documento'} - ${L.name}`;print();};
$('#reset').onclick=()=>{if(confirm('Svuotare il documento?')){localStorage.removeItem(KEY);f.reset();f.corpo.value='';load();}};
$('#word').onclick=()=>{
  const css=`body{font:11.5pt Georgia,serif}.lh-head{border-bottom:3px solid #f04428;margin-bottom:24pt}.lh-name{font:bold 24pt Georgia;color:#231019}.lh-tag{font:10pt Arial;color:#6b5560}.lh-contact{font:8.5pt Arial;color:#444;text-align:right}.meta{text-align:right}.dest{margin-left:250pt}.ogg{font-weight:bold}.sign{margin-left:250pt;text-align:center}.lh-foot p{text-align:center;font:8pt Arial;color:#555;border-top:3pt solid #f04428;padding-top:4pt}.bar{display:none}`;
  const doc=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>@page{size:21cm 29.7cm;margin:1.6cm 2cm}${css}</style></head><body>${html(v()).replace(/<div class="lh-head">([\s\S]*?)<\/div><div class="lh-contact">/,'<table width="100%" class="lh-head"><tr><td>$1</td><td class="lh-contact">')}</body></html>`;
  // versione robusta: intestazione come tabella
  const head=`<table width="100%" style="border-bottom:3pt solid #f04428"><tr><td><div class="lh-name">${esc(L.name)}</div><div class="lh-tag">${esc(L.tagline)}</div></td><td class="lh-contact">${[L.address,L.email,L.phone,L.web].filter(Boolean).map(esc).join('<br>')}</td></tr></table>`;
  const d=v(),b=esc(d.corpo).split(/\n{2,}/).map(p=>`<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
  const out=`<html><head><meta charset="utf-8"><style>@page{size:21cm 29.7cm;margin:1.6cm 2cm}${css}</style></head><body>${head}<p class="meta">${esc(d.luogo)}, ${fmtDate(d.data)}</p>${d.dest?`<p class="dest">${esc(d.dest).replace(/\n/g,'<br>')}</p>`:''}${d.ogg?`<p class="ogg">Oggetto: ${esc(d.ogg)}</p>`:''}${b}<p class="sign">${esc(d.saluti)}<br><br><br><b>${esc(d.firma)}</b></p><div class="lh-foot"><p>${esc(L.name)} · ${esc(L.vat)}</p></div></body></html>`;
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['\ufeff',out],{type:'application/msword'}));
  a.download=(d.ogg||'documento').replace(/[^\w\-]+/g,'_')+'.doc';a.click();URL.revokeObjectURL(a.href);
};
load();
