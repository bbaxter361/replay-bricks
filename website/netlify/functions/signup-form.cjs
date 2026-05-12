#!/usr/bin/env node

// Pool Party Signup — Netlify Function
// GET  /?view=list  → shows signup list (copy-paste friendly)
// POST /            → submits to Google Sheet

const SHEET_ID = "19bRoDN5BYmfoakTuDuQIpTfqsJyRBbHSpU43sh7KMDo";
const SHEET_RANGE = encodeURIComponent("Signups!A:D");

// ── HTML templates ──────────────────────────────────────────

function formHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pool Party Food Signup</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;justify-content:center;padding:20px}
.container{max-width:500px;width:100%;padding:20px}
h1{font-size:1.5rem;margin-bottom:4px;color:#f8fafc}
.subtitle{color:#94a3b8;font-size:.9rem;margin-bottom:24px}
.g{margin-bottom:16px}
label{display:block;font-size:.85rem;color:#cbd5e1;margin-bottom:6px;font-weight:600}
input,select{width:100%;padding:12px;border:1px solid #334155;border-radius:8px;font-size:1rem;background:#1e293b;color:#e2e8f0;outline:none}
input:focus,select:focus{border-color:#818cf8}
button{width:100%;padding:14px;background:#818cf8;color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;margin-top:8px}
button:hover{background:#6366f1}
button:disabled{opacity:.6;cursor:not-allowed}
.s{background:#065f46;border:1px solid #059669;border-radius:8px;padding:16px;text-align:center;margin-top:16px;display:none}
.s h3{color:#6ee7b7;margin-bottom:4px}
.s p{color:#a7f3d0;font-size:.9rem}
.e{background:#7f1d1d;border:1px solid #dc2626;border-radius:8px;padding:12px;text-align:center;margin-top:8px;display:none;color:#fca5a5;font-size:.85rem}
.r{background:#1e293b;border-radius:8px;padding:12px 16px;margin-bottom:24px;font-size:.85rem;color:#94a3b8;line-height:1.5}
.r strong{color:#cbd5e1}
.l{text-align:center;color:#94a3b8;padding:10px;display:none}
.f{text-align:center;margin-top:32px;font-size:.8rem;color:#475569}
.f a{color:#6366f1;text-decoration:none;cursor:pointer}
.f a:hover{text-decoration:underline}
</style>
</head>
<body>
<div class="container">
<h1>Pool Party Food Signup</h1>
<p class="subtitle">Saturday, June 6th &mdash; 3pm til whenever. Doors lock at 9.</p>
<div class="r"><strong>Rules:</strong> One food item per person, two per couple.</div>
<form id="f">
<div class="g"><label for="n">Your Name</label><input type="text" id="n" placeholder="e.g. Sarah" required></div>
<div class="g"><label for="fd">What are you bringing?</label><input type="text" id="fd" placeholder="e.g. Mac and cheese" required></div>
<div class="g"><label for="c">Are you a couple?</label>
<select id="c"><option value="N">No &mdash; just me, 1 item</option><option value="Y">Yes &mdash; couple, 2 items</option></select></div>
<button type="submit" id="b">Sign Me Up!</button>
<div class="l" id="l">Submitting...</div>
</form>
<div class="s" id="s"><h3>Thanks!</h3><p>You're on the list. See you at the pool!</p></div>
<div class="e" id="e"></div>
<div class="f"><a onclick="window.location.href='?view=list'">See who's signed up</a></div>
</div>
<script>
document.getElementById('f').addEventListener('submit',async e=>{
e.preventDefault();const b=document.getElementById('b');b.disabled=true;
document.getElementById('l').style.display='block';
document.getElementById('s').style.display='none';
document.getElementById('e').style.display='none';
try{
const r=await fetch(window.location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:document.getElementById('n').value.trim(),food:document.getElementById('fd').value.trim(),couple:document.getElementById('c').value})});
const j=await r.json();
if(r.ok){document.getElementById('s').style.display='block';document.getElementById('f').reset()}
else{document.getElementById('e').textContent=j.error||'Something went wrong.';document.getElementById('e').style.display='block'}
}catch(e){document.getElementById('e').textContent="Can't reach the server.";document.getElementById('e').style.display='block'}
finally{b.disabled=false;document.getElementById('l').style.display='none'}
});
</script>
</body>
</html>`;
}

function listHTML(rows) {
  let t = '', p = '';
  rows.forEach(r => {
    const [name, food, couple] = r;
    t += `<tr><td>${esc(name)}</td><td>${esc(food)}</td><td>${esc(couple)}</td></tr>`;
    p += `${esc(name)} | ${esc(food)}${couple==='Y' ? ' (couple)' : ''}\n`;
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pool Party Signups</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:20px}
.container{max-width:700px;margin:0 auto}
h1{font-size:1.5rem;margin-bottom:16px}
table{width:100%;border-collapse:collapse;background:#1e293b;border-radius:8px;overflow:hidden}
th{background:#334155;color:#94a3b8;padding:10px 14px;text-align:left;font-size:.8rem;text-transform:uppercase}
td{padding:10px 14px;border-top:1px solid #334155}
tr:hover td{background:#1a2332}
.empty{text-align:center;padding:40px;color:#64748b}
.ac{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.btn{padding:10px 20px;background:#818cf8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.85rem}
.btn:hover{background:#6366f1}
.btn-o{background:transparent;border:1px solid #334155;color:#cbd5e1}
.btn-o:hover{background:#1e293b}
.cp{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:16px;margin-top:16px;white-space:pre-wrap;font-family:monospace;font-size:.85rem;color:#94a3b8;display:none;max-height:300px;overflow-y:auto}
.tt{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#065f46;color:#6ee7b7;padding:12px 24px;border-radius:8px;display:none}
</style>
</head>
<body>
<div class="container">
<h1>Pool Party Signups</h1>
<div class="ac">
<button class="btn" onclick="cp()">Copy to Messenger</button>
<button class="btn btn-o" onclick="document.getElementById('rb').style.display=document.getElementById('rb').style.display==='block'?'none':'block'">Show Raw Text</button>
<button class="btn btn-o" onclick="window.location.href='.'">Add Someone</button>
</div>
<table><thead><tr><th>Name</th><th>Food Item</th><th>Couple</th></tr></thead><tbody>
${t || '<tr><td colspan="3" class="empty">No one signed up yet</td></tr>'}
</tbody></table>
<div class="cp" id="rb">${esc(p.trim())}</div>
</div>
<div class="tt" id="tt">Copied!</div>
<script>
const rt=${JSON.stringify(p.trim())};
function cp(){navigator.clipboard.writeText(rt).then(()=>{document.getElementById('tt').style.display='block';setTimeout(()=>document.getElementById('tt').style.display='none',2000)})}
</script>
</body>
</html>`;
}

function esc(s) { return !s ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── Google Sheets helpers ────────────────────────────────────

async function getAccessToken() {
  const tok = JSON.parse(process.env.GOOGLE_SHEET_TOKEN);
  const expiry = new Date(tok.expiry || 0);
  // If token expires within 5 minutes, refresh it
  if (expiry.getTime() - Date.now() < 300000) {
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: tok.client_id,
        client_secret: tok.client_secret,
        refresh_token: tok.refresh_token,
        grant_type: 'refresh_token'
      })
    });
    const data = await resp.json();
    if (data.access_token) {
      tok.token = data.access_token;
      tok.expiry = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();
    }
  }
  return tok.token;
}

async function appendRow(name, food, couple) {
  const token = await getAccessToken();
  const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [[new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }), name, food, couple]]
    })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Sheet write failed: ${resp.status} ${err}`);
  }
  return resp.json();
}

async function readRows() {
  const token = await getAccessToken();
  const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  const values = data.values || [];
  // Skip header, handle both timestamped and non-timestamped rows, skip incomplete
  return values.slice(1).map(r => {
    // If row has 4 cols: [timestamp, name, food, couple]
    // If row has 3 cols: [name, food, couple]
    let name, food, couple;
    if (r.length >= 4) { name = r[1]; food = r[2]; couple = r[3]; }
    else if (r.length >= 3) { name = r[0]; food = r[1]; couple = r[2]; }
    else { return null; }
    // Skip rows without a name or food
    if (!name || !food || !String(name).trim() || !String(food).trim()) return null;
    return [String(name), String(food), String(couple || 'N')];
  }).filter(Boolean);
}

// ── Handler ──────────────────────────────────────────────────

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // POST — submit form
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      if (!body.name || !body.food) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name and food item are required' }) };
      }
      await appendRow(body.name.trim(), body.food.trim(), body.couple || 'N');
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (err) {
      console.error('POST error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not save. Try again.' }) };
    }
  }

  // GET — serve HTML
  const view = event.queryStringParameters?.view;

  if (view === 'list') {
    try {
      const rows = await readRows();
      return { statusCode: 200, headers: { ...headers, 'Content-Type': 'text/html' }, body: listHTML(rows) };
    } catch (err) {
      console.error('Read error:', err);
      return { statusCode: 200, headers: { ...headers, 'Content-Type': 'text/html' }, body: listHTML([]) };
    }
  }

  return { statusCode: 200, headers: { ...headers, 'Content-Type': 'text/html' }, body: formHTML() };
};
