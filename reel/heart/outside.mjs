// outside.mjs — the world he grows up in, as one long morning-to-evening strip he runs through:
// the lane outside home (morning, kites), the school (noon, arches, a banyan), the race track (golden afternoon,
// the stands full of small lit hearts). The sun is always ahead of him, so everything is backlit and edged in gold.
//
// World: x from -1200 to 9600, feet at y = 0. Layers have parallax p (1 = moves with the ground).
import { Path2D, PathOp, clamp, lerp, hash, TAU, rgba, mixc, catmull } from "./lib.mjs";
import { bake, mottle, poly, soft, lin, rad, glow } from "./paint.mjs";

export const STRIP = { x0: -1200, x1: 9600 };
// time of day along the strip: 0 morning .. 1 golden late afternoon
export const dayAt = (x) => clamp((x - 0) / 8200);
const SKY = [ // [k, top, mid, horizon]
  [0, "#4A6A8E", "#C9A9A0", "#F6D2A8"], [.35, "#3E78B0", "#9EC0D6", "#F4E2C2"], [.7, "#3C5E92", "#D9A882", "#FFC98A"], [1, "#30406E", "#D98A6A", "#FFB070"]];
const skyAt = (k) => { let i = 0; while (i < SKY.length - 2 && k > SKY[i + 1][0]) i++; const a = SKY[i], b = SKY[i + 1], u = clamp((k - a[0]) / (b[0] - a[0])); return [1, 2, 3].map((j) => mixc(a[j], b[j], u)); };
export const sunCol = (k) => mixc("#FFE2B8", "#FFB866", k);

// silhouette with a lit edge toward the sun (key = direction toward the light)
export function rimFill(c, path, col, rimCol, key, w = 3, a = .8) {
  c.fillStyle = col; c.fill(path);
  for (const [ww, aa] of [[w * 2.5, .25], [w, 1]]) { const sh = new Path2D(); sh.addPath(path, { a: 1, b: 0, c: 0, d: 1, e: -key[0] * ww, f: -key[1] * ww }); const cr = new Path2D(path); cr.op(sh, PathOp.Difference); c.fillStyle = rgba(rimCol, a * aa); c.fill(cr); }
}
const P = () => new Path2D();
const rect = (p, x, y, w, h) => { p.rect(x, y, w, h); return p; };
const pts = (p, Q) => { Q.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
const circ = (p, x, y, r) => { p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); p.closePath(); return p; };
const union = (A, B) => { A.op(B, PathOp.Union); return A; };

// ---------------------------------------------------------------- shapes
function houseShape(x, w, h, seed) { // an Indian city house: flat roof, railings, balconies, a water tank, a dish, laundry
  const r = (k) => hash(seed * 13.7 + k * 3.1), p = rect(P(), x, -h, w, h);
  // roof edge: a railing with posts (sky shows between them) or a solid parapet
  if (r(1) > .45) { union(p, rect(P(), x - 6, -h - 46, w + 12, 7)); for (let i = 0; i <= w / 26; i++) union(p, rect(P(), x - 4 + i * 26, -h - 46, 5, 46)); }
  else { union(p, rect(P(), x - 8, -h - 26, w + 16, 26)); union(p, rect(P(), x - 12, -h - 30, w + 24, 6)); }
  // water tank (a ribbed cylinder with a domed lid) on a stand
  if (r(2) > .25) { const tx = x + w * (.12 + r(3) * .5), tw = 70 + r(4) * 30, th = 80 + r(5) * 30, ty = -h - (r(1) > .45 ? 46 : 26);
    union(p, rect(P(), tx, ty - 18, tw, 18)); union(p, rect(P(), tx + 6, ty - 18 - th, tw - 12, th)); union(p, pts(P(), catmull([[tx + 6, ty - 18 - th], [tx + tw / 2, ty - 18 - th - 22], [tx + tw - 6, ty - 18 - th]], false, 6).concat([[tx + tw - 6, ty - 18 - th + 2], [tx + 6, ty - 18 - th + 2]]))); union(p, rect(P(), tx + tw / 2 - 8, ty - 18 - th - 30, 16, 10)); }
  // a stair room with a door, and a dish antenna
  if (r(6) > .35) { const sx = x + w * (.6 + r(7) * .2); union(p, rect(P(), sx, -h - 150, w * .28, 150)); union(p, rect(P(), sx - 8, -h - 158, w * .28 + 16, 10)); }
  if (r(8) > .4) { const dx = x + w * (.3 + r(9) * .3), dy = -h - (r(1) > .45 ? 46 : 26); union(p, rect(P(), dx, dy - 50, 4, 50)); const d = P(); d.ellipse(dx + 6, dy - 62, 26, 12, -.6, 0, TAU); d.closePath(); union(p, d); }
  // floors: a balcony per floor with a railing; sometimes laundry and plant pots
  const floors = Math.max(2, Math.round(h / 250));
  for (let f = 1; f < floors; f++) { const by = -h + f * h / floors, bw = w * (.42 + r(10 + f) * .2), bx = r(20 + f) > .5 ? x - 26 : x + w - bw + 26;
    union(p, rect(P(), bx, by, bw, 14)); union(p, rect(P(), bx, by - 62, bw, 6)); for (let i = 0; i <= bw / 16; i++) union(p, rect(P(), bx + i * 16, by - 62, 3, 62));
    if (r(30 + f) > .45) { union(p, rect(P(), bx + 4, by - 120, bw - 8, 2)); for (let i = 0; i < 4; i++) { const cx = bx + 14 + i * (bw - 28) / 4 + r(40 + i) * 10; union(p, rect(P(), cx, by - 119, 18 + r(50 + i) * 18, 30 + r(60 + i) * 30)); } }
    if (r(70 + f) > .5) for (let i = 0; i < 3; i++) { const cx = bx + 20 + i * 34; union(p, rect(P(), cx - 8, by - 82, 16, 18)); union(p, circ(P(), cx, by - 92, 14)); } }
  // window sunshades (chajja) and an AC unit
  for (let f = 0; f < floors; f++) for (let i = 0; i < 2; i++) { if (r(80 + f * 3 + i) < .35) continue; const wx = x + w * (.18 + i * .45), wy = -h + f * h / floors + 54; union(p, pts(P(), [[wx - 14, wy], [wx + 104, wy], [wx + 96, wy + 12], [wx - 6, wy + 12]])); }
  if (r(90) > .5) union(p, rect(P(), x + w, -h * .6, 34, 40));
  return p;
}
export function windowsOf(x, w, h, seed) { const out = [], floors = Math.max(2, Math.round(h / 250)); for (let f = 0; f < floors; f++) for (let i = 0; i < 2; i++) { if (hash(seed * 13.7 + 80 * 3.1 + f * 3 + i) < .35) continue; out.push([x + w * (.18 + i * .45), -h + f * h / floors + 70, 90, 96, hash(seed + f * 5 + i * 7)]); } return out; }
function treeShape(x, h, seed, spread = 1) { // a trunk that forks into branches; leaves gather in clumps at the branch ends
  const p = P(), br = [];
  const grow = (a, ang, L, wd, d) => { const b = [a[0] + Math.sin(ang) * L, a[1] - Math.cos(ang) * L]; union(p, pts(P(), [[a[0] - wd, a[1]], [b[0] - wd * .6, b[1]], [b[0] + wd * .6, b[1]], [a[0] + wd, a[1]]]));
    if (d === 0) { br.push(b); return; } const n = 2 + (hash(seed + d * 7 + a[0]) > .6 ? 1 : 0); for (let i = 0; i < n; i++) grow(b, ang + (i - (n - 1) / 2) * (.55 + hash(seed + i + d) * .3) + (hash(seed * 3 + i * d) - .5) * .3, L * (.62 + hash(seed + i * 3 + d) * .2), wd * .62, d - 1); };
  grow([x, 0], (hash(seed) - .5) * .1, h * .42, h * .035, 3);
  for (const [bx, by] of br) for (let i = 0; i < 22; i++) { const a = hash(seed + bx * .1 + i) * TAU, rr = h * .13 * spread * Math.sqrt(hash(seed + by * .1 + i * 3)); union(p, circ(P(), bx + Math.cos(a) * rr * 1.35, by + Math.sin(a) * rr * .75 - h * .03, h * (.012 + hash(bx + i * 5) * .03) * spread)); }
  return p;
}
function poleShape(x, h) { const p = rect(P(), x - 6, -h, 12, h); union(p, rect(P(), x - 50, -h + 30, 100, 8)); union(p, rect(P(), x - 40, -h + 70, 80, 6)); return p; }
function archesShape(x, w, h, n) { // a school wing: a long two-storey building with an arched corridor below
  const p = rect(P(), x, -h, w, h); union(p, rect(P(), x - 20, -h - 26, w + 40, 26)); union(p, rect(P(), x + w * .42, -h - 150, w * .16, 130)); union(p, pts(P(), [[x + w * .4, -h - 150], [x + w * .5, -h - 210], [x + w * .6, -h - 150]]));
  union(p, circ(P(), x + w * .5, -h - 95, 30)); for (let i = 0; i <= w / 30; i++) union(p, rect(P(), x - 16 + i * 30, -h - 60, 6, 34)); union(p, rect(P(), x - 20, -h - 62, w + 40, 7));
  const holes = P(); const aw = w / n;
  for (let i = 0; i < n; i++) { const ax = x + i * aw + aw * .18, ww = aw * .64, ah = h * .4; holes.moveTo(ax, 0); holes.lineTo(ax, -ah * .7); holes.arc(ax + ww / 2, -ah * .7, ww / 2, Math.PI, 0); holes.lineTo(ax + ww, 0); holes.closePath();
    const wy = -h * .82; holes.rect(ax + ww * .15, wy, ww * .7, h * .22); }
  p.op(holes, PathOp.Difference); return p;
}
function standShape(x, w, h) { // stadium stand: stepped tiers with a sloped roof on posts
  const p = P(); const tiers = 6; for (let i = 0; i < tiers; i++) union(p, rect(P(), x + i * 14, -h * (i + 1) / tiers, w - i * 28, h / tiers + 1));
  union(p, pts(P(), [[x - 40, -h - 160], [x + w + 40, -h - 210], [x + w + 40, -h - 190], [x - 40, -h - 140]])); for (const px of [x, x + w * .5, x + w]) union(p, rect(P(), px - 5, -h - 200, 10, 200));
  return p;
}

// ---------------------------------------------------------------- the strip
const SEG = { lane: [-1200, 2500], school: [2500, 4900], track: [4900, 9600] };
export const OCCLUDERS = [{ x: 2560, kind: "trunk" }, { x: 4900, kind: "pillar" }];
export const TEACHER = { x: 3750 };
export const FINISH = { x: 7300 };
export const STANDS = { x: 5200, w: 3700, h: 300, y: -60 };

// a horizontal gradient whose colour at each image x follows the time of day the viewer will be at when that
// part of a parallax layer is on screen
function dayGrad(c, imgW, p, ox0, colFn) { const g = c.createLinearGradient(0, 0, imgW, 0); for (let i = 0; i <= 24; i++) { const ix = i / 24 * imgW, camX = (ix - ox0) / p; g.addColorStop(i / 24, colFn(dayAt(camX))); } return g; }
const KEY = [.82, -.57];   // toward the sun: ahead (right) and up
export const farCol = (k) => { const [top, m, h] = skyAt(k); return mixc(h, m, .45); };
export const midCol = (k) => { const [top] = skyAt(k); return mixc(top, "#1C1820", .62); };
export const nearCol = (k) => mixc("#141018", "#2A1A16", k * .5);

export async function initStrip() {
  const W = STRIP.x1 - STRIP.x0;
  // where a layer image starts in world x when the camera is at cam.x:  ox = cam.x * (1 - p) + (STRIP.x0 - PAD) * p
  // the image pixel ix then sits at world ox + ix; it is centred on screen when cam.x = (ix - PAD*p... ) — we bake with ox0 = PAD
  const PAD = 1300;
  const mk = async (p, h, base, yOff, build, colFn, rimA, extra = null) => { const w = Math.ceil(W * p + PAD * 2);
    const camX = (ix) => (ix - PAD) / p + STRIP.x0;
    const im = await bake(w, h, (c) => { c.translate(0, h - base); const path = build(w);
      const g = c.createLinearGradient(0, 0, w, 0); for (let i = 0; i <= 30; i++) g.addColorStop(i / 30, colFn(dayAt(camX(i / 30 * w))));
      c.fillStyle = g; c.fill(path);
      // haze: the lower parts of things sit deeper in the bright air
      c.save(); c.clip(path); const hz = c.createLinearGradient(0, -700, 0, 0); hz.addColorStop(0, "rgba(255,220,180,0)"); hz.addColorStop(1, `rgba(255,214,170,${.16 * rimA})`); c.fillStyle = hz; c.fillRect(0, -1200, w, 1300); c.restore();
      for (const [ww, aa] of [[7, .22], [2.6, .9]]) { const sh = new Path2D(); sh.addPath(path, { a: 1, b: 0, c: 0, d: 1, e: -KEY[0] * ww, f: -KEY[1] * ww }); const cr = new Path2D(path); cr.op(sh, PathOp.Difference);
        const gr = c.createLinearGradient(0, 0, w, 0); for (let i = 0; i <= 30; i++) gr.addColorStop(i / 30, rgba(sunCol(dayAt(camX(i / 30 * w))), aa * rimA)); c.fillStyle = gr; c.fill(cr); }
      if (extra) extra(c, w, camX); });
    return { im, p, base, yOff, PAD }; };
  const toImg = (wx, p) => (wx - STRIP.x0) * p + PAD;
  const far = await mk(.25, 760, 80, -90, (w) => { const p = P();
    for (let x = 0; x < w; x += 60 + hash(x) * 140) { const h = 80 + hash(x * .7) * 200; union(p, rect(P(), x, -h, 50 + hash(x * 3) * 120, h + 80)); if (hash(x * 1.3) > .82) { union(p, circ(P(), x + 50, -h - 30, 42)); union(p, rect(P(), x + 48, -h - 100, 4, 50)); } if (hash(x * 2.1) > .9) union(p, pts(P(), [[x, -h], [x + 45, -h - 160], [x + 90, -h]])); }
    union(p, rect(P(), 0, -10, w, 90)); return p; }, farCol, .35);
  const wins = [];
  const mid = await mk(.6, 1000, 80, -36, (w) => { const p = P(), ti = (wx) => toImg(wx, .6);
    let x = 0; while (x < ti(SEG.school[0]) - 200) { const ww = 240 + hash(x) * 220, h = 320 + hash(x * 1.7) * 300; union(p, houseShape(x, ww, h, x)); wins.push(...windowsOf(x, ww, h, x)); x += ww + 14 + hash(x * 2.3) * 70; }
    const sx = ti(SEG.school[0]) + 60; union(p, archesShape(sx, 1400, 560, 10)); union(p, treeShape(sx + 1480, 560, 77, 1.25));
    const tx = ti(SEG.track[0]) + 300; for (let i = 0; i < 4; i++) union(p, standShape(tx + i * 760, 700, 240));
    union(p, rect(P(), 0, -12, w, 92)); return p; }, midCol, .7, (c) => {
      for (const [x, y, ww, hh, rnd] of wins) { if (rnd < .55) { c.fillStyle = "rgba(10,8,14,.35)"; c.fillRect(x, y, ww, hh); continue; } c.fillStyle = rgba(rnd > .8 ? "#FFC27A" : "#E8D2B0", .32 + rnd * .2); c.fillRect(x, y, ww, hh);
        c.fillStyle = "rgba(20,16,22,.55)"; for (let i = 1; i < 4; i++) c.fillRect(x + i * ww / 4 - 2, y, 4, hh); c.fillRect(x, y + hh / 2 - 2, ww, 4); } });
  // near layer (p = 1): the lane's wall, poles, a neem tree, a bicycle; the school's wall, gate and bell; the track's railing
  const near = await mk(1, 1100, 120, 0, (w) => { const p = P(), X = (wx) => toImg(wx, 1);
    // lane
    for (let wx = -1100; wx < 2400; wx += 380) { if (hash(wx) < .25) continue; union(p, rect(P(), X(wx), -130, 360, 130)); union(p, rect(P(), X(wx) - 6, -140, 372, 12)); }
    for (const wx of [-700, 0, 700, 1400, 2100]) union(p, poleShape(X(wx), 640));
    union(p, treeShape(X(1500), 560, 31, .95));
    { const bx = X(380); union(p, circ(P(), bx, -40, 38)); union(p, circ(P(), bx + 120, -40, 38)); const hole = P(); circ(hole, bx, -40, 31); circ(hole, bx + 120, -40, 31); p.op(hole, PathOp.Difference);
      union(p, pts(P(), [[bx, -40], [bx + 50, -100], [bx + 110, -100], [bx + 120, -40], [bx + 114, -40], [bx + 104, -94], [bx + 56, -94], [bx + 4, -38]])); union(p, rect(P(), bx + 40, -118, 30, 8)); union(p, rect(P(), bx + 100, -124, 26, 6)); }
    // school: a compound wall with pillars, a gate, the bell on its post, a flagpole
    for (let wx = 2650; wx < 4850; wx += 300) { union(p, rect(P(), X(wx), -50, 280, 50)); union(p, rect(P(), X(wx), -112, 280, 6)); for (let i = 0; i < 14; i++) union(p, rect(P(), X(wx) + 10 + i * 19, -112, 4, 62)); union(p, rect(P(), X(wx) - 18, -150, 36, 150)); union(p, rect(P(), X(wx) - 25, -160, 50, 12)); }
    union(p, rect(P(), X(3180) - 5, -420, 10, 420)); union(p, rect(P(), X(3180) - 60, -420, 120, 10)); union(p, circ(P(), X(3180) - 30, -380, 26));
    union(p, rect(P(), X(4300) - 4, -760, 8, 760)); union(p, circ(P(), X(4300), -768, 10));
    // track: a low railing in front of the stands, posts for the bunting, the finish posts
    for (let wx = 5000; wx < 9500; wx += 120) union(p, rect(P(), X(wx), -110, 6, 110)); union(p, rect(P(), X(5000), -112, 4500, 8)); union(p, rect(P(), X(5000), -60, 4500, 6));
    for (let wx = 5100; wx < 9500; wx += 900) union(p, rect(P(), X(wx) - 5, -520, 10, 520));
    union(p, rect(P(), X(FINISH.x) - 6, -300, 12, 300));
    union(p, rect(P(), 0, -6, w, 40)); return p; }, nearCol, 1, (c, w) => { const X = (wx) => toImg(wx, 1);
      c.strokeStyle = "rgba(20,14,20,.85)"; c.lineCap = "round";
      const poles = [-700, 0, 700, 1400, 2100];
      for (let i = 0; i < poles.length - 1; i++) for (const [dy, sag, lw] of [[-610, 60, 2.2], [-590, 80, 1.8], [-570, 70, 2], [-532, 100, 1.6]]) { const a = X(poles[i]), b = X(poles[i + 1]); c.lineWidth = lw; c.beginPath(); for (let k = 0; k <= 30; k++) { const u = k / 30; c.lineTo(lerp(a, b, u), dy + sag * 4 * u * (1 - u)); } c.stroke(); }
      for (const [x0, x1, y0, y1, sag] of [[-900, -200, -380, -600, 90], [300, 1100, -560, -300, 70], [1500, 2400, -600, -420, 60]]) { c.lineWidth = 1.6; c.beginPath(); for (let k = 0; k <= 30; k++) { const u = k / 30; c.lineTo(X(lerp(x0, x1, u)), lerp(y0, y1, u) + sag * 4 * u * (1 - u)); } c.stroke(); } });
  return { far, mid, near };
}

// the backdrop for a camera; `view` = [x, y, w, h] world rect
export function drawStrip(ctx, S, t, cam, view) {
  const [vx, vy, vw, vh] = view, k = dayAt(cam.x), [top, midc, hor] = skyAt(k), sc = sunCol(k);
  ctx.fillStyle = lin(ctx, 0, vy, 0, vy + vh, [[0, top], [.55, midc], [.8, hor], [1, hor]]); ctx.fillRect(vx - 50, vy - 50, vw + 100, vh + 100);
  // the sun ahead, lower as the day goes
  const sx = vx + vw * (.8 + .04 * k), sy = vy + vh * (k < .35 ? lerp(.42, .2, k / .35) : lerp(.2, .52, (k - .35) / .65));
  glow(ctx, sx, sy, vh * 1.1, sc, .5); glow(ctx, sx, sy, vh * .22, "#FFF4DE", .75); ctx.fillStyle = "#FFF8EA"; ctx.beginPath(); ctx.arc(sx, sy, 30, 0, TAU); ctx.fill();
  // soft cloud streaks
  ctx.save(); ctx.globalCompositeOperation = "lighter"; for (let i = 0; i < 8; i++) { const span = vw + 1200, cx = vx - 600 + ((hash(i) * 5000 - cam.x * .1 + t * 8) % span + span) % span, cy = vy + vh * (.08 + hash(i * 3) * .32);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(3, .3); ctx.fillStyle = rad(ctx, 0, 0, 0, 220, [[0, rgba(hor, .16)], [1, rgba(hor, 0)]]); ctx.fillRect(-220, -220, 440, 440); ctx.restore(); } ctx.restore();
  // a kite tugging on its string, mornings only
  if (k < .3) { const al = clamp((.3 - k) * 6), kx = vx + vw * .6 + Math.sin(t * .9) * 30, ky = vy + vh * .22 + Math.sin(t * 1.3) * 18;
    ctx.save(); ctx.globalAlpha = al; ctx.strokeStyle = rgba(midCol(k), .6); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(kx, ky + 22); ctx.quadraticCurveTo(kx - 140, ky + 300, kx - 300, vy + vh); ctx.stroke();
    ctx.translate(kx, ky); ctx.rotate(.78 + Math.sin(t * 1.7) * .2); ctx.fillStyle = midCol(k); ctx.fillRect(-17, -17, 34, 34); ctx.fillStyle = rgba(sc, .5); ctx.fillRect(-17, -17, 34, 3); ctx.restore(); }
  for (const [L, hz] of [[S.far, .4], [S.mid, .22], [S.near, 0]]) { const ox = cam.x * (1 - L.p) + STRIP.x0 * L.p - L.PAD;
    ctx.drawImage(L.im, ox, L.yOff + L.base - L.im.height);
    ctx.fillStyle = lin(ctx, 0, L.yOff - 480, 0, L.yOff + 40, [[0, rgba(hor, 0)], [1, rgba(hor, hz)]]); ctx.fillRect(vx - 50, L.yOff - 480, vw + 100, 520); }
}

// ground: dusty lane -> school courtyard -> red track, with the low sun's light lying along it
export function drawGround(ctx, cam, view, t) {
  const [vx, vy, vw, vh] = view, k = dayAt(cam.x), sc = sunCol(k), x0 = vx - 50, x1 = vx + vw + 50;
  const g = ctx.createLinearGradient(x0, 0, x1, 0), col = (wx) => wx < 2500 ? "#3A2A26" : wx < 4900 ? "#4A3424" : "#5A2418";
  for (let i = 0; i <= 8; i++) { const wx = lerp(x0, x1, i / 8); g.addColorStop(i / 8, mixc(col(wx), col(wx + 300), .5)); }
  ctx.fillStyle = g; ctx.fillRect(x0, -4, x1 - x0, vy + vh - -4 + 50);
  ctx.fillStyle = lin(ctx, 0, -4, 0, 420, [[0, rgba(sc, .32)], [.15, rgba(sc, .1)], [1, "rgba(0,0,0,.45)"]]); ctx.fillRect(x0, -4, x1 - x0, 430);
  // lane lines on the track, converging a little toward the stands
  if (x1 > 4900) { ctx.save(); ctx.beginPath(); ctx.rect(Math.max(x0, 4900), -4, x1 - Math.max(x0, 4900), 500); ctx.clip(); ctx.strokeStyle = "rgba(240,225,210,.35)"; for (const y of [24, 70, 140, 240, 380]) { ctx.lineWidth = 2 + y / 60; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); } ctx.restore();
    if (FINISH.x > x0 && FINISH.x < x1) { ctx.fillStyle = "rgba(245,240,230,.65)"; ctx.beginPath(); ctx.moveTo(FINISH.x - 4, -2); ctx.lineTo(FINISH.x + 4, -2); ctx.lineTo(FINISH.x + 70, 480); ctx.lineTo(FINISH.x + 50, 480); ctx.fill(); } }
}
// bunting across the track and the school flag: small cloth that moves
export function drawCloth(ctx, cam, view, t) {
  const [vx, , vw] = view, k = dayAt(cam.x), nc = nearCol(k), sc = sunCol(k);
  const flags = ["#B83A3A", "#E0A030", "#3A7AB8", "#3A9A5A", "#E8E0D0"];
  for (let px = 5100; px < 9400; px += 900) { if (px + 900 < vx - 100 || px > vx + vw + 100) continue; const a = [px, -510], b = [px + 900, -510];
    ctx.strokeStyle = rgba(nc, .9); ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 20; i++) { const u = i / 20, x = lerp(a[0], b[0], u), y = -510 + Math.sin(u * Math.PI) * 90; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    for (let i = 1; i < 18; i++) { const u = i / 18, x = lerp(a[0], b[0], u), y = -510 + Math.sin(u * Math.PI) * 90, sw = Math.sin(t * 3 + i * .9 + px) * 5;
      ctx.fillStyle = mixc(flags[(i + px / 900) % 5 | 0], nc, .55); ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.lineTo(x + sw, y + 36); ctx.closePath(); ctx.fill(); ctx.fillStyle = rgba(sc, .35); ctx.fillRect(x - 14, y, 28, 2); } }
  if (4300 > vx - 300 && 4300 < vx + vw + 300) { const fx = 4300, fy = -750; ctx.fillStyle = mixc("#D8742A", nc, .4); ctx.beginPath(); ctx.moveTo(fx + 4, fy); for (let i = 0; i <= 12; i++) { const u = i / 12; ctx.lineTo(fx + 4 + u * 150, fy + Math.sin(t * 4 - u * 4) * 8 * u); }
      for (let i = 12; i >= 0; i--) { const u = i / 12; ctx.lineTo(fx + 4 + u * 150, fy + 90 + Math.sin(t * 4 - u * 4) * 8 * u); } ctx.closePath(); ctx.fill(); }
}
// near-camera occluders he passes behind (he comes out older)
export function drawOccluders(ctx, cam, view) {
  const k = dayAt(cam.x);
  for (const O of OCCLUDERS) { const x = O.x + (O.x - cam.x) * .45; if (x < view[0] - 500 || x > view[0] + view[2] + 500) continue;
    ctx.save(); ctx.filter = "blur(8px)"; ctx.fillStyle = mixc("#0C0A0E", "#1A1012", k * .3);
    if (O.kind === "trunk") { ctx.beginPath(); ctx.moveTo(x - 140, 900); ctx.bezierCurveTo(x - 120, 300, x - 90, -200, x - 110, -1400); ctx.lineTo(x + 150, -1400); ctx.bezierCurveTo(x + 110, -300, x + 140, 300, x + 190, 900); ctx.fill(); }
    else { ctx.fillRect(x - 130, -1400, 260, 2400); ctx.fillStyle = rgba(sunCol(k), .25); ctx.fillRect(x + 120, -1400, 10, 2400); }
    ctx.restore(); }
}
