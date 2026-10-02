// env.mjs — painted worlds. Static layers are baked once with layer(); only what moves is drawn per frame.
import { core, tex, createCanvas, Image, clamp, lerp, ss, hash, rng, noise1, TAU, mixc, rgba, R, rad, eIO } from "./lib.mjs";
import { paint, INKC } from "./art.mjs";

// baked layers are re-decoded as Images: drawing an Image is free of the per-draw bitmap copy that drawImage(canvas) makes
export const PENDING = [];
export const layer = (w, h, fn) => { const c = createCanvas(w, h), x = c.getContext("2d"); fn(x, w, h); const im = new Image(); im.src = c.toBuffer("image/png"); PENDING.push(im); return im; };
export const blit = (ctx, img, x, y) => ctx.drawImage(img, x, y);
const grainTile = core.grainCanvas(256, 56, 9);
export function grainRect(ctx, x, y, w, h, a = .3) { ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = a; ctx.fillStyle = ctx.createPattern(grainTile, "repeat"); ctx.fillRect(x, y, w, h); ctx.restore(); }
export function grad(ctx, x, y, w, h, c0, c1, vertical = true, a = 1) { const g = vertical ? ctx.createLinearGradient(0, y, 0, y + h) : ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.restore(); }
export function glow(ctx, x, y, r, color, a = .5, mode = "source-over") { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0)); ctx.save(); ctx.globalCompositeOperation = mode; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); }
export function poly(ctx, pts, color, a = 1) { ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore(); }
export function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
export const box = (ctx, x, y, w, h, color, o = {}) => paint(ctx, () => rr(ctx, x, y, w, h, o.r ?? 4), color, { ew: o.ew ?? 2.6, sz: Math.max(w, h) * .5, c: [x + w / 2, y + h / 2], lit: o.lit ?? .14, grain: o.grain ?? .3, ink: o.ink ?? true });

// ------------------------------------------------------------------ rooms
export function planks(ctx, x, y, w, h, c0, c1, seed = 3, pw = 120) {
  grad(ctx, x, y, w, h, c0, c1);
  const r = rng(seed); for (let px = x - (seed * 37 % pw); px < x + w; px += pw) { ctx.fillStyle = `rgba(60,30,10,${.04 + r() * .06})`; ctx.fillRect(px, y, pw, h); ctx.fillStyle = "rgba(50,25,10,.22)"; ctx.fillRect(px, y, 2, h); }
  for (let i = 0; i < 120; i++) { const px = x + r() * w, py = y + r() * h; ctx.strokeStyle = "rgba(60,30,10,.12)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 40 + r() * 80, py + (r() - .5) * 3); ctx.stroke(); }
  grainRect(ctx, x, y, w, h, .35);
}
export function wallPaint(ctx, x, y, w, h, c0, c1, seed = 5) {
  grad(ctx, x, y, w, h, c0, c1); const r = rng(seed);
  for (let i = 0; i < 26; i++) glow(ctx, x + r() * w, y + r() * h, 160 + r() * 360, mixc(c0, "#FFFFFF", .45), .12);
  for (let i = 0; i < 8; i++) glow(ctx, x + r() * w, y + r() * h, 180 + r() * 300, "#6A4A30", .035);
  grainRect(ctx, x, y, w, h, .3);
}
export function windowFrame(ctx, x, y, w, h, sky0, sky1, o = {}) {
  const { cross = true, frame = "#F4ECDD", ew = 3.4, curtain = null } = o;
  ctx.save(); rr(ctx, x, y, w, h, 6); ctx.clip(); grad(ctx, x, y, w, h, sky0, sky1); if (o.inner) o.inner(ctx, x, y, w, h); ctx.restore();
  ctx.save(); ctx.lineWidth = 12; ctx.strokeStyle = frame; rr(ctx, x, y, w, h, 6); ctx.stroke(); ctx.lineWidth = ew; ctx.strokeStyle = INKC; rr(ctx, x - 6, y - 6, w + 12, h + 12, 8); ctx.stroke(); rr(ctx, x + 6, y + 6, w - 12, h - 12, 4); ctx.stroke();
  if (cross) { ctx.lineWidth = 9; ctx.strokeStyle = frame; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h * .5); ctx.lineTo(x + w, y + h * .5); ctx.stroke(); }
  ctx.restore();
  if (curtain) { for (const sd of [0, 1]) { const cx0 = sd ? x + w - w * .22 : x - w * .02; paint(ctx, () => { ctx.beginPath(); ctx.moveTo(cx0, y - 20); ctx.quadraticCurveTo(cx0 + (sd ? 10 : -10), y + h * .5, cx0 + (sd ? -10 : 10), y + h + 30); ctx.lineTo(cx0 + w * .24, y + h + 30); ctx.quadraticCurveTo(cx0 + w * .24 + (sd ? 8 : -8), y + h * .5, cx0 + w * .24, y - 20); ctx.closePath(); }, curtain, { ew: 2.4, sz: h * .5, c: [cx0, y + h / 2], lit: .1 }); } }
}
// a slanted shaft of light from a window across the room (additive-looking, low alpha)
export function shaft(ctx, pts, color = "#FFE6A8", a = .22) {
  ctx.save(); const g = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[2][0], pts[2][1]); g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.restore();
}
export function motes(ctx, t, box4, n = 26, color = "#FFF2C8", a = .6) {
  const [x0, y0, w, h] = box4; ctx.save();
  for (let i = 0; i < n; i++) { const px = x0 + ((R(i, 1) + t * (.01 + .015 * R(i, 2)) * (R(i, 3) > .5 ? 1 : -1) + 10) % 1) * w, py = y0 + ((R(i, 4) + Math.sin(t * .3 + i) * .02 + t * .008 + 10) % 1) * h, r = 1.2 + R(i, 5) * 2.4;
    ctx.globalAlpha = a * (.4 + .6 * Math.abs(Math.sin(t * .7 + i * 2))); ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fillStyle = color; ctx.fill(); }
  ctx.restore();
}
export function lamp(ctx, x, y, s = 1, on = 1, t = 0) {
  glow(ctx, x, y - 150 * s, 380 * s, "#FFD08A", .45 * on); ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  box(ctx, -6, -150, 12, 150, "#5A4030", { r: 3 }); box(ctx, -42, -8, 84, 14, "#5A4030", { r: 6 });
  paint(ctx, () => { ctx.beginPath(); ctx.moveTo(-50, -150); ctx.lineTo(50, -150); ctx.lineTo(34, -222); ctx.lineTo(-34, -222); ctx.closePath(); }, on > .5 ? "#FFE0A0" : "#C8B9A0", { ew: 2.6, sz: 70, c: [0, -190], lit: .1 }); ctx.restore();
}
export function shelf(ctx, x, y, w, seed = 4) {
  box(ctx, x, y, w, 16, "#7A5236", { r: 3 }); const r = rng(seed); let px = x + 14;
  const cols = ["#C0624A", "#5F8A8B", "#E0B04C", "#6A5A8C", "#8AA35E", "#B0764A"];
  while (px < x + w - 40) { const bw = 20 + r() * 20, bh = 60 + r() * 60; box(ctx, px, y - bh, bw, bh, cols[Math.floor(r() * cols.length)], { r: 2, ew: 2.2 }); px += bw + 3; if (r() < .25) px += 24; }
}
export function plant(ctx, x, y, s = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  paint(ctx, () => { ctx.beginPath(); ctx.moveTo(-34, -70); ctx.lineTo(34, -70); ctx.lineTo(26, 0); ctx.lineTo(-26, 0); ctx.closePath(); }, "#B5663D", { ew: 2.6, sz: 50, c: [0, -35] });
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .32 + Math.sin(t * .8 + i) * .03; paint(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -70); ctx.quadraticCurveTo(Math.cos(a - .3) * 90, -70 + Math.sin(a - .3) * 90, Math.cos(a) * 150, -70 + Math.sin(a) * 150); ctx.quadraticCurveTo(Math.cos(a + .3) * 90, -70 + Math.sin(a + .3) * 90, 0, -70); ctx.closePath(); }, i % 2 ? "#6F9A58" : "#5C8A4C", { ew: 2.4, sz: 80, c: [0, -130] }); }
  ctx.restore();
}
export function sofa(ctx, x, y, w, color = "#9C5B4A") {
  box(ctx, x, y - 260, w, 150, mixc(color, "#000000", .12), { r: 26 }); box(ctx, x - 24, y - 190, w + 48, 130, color, { r: 24 });
  box(ctx, x + 10, y - 130, w - 20, 98, mixc(color, "#FFFFFF", .08), { r: 20 }); box(ctx, x - 24, y - 120, 40, 120, mixc(color, "#000000", .1), { r: 14 }); box(ctx, x + w - 16, y - 120, 40, 120, mixc(color, "#000000", .1), { r: 14 });
  ctx.fillStyle = "#5A4030"; ctx.fillRect(x - 8, y - 6, 16, 22); ctx.fillRect(x + w - 8, y - 6, 16, 22);
}
export function rug(ctx, x, y, rx, ry, c0 = "#B5483E", c1 = "#E8C27A") {
  paint(ctx, () => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); }, c0, { ew: 2.4, sz: rx, c: [x, y], lit: .08 });
  for (const k of [.82, .62, .4]) { ctx.beginPath(); ctx.ellipse(x, y, rx * k, ry * k, 0, 0, TAU); ctx.lineWidth = 5; ctx.strokeStyle = k === .62 ? c1 : "rgba(255,240,210,.55)"; ctx.setLineDash(k === .62 ? [] : [10, 12]); ctx.stroke(); ctx.setLineDash([]); }
}
// ------------------------------------------------------------------ outdoors
export function skyline(ctx, x0, x1, baseY, hmax, color, seed = 2, windows = null) {
  const r = rng(seed); let x = x0; ctx.fillStyle = color;
  while (x < x1) { const w = 60 + r() * 120, h = hmax * (.35 + r() * .65); ctx.fillRect(x, baseY - h, w, h + 4);
    if (windows) for (let wy = baseY - h + 16; wy < baseY - 14; wy += 26) for (let wx = x + 10; wx < x + w - 14; wx += 22) if (r() < .5) { ctx.fillStyle = windows(r()); ctx.fillRect(wx, wy, 9, 12); ctx.fillStyle = color; }
    x += w + (r() < .3 ? 14 : 0); }
}
export function hills(ctx, x0, x1, baseY, amp, color, seed = 1, freq = .004) {
  ctx.beginPath(); ctx.moveTo(x0, baseY + 400); for (let x = x0; x <= x1; x += 12) ctx.lineTo(x, baseY - amp * (.5 + .5 * noise1(x * freq + seed * 17)) - amp * .3 * noise1(x * freq * 2.3 + seed)); ctx.lineTo(x1, baseY + 400); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
export function tree(ctx, x, y, s = 1, c = "#5F8A4C", t = 0, seed = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  paint(ctx, () => { ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-9, -170); ctx.lineTo(9, -170); ctx.lineTo(14, 0); ctx.closePath(); }, "#7A5236", { ew: 2.6, sz: 80, c: [0, -90] });
  for (let i = 0; i < 6; i++) { const cx0 = (R(i, seed) - .5) * 150 + Math.sin(t * .6 + i) * 2, cy0 = -200 - R(i, seed + 1) * 110, rr0 = 70 + R(i, seed + 2) * 50; paint(ctx, () => { ctx.beginPath(); ctx.arc(cx0, cy0, rr0, 0, TAU); }, mixc(c, "#FFFFFF", R(i, seed + 3) * .18), { ew: 0, ink: false, sz: rr0, c: [cx0, cy0], lit: .2 }); }
  ctx.restore();
}
export function stars(ctx, x0, y0, w, h, n = 90, seed = 4, t = 0) {
  for (let i = 0; i < n; i++) { const px = x0 + R(i, seed) * w, py = y0 + R(i, seed + 1) * h, a = .35 + .65 * Math.abs(Math.sin(t * (.6 + R(i, seed + 2)) + i)); ctx.globalAlpha = a; ctx.fillStyle = "#F4F1FF"; ctx.beginPath(); ctx.arc(px, py, .8 + R(i, seed + 3) * 1.8, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
}
export function lantern(ctx, x, y, s = 1, t = 0, hue = "#FFB347") {
  const f = .85 + .15 * Math.sin(t * 5 + x * .02); glow(ctx, x, y, 120 * s, hue, .55 * f);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  paint(ctx, () => { ctx.beginPath(); ctx.moveTo(-18, -6); ctx.quadraticCurveTo(-30, 18, -16, 34); ctx.lineTo(16, 34); ctx.quadraticCurveTo(30, 18, 18, -6); ctx.closePath(); }, mixc(hue, "#FFF3C8", .35), { ew: 2, sz: 30, c: [0, 14], lit: 0, grain: .15 });
  ctx.beginPath(); ctx.ellipse(0, 14, 9, 14, 0, 0, TAU); ctx.fillStyle = "rgba(255,250,220,.9)"; ctx.fill(); ctx.restore();
}
export function water(ctx, x, y, w, h, c0, c1, t, o = {}) {
  const { flow = 18, lines = 26, hi = "#FFF0C0", seed = 3 } = o;
  grad(ctx, x, y, w, h, c0, c1);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.lineCap = "round";
  for (let i = 0; i < lines; i++) { const py = y + (R(i, seed) ** 1.4) * h, len = 40 + R(i, seed + 1) * 140, px = x + ((R(i, seed + 2) * (w + len) + t * flow * (.4 + py / (y + h) * .8)) % (w + len)) - len; ctx.strokeStyle = rgba(hi, .12 + .3 * R(i, seed + 3)); ctx.lineWidth = 1.6 + R(i, seed + 4) * 2.4; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + len / 2, py - 4 + Math.sin(t * 1.5 + i) * 2, px + len, py); ctx.stroke(); }
  ctx.restore();
}
export function rain(ctx, t, x0, y0, w, h, n = 120, a = .5, color = "#B8C8DC", slant = .25) {
  ctx.save(); ctx.strokeStyle = rgba(color, a); ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < n; i++) { const px = x0 + ((R(i, 1) + t * .1 * (slant)) % 1) * w, py = y0 + ((R(i, 2) + t * (1.6 + R(i, 3))) % 1) * h, L = 24 + R(i, 4) * 30; ctx.moveTo(px, py); ctx.lineTo(px - L * slant, py + L); } ctx.stroke(); ctx.restore();
}
export function clockWall(ctx, x, y, r, t, speed = 1) {
  paint(ctx, () => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }, "#EFE8D8", { ew: 4, sz: r, c: [x, y], lit: .08 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.moveTo(x + Math.sin(a) * r * .84, y - Math.cos(a) * r * .84); ctx.lineTo(x + Math.sin(a) * r * .94, y - Math.cos(a) * r * .94); ctx.lineWidth = 3; ctx.strokeStyle = INKC; ctx.stroke(); }
  const a1 = t * speed * .9, a2 = a1 / 12; for (const [a, L, w] of [[a2, .5, 6], [a1, .78, 3.4]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(a) * r * L, y - Math.cos(a) * r * L); ctx.lineWidth = w; ctx.lineCap = "round"; ctx.strokeStyle = INKC; ctx.stroke(); }
  ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fillStyle = INKC; ctx.fill();
}
// vignette-style darkness blob used for the cold and the silence
export function shade(ctx, W, H, a, color = "#05060C") { ctx.save(); ctx.fillStyle = rgba(color, a); ctx.fillRect(-4000, -4000, 8000, 8000); ctx.restore(); }
