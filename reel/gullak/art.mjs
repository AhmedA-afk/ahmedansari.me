// art.mjs — the painterly kit: paint(), coin, gullak (the heart), shards, cobweb, kintsugi.
import { core, tex, createCanvas, Image, clamp, lerp, ss, hash, rng, noise1, eOut, eIO, TAU, mixc, rgba, R, rad } from "./lib.mjs";
const { ellipse, stroke, fill, line, poly, smooth, INK } = core;
export const INKC = "#2A1D17";

// ---------------------------------------------------------------- grain + paint
// grain is tiled with drawImage: assigning a pattern as fillStyle copies the tile on every use (a native leak)
const GRAIN = new Image(); GRAIN.src = core.grainCanvas(512, 62, 17).toBuffer("image/png");
export const grainTile = (ctx, x0, y0, x1, y1) => { const S = 512; for (let gx = Math.floor(x0 / S) * S; gx < x1; gx += S) for (let gy = Math.floor(y0 / S) * S; gy < y1; gy += S) ctx.drawImage(GRAIN, gx, gy); };
// fill a path built by pathFn with colour + soft light/shade + paper grain + ink edge
export function paint(ctx, pathFn, color, o = {}) {
  const { edge = INKC, ew = 3, grain = .32, lit = .16, c = [0, 0], sz = 80, ink = true, alpha = 1 } = o;
  ctx.save(); ctx.globalAlpha *= alpha;
  pathFn(); ctx.fillStyle = color; ctx.fill();
  ctx.save(); pathFn(); ctx.clip();
  if (lit) { const g = ctx.createLinearGradient(c[0] - sz, c[1] - sz, c[0] + sz, c[1] + sz); g.addColorStop(0, `rgba(255,248,230,${lit})`); g.addColorStop(.5, "rgba(255,255,255,0)"); g.addColorStop(1, `rgba(40,20,10,${lit * 1.25})`); ctx.fillStyle = g; ctx.fillRect(c[0] - sz * 3, c[1] - sz * 3, sz * 6, sz * 6); }
  if (grain) { ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha *= grain; grainTile(ctx, c[0] - sz * 3, c[1] - sz * 3, c[0] + sz * 3, c[1] + sz * 3); }
  ctx.restore();
  if (ink && ew) { pathFn(); ctx.lineWidth = ew; ctx.strokeStyle = edge; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke(); }
  ctx.restore();
}
// a thick outlined tube through points (limbs, tails)
export function tube(ctx, pts, w0, w1, col, o = {}) {
  const { edge = INKC, ew = 3, caps = true } = o, n = pts.length - 1;
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < n; i++) {
    const w = lerp(w0, w1, (i + .5) / n); ctx.beginPath(); ctx.moveTo(...pts[i]); ctx.lineTo(...pts[i + 1]);
    ctx.lineWidth = pass === 0 ? w + ew * 2 : w; ctx.strokeStyle = pass === 0 ? edge : col; ctx.stroke(); }
  ctx.restore();
}

// ---------------------------------------------------------------- coin (the unit of love)
export function coin(ctx, x, y, r, spin = 0, rot = 0, alpha = 1, glow = 0) {
  const cw = Math.max(.16, Math.abs(Math.cos(spin)));
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot);
  if (glow > 0) { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 3.2); g.addColorStop(0, `rgba(255,214,120,${.55 * glow})`); g.addColorStop(1, "rgba(255,214,120,0)"); ctx.fillStyle = g; ctx.fillRect(-r * 3.2, -r * 3.2, r * 6.4, r * 6.4); }
  ctx.scale(cw, 1);
  const g = ctx.createRadialGradient(-r * .3, -r * .35, r * .1, 0, 0, r * 1.05); g.addColorStop(0, "#FFE9A0"); g.addColorStop(.55, "#F2B947"); g.addColorStop(1, "#C98A22");
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(1.2, r * .13); ctx.strokeStyle = "#7A4A12"; ctx.stroke();
  if (cw > .5) { ctx.beginPath(); ctx.arc(0, 0, r * .72, 0, TAU); ctx.lineWidth = Math.max(.8, r * .06); ctx.strokeStyle = "rgba(122,74,18,.55)"; ctx.stroke();
    // a little heart embossed: love is the currency
    const h = r * .34; ctx.beginPath(); ctx.moveTo(0, h * .9); ctx.bezierCurveTo(-h * 1.6, -h * .2, -h * .7, -h * 1.2, 0, -h * .35); ctx.bezierCurveTo(h * .7, -h * 1.2, h * 1.6, -h * .2, 0, h * .9); ctx.fillStyle = "rgba(150,90,20,.55)"; ctx.fill();
    ctx.beginPath(); ctx.arc(-r * .35, -r * .38, r * .22, Math.PI * 1.1, Math.PI * 1.7); ctx.lineWidth = r * .1; ctx.strokeStyle = "rgba(255,250,220,.8)"; ctx.stroke(); }
  ctx.restore();
}
// a coin in a parabolic flight a -> b; returns progress 0..1 or -1 when not flying. Drawn tiny-to-normal and shrinks into the slot.
export function flight(ctx, t, t0, dur, a, b, o = {}) {
  const u = (t - t0) / dur; if (u < 0 || u > 1) return -1;
  const { r = 15, h = 110, spins = 2.2 } = o, k = o.ease === false ? u : eIO(u);
  const x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k) - 4 * h * k * (1 - k);
  coin(ctx, x, y, r * (1 - .35 * ss(.78, 1, u)), u * spins * Math.PI, (u - .5) * .5, 1, .5);
  return u;
}
// coin leaving a gullak: pops up out of the slot, drops, bounces, rolls and fades
export function dropOut(ctx, t, t0, x, y, o = {}) {
  const d = t - t0; if (d < 0 || d > 3.2) return;
  const { r = 16, floor = y + 260, dir = 1, vx = 150 } = o;
  let px = x + dir * vx * Math.min(d, 2.4) * .8, py;
  const g = 1700, v0 = -480, fy = floor;
  let tt = d, bounce = 0, vy = v0, yy = y;
  // integrate analytically per bounce (3 bounces at most)
  let tl = tt; yy = y; vy = v0; for (let b = 0; b < 3; b++) { const disc = vy * vy + 2 * g * (fy - yy), tf = (-vy + Math.sqrt(disc)) / g; if (tl <= tf) { py = yy + vy * tl + .5 * g * tl * tl; bounce = -1; break; } tl -= tf; yy = fy; vy = -(vy + g * tf) * .42; if (b === 2) { py = fy; } }
  if (py === undefined) py = fy;
  const fade = 1 - ss(2.2, 3.2, d), rolling = py >= fy - 1;
  coin(ctx, px, py, r, rolling ? d * 9 : d * 14, rolling ? 0 : d * 3, fade, rolling ? 0 : .35);
}
export function coinSpray(ctx, t, t0, x, y, n, o = {}) {
  const d = t - t0; if (d < 0 || d > (o.life ?? 4)) return;
  const { floor = y + 200, spread = 1.0, speed = 620, r = 15, seed = 5, life = 4, fadeFrom = 2.4 } = o;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (R(i, seed) - .5) * Math.PI * 1.7 * spread, sp = speed * (.35 + .8 * R(i, seed + 1)), vx = Math.cos(a) * sp, vy0 = Math.sin(a) * sp - 120;
    const g = 1500, fy = floor + (R(i, seed + 2) - .5) * 40; let tl = d, yy = y, vy = vy0, px = x + vx * Math.min(d, 1.8) * (1 - .4 * ss(.8, 1.8, d)), py = null, grounded = false;
    for (let b = 0; b < 3; b++) { const disc = vy * vy + 2 * g * (fy - yy), tf = (-vy + Math.sqrt(disc)) / g; if (tl <= tf) { py = yy + vy * tl + .5 * g * tl * tl; break; } tl -= tf; yy = fy; vy = -(vy + g * tf) * .38; }
    if (py === null) { py = fy; grounded = true; }
    const fade = 1 - ss(fadeFrom, life, d);
    if (fade > 0) coin(ctx, px, py, r * (.8 + .4 * R(i, seed + 3)), grounded ? 0 : d * (9 + 8 * R(i, seed + 4)), grounded ? R(i, 9) : d * 3, fade, grounded ? 0 : .25);
  }
}

// ---------------------------------------------------------------- the gullak
const CLAY = { warm: ["#F0A870", "#C86B3A", "#8E3F20"], queen: ["#D96C6C", "#9C2B3A", "#5A1626"], soft: ["#F3B98A", "#D68257", "#9C5230"], golden: ["#F7C58A", "#E08A4A", "#A8532A"] };
const STONE = ["#A3AAB3", "#6F7680", "#363B42"];
const rockR = Array.from({ length: 14 }, (_, i) => .78 + .26 * R(i, 31));
function potPts(Rr, m, lump, t) {
  const N = 60, pts = [];
  for (let i = 0; i < N; i++) {
    const a = i / N * TAU, rk = rockR[Math.floor(a / TAU * 14) % 14] * (1 - ((a / TAU * 14) % 1)) + rockR[(Math.floor(a / TAU * 14) + 1) % 14] * ((a / TAU * 14) % 1);
    let r = lerp(1, rk, m); r *= 1 + lump * (.22 * noise1(a * 2.3 + 4) + .12 * noise1(a * 5.1 + t * .6));
    pts.push([Math.cos(a) * Rr * r, Math.sin(a) * Rr * .92 * r]);
  }
  return pts;
}
const SEAMS = [   // unit-radius polylines (x, y in R): where she mended him
  [[0, -.9], [.1, -.62], [-.06, -.3], [.12, -.02], [.02, .3], [-.1, .62], [0, .9]],
  [[-.88, -.2], [-.55, -.05], [-.3, .12], [-.06, -.3]],
  [[.9, .15], [.55, .02], [.3, .3], [.02, .3]],
  [[-.5, .62], [-.3, .45], [-.1, .62]],
];
// state keys: fill halo web crack stone lump kint broken hollow pulse tint seed
export function gullak(ctx, x, y, Rr, st = {}, t = 0, o = {}) {
  const { appear = 1, fill: fl = .3, halo = .4, web = 0, crack = 0, stone = 0, lump = 0, kint = 0, broken = -1, pulse = 0, tint = "warm", tilt = 0, floor = Rr * 5 } = st;
  const pal = CLAY[tint] || CLAY.warm, cx = x, cy = y;
  if (appear < .01) return;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt); ctx.globalAlpha *= appear; ctx.scale(.6 + .4 * appear, .6 + .4 * appear);
  if (broken >= 0) { shatter(ctx, Rr, broken, pal, floor, st.seed ?? 1); ctx.restore(); return; }
  // halo: love is light
  const hs = (1 - stone) * (.10 + .55 * fl) * (.5 + halo) + pulse * .35 * (1 - stone);
  if (hs > .01) { const g = ctx.createRadialGradient(0, 0, Rr * .3, 0, 0, Rr * (1.5 + fl * 1.5 + pulse * .6)); g.addColorStop(0, `rgba(255,208,110,${clamp(hs, 0, .8)})`); g.addColorStop(1, "rgba(255,208,110,0)"); ctx.fillStyle = g; const e = Rr * 4; ctx.fillRect(-e, -e, e * 2, e * 2); }
  const sc = 1 + pulse * .07; ctx.scale(sc, sc);
  const body = potPts(Rr, stone, lump, t), path = () => { ctx.beginPath(); body.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); };
  // body
  const c0 = mixc(pal[0], STONE[0], stone), c1 = mixc(pal[1], STONE[1], stone), c2 = mixc(pal[2], STONE[2], stone);
  const g = ctx.createRadialGradient(-Rr * .32, -Rr * .38, Rr * .1, 0, 0, Rr * 1.12); g.addColorStop(0, c0); g.addColorStop(.55, c1); g.addColorStop(1, c2);
  paint(ctx, path, g, { ew: Math.max(2.4, Rr * .075), grain: .38, lit: 0, c: [0, 0], sz: Rr });
  // light from within: warm glow through the clay, rising with love
  ctx.save(); path(); ctx.clip();
  const inner = (1 - stone) * (.10 + .6 * fl) + pulse * .4;
  if (inner > .01) { const gi = ctx.createRadialGradient(0, Rr * (.45 - fl * .25), 0, 0, Rr * .2, Rr * 1.05); gi.addColorStop(0, `rgba(255,230,140,${clamp(inner, 0, .95)})`); gi.addColorStop(.6, `rgba(255,170,70,${clamp(inner * .55, 0, .6)})`); gi.addColorStop(1, "rgba(255,150,60,0)"); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = gi; ctx.fillRect(-Rr * 1.3, -Rr * 1.3, Rr * 2.6, Rr * 2.6); ctx.globalCompositeOperation = "source-over"; }
  if (stone > .02) { // stone: cold facets
    ctx.globalAlpha = stone; for (let i = 0; i < 9; i++) { const a = R(i, 3) * TAU, d = Rr * (.15 + .6 * R(i, 4)), w = Rr * (.25 + .3 * R(i, 5)); ctx.beginPath(); ctx.moveTo(Math.cos(a) * d, Math.sin(a) * d); ctx.lineTo(Math.cos(a + 1.1) * (d + w), Math.sin(a + 1.1) * (d + w)); ctx.lineTo(Math.cos(a - .9) * (d + w * .7), Math.sin(a - .9) * (d + w * .7)); ctx.closePath(); ctx.fillStyle = i % 2 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.18)"; ctx.fill(); } ctx.globalAlpha = 1; }
  // painted band: dots and a tiny zig-zag, like a real village gullak
  const bandA = 1 - stone * 1.4;
  if (bandA > 0) { ctx.globalAlpha = bandA * .9; for (let k = -5; k <= 5; k++) { const ph = k / 5 * 1.15, px = Math.sin(ph) * Rr * .93, py = Rr * .1 + (1 - Math.cos(ph)) * Rr * .16; ellipse(ctx, px, py, Rr * .045 * Math.cos(ph * .8) + .6, Rr * .045, 0); ctx.fillStyle = "#FBEFD5"; ctx.fill(); }
    ctx.beginPath(); for (let k = -6; k <= 6; k++) { const ph = k / 6 * 1.2, px = Math.sin(ph) * Rr * .93, py = Rr * .36 + (1 - Math.cos(ph)) * Rr * .22 + (k % 2 ? -Rr * .05 : Rr * .05); k === -6 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.lineWidth = Math.max(1, Rr * .035); ctx.strokeStyle = "rgba(251,239,213,.8)"; ctx.stroke(); ctx.globalAlpha = 1; }
  // soft specular
  ctx.save(); ctx.globalAlpha = .5 * (1 - stone * .6); ctx.beginPath(); ctx.ellipse(-Rr * .42, -Rr * .38, Rr * .1, Rr * .3, rad(35), 0, TAU); ctx.fillStyle = "rgba(255,246,225,.75)"; ctx.fill(); ctx.restore();
  ctx.restore();
  // collar + slot
  const cw = Rr * .46, cy2 = -Rr * (.86 + .02);
  const colPath = () => { ctx.beginPath(); ctx.ellipse(0, cy2, cw, Rr * .13, 0, 0, TAU); };
  paint(ctx, colPath, mixc(pal[1], STONE[1], stone), { ew: Math.max(2, Rr * .06), grain: .3, lit: .1, sz: Rr * .5, c: [0, cy2] });
  ctx.beginPath(); ctx.ellipse(0, cy2 - Rr * .005, cw * .62, Rr * .05, 0, 0, TAU); ctx.fillStyle = "#1A0D07"; ctx.fill();
  if (pulse > 0) { ctx.beginPath(); ctx.ellipse(0, cy2, cw * .62, Rr * .05, 0, 0, TAU); ctx.fillStyle = `rgba(255,220,120,${pulse * .9})`; ctx.fill(); }
  // cracks (mid-fight) and gold seams (after mending)
  if (crack > .01) drawSeam(ctx, [[0, -.9], [.08, -.62], [-.07, -.34], [.1, -.08], [-.02, .22], [.07, .5]], Rr, crack, Math.max(1.6, Rr * .045), INKC, null);
  if (crack > .5) drawSeam(ctx, [[.5, -.55], [.32, -.3], [.4, -.05]], Rr, (crack - .5) * 2, Math.max(1.2, Rr * .035), INKC, null);
  if (kint > .01) SEAMS.forEach((s, i) => drawSeam(ctx, s, Rr, clamp(kint * 1.6 - i * .2, 0, 1), Math.max(2, Rr * .06), "#8A5A14", "#FFD66B"));
  if (web > .02) cobweb(ctx, Rr, web, t);
  ctx.restore();
}
function drawSeam(ctx, pts, Rr, k, w, dark, gold) {
  if (k <= 0) return; const P = pts.map(([a, b]) => [a * Rr, b * Rr]); let L = 0; const seg = []; for (let i = 1; i < P.length; i++) { const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(l); L += l; }
  let rem = L * k; const out = [P[0]]; for (let i = 1; i < P.length; i++) { if (rem >= seg[i - 1]) { out.push(P[i]); rem -= seg[i - 1]; } else { const f = rem / seg[i - 1]; out.push([lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)]); break; } }
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (gold) { ctx.beginPath(); out.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.lineWidth = w * 3.2; ctx.strokeStyle = "rgba(255,210,100,.28)"; ctx.stroke(); }
  ctx.beginPath(); out.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.lineWidth = w; ctx.strokeStyle = dark; ctx.stroke();
  if (gold) { ctx.beginPath(); out.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.lineWidth = w * .62; ctx.strokeStyle = gold; ctx.stroke(); ctx.lineWidth = w * .2; ctx.strokeStyle = "#FFF6D0"; ctx.stroke(); }
  ctx.restore();
}
function cobweb(ctx, Rr, k, t) {
  const a = clamp(k * 1.2, 0, 1); ctx.save(); ctx.globalAlpha = .8 * a; ctx.strokeStyle = "rgba(90,84,76,.8)"; ctx.lineWidth = Math.max(1.2, Rr * .03); ctx.lineCap = "round";
  const o = [-.3, -.88];
  const rays = [[-1.15, -1.55], [-.6, -2.0], [.05, -2.15], [.7, -1.95], [1.2, -1.5], [1.35, -.95], [-1.35, -.9]];
  const rk = ss(0, .6, k);
  rays.forEach(([rx, ry]) => { ctx.beginPath(); ctx.moveTo(o[0] + .3 * Rr, o[1] * Rr + .02); ctx.lineTo(lerp(o[0] * Rr + .3 * Rr, rx * Rr, rk), lerp(o[1] * Rr, ry * Rr, rk)); ctx.stroke(); });
  for (let ring = 1; ring <= 3; ring++) { const f = ring / 3.4; if (k < ring * .22) break; let lx = 0, ly = 0; ctx.beginPath(); rays.forEach(([rx, ry], i) => { const px = lerp(o[0] * Rr + .3 * Rr, rx * Rr, f * rk) + Math.sin(i * 3 + ring) * 1.2, py = lerp(o[1] * Rr, ry * Rr, f * rk); i ? ctx.quadraticCurveTo((px + lx) / 2, (py + ly) / 2 + Rr * .05, px, py) : ctx.moveTo(px, py); lx = px; ly = py; }); ctx.stroke(); }
  if (k > .85) { // a little spider on a thread, swaying
    const sx = Rr * .12, sy0 = -1.5 * Rr, sy = sy0 + Rr * (.45 + .06 * Math.sin(t * 1.6)); ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(sx, sy0); ctx.lineTo(sx, sy); ctx.strokeStyle = "rgba(232,230,220,.9)"; ctx.stroke();
    ctx.fillStyle = "#2B2623"; ctx.beginPath(); ctx.arc(sx, sy + Rr * .05, Rr * .06, 0, TAU); ctx.fill(); ctx.strokeStyle = "#2B2623"; for (let l = 0; l < 4; l++) { const s = l < 2 ? -1 : 1, yy = (l % 2) * Rr * .03; ctx.beginPath(); ctx.moveTo(sx, sy + Rr * .05); ctx.lineTo(sx + s * Rr * .1, sy + yy - Rr * .02); ctx.lineTo(sx + s * Rr * .16, sy + yy + Rr * .06); ctx.stroke(); } }
  ctx.restore();
}
// shards: 3 rings x sectors; each flies out, tumbles, lands on `floor` and settles
function shatter(ctx, Rr, tau, pal, floor, seed) {
  if (tau < .16) { const k = 1 - tau / .16; ctx.save(); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, Rr * (2 + 3 * (1 - k))); g.addColorStop(0, `rgba(255,248,220,${.95 * k})`); g.addColorStop(1, "rgba(255,200,120,0)"); ctx.fillStyle = g; ctx.fillRect(-Rr * 6, -Rr * 6, Rr * 12, Rr * 12); ctx.restore(); }
  const rings = [[0, .42, 6], [.42, .78, 9], [.78, 1.04, 11]];
  let n = 0;
  for (const [r0, r1, sec] of rings) for (let s = 0; s < sec; s++) {
    const a0 = s / sec * TAU + (R(n, seed) - .5) * .25, a1 = (s + 1) / sec * TAU + (R(n, seed + 1) - .5) * .25;
    const j = (i) => 1 + (R(n * 5 + i, seed + 2) - .5) * .18;
    const pts = [[Math.cos(a0) * r0 * Rr * j(0), Math.sin(a0) * r0 * Rr * .92 * j(0)], [Math.cos(a0) * r1 * Rr * j(1), Math.sin(a0) * r1 * Rr * .92 * j(1)], [Math.cos((a0 + a1) / 2) * r1 * Rr * j(2), Math.sin((a0 + a1) / 2) * r1 * Rr * .92 * j(2)], [Math.cos(a1) * r1 * Rr * j(3), Math.sin(a1) * r1 * Rr * .92 * j(3)], [Math.cos(a1) * r0 * Rr * j(4), Math.sin(a1) * r0 * Rr * .92 * j(4)]];
    const cxs = pts.reduce((a, p) => a + p[0], 0) / pts.length, cys = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const am = (a0 + a1) / 2, sp = (260 + 520 * R(n, seed + 3)) * (Rr / 40) * (.45 + r0 * .8), vx = Math.cos(am) * sp, vy0 = Math.sin(am) * sp - 340 * (Rr / 40);
    const g = 1700 * (Rr / 40); let px = cxs + vx * Math.min(tau, 1.4) * (1 - .45 * ss(.4, 1.4, tau)), py;
    const fy = floor - (R(n, seed + 4)) * 18; let tl = tau, yy = cys, vy = vy0, grounded = false;
    for (let b = 0; b < 3; b++) { const disc = vy * vy + 2 * g * (fy - yy), tf = (-vy + Math.sqrt(Math.max(0, disc))) / g; if (tl <= tf) { py = yy + vy * tl + .5 * g * tl * tl; break; } tl -= tf; yy = fy; vy = -(vy + g * tf) * .3; }
    if (py === undefined) { py = fy; grounded = true; }
    const rot = grounded ? (R(n, 8) - .5) * 1.2 : tau * (3 + 6 * R(n, seed + 5)) * (R(n, 6) > .5 ? 1 : -1);
    ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
    const path = () => { ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a - cxs, b - cys) : ctx.moveTo(a - cxs, b - cys)); ctx.closePath(); };
    paint(ctx, path, r0 === 0 ? pal[1] : (n % 3 ? pal[1] : pal[2]), { ew: Math.max(1.8, Rr * .05), lit: .2, grain: .35, sz: Rr * .4 });
    ctx.restore(); n++;
  }
}
export const potDims = (Rr) => ({ slotY: -Rr * .88 });
