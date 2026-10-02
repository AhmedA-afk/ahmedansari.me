// paint.mjs — painterly building blocks for the worlds: baked layers, noise textures, light through windows,
// dust in the air, soft glows. Everything here is either baked once (to an Image) or cheap enough per frame.
import { createCanvas, Image, Path2D, clamp, lerp, hash, TAU, rgba, mixc, catmull } from "./lib.mjs";

// draw into an offscreen canvas once, then decode to an Image (drawing a canvas onto a canvas leaks in this binding)
export async function bake(w, h, fn) {
  const cv = createCanvas(Math.ceil(w), Math.ceil(h)), c = cv.getContext("2d"); await fn(c, cv);
  return decode(cv.toBuffer("image/png"));
}
export async function decode(buf) { const im = new Image(); await new Promise((res) => { im.onload = res; im.onerror = res; im.src = buf; }); await new Promise((r) => setTimeout(r, 20)); return im; }

// value noise, smooth, tileable-ish; fbm over octaves
// period (px, py) makes the noise tile seamlessly
const vn = (x, y, s, px = 1e9, py = 1e9) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const h = (a, b) => { a = ((a % px) + px) % px; b = ((b % py) + py) % py; return hash(a * 157.31 + b * 311.7 + s * 71.3); }; return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v); };
export const fbm = (x, y, oct = 4, s = 1, px = 1e9, py = 1e9) => { let a = 0, amp = .5, f = 1, n = 0; for (let i = 0; i < oct; i++) { a += vn(x * f, y * f, s + i * 13, px * f, py * f) * amp; n += amp; amp *= .5; f *= 2; } return a / n; };

// a texture of soft mottling (plaster, paper, sky haze): returns an Image, transparent-to-colour
export async function mottle(w, h, { scale = 120, oct = 5, seed = 1, col = "#000000", a0 = 0, a1 = .25, streak = 0 } = {}) {
  const cv = createCanvas(w, h), c = cv.getContext("2d"), img = c.createImageData(w, h), d = img.data, n = parseInt(col.slice(1), 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255;
  const PX = Math.round(w / scale), PY = Math.round(h / (scale * (1 + streak)));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = fbm(x / (w / PX), y / (h / PY), oct, seed, PX, PY), i = (y * w + x) * 4;
    d[i] = R; d[i + 1] = G; d[i + 2] = B; d[i + 3] = 255 * clamp(lerp(a0, a1, clamp((v - .3) / .4))); }
  c.putImageData(img, 0, 0); return decode(cv.toBuffer("image/png"));
}
// film grain tiles (several, so the grain moves)
export async function grainTiles(n = 4, sz = 256, amt = 38) {
  const out = []; for (let k = 0; k < n; k++) { const cv = createCanvas(sz, sz), c = cv.getContext("2d"), img = c.createImageData(sz, sz), d = img.data;
    for (let i = 0; i < sz * sz; i++) { const v = 128 + (hash(i * 1.37 + k * 911.1) - .5) * 2 * amt; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
    c.putImageData(img, 0, 0); out.push(await decode(cv.toBuffer("image/png"))); }
  await new Promise((r) => setTimeout(r, 40)); return out;
}

export const poly = (ctx, P) => { ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
export const soft = (ctx, P, step = 6) => poly(ctx, catmull(P, true, step));
export function lin(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) g.addColorStop(o, c); return g; }
export function rad(ctx, x, y, r0, r1, stops, x1 = x, y1 = y) { const g = ctx.createRadialGradient(x, y, r0, x1, y1, r1); for (const [o, c] of stops) g.addColorStop(o, c); return g; }
export function glow(ctx, x, y, r, col, a = 1, mode = "lighter") { ctx.save(); ctx.globalCompositeOperation = mode; ctx.fillStyle = rad(ctx, x, y, 0, r, [[0, rgba(col, a)], [.35, rgba(col, a * .35)], [1, rgba(col, 0)]]); ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); }

// a shaft of light: a quad from the source edge (a0,a1) to the landing edge (b0,b1), fading along its length,
// with soft streaks inside it (light catching the dust)
export function shaft(ctx, a0, a1, b0, b1, col, a = .35, t = 0, seed = 1, streaks = 7) {
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const mA = [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2], mB = [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2];
  ctx.filter = "blur(10px)"; poly(ctx, [a0, a1, b1, b0]); ctx.fillStyle = lin(ctx, mA[0], mA[1], mB[0], mB[1], [[0, rgba(col, a)], [.6, rgba(col, a * .55)], [1, rgba(col, a * .15)]]); ctx.fill();
  for (let i = 0; i < streaks; i++) { const u0 = hash(seed * 31 + i * 7.1), w = .03 + hash(seed + i * 3.3) * .07, fl = .5 + .5 * Math.sin(t * (.4 + hash(i + seed) * .5) + i * 2.1), u1 = Math.min(1, u0 + w);
    const P = (e0, e1, u) => [lerp(e0[0], e1[0], u), lerp(e0[1], e1[1], u)];
    poly(ctx, [P(a0, a1, u0), P(a0, a1, u1), P(b0, b1, u1), P(b0, b1, u0)]); ctx.fillStyle = lin(ctx, mA[0], mA[1], mB[0], mB[1], [[0, rgba(col, a * .5 * fl)], [1, rgba(col, 0)]]); ctx.fill(); }
  ctx.filter = "none"; ctx.restore();
}
// dust motes drifting in a region; brighter where `lightFn(x,y)` says the light is
export function motes(ctx, box, n, t, lightFn, seed = 3, col = "#FFE6B8", size = 1) {
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) { const h1 = hash(i * 3.17 + seed), h2 = hash(i * 7.31 + seed * 2), h3 = hash(i * 1.93 + seed * 5), sp = .15 + h3 * .35;
    const x = box[0] + ((h1 * box[2] + Math.sin(t * sp * .7 + i) * 30 + t * 6 * (h2 - .4)) % box[2] + box[2]) % box[2], y = box[1] + ((h2 * box[3] + t * 9 * sp + Math.cos(t * sp + i * 1.7) * 20) % box[3] + box[3]) % box[3];
    const L = lightFn(x, y); if (L < .02) continue; const tw = .55 + .45 * Math.sin(t * (1 + h3 * 2) + i), r = (1.2 + h3 * 2.6) * size, a = L * tw * (.35 + h1 * .5);
    ctx.fillStyle = rad(ctx, x, y, 0, r * 3, [[0, rgba(col, a)], [.4, rgba(col, a * .3)], [1, rgba(col, 0)]]); ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); }
  ctx.restore();
}
// point-in-quad test helper for light masks
export function inQuad(p, Q) { let s = 0; for (let i = 0; i < 4; i++) { const a = Q[i], b = Q[(i + 1) % 4]; const c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); if (c === 0) continue; if (s === 0) s = Math.sign(c); else if (Math.sign(c) !== s) return false; } return true; }
