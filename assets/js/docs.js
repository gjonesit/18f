ready.then(async u=>{if(!u)return;let docs=[],cur=null;
function render(){$('#dl').innerHTML=docs.length?docs.map(d=>`<div data-id="${d.id}" class="${cur&&cur.id==d.id?'on':''}"><b>${esc(d.title||'Senza titolo')}</b><small>${esc(d.by)} · ${new Date(d.at).toLocaleDateString('it-IT')}</small></div>`).join(''):'<div class="empty">Nessun documento. Creane uno.</div>';
 document.querySelectorAll('#dl div[data-id]').forEach(el=>el.onclick=()=>{cur=docs.find(d=>d.id==el.dataset.id);$('#dt').value=cur.title;$('#body').innerHTML=cur.html;render()})}
$('#dn').onclick=()=>{cur=null;$('#dt').value='';$('#body').innerHTML='<p>Gentile ...,</p><p><br></p>';render()};
$('#ds').onclick=async()=>{docs=await api('/api/docs',{method:'POST',body:{id:cur?.id,title:$('#dt').value,html:$('#body').innerHTML}});cur=cur?docs.find(d=>d.id==cur.id):docs[0];render()};
$('#dx').onclick=async()=>{if(cur&&confirm('Eliminare questo documento?')){docs=await api('/api/docs/'+cur.id,{method:'DELETE'});cur=null;$('#dt').value='';$('#body').innerHTML='';render()}};
$('#dp').onclick=()=>{const t=document.title;document.title=$('#dt').value||'Documento';print();document.title=t};
docs=await api('/api/docs');render()});
