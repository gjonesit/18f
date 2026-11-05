import {getStore} from '@netlify/blobs';
import crypto from 'node:crypto';
const E=process.env,DC=E.ZOHO_DC||'eu',ACC=`https://accounts.zoho.${DC}`,API=`https://mail.zoho.${DC}`;
const key=()=>crypto.createHash('sha256').update(E.SESSION_SECRET||'').digest();
const seal=o=>{const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key(),iv),b=Buffer.concat([c.update(JSON.stringify(o)),c.final()]);return Buffer.concat([iv,c.getAuthTag(),b]).toString('base64url')};
const unseal=s=>{try{const b=Buffer.from(s,'base64url'),d=crypto.createDecipheriv('aes-256-gcm',key(),b.subarray(0,12));d.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([d.update(b.subarray(28)),d.final()]))}catch{return null}};
const getS=r=>{const m=(r.headers.get('cookie')||'').match(/(?:^|; )s=([^;]+)/);return m&&unseal(m[1])};
const ck=v=>`s=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${v?2592000:0}`;
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
const tok=async p=>(await fetch(ACC+'/oauth/v2/token',{method:'POST',body:new URLSearchParams({client_id:E.ZOHO_CLIENT_ID,client_secret:E.ZOHO_CLIENT_SECRET,...p})})).json();
async function zo(S,path,opt={}){
 if(Date.now()>S.exp){const t=await tok({grant_type:'refresh_token',refresh_token:S.r});if(!t.access_token)throw Error('Sessione Zoho scaduta: rientra');S.a=t.access_token;S.exp=Date.now()+3e6;S.dirty=1}
 return(await fetch(API+'/api/accounts/'+S.id+path,{...opt,headers:{Authorization:'Zoho-oauthtoken '+S.a,'Content-Type':'application/json'}})).json()}
export default async req=>{
 const u=new URL(req.url),p=u.pathname,q=u.searchParams,cb=u.origin+'/auth/callback';
 if(p==='/auth/zoho')return Response.redirect(`${ACC}/oauth/v2/auth?`+new URLSearchParams({response_type:'code',client_id:E.ZOHO_CLIENT_ID,scope:'ZohoMail.accounts.READ,ZohoMail.folders.READ,ZohoMail.messages.ALL',redirect_uri:cb,access_type:'offline',prompt:'consent'}),302);
 if(p==='/auth/callback'){
  const t=await tok({grant_type:'authorization_code',code:q.get('code'),redirect_uri:cb});
  if(!t.access_token)return new Response('Errore OAuth: '+JSON.stringify(t),{status:400});
  const a=await(await fetch(API+'/api/accounts',{headers:{Authorization:'Zoho-oauthtoken '+t.access_token}})).json(),ac=a.data?.[0];
  const email=(ac?.primaryEmailAddress||'').toLowerCase(),ok=(E.ALLOWED_EMAILS||'').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
  if(!ac||!ok.includes(email))return new Response('Accesso non autorizzato',{status:403});
  const S={email,id:ac.accountId,a:t.access_token,r:t.refresh_token,exp:Date.now()+3e6};
  return new Response(null,{status:302,headers:{location:'/','set-cookie':ck(seal(S))}})}
 if(p==='/api/logout')return new Response('{}',{headers:{'set-cookie':ck('')}});
 const S=getS(req);
 if(p==='/api/me')return J({user:S?.email||null});
 if(!S)return J({error:'Accesso richiesto'},401);
 try{
  const st=getStore('docs'),load=async()=>(await st.get('all',{type:'json'}))||[],save=d=>st.setJSON('all',d);
  let res;
  if(p==='/api/mail/folders')res=J(await zo(S,'/folders'));
  else if(p==='/api/mail/list')res=J(await zo(S,`/messages/view?folderId=${encodeURIComponent(q.get('f'))}&limit=40`));
  else if(p==='/api/mail/msg')res=J(await zo(S,`/folders/${encodeURIComponent(q.get('f'))}/messages/${encodeURIComponent(q.get('m'))}/content`));
  else if(p==='/api/mail/send'){const b=await req.json();res=J(await zo(S,'/messages',{method:'POST',body:JSON.stringify({fromAddress:S.email,toAddress:b.to,subject:b.subject,content:b.body,mailFormat:'html'})}))}
  else if(p==='/api/docs'&&req.method==='GET')res=J(await load());
  else if(p==='/api/docs'&&req.method==='POST'){let d=await load();const b={...await req.json(),by:S.email,at:Date.now()};
   if(b.id&&d.some(x=>x.id===b.id))d=d.map(x=>x.id===b.id?b:x);else d.unshift({...b,id:crypto.randomUUID()});await save(d);res=J(d)}
  else if(p.startsWith('/api/docs/')&&req.method==='DELETE'){const d=(await load()).filter(x=>x.id!==p.split('/').pop());await save(d);res=J(d)}
  else res=J({error:'Non trovato'},404);
  if(S.dirty){delete S.dirty;res.headers.append('set-cookie',ck(seal(S)))}
  return res}catch(e){return J({error:e.message},500)}};
export const config={path:['/api/*','/auth/*']};
