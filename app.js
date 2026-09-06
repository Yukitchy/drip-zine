import { RECIPES, TECH } from './data.js';
import { fmt, pickPours, scale, stepAt, round1 } from './brew.js';

const $ = s => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }
};
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fill = (s, v) => v ? String(s || '').replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '') : (s || '');

// ---------- i18n ----------
const UI = {
  log: { en: 'Log', ja: 'ログ' },
  tagline: { en: 'Coffee-shop recipes, scaled to your beans.', ja: 'コーヒーショップのレシピを、あなたの豆の量で。' },
  sub: { en: '31 hand-drip recipes from Japanese roasters and World Brewers Cup finalists. Enter your beans; the timer tells you when and how much to pour.', ja: '日本のロースター＋World Brewers Cupファイナリストのハンドドリップ31本。豆の量を入れると、注ぐタイミングと量をタイマーが教えます。' },
  hot: { en: 'Hot', ja: 'ホット' }, iced: { en: 'Iced', ja: 'アイス' },
  search: { en: 'Search shop, barista, dripper', ja: 'ショップ・バリスタ・ドリッパーで検索' },
  anyDripper: { en: 'All drippers', ja: 'すべて' }, results: { en: 'recipes', ja: '件' },
  noResults: { en: 'Nothing matches. Clear a filter.', ja: '該当なし。フィルタを外してください。' },
  pick: { en: 'Pick', ja: 'おすすめ' }, back: { en: '‹ All recipes', ja: '‹ 一覧に戻る' },
  coffee: { en: 'Coffee', ja: 'コーヒー豆' }, water: { en: 'Water', ja: 'お湯' }, ice: { en: 'Ice', ja: '氷' },
  ratio: { en: 'Ratio', ja: '比率' }, cup: { en: 'in the cup', ja: 'できあがり' }, brewTime: { en: 'Brew time', ja: '抽出時間' },
  adjust: { en: 'Adjust the recipe', ja: 'レシピ調整' },
  start: { en: 'Start', ja: '抽出開始' }, pause: { en: 'Pause', ja: '一時停止' }, resume: { en: 'Resume', ja: '再開' }, reset: { en: 'Reset', ja: '最初から' },
  pourTo: { en: 'Pour up to', ja: 'ここまで注ぐ' }, nextAt: { en: 'Next pour', ja: '次の注ぎ' }, inSec: { en: 'in', ja: 'あと' },
  drain: { en: 'Let it drain', ja: '落ちきり' }, done: { en: 'Done. Enjoy your cup.', ja: '完成。どうぞ召し上がれ。' },
  beep: { en: 'Beep', ja: '音' }, voice: { en: 'Voice', ja: '音声' },
  awake: { en: 'Screen stays on while brewing', ja: '抽出中は画面が消えません' },
  manualHint: { en: 'This recipe has no fixed timing. Tap › as you go.', ja: 'このレシピは時間指定なし。進んだら › を押してください。' },
  before: { en: 'Before you start', ja: 'はじめる前に' }, steps: { en: 'Pour schedule', ja: '抽出ステップ' },
  temp: { en: 'Water temp', ja: 'お湯の温度' }, grind: { en: 'Grind', ja: '挽き目' }, details: { en: 'Details', ja: '詳細' },
  links: { en: 'From the shop', ja: 'ショップの情報' }, shopPage: { en: 'Recipe page', ja: '解説ページ' }, buyBeans: { en: 'Buy the beans', ja: '豆を買う' }, video: { en: 'Watch the video', ja: '解説動画' },
  vocab: { en: 'Coffee Japanese in this recipe', ja: 'このレシピのコーヒー日本語' },
  brewLog: { en: 'Brew log', ja: '抽出ログ' }, logThis: { en: 'Log this brew', ja: 'この抽出を記録' }, rating: { en: 'How was it?', ja: '味は？' },
  grindSetting: { en: 'Grind setting (your grinder)', ja: '挽き目の設定（自分のミル）' }, notes: { en: 'Notes', ja: 'メモ' }, save: { en: 'Save', ja: '保存' }, saved: { en: 'Saved.', ja: '保存しました。' },
  yourBrews: { en: 'Your brews of this recipe', ja: 'このレシピの記録' }, recent: { en: 'Recent brews', ja: '最近の抽出' },
  noLog: { en: 'No brews logged yet. Finish a timer and rate the cup.', ja: 'まだ記録がありません。タイマーを完走して味を記録してください。' },
  delete: { en: 'Delete', ja: '削除' }, allLogs: { en: 'All brews', ja: '抽出ログ' },
  credit: { en: 'Recipes belong to each shop and barista. Catalog compiled from BARISTAI (baristai.net). Built for Rolando.', ja: '各レシピの著作はショップ・バリスタに帰属します。元カタログ: BARISTAI (baristai.net)。Rolandoさんのために。' },
  motif: { en: 'Look', ja: '見た目' },
  cueDrain: { en: 'Let it drain', ja: '落ちきりを待ちます' }, cueDone: { en: 'Done. Enjoy your coffee.', ja: '完成です。' },
};
let lang = store.get('dz.lang', 'en');
const t = k => (lang === 'ja' ? UI[k].ja : UI[k].en);
function L(o, vars, inline) {
  if (!o) return '';
  const en = fill(o.en, vars), ja = fill(o.ja, vars);
  if (lang === 'ja') return esc(ja || en);
  if (lang === 'en') return esc(en || ja);
  return esc(en || ja) + (ja && ja !== en ? `<span class="ja${inline ? ' inline' : ''}">${esc(ja)}</span>` : '');
}
function setLang(l) {
  lang = l; store.set('dz.lang', l);
  document.documentElement.lang = l === 'ja' ? 'ja' : 'en';
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('on', b.dataset.lang === l));
  $('[data-ui=log]').textContent = t('log');
}

// ---------- motif (design pick session) ----------
const qs = new URLSearchParams(location.search);
if (qs.get('motif')) { store.set('dz.motif', qs.get('motif')); history.replaceState(null, '', location.pathname + location.hash); }
document.documentElement.dataset.motif = store.get('dz.motif', 'a');

// ---------- state ----------
const F = { temp: store.get('dz.temp', 'hot'), drippers: new Set(store.get('dz.drippers', [])), q: '' };
let R = null; // current recipe view
const timer = { running: false, base: 0, startAt: 0, iv: 0, fired: -1, warned: -1, done: false };
const logs = () => store.get('dz.log', []);

// ---------- home ----------
function home() {
  return `<section class="hero"><h1 class="tagline">${t('tagline')}</h1><p class="sub">${t('sub')}</p></section>
  <div class="filters">
    <div class="row1">
      <div class="seg temp"><button data-temp="hot" class="${F.temp === 'hot' ? 'on' : ''}">${t('hot')}</button><button data-temp="ice" class="${F.temp === 'ice' ? 'on' : ''}">${t('iced')}</button></div>
      <input id="q" type="search" placeholder="${t('search')}" value="${esc(F.q)}" autocomplete="off">
    </div>
    <div class="chips" id="chips"></div>
  </div>
  <div id="list"></div>
  ${recentLog()}
  ${footer()}`;
}
function paintList() {
  const drippers = [...new Set(RECIPES.filter(r => r.temp === F.temp).map(r => r.dripper).filter(Boolean))];
  $('#chips').innerHTML = `<button data-drip="" class="chip ${F.drippers.size === 0 ? 'on' : ''}">${t('anyDripper')}</button>` +
    drippers.map(d => `<button data-drip="${esc(d)}" class="chip ${F.drippers.has(d) ? 'on' : ''}">${esc(d)}</button>`).join('');
  const q = F.q.trim().toLowerCase();
  const list = RECIPES.filter(r => r.temp === F.temp && (F.drippers.size === 0 || F.drippers.has(r.dripper)) &&
    (!q || [r.title.en, r.title.ja, r.shop.en, r.shop.ja, r.author.en, r.author.ja, r.dripper || ''].join(' ').toLowerCase().includes(q)));
  $('#list').innerHTML = `<div class="count mono">${list.length} ${t('results')}</div>` +
    (list.length ? `<ol class="rows">${list.map(row).join('')}</ol>` : `<p class="empty">${t('noResults')}</p>`);
}
function row(r) {
  const sc = scale(r, r.pours, r.coffee);
  return `<li><a class="row" href="#/r/${r.slug}">
    <div class="row-top mono">${esc(r.dripper || '—')} · ${L(r.shop, null, true)}${r.recommended ? `<span class="tag">${t('pick')}</span>` : ''}</div>
    <h3 class="display">${L(r.title)}</h3>
    <div class="row-stats mono">${r.coffee} g → ${r.water} g · 1:${round1(r.water / r.coffee)} · ${r.celsius}°C${sc.total ? ` · ${fmt(sc.total)}` : ''}</div></a></li>`;
}
function recentLog() {
  const l = logs().slice(0, 3);
  if (!l.length) return '';
  return `<section class="brewlog"><h2>${t('recent')}</h2><ul class="logs">${l.map(logItem).join('')}</ul></section>`;
}
function logItem(e, showRecipe = true) {
  const r = RECIPES.find(x => x.slug === e.slug);
  const d = new Date(e.ts);
  const when = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  return `<li><span class="when">${when}${e.rating ? ` · ${'★'.repeat(e.rating)}` : ''}</span><button class="del" data-del="${e.id}">${t('delete')}</button>
    <span class="what">${showRecipe && r ? `<a href="#/r/${r.slug}"><b>${L(r.title, null, true)}</b></a> · ` : ''}${e.coffee} g → ${e.water} g${e.grind ? ` · ${esc(e.grind)}` : ''}</span>
    ${e.notes ? `<span class="memo">${esc(e.notes)}</span>` : ''}</li>`;
}
function footer() {
  const m = document.documentElement.dataset.motif;
  return `<footer><div>${t('credit')}</div>
    <div class="motifs mono">${t('motif')}: ${['a', 'b', 'c'].map(x => `<button data-motif="${x}" class="${m === x ? 'on' : ''}">${x.toUpperCase()}</button>`).join('')}</div></footer>`;
}

// ---------- recipe ----------
function recipePage(slug) {
  const r = RECIPES.find(x => x.slug === slug);
  if (!r) return `<p class="empty">Not found.</p>`;
  if (!R || R.recipe !== r) { R = { recipe: r, coffee: store.get('dz.dose.' + slug, r.coffee), sel: {}, idx: 0, rating: 0 }; resetTimer(); }
  const dr = r.dripper ? `${esc(r.dripper)} · ` : '';
  return `<a class="back mono" href="#/">${t('back')}</a>
  <header class="rhead">
    <div class="eyebrow mono">${dr}${L(r.shop, null, true)} · ${r.temp === 'ice' ? t('iced') : t('hot')}${r.recommended ? `<span class="tag">${t('pick')}</span>` : ''}</div>
    <h1 class="display">${L(r.title)}</h1>
    <p class="by">by ${L(r.author, null, true)}</p>
    <p class="desc">${L(r.desc)}</p>
  </header>
  <section class="dose">
    <div class="field"><label for="coffee">${t('coffee')}</label>
      <div class="numrow"><input id="coffee" type="number" inputmode="decimal" step="0.5" min="1" max="200" value="${R.coffee}"><span class="unit">g</span></div>
      <div class="stepper"><button data-dose="-1" aria-label="-1 g">−</button><button data-dose="1" aria-label="+1 g">+</button></div></div>
    <div class="field"><label for="water">${t('water')}</label>
      <div class="numrow"><input id="water" type="number" inputmode="numeric" step="1" min="10" max="3000" value=""><span class="unit">g</span></div>
      <div class="facts mono" id="facts"></div></div>
  </section>
  ${r.inputs ? `<section class="adjust"><h2>${t('adjust')}</h2>${r.inputs.map(inp => `<div class="grp"><div class="mono" style="color:var(--dust)">${L(inp.name, null, true)}</div>
      <div class="seg">${inp.options.map(o => `<button data-inp="${inp.id}" data-v="${o.v}" class="${(R.sel[inp.id] ?? inp.default) === o.v ? 'on' : ''}">${L(o, null, true)}</button>`).join('')}</div></div>`).join('')}</section>` : ''}
  <section class="timer">
    <div class="frame" id="frame">
      <div class="t-top mono"><span class="t-clock" id="tclock">00:00</span><span id="tstep">1 / 1</span></div>
      <div class="t-label mono" id="tlabel"></div>
      <div class="t-big" id="tbig"></div>
      <div class="t-sub mono" id="tsub"></div>
      <div class="t-note" id="tnote"></div>
      <div class="track" id="track"><div class="fill" id="fill"></div></div>
      <p class="hint" id="manualHint" hidden>${t('manualHint')}</p>
      <div class="t-ctrl">
        <button class="btn arrow" data-nav="-1" aria-label="previous">‹</button>
        <button class="btn primary" id="tstart">${t('start')}</button>
        <button class="btn" id="treset">${t('reset')}</button>
        <button class="btn arrow" data-nav="1" aria-label="next">›</button>
      </div>
      <div class="t-opts mono">
        <label><input type="checkbox" id="optBeep" ${store.get('dz.beep', true) ? 'checked' : ''}>${t('beep')}</label>
        <label><input type="checkbox" id="optVoice" ${store.get('dz.voice', false) ? 'checked' : ''}>${t('voice')}</label>
        <span class="awake" id="awake" hidden>${t('awake')}</span>
      </div>
    </div>
  </section>
  <section class="before" id="before" hidden><h2>${t('before')}</h2><ul id="beforeList"></ul></section>
  <section class="steps"><h2>${t('steps')}</h2><ol id="stepList"></ol></section>
  <section class="facts-sec"><h2>${t('details')}</h2><dl class="kv">
    <dt>${t('temp')}</dt><dd><div class="big">${r.celsius}°C</div>${r.tempNote.ja ? `<div class="muted">${L(r.tempNote)}</div>` : ''}</dd>
    <dt>${t('grind')}</dt><dd><div>${r.grind.ja ? L(r.grind) : '—'}</div>${r.grindNote.ja ? `<div class="muted">${L(r.grindNote)}</div>` : ''}</dd>
    <dt>${t('ratio')}</dt><dd><div class="big">1:${round1(r.water / r.coffee)}</div></dd>
  </dl></section>
  ${(r.links.shop || r.links.beans || r.links.video) ? `<section class="links"><h2>${t('links')}</h2><div class="btns">
    ${r.links.shop ? `<a class="btn" href="${esc(r.links.shop)}" target="_blank" rel="noopener">${t('shopPage')}</a>` : ''}
    ${r.links.beans ? `<a class="btn" href="${esc(r.links.beans)}" target="_blank" rel="noopener">${t('buyBeans')}</a>` : ''}
    ${r.links.video ? `<button class="btn" id="loadVideo">${t('video')}</button>` : ''}
  </div><div id="videoBox"></div></section>` : ''}
  ${vocab(r)}
  <section class="brewlog"><h2>${t('logThis')}</h2>
    <div class="form">
      <div><span class="mono" style="color:var(--dust);display:block;margin-bottom:6px">${t('rating')}</span><div class="stars">${[1, 2, 3, 4, 5].map(n => `<button data-rate="${n}">${n}</button>`).join('')}</div></div>
      <label><span>${t('grindSetting')}</span><input type="text" id="logGrind" value="${esc(lastGrind(slug))}" placeholder="e.g. C40 24 clicks"></label>
      <label><span>${t('notes')}</span><textarea id="logNotes" rows="2"></textarea></label>
      <div><button class="btn primary" id="saveLog">${t('save')}</button> <span class="mono saved" id="savedMsg"></span></div>
    </div>
    <div id="myLogs"></div>
  </section>
  ${footer()}`;
}
function vocab(r) {
  const ids = [...new Set([...r.pours, ...(r.variants || []).flatMap(v => v.pours)].flatMap(p => p.tech.map(x => x.id)))];
  if (!ids.length) return '';
  return `<section class="vocab"><h2>${t('vocab')}</h2><ul>${ids.map(id => { const x = TECH[id]; const v = { v: '…' }; return `<li><span class="jp">${esc(fill(x.ja, v))}</span><span class="ro">${esc(x.romaji)}</span><span class="en">${esc(fill(x.en, v))}</span></li>`; }).join('')}</ul></section>`;
}
const lastGrind = slug => (logs().find(e => e.slug === slug) || {}).grind || '';
function techChips(step) {
  return step.tech.length ? `<div class="techs">${step.tech.map(x => `<span class="chip">${L(TECH[x.id], { v: x.v }, true)}</span>`).join('')}</div>` : '';
}
function refreshCalc() {
  const r = R.recipe;
  const pours = pickPours(r, R.sel);
  const sc = scale(r, pours, R.coffee); R.sc = sc;
  $('#water').value = sc.water;
  const parts = [`1:<b>${round1(r.water / r.coffee)}</b>`, `<b>${r.celsius}°C</b>`, `≈ <b>${sc.cup} ml</b> ${t('cup')}`];
  if (sc.ice) parts.push(`${t('ice')} <b>${sc.ice} g</b>`);
  if (sc.total) parts.push(`${t('brewTime')} <b>${fmt(sc.total)}</b>`);
  $('#facts').innerHTML = parts.map(p => `<span>${p}</span>`).join('');
  // before-you-start
  const pre = [...sc.pre.map(p => L(p.note, { ice: p.ice }))];
  if (r.tempNote.ja) pre.push(`${t('temp')}: ${L(r.tempNote)}`);
  $('#before').hidden = !pre.length;
  $('#beforeList').innerHTML = pre.map(x => `<li><span class="dot"></span><span>${x}</span></li>`).join('');
  // schedule
  $('#stepList').innerHTML = sc.steps.map((s, i) => `<li data-i="${i}">
    <span class="n">${i + 1}</span><span class="tm">${s.sec === null ? '--:--' : esc(s.t)}</span>
    <span class="w">${s.w} g${s.delta > 0 ? `<small>+${s.delta}</small>` : ''}</span>
    <div class="body">${techChips(s)}${L(s.note, { ice: s.ice })}${s.video && r.links.video ? `<button class="vlink" data-vstart="${s.video.start}">▶ ${fmt(s.video.start)}</button>` : ''}</div></li>`).join('');
  // track markers
  $('#track').innerHTML = `<div class="fill" id="fill"></div>` + (sc.total ? sc.steps.map((s, i) => `<span class="mk" data-mk="${i}" style="left:${(s.sec / sc.total) * 100}%"></span>`).join('') : '');
  $('#manualHint').hidden = !sc.manual;
  $('#tstart').hidden = sc.manual;
  $('#treset').style.gridColumn = sc.manual ? '2 / 4' : '';
  if (R.idx >= sc.steps.length) R.idx = 0;
  paintTimer();
}

// ---------- timer ----------
const now = () => performance.now() / 1000;
const elapsed = () => timer.running ? timer.base + (now() - timer.startAt) : timer.base;
function resetTimer() {
  clearInterval(timer.iv); Object.assign(timer, { running: false, base: 0, startAt: 0, iv: 0, fired: -1, warned: -1, done: false });
  if (R) R.idx = 0; keepAwake(false);
}
function toggleTimer() {
  if (timer.running) { timer.base = elapsed(); timer.running = false; clearInterval(timer.iv); keepAwake(false); }
  else {
    if (timer.done) resetTimer();
    unlockAudio(); timer.startAt = now(); timer.running = true; keepAwake(true);
    timer.iv = setInterval(tick, 100);
  }
  paintTimer();
}
function tick() {
  const { steps, total } = R.sc; const el = elapsed();
  const i = stepAt(steps, el);
  if (i !== timer.fired && i >= 0) { timer.fired = i; cue(steps[i], i); }
  const nx = steps[i + 1];
  if (nx && nx.sec - el <= 3 && timer.warned !== i + 1) { timer.warned = i + 1; beep(1, 660); }
  if (total !== null && el >= total && !timer.done) { timer.done = true; timer.running = false; timer.base = total; clearInterval(timer.iv); keepAwake(false); beep(3, 880); speak(t('cueDone')); }
  paintTimer();
}
function cue(s, i) {
  const last = i === R.sc.steps.length - 1;
  if (s.delta > 0) { beep(2, 880); speak(lang === 'ja' ? `${s.w}グラムまで注いでください` : `Pour up to ${s.w} grams`); }
  else if (!last) { beep(1, 880); speak(s.note[lang === 'ja' ? 'ja' : 'en'] || ''); }
  else { beep(1, 880); speak(t('cueDrain')); }
}
function paintTimer() {
  if (!R || !R.sc) return;
  const { steps, total, manual } = R.sc; const el = elapsed();
  const i = manual ? R.idx : Math.max(0, stepAt(steps, el));
  const s = steps[i], nx = steps[i + 1];
  $('#tclock').textContent = manual ? '—:—' : fmt(el);
  $('#tstep').textContent = `${i + 1} / ${steps.length}`;
  const done = !manual && timer.done;
  const last = i === steps.length - 1;
  $('#tlabel').innerHTML = done ? '' : (s.delta > 0 ? t('pourTo') : (last ? t('drain') : '&nbsp;'));
  const big = $('#tbig');
  big.classList.toggle('done', done);
  big.innerHTML = done ? t('done') : `${s.w}<span class="g">g</span>`;
  const sub = [];
  if (!done && s.delta > 0) sub.push(`+${s.delta} g`);
  if (!done && nx && nx.sec !== null && !manual) { const left = Math.ceil(nx.sec - el); sub.push(`${t('nextAt')} ${fmt(nx.sec)} · <span class="cd">${t('inSec')} ${left}s</span>`); }
  else if (!done && nx && manual) sub.push(`${t('nextAt')}: ${nx.w} g`);
  $('#tsub').innerHTML = sub.map(x => `<span>${x}</span>`).join('');
  $('#tnote').innerHTML = done ? '' : techChips(s) + L(s.note, { ice: s.ice });
  if (total) $('#fill').style.width = `${Math.min(100, (el / total) * 100)}%`;
  document.querySelectorAll('#track .mk').forEach(m => { const k = +m.dataset.mk; m.classList.toggle('on', k <= i); m.classList.toggle('cur', k === i && !done); });
  document.querySelectorAll('#stepList li').forEach(li => li.classList.toggle('cur', +li.dataset.i === i && (timer.running || manual || el > 0) && !done));
  const b = $('#tstart'); if (b) b.textContent = timer.running ? t('pause') : (el > 0 && !done ? t('resume') : t('start'));
  $('#awake').hidden = !timer.running;
  document.querySelector('[data-nav="-1"]').disabled = i <= 0;
  document.querySelector('[data-nav="1"]').disabled = i >= steps.length - 1;
}
function nav(d) {
  const { steps, manual } = R.sc;
  if (manual) { R.idx = Math.max(0, Math.min(steps.length - 1, R.idx + d)); if (d > 0) cue(steps[R.idx], R.idx); }
  else {
    const i = Math.max(0, Math.min(steps.length - 1, Math.max(0, stepAt(steps, elapsed())) + d));
    timer.base = steps[i].sec; timer.startAt = now(); timer.fired = i; timer.warned = -1; timer.done = false;
  }
  paintTimer();
}

// audio / voice / wake lock
let actx;
function unlockAudio() {
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch { }
  if ('speechSynthesis' in window && $('#optVoice')?.checked) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); }
}
function beep(n = 1, freq = 880) {
  if (!$('#optBeep')?.checked) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    for (let k = 0; k < n; k++) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = freq; o.connect(g); g.connect(actx.destination);
      const t0 = actx.currentTime + k * 0.2;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.start(t0); o.stop(t0 + 0.18);
    }
  } catch { }
  try { navigator.vibrate?.(n === 1 ? 60 : Array(n).fill([80, 70]).flat()); } catch { }
}
function speak(txt) {
  if (!txt || !$('#optVoice')?.checked || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(txt); u.lang = lang === 'ja' ? 'ja-JP' : 'en-US'; u.rate = 1.05;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
let wl = null;
async function keepAwake(on) {
  try { if (on) { wl = await navigator.wakeLock?.request('screen'); } else { await wl?.release(); wl = null; } } catch { }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && timer.running) keepAwake(true); });

// ---------- log page ----------
function logPage() {
  const l = logs();
  return `<a class="back mono" href="#/">${t('back')}</a><section class="brewlog"><h2>${t('allLogs')}</h2>
    ${l.length ? `<ul class="logs">${l.map(e => logItem(e)).join('')}</ul>` : `<p class="empty">${t('noLog')}</p>`}</section>${footer()}`;
}
function saveLog() {
  const e = { id: Date.now(), slug: R.recipe.slug, ts: Date.now(), coffee: R.coffee, water: R.sc.water, sel: R.sel, rating: R.rating, grind: $('#logGrind').value.trim(), notes: $('#logNotes').value.trim() };
  store.set('dz.log', [e, ...logs()].slice(0, 300));
  $('#savedMsg').textContent = t('saved'); $('#logNotes').value = ''; paintMyLogs();
}
function paintMyLogs() {
  const l = logs().filter(e => e.slug === R.recipe.slug);
  $('#myLogs').innerHTML = l.length ? `<h2 style="margin-top:20px">${t('yourBrews')}</h2><ul class="logs">${l.map(e => logItem(e, false)).join('')}</ul>` : '';
}

// ---------- router ----------
function render() {
  const h = location.hash;
  const app = $('#app');
  if (h.startsWith('#/r/')) {
    app.innerHTML = recipePage(decodeURIComponent(h.slice(4)));
    if (R && R.sc !== undefined || R) { refreshCalc(); paintMyLogs(); bindRecipe(); }
    window.scrollTo(0, 0);
  } else if (h === '#/log') { app.innerHTML = logPage(); window.scrollTo(0, 0); }
  else { if (!h.startsWith('#/r/')) { R = null; resetTimer(); } app.innerHTML = home(); paintList(); $('#q').addEventListener('input', e => { F.q = e.target.value; paintList(); }); }
}
function bindRecipe() {
  $('#coffee').addEventListener('input', e => { const v = parseFloat(e.target.value); if (v > 0) { R.coffee = v; store.set('dz.dose.' + R.recipe.slug, v); refreshCalc(); } });
  $('#water').addEventListener('input', e => { const w = parseFloat(e.target.value); if (w > 0) { R.coffee = Math.round((w / (R.recipe.water / R.recipe.coffee)) * 2) / 2; $('#coffee').value = R.coffee; store.set('dz.dose.' + R.recipe.slug, R.coffee); refreshCalc(); } });
  $('#optBeep').addEventListener('change', e => store.set('dz.beep', e.target.checked));
  $('#optVoice').addEventListener('change', e => { store.set('dz.voice', e.target.checked); if (e.target.checked) unlockAudio(); });
}
$('#app').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.temp) { F.temp = d.temp; store.set('dz.temp', F.temp); paintList(); document.querySelectorAll('[data-temp]').forEach(x => x.classList.toggle('on', x.dataset.temp === F.temp)); }
  else if ('drip' in d) { if (!d.drip) F.drippers.clear(); else F.drippers.has(d.drip) ? F.drippers.delete(d.drip) : F.drippers.add(d.drip); store.set('dz.drippers', [...F.drippers]); paintList(); }
  else if (d.dose) { R.coffee = Math.max(1, round1(R.coffee + Number(d.dose))); $('#coffee').value = R.coffee; store.set('dz.dose.' + R.recipe.slug, R.coffee); refreshCalc(); }
  else if (b.id === 'tstart') toggleTimer();
  else if (b.id === 'treset') { resetTimer(); paintTimer(); }
  else if (d.nav) nav(Number(d.nav));
  else if (d.inp) { R.sel[d.inp] = Number(d.v); document.querySelectorAll(`[data-inp="${d.inp}"]`).forEach(x => x.classList.toggle('on', x.dataset.v === d.v)); refreshCalc(); }
  else if (d.rate) { R.rating = Number(d.rate); document.querySelectorAll('[data-rate]').forEach(x => x.classList.toggle('on', +x.dataset.rate <= R.rating)); }
  else if (b.id === 'saveLog') saveLog();
  else if (d.del) { store.set('dz.log', logs().filter(x => x.id !== Number(d.del))); render(); }
  else if (b.id === 'loadVideo' || d.vstart) {
    const src = R.recipe.links.video + (R.recipe.links.video.includes('?') ? '&' : '?') + 'rel=0' + (d.vstart ? `&start=${d.vstart}&autoplay=1` : '');
    $('#videoBox').innerHTML = `<div class="video"><iframe src="${esc(src)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
    $('#videoBox').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  else if (d.motif) { store.set('dz.motif', d.motif); document.documentElement.dataset.motif = d.motif; document.querySelectorAll('[data-motif]').forEach(x => x.classList.toggle('on', x.dataset.motif === d.motif)); }
});
document.querySelector('.lang').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { setLang(b.dataset.lang); render(); } });
window.addEventListener('hashchange', render);
setLang(lang);
render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
