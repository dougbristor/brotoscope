// Brim wave scope (2026-10-23): the page around the part. Since 2026-11-20 the wave itself is ./wave.js (mount → set/state/still/destroy);
// this file owns the URL, the controls, the captions (chip, ring text), the harmonics bars, the peaks table, the checks line and copy settings.
// Behaviour and pixels are those of the 10-23 page (checked 11-20: every panel, 7 states incl. the 3 plants, against the pre-split page).
import { mount, wrap, ORIGINS } from './wave.js';
import { makeRef } from './code/copy_ref/v1.js';                                         // codetree:copy_ref/v1

const $ = id => document.getElementById(id);
const P = new URLSearchParams(location.search), PLANT = P.get('plant') === '1', PLANT2 = P.get('plant') === '2', PLANT3 = P.get('plant') === '3';
const num = (k, d) => { const v = parseFloat(P.get(k)); return Number.isFinite(v) ? v : d; };
const init = { org: num('org', -45), ph: num('ph', 0), cyc: Math.max(1, Math.min(4, Math.round(num('cyc', 2)))), yz: num('yz', 40) >= 90 ? 90 : 40,
  map: P.get('map') !== '0', parts: P.get('parts') === '1', marks: P.get('marks') !== '0', ring: P.get('ring') !== '0',
  qm: Math.max(0.05, Math.min(2, num('qm', 0.9))), r: Math.max(0.01, Math.min(2, num('r', 0.6))) };
if (P.get('q')) { const q = P.get('q').split(',').map(Number); if (q.length === 2 && q.every(Number.isFinite)) init.q = q; }

const f3 = v => +(+v).toFixed(3);
const slot = (t, ch, al = 'right') => `<span class="val" style="min-width:${ch}ch;text-align:${al}">${t}</span>`;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function fit(cv) { const d = devicePixelRatio || 1, r = cv.getBoundingClientRect(), W = Math.round(r.width * d), H = Math.round(r.height * d);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } return { x: cv.getContext('2d'), W, H, d }; }

// the captions follow every draw of the wave (onDraw), as they did when draw() wrote them itself
function captions(vp) { const S = vp.S, o = vp.origin(), oname = (ORIGINS.find(([, v]) => v === S.org) || ['lon ' + S.org])[0];
  // every field that changes sits in a fixed-width slot, and none comes and goes, so the line neither slides nor rewraps (2026-10-23)
  $('chip').innerHTML = `live · B2 · origin ${slot(oname, ONAMEW, 'left')} ${slot(`${S.ph > 0 ? '+' : S.ph < 0 ? '−' : '±'} ${Math.abs(S.ph).toFixed(1)}°`, 8)} (lon ${slot(o.toFixed(1) + '°', 7)})`
    + ` · ${S.cyc} ${slot(S.cyc > 1 ? 'cycles' : 'cycle', 6, 'left')} · ring at q (${slot(S.q[0] + '°', 5)}, ${slot(S.q[1] + '°', 4)})`
    + ` · ${slot(S.ring ? `ball r ${slot(S.r.toFixed(3), 5)}, |q| ${slot(S.qm.toFixed(3), 5)}` : 'ring off', 23, 'left')} · canvas 2D, no GPU${PLANT || PLANT2 || PLANT3 ? ' · PLANT ON' : ''}`;
  ringInfo(vp); drawSpectrum(vp, o); table(vp, o); if (S.run) sync(); }

function ringInfo(vp) { const el = $('ringinfo'), S = vp.S; if (!S.ring) { el.textContent = ''; return; } const G = vp.ring(), M = G.M;
  const ms = [...M.touches.map(m => ['①', m.r]), ...M.crossingMerges.map(m => ['two rims meet', m.r]), ['③ r = |q|', S.qm]].sort((a, b) => a[1] - b[1]);
  el.innerHTML = (G.all ? `r ${f3(S.r)} ≥ |q| ${f3(S.qm)}: the ball holds 0, so every direction meets it and the whole wave is the eye (③ and past).`
    : `ring: the directions from 0 that meet the ball, within α = asin(r / |q|) = asin(${f3(S.r)} / ${f3(S.qm)}) = ${G.al.toFixed(2)}° of q. The wave inside it (bright) is the eye seen from 0: ${G.arcs} arc${G.arcs === 1 ? '' : 's'}, one per rim loop. The ring cuts it at ${G.cuts.length} points, where each rim turns back.`)
    + `<br>moments along r: ${ms.map(([n, r]) => `${n} ${r.toFixed(5)}${r < S.r ? ' ✓' : ''}`).join(' · ')}`;
  // the text changes length with r, and the controls sit below it: its height only ratchets up (reset on resize), so nothing below jitters (2026-10-23)
  el.style.minHeight = Math.max(parseFloat(el.style.minHeight) || 0, el.offsetHeight) + 'px'; }

function drawSpectrum(vp, o) { const { x, W, H, d } = fit($('sp')), hs = vp.harmonics(o), L = 10 * d, B = 30 * d, bw = (W - 2 * L) / hs.length, top = 12 * d, Amax = Math.max(...hs.map(h => h.A));
  x.clearRect(0, 0, W, H); x.font = `${10.5 * d}px ui-monospace, monospace`; x.textAlign = 'center';
  for (const hn of hs) { const cx = L + bw * (hn.n - 0.5), bh = (H - top - B) * hn.A / Amax, odd = hn.n % 2 === 1;
    x.fillStyle = hn.n === 1 ? css('--h1') : hn.n === 3 ? css('--h3') : css('--trace'); x.globalAlpha = hn.A < 1e-6 ? 0.2 : 0.85; x.fillRect(cx - bw * 0.3, H - B - bh, bw * 0.6, Math.max(bh, 1 * d)); x.globalAlpha = 1;
    x.fillStyle = css('--ink'); x.textBaseline = 'bottom'; x.fillText(hn.A < 1e-6 ? '0' : hn.A.toFixed(2), cx, H - B - bh - 2 * d);
    x.fillStyle = css('--dim'); x.textBaseline = 'top'; x.fillText(`h${hn.n}`, cx, H - B + 3 * d); if (odd && hn.A > 1e-6) x.fillText(`${hn.ph.toFixed(0)}°`, cx, H - B + 15 * d); } }

function table(vp, o) { const rows = vp.extrema.map(e => ({ ...e, s: wrap(e.lo - o) })).sort((a, b) => a.s - b.s);
  $('pk').innerHTML = '<tr><th></th><th>sweep</th><th>lon</th><th>lat</th></tr>' + rows.map(e => `<tr><td style="color:var(${e.hi ? '--keep' : '--mirror'})">${e.hi ? 'peak' : 'dip'}${Math.abs(e.lat) < 1e-6 ? ' (kiss)' : ''}</td><td>${e.s >= 0 ? '+' : ''}${e.s.toFixed(2)}°</td><td>${e.lo.toFixed(2)}°</td><td>${e.lat.toFixed(3)}°</td></tr>`).join(''); }

// checks: the part's rows; ?plant=1 must fail C1 and C2, ?plant=2 must fail C5 and C6, ?plant=3 must fail only C7
function checks() { const r = vp.checks();
  $('checks').innerHTML = (PLANT || PLANT2 || PLANT3 ? 'PLANT ON · ' : '') + r.map(([n, ok, v]) => `<span class="${ok ? 'ok' : 'bad'}">${ok ? 'PASS' : 'FAIL'}</span> ${n} (${typeof v === 'number' && v < 1 ? v.toExponential(1) : v})`).join(' · ');
  window.__scope = { r, EXT: vp.extrema, latAt: vp.latAt, harmonics: vp.harmonics, S: vp.S, ring: vp.ring, settingsRef, checks, vp }; }

const ONAMEW = Math.max(...ORIGINS.map(([n]) => n.length), ('lon ' + init.org).length) + 0.5;
const plant = PLANT ? 1 : PLANT2 ? 2 : PLANT3 ? 3 : 0;
const sel = $('org'); for (const [n, v] of ORIGINS) sel.add(new Option(n, v)); if (!ORIGINS.some(([, v]) => v === init.org)) sel.add(new Option('lon ' + init.org, init.org)); sel.value = init.org;
const vp = mount($('cv'), init, { plant, onDraw: captions });
const S = vp.S;

const sync = () => { $('ph').value = S.ph; $('phv').textContent = `${S.ph > 0 ? '+' : ''}${S.ph}°`; $('cyc').value = S.cyc; $('cycv').textContent = S.cyc; $('yz').value = S.yz; $('spdv').textContent = `${S.spd}°/s`;
  for (const k of ['map', 'parts', 'marks', 'ring', 'run']) $(k).setAttribute('aria-pressed', String(S[k]));
  const u = new URLSearchParams(); if (S.org !== -45) u.set('org', S.org); if (S.ph) u.set('ph', S.ph); if (S.cyc !== 2) u.set('cyc', S.cyc); if (S.yz !== 40) u.set('yz', S.yz);
  if (!S.map) u.set('map', 0); if (S.parts) u.set('parts', 1); if (!S.marks) u.set('marks', 0); if (!S.ring) u.set('ring', 0); if (S.q[0] || S.q[1]) u.set('q', S.q.join(',')); if (S.qm !== 0.9) u.set('qm', S.qm); if (S.r !== 0.6) u.set('r', S.r); if (PLANT) u.set('plant', 1); if (PLANT2) u.set('plant', 2); if (PLANT3) u.set('plant', 3);
  $('rr').value = S.r; $('rv').textContent = f3(S.r); $('qmin').value = S.qm;
  history.replaceState(null, '', (u.toString() ? '?' + u.toString().replace(/%2C/g, ',') : location.pathname)); };
const upd = over => { vp.set(over, { redraw: false }); sync(); vp.draw(); };
sel.onchange = () => upd({ org: +sel.value, ph: 0 });
$('ph').oninput = e => upd({ ph: +e.target.value });
$('cyc').oninput = e => upd({ cyc: +e.target.value });
$('yz').onchange = e => upd({ yz: +e.target.value });
$('spd').oninput = e => { vp.set({ spd: +e.target.value }, { redraw: false }); sync(); };
$('qin').value = S.q.join(','); $('qin').onchange = e => { const q = e.target.value.split(',').map(Number); if (q.length === 2 && q.every(Number.isFinite)) upd({ q: [wrap(q[0]), Math.max(-90, Math.min(90, q[1]))] }); };
for (const k of ['map', 'parts', 'marks', 'ring']) $(k).onclick = () => { upd({ [k]: !S[k] }); if (k === 'ring') checks(); };
$('rr').oninput = e => { upd({ r: +e.target.value }); checks(); };
$('qmin').onchange = e => { const v = +e.target.value; if (v > 0) { upd({ qm: Math.min(2, v) }); checks(); } };
$('qin').addEventListener('change', () => checks());
$('run').onclick = () => { vp.set({ run: !S.run }, { redraw: false }); sync(); };

// copy settings (2026-10-22: every viewer needs a means to reference its settings): one copy_ref line, every setting (* = changed), then the link
function settingsRef() { const D = { origin: 'i − j (fold)', phase: '0°', cycles: '2', height: '±40°', map: 'on', harmonics: 'off', names: 'on', ring: 'on', q: '(0°, 0°)', '|q|': '0.9', r: '0.6' };
  const oname = (ORIGINS.find(([, v]) => v === S.org) || ['lon ' + S.org + '°'])[0], V = { origin: oname, phase: `${S.ph}°`, cycles: String(S.cyc), height: `±${S.yz}°`,
    map: S.map ? 'on' : 'off', harmonics: S.parts ? 'on' : 'off', names: S.marks ? 'on' : 'off', ring: S.ring ? 'on' : 'off', q: `(${S.q[0]}°, ${S.q[1]}°)`, '|q|': String(f3(S.qm)), r: String(f3(S.r)) };
  const it = k => `${k} ${V[k]}${V[k] !== D[k] ? '*' : ''}`;
  const text = [`view ${['origin', 'phase', 'cycles', 'height'].map(it).join(' ')}`, `layers ${['map', 'harmonics', 'names', 'ring'].map(it).join(' ')}`, `ball ${['q', '|q|', 'r'].map(it).join(' ')}`,
    'B2', 'canvas 2D, no GPU', '* = changed from the default'].join(' · ');
  return makeRef({ title: 'the wave', settings: text }); }
$('copy').addEventListener('click', async () => { const t = settingsRef(), box = $('copied'); let ok = true; try { await navigator.clipboard.writeText(t); } catch (e) { ok = false; }
  box.innerHTML = (ok ? 'copied — paste it into your note' : 'select and copy this:') + '<pre></pre>'; box.querySelector('pre').textContent = t; box.hidden = false;
  clearTimeout(box.t); box.t = setTimeout(() => box.hidden = true, ok ? 8000 : 20000); });
// the ring text's height ratchet resets when the window width changes; the part redraws itself on resize
let LASTW = 0; new ResizeObserver(() => { if (innerWidth !== LASTW) { LASTW = innerWidth; $('ringinfo').style.minHeight = ''; } vp.draw(); }).observe(document.body);
sync(); vp.draw(); checks();
