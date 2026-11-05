// Proxy sicuro verso Zoho Mail + login a password. Variabili d'ambiente: vedi README.
const crypto = require('crypto');
const E = process.env, DC = E.ZOHO_DC || 'eu';
const H = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const out = (s, o, extra = {}) => ({ statusCode: s, headers: { ...H, ...extra }, body: JSON.stringify(o) });
const sign = v => crypto.createHmac('sha256', E.8680ca4cbc72ac6aa15614df449387c6c67964f546 || '').update(v).digest('hex');
const sha = v => crypto.createHash('sha256').update(String(v)).digest();

const valid = h => {
  const m = (h.cookie || '').match(/gj_session=(\d+)\.([a-f0-9]{64})/);
  if (!m || +m[1] < Date.now() || !E.SESSION_SECRET) return false;
  return crypto.timingSafeEqual(Buffer.from(m[2]), Buffer.from(sign(m[1])));
};

let tok = { v: null, exp: 0 };
async function token() {
  if (tok.v && tok.exp > Date.now()) return tok.v;
  const r = await fetch(`https://accounts.zoho.${DC}/oauth/v2/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ refresh_token: E.ZOHO_REFRESH_TOKEN, client_id: E.ZOHO_CLIENT_ID, client_secret: E.ZOHO_CLIENT_SECRET, grant_type: 'refresh_token' })
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Autorizzazione Zoho non valida: controlla le variabili su Netlify');
  tok = { v: j.access_token, exp: Date.now() + 55 * 60 * 1000 };
  return tok.v;
}
async function zoho(path, opt = {}) {
  const r = await fetch(`https://mail.zoho.${DC}/api/accounts/${E.1000.9HY0S2LHUEAAPUNI5YY13T77615KEI}${path}`, {
    ...opt, headers: { Authorization: 'Zoho-oauthtoken ' + await token(), Accept: 'application/json', 'Content-Type': 'application/json' }
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.data && j.data.moreInfo) || (j.status && j.status.description) || 'Errore Zoho ' + r.status);
  return j;
}
const id = v => encodeURIComponent(String(v || '').replace(/[^\w-]/g, ''));

exports.handler = async (ev) => {
  const q = ev.queryStringParameters || {}, a = q.a;
  let body = {}; try { body = ev.body ? JSON.parse(ev.body) : {}; } catch (e) {}
  const h = Object.fromEntries(Object.entries(ev.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));

  if (a === 'login') {
    if (!E.PORTAL_PASSWORD || !E.SESSION_SECRET) return out(500, { error: 'Configura PORTAL_PASSWORD e SESSION_SECRET' });
    const dom = '@' + (E.ALLOWED_DOMAIN || '18f.it').toLowerCase();
    const mail = String(body.email || '').trim().toLowerCase();
    const list = (E.ALLOWED_EMAILS || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
    const okMail = mail.endsWith(dom) && mail.length > dom.length && (!list.length || list.includes(mail));
    const okPw = crypto.timingSafeEqual(sha(body.password), sha(E.PORTAL_PASSWORD));
    if (!okMail || !okPw) { await new Promise(r => setTimeout(r, 700)); return out(401, { error: 'Credenziali non valide' }); }
    const exp = String(Date.now() + 12 * 3600e3);
    return out(200, { ok: true }, { 'Set-Cookie': `gj_session=${exp}.${sign(exp)}; Path=/; Max-Age=43200; HttpOnly; Secure; SameSite=Strict` });
  }
  if (a === 'logout') return out(200, { ok: true }, { 'Set-Cookie': 'gj_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict' });
  if (!valid(h)) return out(401, { error: 'Non autorizzato' });
  if (a === 'me') return out(200, { ok: true });

  try {
    if (a === 'folders') return out(200, await zoho('/folders'));
    if (a === 'list') return out(200, await zoho(`/messages/view?folderId=${id(q.folderId)}&start=${+q.start || 1}&limit=${Math.min(+q.limit || 30, 50)}&sortBy=date&sortorder=false`));
    if (a === 'message') return out(200, await zoho(`/folders/${id(q.folderId)}/messages/${id(q.id)}/content`));
    if (a === 'delete' && ev.httpMethod === 'POST') return out(200, await zoho(`/folders/${id(q.folderId)}/messages/${id(q.id)}`, { method: 'DELETE' }));
    if (a === 'send' && ev.httpMethod === 'POST') {
      if (!body.to) return out(400, { error: 'Inserisci almeno un destinatario' });
      const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
      return out(200, await zoho('/messages', { method: 'POST', body: JSON.stringify({
        fromAddress: E.ZOHO_FROM, toAddress: body.to, subject: body.subject || '(senza oggetto)',
        content: esc(body.body || '').replace(/\n/g, '<br>'), mailFormat: 'html' }) }));
    }
    return out(404, { error: 'Azione sconosciuta' });
  } catch (e) { return out(502, { error: e.message }); }
};
