const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ICON={Inbox:'📥',Sent:'📤',Drafts:'📝',Trash:'🗑️',Spam:'⚠️',Templates:'📄'};
const PAGE=30;let folder=null,start=1,cur=null,items=[];
async function api(a,p={},body){
  const u=new URL(API,location.origin);u.searchParams.set('a',a);for(const k in p)u.searchParams.set(k,p[k]);
  const r=await fetch(u,body?{method:'POST',body:JSON.stringify(body)}:{});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('Errore '+r.status));return j;
}
const fmt=t=>{const d=new Date(+t),n=new Date();return d.toDateString()===n.toDateString()?d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}):d.toLocaleDateString('it-IT',{day:'numeric',month:'short'});};
function note(msg){$('#msgs').innerHTML=`<li class="muted" style="padding:1rem">${esc(msg)}</li>`;}

async function loadFolders(){
  try{
    const j=await api('folders');const fl=j.data||[];
    $('#folderlist').innerHTML=fl.map(f=>`<li><button data-id="${esc(f.folderId)}" data-name="${esc(f.folderName)}">
      <span>${ICON[f.folderType]||'📁'} ${esc(f.folderName)}</span>${+f.unreadCount?`<span class="badge">${f.unreadCount}</span>`:''}</button></li>`).join('');
    const inbox=fl.find(f=>f.folderType==='Inbox')||fl[0];if(inbox)openFolder(inbox.folderId,inbox.folderName);
  }catch(e){note(e.message);$('#folderlist').innerHTML='';}
}
async function openFolder(id,name){
  folder=id;start=1;cur=null;$('#foldername').textContent=name;
  document.querySelectorAll('#folderlist button').forEach(b=>b.toggleAttribute('aria-current',b.dataset.id===id));
  $('#reader').innerHTML='<p class="empty">Seleziona un messaggio per leggerlo.</p>';loadList();
}
async function loadList(){
  note('Carico…');
  try{
    const j=await api('list',{folderId:folder,start,limit:PAGE});items=j.data||[];
    if(!items.length)return note(start>1?'Nessun altro messaggio.':'Cartella vuota. Niente da leggere qui.');
    $('#msgs').innerHTML=items.map((m,i)=>`<li class="${m.status==='0'?'unread':''}"><button data-i="${i}">
      <div class="from"><span>${esc(m.sender||m.fromAddress)}</span><span class="muted">${fmt(m.receivedTime)}</span></div>
      <div class="sub">${esc(m.subject||'(senza oggetto)')}</div><div class="snip">${esc(m.summary)}</div></button></li>`).join('');
  }catch(e){note(e.message);}
}
async function openMsg(i){
  const m=items[i];cur=m;
  document.querySelectorAll('#msgs button').forEach(b=>b.toggleAttribute('aria-current',+b.dataset.i===i));
  $('#reader').innerHTML=`<h2>${esc(m.subject||'(senza oggetto)')}</h2><div class="meta">Da ${esc(m.sender)} &lt;${esc(m.fromAddress)}&gt; · ${new Date(+m.receivedTime).toLocaleString('it-IT')}</div>
   <div class="actions"><button class="btn yellow sm" id="reply">Rispondi</button><button class="btn ghost sm" id="del">Elimina</button></div><p class="muted">Carico il messaggio…</p>`;
  $('#reply').onclick=()=>compose(m.fromAddress,'Re: '+(m.subject||'').replace(/^Re:\s*/i,''),'\n\n— Messaggio originale —\n'+(m.summary||''));
  $('#del').onclick=async()=>{if(!confirm('Eliminare il messaggio?'))return;try{await api('delete',{folderId:m.folderId||folder,id:m.messageId},{});loadList();$('#reader').innerHTML='<p class="empty">Messaggio eliminato.</p>';}catch(e){alert(e.message);}};
  try{
    const j=await api('message',{folderId:m.folderId||folder,id:m.messageId});
    const fr=document.createElement('iframe');fr.setAttribute('sandbox','allow-popups');fr.referrerPolicy='no-referrer';
    fr.srcdoc=`<base target="_blank"><style>body{font:15px/1.5 system-ui,sans-serif;margin:16px}img{max-width:100%}</style>`+((j.data&&j.data.content)||'');
    $('#reader').querySelector('p.muted').replaceWith(fr);
  }catch(e){$('#reader').querySelector('p.muted').textContent=e.message;}
}
function compose(to='',subject='',body=''){const f=$('#cf');f.to.value=to;f.subject.value=subject;f.body.value=body;$('#cerr').textContent='';$('#compose').showModal();(to?f.body:f.to).focus();}

$('#folderlist').addEventListener('click',e=>{const b=e.target.closest('button');if(b)openFolder(b.dataset.id,b.dataset.name);});
$('#msgs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)openMsg(+b.dataset.i);});
$('#new').onclick=()=>compose();
$('#refresh').onclick=loadList;
$('#next').onclick=()=>{start+=PAGE;loadList();};
$('#prev').onclick=()=>{if(start>1){start=Math.max(1,start-PAGE);loadList();}};
$('#cancel').onclick=()=>$('#compose').close();
$('#cf').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,btn=$('#send');btn.disabled=true;btn.textContent='Invio…';
  try{await api('send',{},{to:f.to.value,subject:f.subject.value,body:f.body.value});$('#compose').close();}
  catch(err){$('#cerr').textContent=err.message;}
  btn.disabled=false;btn.textContent='Invia';
});
loadFolders();
