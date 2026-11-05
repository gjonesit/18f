const $=s=>document.querySelector(s),esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function api(u,o){const r=await fetch(u,o&&{headers:{'Content-Type':'application/json'},...o,body:o.body&&JSON.stringify(o.body)});const j=await r.json();if(!r.ok)throw Error(j.error||'Errore');return j}
const ready=(async()=>{const me=await api('/api/me');
 if(!me.user&&document.body.dataset.protected){location.href='/';return null}
 document.body.classList.toggle('in',!!me.user);if($('#who'))$('#who').textContent=me.user||'';return me.user})();
['#out','#out2'].forEach(s=>$(s)?.addEventListener('click',async e=>{e.preventDefault();await api('/api/logout',{method:'POST'});location.href='/'}));
