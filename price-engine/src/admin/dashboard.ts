export const ADMIN_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>STACK Price Engine — Admin</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, system-ui, sans-serif; background: #0a0a14; color: #d4d4e0; padding: 20px; max-width: 1400px; margin: 0 auto; }
  h1 { font-size: 22px; margin-bottom: 4px; color: #7C6FF7; letter-spacing: -0.5px; }
  .subtitle { color: #666; font-size: 13px; margin-bottom: 20px; }

  /* ─── Top bar ─── */
  .topbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .country-toggle { display: flex; gap: 0; border: 1px solid #2a2a40; border-radius: 8px; overflow: hidden; }
  .country-toggle button { padding: 6px 18px; border: none; background: #141422; color: #888; font-size: 13px; cursor: pointer; font-weight: 600; transition: all 0.15s; }
  .country-toggle button.active { background: #7C6FF7; color: #fff; }
  .search-box { flex: 1; min-width: 200px; padding: 8px 14px; background: #141422; border: 1px solid #2a2a40; border-radius: 8px; color: #d4d4e0; font-size: 13px; outline: none; }
  .search-box:focus { border-color: #7C6FF7; }
  .refresh-btn { padding: 8px 18px; background: #7C6FF7; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: opacity 0.15s; }
  .refresh-btn:hover { opacity: 0.85; }

  /* ─── Stats row ─── */
  .stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
  .stat-card { background: #11111e; border: 1px solid #1e1e30; border-radius: 10px; padding: 14px 16px; }
  .stat-card .label { font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; margin-bottom: 4px; }
  .stat-card .value { font-size: 24px; font-weight: 700; color: #e0e0e8; }
  .stat-card .value.green { color: #4ade80; }
  .stat-card .value.amber { color: #fbbf24; }
  .stat-card .value.purple { color: #7C6FF7; }

  /* ─── Category chips ─── */
  .cat-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
  .cat-chip { padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #2a2a40; background: #141422; color: #888; transition: all 0.15s; user-select: none; }
  .cat-chip:hover { border-color: #7C6FF7; color: #ccc; }
  .cat-chip.active { background: #7C6FF7; color: #fff; border-color: #7C6FF7; }
  .cat-chip .count { opacity: 0.6; margin-left: 4px; }

  /* ─── Tables ─── */
  .section-title { font-size: 14px; font-weight: 700; color: #aaa; margin: 28px 0 10px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px; }
  .section-title .pill { padding: 2px 10px; border-radius: 12px; background: #1a1a2e; font-size: 11px; color: #888; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { text-align: left; padding: 8px 12px; background: #0f0f1a; font-size: 11px; text-transform: uppercase; color: #555; letter-spacing: 0.3px; position: sticky; top: 0; }
  td { padding: 9px 12px; border-bottom: 1px solid #141422; font-size: 13px; }
  tr:hover { background: #0f0f1a; }
  .cat-header-row td { background: #11111e; font-weight: 700; font-size: 12px; text-transform: uppercase; color: #7C6FF7; letter-spacing: 0.3px; padding: 8px 12px; border-bottom: 2px solid #1e1e30; cursor: pointer; }
  .cat-header-row td .cat-count { color: #555; font-weight: 400; margin-left: 8px; }
  .cat-header-row:hover { background: #141422; }

  /* ─── Badges ─── */
  .badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
  .badge.verified { background: #0d3320; color: #4ade80; }
  .badge.manual_required { background: #3a2810; color: #fbbf24; }
  .badge.review_required, .badge.pending_verification, .badge.detected { background: #3a1020; color: #f87171; }
  .badge.auto_approved, .badge.approved { background: #0d2838; color: #60a5fa; }
  .badge.rejected { background: #1a1010; color: #666; }

  /* ─── Price formatting ─── */
  .price { font-weight: 700; color: #e0e0e8; }
  .price.zero { color: #555; }
  .currency { font-size: 11px; color: #777; margin-left: 2px; }

  /* ─── Misc ─── */
  .btn { padding: 4px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; margin: 0 2px; transition: opacity 0.15s; }
  .btn:hover { opacity: 0.85; }
  .btn-approve { background: #2563eb; color: white; }
  .btn-reject { background: #dc2626; color: white; }
  .actions { display: flex; gap: 4px; }
  .source-link { color: #7C6FF7; text-decoration: none; font-size: 12px; }
  .source-link:hover { text-decoration: underline; }
  #loading, #candidates-loading { color: #555; font-style: italic; padding: 20px 0; }
  .hidden { display: none !important; }

  /* ─── Category colors (left border) ─── */
  .cat-ai { border-left: 3px solid #7C6FF7; }
  .cat-streaming { border-left: 3px solid #ef4444; }
  .cat-music { border-left: 3px solid #22c55e; }
  .cat-cloud { border-left: 3px solid #3b82f6; }
  .cat-productivity { border-left: 3px solid #f59e0b; }
  .cat-devtools { border-left: 3px solid #06b6d4; }
  .cat-gaming { border-left: 3px solid #a855f7; }
  .cat-security { border-left: 3px solid #10b981; }
  .cat-education { border-left: 3px solid #ec4899; }
  .cat-fitness { border-left: 3px solid #f97316; }
  .cat-news { border-left: 3px solid #64748b; }
  .cat-social { border-left: 3px solid #e879f9; }
  .cat-telco { border-left: 3px solid #fbbf24; }
  .cat-finance { border-left: 3px solid #84cc16; }
  .cat-design { border-left: 3px solid #fb7185; }
  .cat-ecommerce { border-left: 3px solid #38bdf8; }
  .cat-shopping { border-left: 3px solid #facc15; }
  .cat-marketing { border-left: 3px solid #c084fc; }
  .cat-other { border-left: 3px solid #555; }
</style>
</head>
<body>
<h1>STACK Price Engine</h1>
<p class="subtitle">Admin Dashboard — Catalog & Price Management</p>

<div class="topbar">
  <div class="country-toggle" id="country-toggle"></div>
  <input class="search-box" type="text" id="search" placeholder="Buscar servicio o plan..." oninput="renderPrices()">
  <button class="refresh-btn" onclick="loadAll()">↻ Refresh</button>
</div>

<div class="stats-row" id="stats-row"></div>
<div class="cat-chips" id="cat-chips"></div>

<div class="section-title">Services & Prices <span class="pill" id="prices-count">0</span></div>
<div id="coverage-bar" style="margin-bottom:12px;font-size:13px;color:#888"></div>
<div id="loading">Loading...</div>
<div id="prices-container"></div>

<div class="section-title">Change Candidates <span class="pill" id="candidates-count">0</span></div>
<div id="candidates-loading">Loading...</div>
<table id="candidates-table" class="hidden">
  <thead><tr>
    <th>ID</th><th>Service</th><th>Plan</th><th>Old</th><th>New</th>
    <th>Change</th><th>Confidence</th><th>Status</th><th>Detected</th><th>Actions</th>
  </tr></thead>
  <tbody id="candidates-body"></tbody>
</table>

<script>
let currentCountry = 'AR';
let allPrices = [];
let allServices = [];
let allMarkets = [];
let activeCat = 'all';
let collapsedCats = new Set();

const CURRENCY_MINOR_UNIT = {
  ARS: 0, CLP: 0, COP: 0, USD: 2, EUR: 2, BRL: 2, MXN: 2, GBP: 2, PEN: 2, UYU: 0,
};

const CAT_LABELS = {
  ai: 'AI', streaming: 'Streaming', music: 'Music', cloud: 'Cloud',
  productivity: 'Productivity', devtools: 'Dev Tools', gaming: 'Gaming',
  security: 'Security', education: 'Education', fitness: 'Fitness',
  news: 'News & Reading', social: 'Social', telco: 'Telco / AR',
  finance: 'Finance', design: 'Design', ecommerce: 'E-commerce',
  shopping: 'Shopping', marketing: 'Marketing', other: 'Other',
};

const CAT_COLORS = {
  ai: '#7C6FF7', streaming: '#ef4444', music: '#22c55e', cloud: '#3b82f6',
  productivity: '#f59e0b', devtools: '#06b6d4', gaming: '#a855f7',
  security: '#10b981', education: '#ec4899', fitness: '#f97316',
  news: '#64748b', social: '#e879f9', telco: '#fbbf24',
  finance: '#84cc16', design: '#fb7185', ecommerce: '#38bdf8',
  shopping: '#facc15', marketing: '#c084fc', other: '#555',
};

function fmtPrice(amount, currency) {
  if (amount === 0) return '<span class="price zero">—</span>';
  const minorUnit = CURRENCY_MINOR_UNIT[currency] ?? 2;
  const formatted = (amount / Math.pow(10, minorUnit)).toLocaleString('es-AR', { minimumFractionDigits: minorUnit, maximumFractionDigits: minorUnit });
  return '<span class="price">' + formatted + '</span><span class="currency">' + currency + '</span>';
}

async function loadMarkets() {
  try {
    const res = await fetch('/v1/markets?enabled=true');
    const data = await res.json();
    allMarkets = data.markets || [];
    renderCountryToggle();
  } catch(err) {
    console.error('Failed to load markets:', err);
  }
}

function renderCountryToggle() {
  const container = document.getElementById('country-toggle');
  container.innerHTML = allMarkets.map(m => {
    const isActive = m.countryCode === currentCountry;
    return '<button id="btn-' + m.countryCode + '" class="' + (isActive ? 'active' : '') + '" onclick="switchCountry(\\'' + m.countryCode + '\\')">' + m.name + '</button>';
  }).join('');
}

function switchCountry(c) {
  currentCountry = c;
  renderCountryToggle();
  activeCat = 'all';
  loadPrices();
  loadCoverage();
}

async function loadCoverage() {
  try {
    const res = await fetch('/v1/markets/' + currentCountry + '/coverage');
    const cov = await res.json();
    const coverageEl = document.getElementById('coverage-bar');
    if (coverageEl) {
      const pct = cov.coveragePercentage;
      const color = pct >= 70 ? '#4ade80' : pct >= 40 ? '#fbbf24' : '#f87171';
      coverageEl.innerHTML = '<span style="color:' + color + ';font-weight:700">' + pct + '%</span> coverage — ' + cov.pricesVerified + ' verified / ' + cov.pricesManualRequired + ' manual required / ' + cov.pricesStale + ' stale';
    }
  } catch(err) {
    console.error('Coverage error:', err);
  }
}

async function loadPrices() {
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('prices-container').innerHTML = '';

  try {
    const res = await fetch('/admin/services?country=' + currentCountry);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    allPrices = data.prices || [];
    allServices = data.services || [];

    document.getElementById('loading').classList.add('hidden');
    renderStats();
    renderCatChips();
    renderPrices();
  } catch(err) {
    document.getElementById('loading').textContent = 'Error: ' + err.message;
    document.getElementById('loading').style.color = '#f87171';
  }
}

function renderStats() {
  const verified = allPrices.filter(p => p.status === 'verified').length;
  const manual = allPrices.filter(p => p.status === 'manual_required').length;
  const svcCount = new Set(allPrices.map(p => p.pe_services?.slug)).size;
  const cats = new Set(allPrices.map(p => p.pe_services?.category).filter(Boolean)).size;

  document.getElementById('stats-row').innerHTML = \`
    <div class="stat-card"><div class="label">Services</div><div class="value purple">\${svcCount}</div></div>
    <div class="stat-card"><div class="label">Plans</div><div class="value">\${allPrices.length}</div></div>
    <div class="stat-card"><div class="label">Categories</div><div class="value">\${cats}</div></div>
    <div class="stat-card"><div class="label">Verified</div><div class="value green">\${verified}</div></div>
    <div class="stat-card"><div class="label">Manual Required</div><div class="value amber">\${manual}</div></div>
  \`;
}

function renderCatChips() {
  const catMap = {};
  for (const p of allPrices) {
    const cat = p.pe_services?.category || 'other';
    catMap[cat] = (catMap[cat] || 0) + 1;
  }
  const cats = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a]);

  const html = cats.map(cat => {
    const label = CAT_LABELS[cat] || cat;
    const color = CAT_COLORS[cat] || '#555';
    const isActive = activeCat === cat;
    return '<span class="cat-chip ' + (isActive ? 'active' : '') + '" style="' + (isActive ? 'background:' + color + ';border-color:' + color : 'border-color:#2a2a40') + '" onclick="toggleCat(\\'' + cat + '\\')">' + label + '<span class="count">' + catMap[cat] + '</span></span>';
  }).join('');

  const allActive = activeCat === 'all';
  document.getElementById('cat-chips').innerHTML =
    '<span class="cat-chip ' + (allActive ? 'active' : '') + '" onclick="toggleCat(\\'all\\')">All<span class="count">' + allPrices.length + '</span></span>' +
    html;
}

function toggleCat(cat) {
  activeCat = cat;
  collapsedCats.clear();
  renderCatChips();
  renderPrices();
}

function renderPrices() {
  const search = document.getElementById('search').value.toLowerCase();
  let filtered = allPrices;

  if (activeCat !== 'all') {
    filtered = filtered.filter(p => (p.pe_services?.category || 'other') === activeCat);
  }
  if (search) {
    filtered = filtered.filter(p => {
      const svc = (p.pe_services?.name || '').toLowerCase();
      const plan = (p.pe_plans?.name || '').toLowerCase();
      return svc.includes(search) || plan.includes(search);
    });
  }

  filtered.sort((a, b) => {
    const catA = a.pe_services?.category || 'zzz';
    const catB = b.pe_services?.category || 'zzz';
    if (catA !== catB) return catA.localeCompare(catB);
    return (a.pe_services?.name || '').localeCompare(b.pe_services?.name || '');
  });

  document.getElementById('prices-count').textContent = filtered.length;

  if (filtered.length === 0) {
    document.getElementById('prices-container').innerHTML = '<div style="color:#555;padding:20px 0">No results</div>';
    return;
  }

  // Group by category
  const grouped = {};
  for (const p of filtered) {
    const cat = p.pe_services?.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  let html = '';
  for (const cat of Object.keys(grouped).sort()) {
    const catLabel = CAT_LABELS[cat] || cat;
    const catClass = 'cat-' + cat;
    const isCollapsed = collapsedCats.has(cat);
    const items = grouped[cat];

    html += '<table style="margin-bottom:16px">';
    html += '<thead><tr class="cat-header-row ' + catClass + '" onclick="toggleCollapse(\\'' + cat + '\\')"><th colspan="7">' + catLabel + '<span class="cat-count">' + items.length + ' plans</span>' + (isCollapsed ? ' ▸' : ' ▾') + '</th></tr></thead>';

    if (!isCollapsed) {
      html += '<tbody><tr><th>Service</th><th>Plan</th><th>Price</th><th>Tax Mode</th><th>Status</th><th>Last Verified</th><th>Source</th></tr>';
      for (const p of items) {
        const svcName = p.pe_services?.name || '—';
        const planName = p.pe_plans?.name || '—';
        html += '<tr class="' + catClass + '"><td>' + svcName + '</td><td>' + planName + '</td><td>' + fmtPrice(p.amount, p.currency) + '</td><td style="color:#888;font-size:12px">' + (p.tax_mode || '—') + '</td><td><span class="badge ' + p.status + '">' + p.status + '</span></td><td style="color:#666;font-size:12px">' + (p.last_verified_at ? new Date(p.last_verified_at).toLocaleDateString() : '—') + '</td><td>' + (p.source_url ? '<a class="source-link" href="' + p.source_url + '" target="_blank">link</a>' : '—') + '</td></tr>';
      }
      html += '</tbody>';
    }
    html += '</table>';
  }

  document.getElementById('prices-container').innerHTML = html;
}

function toggleCollapse(cat) {
  if (collapsedCats.has(cat)) collapsedCats.delete(cat);
  else collapsedCats.add(cat);
  renderPrices();
}

async function loadCandidates() {
  const res = await fetch('/admin/candidates');
  const data = await res.json();
  const tbody = document.getElementById('candidates-body');
  tbody.innerHTML = '';
  const candidates = data.candidates || [];
  document.getElementById('candidates-count').textContent = candidates.length;

  for (const c of candidates) {
    const pct = c.old_amount > 0 ? ((c.new_amount - c.old_amount) / c.old_amount * 100).toFixed(1) + '%' : '—';
    const oldMinor = CURRENCY_MINOR_UNIT[c.old_currency] ?? 2;
    const newMinor = CURRENCY_MINOR_UNIT[c.new_currency] ?? 2;
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + c.id + '</td><td>—</td><td>—</td><td>' + (c.old_amount / Math.pow(10, oldMinor)).toFixed(oldMinor) + ' ' + c.old_currency + '</td><td>' + (c.new_amount / Math.pow(10, newMinor)).toFixed(newMinor) + ' ' + c.new_currency + '</td><td>' + pct + '</td><td>' + c.confidence_score + '</td><td><span class="badge ' + c.status + '">' + c.status + '</span></td><td>' + new Date(c.detected_at).toLocaleString() + '</td><td class="actions"><button class="btn btn-approve" onclick="approve(' + c.id + ')">Approve</button><button class="btn btn-reject" onclick="reject(' + c.id + ')">Reject</button></td>';
    tbody.appendChild(tr);
  }
  document.getElementById('candidates-loading').classList.add('hidden');
  document.getElementById('candidates-table').classList.remove('hidden');
}

async function approve(id) {
  await fetch('/admin/candidates/' + id + '/approve', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({reviewer:'admin-ui'}) });
  loadAll();
}

async function reject(id) {
  await fetch('/admin/candidates/' + id + '/reject', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({reviewer:'admin-ui'}) });
  loadAll();
}

function loadAll() {
  loadMarkets();
  loadPrices();
  loadCoverage();
  loadCandidates();
}

loadAll();
</script>
</body>
</html>`;
