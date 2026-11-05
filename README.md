# Portale interno — Gabriel Jones

Jekyll + Netlify (con Netlify Function per Zoho Mail).

## 1. Personalizza
- `_config.yml`: dati della carta intestata e URL del sito pubblico.

## 2. Zoho Mail (una volta sola)
1. Vai su https://api-console.zoho.eu (usa `.com` / `.in` se il tuo account è su un altro data center) → **Self Client**.
2. Scope: `ZohoMail.accounts.READ,ZohoMail.folders.READ,ZohoMail.messages.ALL` → genera il *code* (vale pochi minuti).
3. Scambia il code con il refresh token:
   `curl -X POST "https://accounts.zoho.eu/oauth/v2/token" -d "grant_type=authorization_code&client_id=ID&client_secret=SECRET&code=CODE"`
4. Prendi l'**accountId**: `curl -H "Authorization: Zoho-oauthtoken ACCESS_TOKEN" https://mail.zoho.eu/api/accounts` → campo `accountId`.

## 3. Variabili d'ambiente su Netlify (Site settings → Environment variables)
| Nome | Valore |
|---|---|
| PORTAL_PASSWORD | password per entrare nel portale |
| SESSION_SECRET | stringa casuale lunga (es. `openssl rand -hex 32`) |
| ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET | dalla console Zoho |
| ZOHO_REFRESH_TOKEN | dal passo 2.3 |
| ZOHO_ACCOUNT_ID | dal passo 2.4 |
| ZOHO_FROM | il tuo indirizzo Zoho mittente |
| ALLOWED_DOMAIN | `joneshouse.it` (default) |
| ALLOWED_EMAILS | facoltativo: elenco di email consentite, separate da virgola |
| ZOHO_DC | `eu` (default), `com` o `in` |

## 4. Pubblica
Carica la cartella su GitHub, collega il repo a Netlify (build e functions sono già in `netlify.toml`).
Test in locale: `netlify dev` (con un file `.env` con le stesse variabili).
