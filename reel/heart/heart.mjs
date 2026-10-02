// heart.mjs — the gullak and the coins of love.
// A gullak is an unglazed terracotta money pot: a small knob on top, a narrow neck, a wide round belly, a coin slit
// on the shoulder, a little foot, and bands scratched into the clay while it was still wet. Inside the chest it is
// the heart. Its light is the love it holds: the coins glow through the slit and warm the clay from inside.
//
//   gullak(ctx, cx, cy, h, st)      cx,cy = centre of the pot, h = height.  st: { fill 0..1, pulse 0..1, t, view }
//   halo(ctx, cx, cy, h, st)        the light the heart throws on the world around it (additive)
//   coin(ctx, x, y, r, { spin, glow, a })
import { Path2D, clamp, lerp, catmull, TAU, mixc, rgba } from "./lib.mjs";

// the right half of the profile (r = half-width, v = 0 at the top of the knob .. 1 at the foot), in units of h
const HALF = [[0,0],[0.045,0.01],[0.07,0.045],[0.066,0.085],[0.05,0.105],[0.062,0.128],[0.1,0.158],[0.213,0.2],[0.291,0.25],[0.343,0.3],[0.381,0.35],[0.408,0.4],[0.426,0.45],[0.437,0.5],[0.44,0.55],[0.437,0.6],[0.426,0.65],[0.408,0.7],[0.381,0.75],[0.343,0.8],[0.291,0.85],[0.249,0.88],[0.2,0.905],[0.185,0.93],[0.2,0.965],[0.215,1],[0,1]];
const OUT = (() => { const R = catmull(HALF.slice(1, -1), false, .02).map(([r, v]) => [r, v]); return [[0, 0], ...R, [0, 1]]; })();
export const POT = { outline: (h) => { const R = OUT.map(([r, v]) => [r * h, (v - .5) * h]); return [...R, ...R.slice(1, -1).reverse().map(([x, y]) => [-x, y])]; },
  slitV: .235, slitW: .2, bellyV: .56, rAt: (v) => { for (let i = 1; i < OUT.length; i++) if (OUT[i][1] >= v) { const a = OUT[i - 1], b = OUT[i]; return lerp(a[0], b[0], (v - a[1]) / ((b[1] - a[1]) || 1)); } return 0; } };

const CLAY = { hi: "#D98A55", mid: "#B55E33", lo: "#6E2E18", line: "#5A2414", lit: "#FFC890" };
export function gullak(ctx, cx, cy, h, st = {}) {
  const fill = st.fill ?? .5, pulse = st.pulse ?? 0, glow = clamp(fill * .85 + pulse * .6), dim = st.dim ?? 0;
  const P = POT.outline(h), path = new Path2D(); P.forEach(([x, y], i) => (i ? path.lineTo(cx + x, cy + y) : path.moveTo(cx + x, cy + y))); path.closePath();
  const y0 = cy - h / 2, V = (v) => y0 + v * h;
  ctx.save();
  // body of clay: round, lit softly from the upper left, darker underneath
  const g = ctx.createRadialGradient(cx - h * .14, V(.42), h * .02, cx, V(.56), h * .62);
  g.addColorStop(0, mixc(CLAY.hi, "#1A0E0C", dim)); g.addColorStop(.55, mixc(CLAY.mid, "#140C0C", dim)); g.addColorStop(1, mixc(CLAY.lo, "#0A0608", dim));
  ctx.fillStyle = g; ctx.fill(path);
  ctx.clip(path);
  // the warmth inside shows through the thin clay (a lantern made of earth)
  if (glow > .01) { const ig = ctx.createRadialGradient(cx, V(.5), 0, cx, V(.55), h * .55); ig.addColorStop(0, rgba("#FFB45A", .55 * glow)); ig.addColorStop(.6, rgba("#FF8A3A", .18 * glow)); ig.addColorStop(1, "rgba(255,120,40,0)");
    ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = ig; ctx.fillRect(cx - h, y0, h * 2, h); ctx.globalCompositeOperation = "source-over"; }
  // incised bands: a pair of rings above the belly, a band of chevrons, a ring below. Seen from a little above,
  // each ring is the front half of an ellipse.
  const ring = (v, w = 1.4, a = .7) => { const r = POT.rAt(v) * h, e = r * .12; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const k = i / 40 * 2 - 1, x = k * r * .99, y = V(v) + e * Math.sqrt(1 - k * k); i ? ctx.lineTo(cx + x, y) : ctx.moveTo(cx + x, y); }
    ctx.strokeStyle = rgba(mixc(CLAY.line, "#000000", dim), a); ctx.lineWidth = w * h / 60; ctx.stroke(); ctx.translate(0, w * h / 80); ctx.strokeStyle = rgba(mixc(CLAY.hi, "#000000", dim), a * .35); ctx.lineWidth = w * h / 120; ctx.stroke(); ctx.translate(0, -w * h / 80); };
  ring(.42); ring(.455); ring(.74, 1.2, .55); ring(.77, 1.2, .55);
  { const v0 = .48, v1 = .545, r0 = POT.rAt(v0) * h, n = 9; ctx.beginPath(); for (let i = 0; i <= n * 2; i++) { const k = i / (n * 2) * 2 - 1, v = i % 2 ? v1 : v0, r = POT.rAt(v) * h, x = k * Math.min(r0, r) * .96, y = V(v) + r * .12 * Math.sqrt(Math.max(0, 1 - k * k)); i ? ctx.lineTo(cx + x, y) : ctx.moveTo(cx + x, y); }
    ctx.strokeStyle = rgba(mixc(CLAY.line, "#000000", dim), .6); ctx.lineWidth = h / 70; ctx.lineJoin = "round"; ctx.stroke(); }
  // the slit on the shoulder; its light is the coins inside
  const sv = POT.slitV, sw = POT.slitW * h, sy = V(sv), sr = POT.rAt(sv) * h, sc = sr * .14;
  ctx.beginPath(); ctx.ellipse(cx, sy + sc * .3, sw / 2, h * .022, 0, 0, TAU); ctx.fillStyle = mixc("#1A0A06", "#000000", dim); ctx.fill();
  if (glow > .01) { ctx.globalCompositeOperation = "lighter"; const sg = ctx.createRadialGradient(cx, sy, 0, cx, sy, sw * .7); sg.addColorStop(0, rgba("#FFE7B0", .95 * glow)); sg.addColorStop(.3, rgba("#FFC060", .5 * glow)); sg.addColorStop(1, "rgba(255,160,60,0)");
    ctx.fillStyle = sg; ctx.fillRect(cx - sw, sy - sw, sw * 2, sw * 2);
    ctx.beginPath(); ctx.ellipse(cx, sy + sc * .3, sw / 2 * .9, h * .012, 0, 0, TAU); ctx.fillStyle = rgba("#FFF2D0", glow); ctx.fill(); ctx.globalCompositeOperation = "source-over"; }
  // the slit's lip catches light on its lower edge
  ctx.beginPath(); ctx.ellipse(cx, sy + sc * .3 + h * .006, sw / 2, h * .024, 0, .15, Math.PI - .15); ctx.strokeStyle = rgba(mixc(CLAY.hi, "#000000", dim), .5); ctx.lineWidth = h / 110; ctx.stroke();
  // a soft highlight and a hand-made unevenness
  const hl = ctx.createRadialGradient(cx - h * .18, V(.45), 0, cx - h * .18, V(.45), h * .2); hl.addColorStop(0, `rgba(255,230,200,${.22 * (1 - dim)})`); hl.addColorStop(1, "rgba(255,230,200,0)"); ctx.fillStyle = hl; ctx.fillRect(cx - h, y0, h * 2, h);
  const sh = ctx.createLinearGradient(cx - h * .5, 0, cx + h * .5, 0); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(.7, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(20,6,4,.35)"); ctx.fillStyle = sh; ctx.fillRect(cx - h, y0, h * 2, h);
  ctx.restore();
  // a hairline of light along the rim facing the slit glow
  if (pulse > .01) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = rgba("#FFD890", .6 * pulse); ctx.lineWidth = h / 40; ctx.stroke(path); ctx.restore(); }
}

// the heart's light on the world around it
export function halo(ctx, cx, cy, h, st = {}) {
  const fill = st.fill ?? .5, pulse = st.pulse ?? 0, k = clamp(fill * .9 + pulse * .8), R = h * (1.1 + 2.6 * fill + 2.2 * pulse);
  if (k < .01) return;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(cx, cy - h * .2, 0, cx, cy - h * .2, R); g.addColorStop(0, rgba("#FFC070", .42 * k)); g.addColorStop(.18, rgba("#FFA050", .2 * k)); g.addColorStop(.5, rgba("#FF8040", .06 * k)); g.addColorStop(1, "rgba(255,120,40,0)");
  ctx.fillStyle = g; ctx.fillRect(cx - R, cy - h * .2 - R, R * 2, R * 2);
  // a tight bright core at the slit
  const sy = cy - h / 2 + POT.slitV * h, c = ctx.createRadialGradient(cx, sy, 0, cx, sy, h * .5); c.addColorStop(0, rgba("#FFF0C8", .5 * k)); c.addColorStop(1, "rgba(255,220,160,0)"); ctx.fillStyle = c; ctx.fillRect(cx - h, sy - h, h * 2, h * 2);
  ctx.restore();
}

// a coin of love: a small gold coin that is also a light
export function coin(ctx, x, y, r, o = {}) {
  const spin = o.spin ?? 0, a = o.a ?? 1, glow = o.glow ?? 1, sx = Math.max(.08, Math.abs(Math.cos(spin)));
  ctx.save(); ctx.globalAlpha = a;
  if (glow > 0) { ctx.globalCompositeOperation = "lighter"; const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5); g.addColorStop(0, rgba("#FFE2A0", .55 * glow)); g.addColorStop(.25, rgba("#FFB050", .18 * glow)); g.addColorStop(1, "rgba(255,160,60,0)"); ctx.fillStyle = g; ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10); ctx.globalCompositeOperation = "source-over"; }
  ctx.translate(x, y); ctx.rotate(o.tilt ?? 0); ctx.scale(sx, 1);
  // edge (thickness shows when it turns)
  if (sx < .95) { ctx.fillStyle = "#9A6418"; ctx.beginPath(); ctx.ellipse(r * .12 * Math.sign(Math.cos(spin) || 1) / sx * (1 - sx), 0, r, r, 0, 0, TAU); ctx.fill(); }
  const g = ctx.createRadialGradient(-r * .35, -r * .35, 0, 0, 0, r * 1.05); g.addColorStop(0, "#FFF4C8"); g.addColorStop(.45, "#F4C150"); g.addColorStop(1, "#B47A1E");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = "rgba(150,95,20,.7)"; ctx.lineWidth = r * .12; ctx.beginPath(); ctx.arc(0, 0, r * .72, 0, TAU); ctx.stroke();
  ctx.strokeStyle = "rgba(255,245,210,.7)"; ctx.lineWidth = r * .07; ctx.beginPath(); ctx.arc(0, 0, r * .93, -2.4, -1.0); ctx.stroke();
  ctx.restore();
}
