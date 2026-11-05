const API='/.netlify/functions/api';
(async()=>{
  const root=document.documentElement,gate=document.getElementById('gate');
  let ok=true;
  try{ok=(await fetch(API+'?a=me',{credentials:'same-origin'})).ok;}catch(e){ok=true;} // in locale (senza funzioni) non blocca
  if(ok)root.classList.add('authed');else{gate.hidden=false;document.getElementById('gatepw').focus();}
  document.getElementById('gateform').addEventListener('submit',async e=>{
    e.preventDefault();
    const r=await fetch(API+'?a=login',{method:'POST',body:JSON.stringify({email:document.getElementById('gateemail').value,password:document.getElementById('gatepw').value})});
    if(r.ok)location.reload();else document.getElementById('gateerr').textContent='Email o password non corrette.';
  });
  [...document.querySelectorAll('#logout,#logout2')].forEach(b=>b.addEventListener('click',async e=>{e.preventDefault();await fetch(API+'?a=logout',{method:'POST'});location.href='/';}));
})();
