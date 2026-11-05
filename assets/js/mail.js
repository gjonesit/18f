ready.then(u=>{if(!u)return;
async function loadFolders(){try{const r=await api('/api/mail/folders');$('#fold').innerHTML=(r.data||[]).map(f=>`<button data-id="${esc(f.folderId)}">${esc(f.folderName)}</button>`).join('');
 document.querySelectorAll('#fold button').forEach(b=>b.onclick=()=>openFolder(b.dataset.id,b));document.querySelector('#fold button')?.click()}
 catch(e){$('#list').innerHTML=`<div class="empty">${esc(e.message)}</div>`}}
async function openFolder(id,b){document.querySelectorAll('#fold button').forEach(x=>x.classList.toggle('on',x==b));
 const d=(await api('/api/mail/list?f='+encodeURIComponent(id))).data||[];
 $('#list').innerHTML=d.length?d.map(m=>`<div class="m" data-m="${esc(m.messageId)}" data-f="${esc(m.folderId||id)}"><b>${esc(m.sender||m.fromAddress)}</b><span>${esc(m.subject)}</span><small>${esc(m.summary)}</small></div>`).join(''):'<div class="empty">Nessun messaggio in questa cartella.</div>';
 document.querySelectorAll('.m').forEach(el=>el.onclick=()=>readMsg(el))}
async function readMsg(el){document.querySelectorAll('.m').forEach(x=>x.classList.toggle('on',x==el));
 const r=await api(`/api/mail/msg?f=${encodeURIComponent(el.dataset.f)}&m=${encodeURIComponent(el.dataset.m)}`);
 $('#read').innerHTML=`<h2>${esc(el.querySelector('span').textContent)}</h2><p>${esc(el.querySelector('b').textContent)}</p><iframe sandbox></iframe>`;$('#read iframe').srcdoc=r.data?.content||''}
$('#nw').onclick=()=>$('#compose').classList.remove('hide');$('#cc').onclick=()=>$('#compose').classList.add('hide');
$('#cv').onclick=async()=>{try{await api('/api/mail/send',{method:'POST',body:{to:$('#ct').value,subject:$('#cs').value,body:esc($('#cb').value).replace(/\n/g,'<br>')}});$('#compose').classList.add('hide');['#ct','#cs','#cb'].forEach(s=>$(s).value='')}catch(e){alert(e.message)}};
loadFolders()});
