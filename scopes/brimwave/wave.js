// SPDX-License-Identifier: MIT  (c) 2026 Doug Bristor, bristorbrot.org — attribution requested, not required
// The brim wave, as a part (2026-11-20; the scope since 10-23). the brotoid page's Fig 3 map border (det J = 0, one latitude per longitude)
// drawn as a wave over the sweep, with a movable phase origin (default the fold, i − j) so it can be read like a carrier. det J and dirOf are
// brotoid_weft's; nothing re-derived here. Canvas 2D, CPU only, no GPU.
//
//   import { mount } from './wave.js';
//   const vp = mount(canvas, { org: -45, cyc: 2, q: [0, 0], qm: 0.9, r: 0.6, ... }, { onDraw: vp => …, plant: 0 });
//   vp.set({ ph: 30 })   vp.state()   vp.still()   vp.checks()   vp.destroy()
// Every setting is a key of DEFAULTS. The host owns its controls and captions; it reads back through state() / onDraw.
// Colours come from CSS custom properties on the canvas (inherited); a host without them gets PALETTE.
import { detJ as detJ0, dirOf, CONE } from './code/brotoid_weft/v1.js';      // codetree:brotoid_weft/v1
import { moments } from './code/brotoid_moments/v1.js';                       // codetree:brotoid_moments/v1

export const D2R = Math.PI / 180;
export const wrap = a => ((a % 360) + 540) % 360 - 180;
export const DEFAULTS = Object.freeze({ org: -45, ph: 0, cyc: 2, yz: 40, map: true, parts: false, marks: true, ring: true, run: false, spd: 20, q: [0, 0], qm: 0.9, r: 0.6 });
export const ORIGINS = [['i − j (fold)', -45], ['−(i − j) (fold)', 135], ['i + j (seam)', 45], ['−(i + j) (seam)', -135], ['i', 0], ['j', 90]];
export const NAMED = [['i−j', -45, 'fold'], ['−(i−j)', 135, 'fold'], ['i+j', 45, 'seam'], ['−(i+j)', -135, 'seam'], ['i', 0], ['j', 90], ['−i', 180], ['−j', -90]];
// the dark palette of the scope page, used for any variable the host does not define
export const PALETTE = { '--bg': '#0d0f14', '--ink': '#e9e5dc', '--dim': '#8b8f9c', '--grid': 'rgba(233,229,220,.09)', '--grid2': 'rgba(233,229,220,.22)',
  '--trace': '#ff4fa3', '--eye': '#ffe14d', '--keep': '#19e0ff', '--mirror': '#ff5a1f', '--ring': '#ffffff', '--h1': '#9dff3f', '--h3': '#b48cff', '--hk': '12,70,84', '--hm': '92,34,14' };
const NS = 1440;
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm3 = a => { const n = Math.hypot(...a); return a.map(v => v / n); };

// ---- the wave itself, once per det J (plants: 1 adds 0.05·y³, which breaks the fold mirror and moves the border, so C1 and C2 must fail;
// 3 multiplies by (1 + 0.3·t), an even part that keeps every sign and the border, so only C7 may fire; 2 is a ring plant, see alphaOf)
const CORES = new Map();
function core(plant) { if (CORES.has(plant)) return CORES.get(plant);
  const detJ = plant === 1 ? x => detJ0(x) + 0.05 * x[1] ** 3 : plant === 3 ? x => detJ0(x) * (1 + 0.3 * x[0]) : detJ0;
  // the border at longitude lo: det J(dirOf(lo, la)) = 0, by bisection on la (det J is +8 at la = 90°, −8 at la = −90°; one root per meridian)
  const latAt = lo => { let a = -90, b = 90, fa = detJ(dirOf(lo, a));
    for (let i = 0; i < 56; i++) { const m = (a + b) / 2, fm = detJ(dirOf(lo, m)); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } return (a + b) / 2; };
  const LAT = Float64Array.from({ length: NS }, (_, k) => latAt(-180 + 360 * k / NS));
  const latS = lo => { const u = (wrap(lo) + 180) / 360 * NS, k = Math.floor(u), f = u - k; return LAT[k % NS] * (1 - f) + LAT[(k + 1) % NS] * f; };
  // extrema: sign changes of the sampled slope, refined by golden section on the exact border
  const EXT = []; for (let k = 0; k < NS; k++) { const a = LAT[(k - 1 + NS) % NS], b = LAT[k], c = LAT[(k + 1) % NS], hi = b > a && b >= c, lo = b < a && b <= c; if (!hi && !lo) continue;
    let l = -180 + 360 * (k - 1) / NS, r = -180 + 360 * (k + 1) / NS; const s = hi ? -1 : 1;
    for (let i = 0; i < 80; i++) { const m1 = l + (r - l) * 0.382, m2 = l + (r - l) * 0.618; if (s * latAt(m1) < s * latAt(m2)) r = m2; else l = m1; }
    const at = (l + r) / 2; EXT.push({ hi, lo: wrap(at), lat: latAt(at) }); }
  // harmonics about an origin o: lat(o + ψ) = Σ A_n cos(nψ − φ_n)
  const harmonics = (o, N = 9) => { const M = 2880, out = [];
    for (let n = 1; n <= N; n++) { let a = 0, b = 0; for (let k = 0; k < M; k++) { const p = 2 * Math.PI * k / M, v = latS(o + p / D2R); a += v * Math.cos(n * p); b += v * Math.sin(n * p); }
      a *= 2 / M; b *= 2 / M; out.push({ n, A: Math.hypot(a, b), ph: Math.atan2(b, a) / D2R }); }
    return out; };
  const C = { detJ, latAt, LAT, latS, EXT, harmonics }; CORES.set(plant, C); return C; }

export function mount(canvas, settings = {}, { plant = 0, onDraw = null, observe = true } = {}) {
  const C = core(plant), { detJ, latAt, LAT, latS, EXT, harmonics } = C;
  const S = { ...DEFAULTS, q: DEFAULTS.q.slice() };
  const css = n => { const v = getComputedStyle(canvas).getPropertyValue(n).trim(); return v || PALETTE[n] || ''; };
  const origin = () => wrap(S.org + S.ph);

  // The ball's ring. The ball |x − q| < r, seen from 0, covers the directions within α = asin(r / |q|) of q (all of them once r ≥ |q|: then 0 is
  // inside, ③). Every brim line is a line through 0, so a brim line meets the ball exactly when its direction, a point of the wave, lies inside
  // that ring: the stretch of the wave inside the ring is the eye seen from 0. Each direction inside carries two rim points (where the line enters
  // and leaves the ball); at the ring they meet, so the ring cuts the wave where the rim turns back, and each arc inside is one rim loop.
  // (plant 2: α by acos, which C5 and C6 must catch)
  const alphaOf = r => r >= S.qm ? 90 : (plant === 2 ? Math.acos(r / S.qm) : Math.asin(r / S.qm)) / D2R;
  let RG = null, RGKEY = '';
  function ring() { const key = `${S.q}|${S.qm}|${S.r}`; if (key === RGKEY) return RG; RGKEY = key;
    const qh = dirOf(S.q[0], S.q[1]), all = S.r >= S.qm, al = alphaOf(S.r);
    const ang = Array.from(LAT, (la, k) => Math.acos(Math.max(-1, Math.min(1, dot3(dirOf(-180 + 360 * k / NS, la), qh)))) / D2R);
    const inside = ang.map(a => all || a <= al), cuts = [], arcsAt = a => inside.length && ang.some(v => v > a) ? ang.filter((v, k) => v <= a && ang[(k + NS - 1) % NS] > a).length : 1;
    for (let k = 0; k < NS; k++) { const a = ang[k] - al, b = ang[(k + 1) % NS] - al; if (!all && a * b < 0) cuts.push(wrap(-180 + 360 * (k + a / (a - b)) / NS)); }
    const arcs = all ? 1 : arcsAt(al);
    // the ring itself: a small circle of angular radius α about q, as (lon, lat), lon unwrapped so a circle round a pole runs on
    let circ = null; if (!all) { const t = Math.abs(qh[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = norm3(cross3(qh, t)), e2 = cross3(qh, e1), ca = Math.cos(al * D2R), sa = Math.sin(al * D2R);
      circ = []; let prev = null; for (let i = 0; i <= 360; i++) { const b = i * D2R, u = [0, 1, 2].map(j => ca * qh[j] + sa * (Math.cos(b) * e1[j] + Math.sin(b) * e2[j]));
        let lo = Math.atan2(u[2], u[1]) / D2R; const la = Math.asin(Math.max(-1, Math.min(1, u[0]))) / D2R; if (prev !== null) lo = prev + wrap(lo - prev); prev = lo; circ.push([lo, la]); } }
    // the first moments, from brotoid_moments (not from this page's wave): the ring first touches the wave at ①
    const M = moments(dirOf(S.q[0], S.q[1]).map(v => v * S.qm));
    // C5: the wave's nearest approach to q, refined on the exact border, against ①; C6: arcs inside = rim loops born (①s) − rim loops met, below r
    let k0 = 0; for (let k = 1; k < NS; k++) if (Math.min(ang[k], 180 - ang[k]) < Math.min(ang[k0], 180 - ang[k0])) k0 = k;
    const angAt = lo => { const a = Math.acos(Math.max(-1, Math.min(1, dot3(dirOf(lo, latAt(lo)), qh)))) / D2R; return Math.min(a, 180 - a); };
    let l = -180 + 360 * (k0 - 1) / NS, rr = -180 + 360 * (k0 + 1) / NS; for (let i = 0; i < 80; i++) { const m1 = l + (rr - l) * 0.382, m2 = l + (rr - l) * 0.618; if (angAt(m1) < angAt(m2)) rr = m2; else l = m1; }
    const near = angAt((l + rr) / 2), touchA = alphaOf(M.touch.r);
    const loopsAt = r => M.touches.filter(m => m.r < r).length - M.crossingMerges.filter(m => m.r < r).length, loops = loopsAt(S.r);
    // C6 runs over r, not only the current one: either side of every ① and every meet below |q|, and every 0.05
    const rs = new Set(); for (const m of [...M.touches, ...M.crossingMerges]) if (m.r < S.qm - 0.004) for (const e of [-0.003, 0.003]) if (m.r + e > 0) rs.add(m.r + e);
    for (let r = 0.05; r < S.qm - 1e-9; r += 0.05) rs.add(r);
    const c6 = [...rs].sort((a, b) => a - b).map(r => ({ r, arcs: arcsAt(alphaOf(r)), loops: loopsAt(r) })), c6bad = c6.filter(o => o.arcs !== o.loops);
    RG = { qh, all, al, ang, inside, cuts, arcs, circ, M, near, touchA, loops, c6, c6bad }; return RG; }

  function fit() { const d = devicePixelRatio || 1, r = canvas.getBoundingClientRect(), W = Math.round(r.width * d), H = Math.round(r.height * d);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; } return { x: canvas.getContext('2d'), W, H, d }; }

  // the map behind: keep/mirror over (lon, lat), baked once per height at 0.5° (two turns side by side), then slid to the origin
  let MAPC = null, MAPKEY = '';
  function mapImage(yz) { const key = `${yz}|${css('--hk')}|${css('--hm')}`; if (key === MAPKEY) return MAPC; MAPKEY = key;
    const W = 720, H = Math.round(yz * 4), img = new ImageData(2 * W, H), k = css('--hk').split(',').map(Number), m = css('--hm').split(',').map(Number);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const lo = -180 + (i + 0.5) / 2, la = yz - (j + 0.5) * (2 * yz) / H, c = detJ(dirOf(lo, la)) >= 0 ? k : m;
      for (const p of [4 * (j * 2 * W + i), 4 * (j * 2 * W + i + W)]) { img.data[p] = c[0]; img.data[p + 1] = c[1]; img.data[p + 2] = c[2]; img.data[p + 3] = 255; } }
    MAPC = document.createElement('canvas'); MAPC.width = 2 * W; MAPC.height = H; MAPC.getContext('2d').putImageData(img, 0, 0); return MAPC; }

  let HARM = null, HARMO = NaN, alive = true;
  function draw() { if (!alive) return; const { x, W, H, d } = fit(), o = origin(), L = 46 * d, R = 10 * d, T = 12 * d, B = 30 * d, w = W - L - R, h = H - T - B, span = 360 * S.cyc;
    const X = s => L + w * (s + span / 2) / span, Y = la => T + h * (S.yz - la) / (2 * S.yz);
    x.clearRect(0, 0, W, H);
    // each map tile starts at the window's left edge, lon o − 180·cycles (it was o − 180: half a turn out on even cycles, 2026-10-23)
    if (S.map) { const img = mapImage(S.yz), sx = ((((o - 180 * S.cyc + 180) % 360) + 360) % 360) * 2; x.imageSmoothingEnabled = false; for (let c = 0; c < S.cyc; c++) x.drawImage(img, sx, 0, 720, img.height, X(-span / 2 + 360 * c), T, w / S.cyc, h); }
    x.font = `${11 * d}px ui-monospace, monospace`; x.lineWidth = 1 * d;
    for (let s = -span / 2; s <= span / 2 + 1e-9; s += 45) { x.strokeStyle = s % 180 === 0 ? css('--grid2') : css('--grid'); x.beginPath(); x.moveTo(X(s), T); x.lineTo(X(s), T + h); x.stroke();
      x.fillStyle = css('--dim'); x.textAlign = 'center'; x.textBaseline = 'top'; x.fillText(`${s > 0 ? '+' : ''}${s}°`, X(s), T + h + 4 * d); }
    const ys = S.yz === 90 ? [-90, -60, -30, 0, 30, 60, 90] : [-40, -27.4, -20, 0, 20, 27.4, 40];
    for (const la of ys) { x.strokeStyle = la === 0 ? css('--grid2') : css('--grid'); x.setLineDash(Math.abs(la) === 27.4 ? [3 * d, 4 * d] : []); x.beginPath(); x.moveTo(L, Y(la)); x.lineTo(L + w, Y(la)); x.stroke();
      x.setLineDash([]); x.fillStyle = css('--dim'); x.textAlign = 'right'; x.textBaseline = 'middle'; x.fillText(`${la}°`, L - 5 * d, Y(la)); }
    if (S.marks) for (const [lab, lo, kind] of NAMED) for (let s = wrap(lo - o) - 360 * Math.ceil(S.cyc / 2); s <= span / 2; s += 360) { if (s < -span / 2) continue;
      x.fillStyle = css('--ink'); x.beginPath(); x.arc(X(s), Y(0), 2.5 * d, 0, 7); x.fill(); x.textAlign = 'center'; x.textBaseline = 'bottom'; x.fillText(lab, X(s), Y(0) - 5 * d);
      if (kind) { x.fillStyle = css('--dim'); x.textBaseline = 'top'; x.fillText(kind, X(s), Y(0) + 5 * d); } }
    if (S.parts) { if (HARMO !== o) { HARM = harmonics(o, 3); HARMO = o; }
      for (const [n, col] of [[1, '--h1'], [3, '--h3']]) { const hn = HARM[n - 1]; x.strokeStyle = css(col); x.lineWidth = 1.3 * d; x.setLineDash([5 * d, 4 * d]); x.beginPath();
        for (let i = 0; i <= 1200; i++) { const s = -span / 2 + span * i / 1200, v = hn.A * Math.cos(n * s * D2R - hn.ph * D2R); i ? x.lineTo(X(s), Y(v)) : x.moveTo(X(s), Y(v)); } x.stroke(); }
      x.setLineDash([]); }
    x.strokeStyle = css('--trace'); x.lineWidth = 2.2 * d; x.shadowColor = css('--trace'); x.shadowBlur = 6 * d; x.beginPath();
    const n = Math.round(720 * S.cyc); for (let i = 0; i <= n; i++) { const s = -span / 2 + span * i / n, v = latS(o + s); i ? x.lineTo(X(s), Y(v)) : x.moveTo(X(s), Y(v)); }
    x.stroke(); x.shadowBlur = 0;
    for (const e of EXT) for (let s = wrap(e.lo - o) - 360 * Math.ceil(S.cyc / 2); s <= span / 2; s += 360) { if (s < -span / 2) continue;
      x.fillStyle = e.hi ? css('--keep') : css('--mirror'); x.beginPath(); x.arc(X(s), Y(e.lat), 3.5 * d, 0, 7); x.fill(); }
    if (S.ring) { const G = ring(); x.save(); x.beginPath(); x.rect(L, T, w, h); x.clip();
      x.strokeStyle = css('--eye'); x.lineWidth = 4 * d; x.lineCap = 'round';   // the eye: the wave inside the ring
      for (let i = 0; i <= n; i++) { const s = -span / 2 + span * i / n, lo = wrap(o + s), k = Math.round((lo + 180) / 360 * NS) % NS;
        if (G.inside[k]) { const s0 = s - span / n / 2; x.beginPath(); x.moveTo(X(s0), Y(latS(o + s0))); x.lineTo(X(s + span / n / 2), Y(latS(o + s + span / n / 2))); x.stroke(); } }
      if (G.circ) { x.strokeStyle = css('--ring'); x.lineWidth = 1.6 * d; x.setLineDash([6 * d, 4 * d]);
        const s0 = G.circ[0][0] - o; for (let k = -Math.ceil(S.cyc / 2) - 1; k <= Math.ceil(S.cyc / 2) + 1; k++) { x.beginPath();
          G.circ.forEach(([lo, la], i) => { const s = lo - o + 360 * k + (wrap(s0) - s0); i ? x.lineTo(X(s), Y(la)) : x.moveTo(X(s), Y(la)); }); x.stroke(); }
        x.setLineDash([]); }
      for (const c of G.cuts) for (let s = wrap(c - o) - 360 * Math.ceil(S.cyc / 2); s <= span / 2; s += 360) { if (s < -span / 2) continue;
        x.fillStyle = css('--eye'); x.strokeStyle = css('--bg'); x.lineWidth = 1.5 * d; x.beginPath(); x.arc(X(s), Y(latS(c)), 4.5 * d, 0, 7); x.fill(); x.stroke(); }
      x.restore(); }
    const [ql, qa] = S.q; for (let s = wrap(ql - o) - 360 * Math.ceil(S.cyc / 2); s <= span / 2; s += 360) { if (s < -span / 2 || Math.abs(qa) > S.yz) continue;
      x.strokeStyle = css('--ring'); x.lineWidth = 2 * d; x.beginPath(); x.arc(X(s), Y(qa), 7 * d, 0, 7); x.stroke(); x.fillStyle = css('--ring'); x.textAlign = 'left'; x.textBaseline = 'top'; x.fillText('q', X(s) + 8 * d, Y(qa) + 6 * d); }
    if (onDraw) onDraw(handle); }

  // checks: C1 the border = brotoid_weft's CONE lines; C2 the fold mirror lat(−45 + ψ) = lat(−45 − ψ); C3 pointing the other way lat(lo + 180) = −lat(lo);
  // C4 three peaks, three dips; C5/C6 the ring against brotoid_moments; C7 det J is odd, det J(−d) = −det J(d), by value (C3 only sees the cone; with one
  // root per meridian and fixed signs at the poles, C3 already forces the sign swap, so a sign check would add nothing). Rows: [name, pass, value].
  function checks() { let c1 = 0; for (const Lc of CONE.filter((_, k) => k % 9 === 0)) { const u = Lc.d, lo = Math.atan2(u[2], u[1]) / D2R, la = Math.asin(u[0]) / D2R; c1 = Math.max(c1, Math.abs(latAt(lo) - la)); }
    let c2 = 0, c3 = 0; for (let k = 0; k < 360; k++) { c2 = Math.max(c2, Math.abs(latAt(-45 + k) - latAt(-45 - k))); c3 = Math.max(c3, Math.abs(latAt(k) + latAt(k + 180))); }
    const r = [['C1 border = CONE', c1 < 1e-9, c1], ['C2 fold mirror', c2 < 1e-9, c2], ['C3 antipode', c3 < 1e-9, c3], ['C4 three peaks, three dips', EXT.filter(e => e.hi).length === 3 && EXT.filter(e => !e.hi).length === 3, EXT.length]];
    const G = ring(); r.push(['C5 the ring at r = ① (brotoid_moments) just touches the wave', Math.abs(G.near - G.touchA) < 1e-6, Math.abs(G.near - G.touchA)]);
    r.push(['C6 arcs inside the ring = rim loops (①s − meets) over r', G.c6bad.length === 0, G.c6bad.length ? `${G.c6bad.length} of ${G.c6.length} wrong, first r ${G.c6bad[0].r.toFixed(3)}: ${G.c6bad[0].arcs} vs ${G.c6bad[0].loops}` : `${G.c6.length} r`]);
    // C7 over a 3° grid of directions, |det J(d) + det J(−d)| against the largest |det J|
    let c7 = 0, fmax = 0; for (let la = -87; la <= 87; la += 3) for (let lo = -180; lo < 180; lo += 3) { const u = dirOf(lo, la), f = detJ(u);
      fmax = Math.max(fmax, Math.abs(f)); c7 = Math.max(c7, Math.abs(f + detJ(u.map(v => -v)))); }
    c7 /= fmax; r.push(['C7 det J odd across the half-turn', c7 < 1e-9, c7]);
    return r; }

  // the phase roll: S.run turns the phase at S.spd °/s, half-degree steps
  let last = 0, raf = 0;
  const tick = t => { raf = 0; if (!alive || !S.run) return; const dt = last ? (t - last) / 1000 : 0; last = t; S.ph = Math.round((wrap(S.ph + S.spd * dt)) * 2) / 2; draw(); raf = requestAnimationFrame(tick); };
  const roll = () => { if (S.run && !raf) { last = 0; raf = requestAnimationFrame(tick); } };

  function set(over = {}, { redraw = true } = {}) { for (const [k, v] of Object.entries(over)) if (k in DEFAULTS) S[k] = k === 'q' ? v.slice() : v;
    if (redraw) draw(); roll(); return handle; }
  const ro = observe && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => draw()) : null; if (ro) ro.observe(canvas);
  const mq = matchMedia('(prefers-color-scheme: light)'), onTheme = () => { MAPKEY = ''; draw(); }; mq.addEventListener('change', onTheme);

  const handle = { S, set, draw, checks, ring, origin, extrema: EXT, latAt, harmonics, plant,
    state: () => ({ ...S, q: S.q.slice(), origin: origin() }),
    still: () => canvas.toDataURL('image/png'),
    destroy() { alive = false; if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); mq.removeEventListener('change', onTheme); } };
  set(settings);
  return handle; }
