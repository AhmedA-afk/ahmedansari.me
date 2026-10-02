// person.mjs — a storybook paper-doll with a gullak in its chest. Front-facing torso (so the heart is always visible),
// IK arms and legs, and a face that does the acting: eyes, brows, mouth, tears, plus posture.
//   person(ctx, x, groundY, s, look, pose, state, t)  -> anchors {slot, chest, head, handL, handR} in the caller's coordinates
import { core, catmull, createCanvas, clamp, lerp, ss, hash, rng, noise1, ik, TAU, mixc, rgba, R, rad } from "./lib.mjs";
import { paint, tube, gullak, INKC } from "./art.mjs";
const { ellipse, stroke, fill, line, poly, smooth } = core;

// ------------------------------------------------------------------ bodies
export function dims(age = 26, k = {}) {
  const f = clamp((age - 5) / 21);
  const h = k.h ?? 1, w = k.w ?? 1;
  const d = {
    legLen: lerp(100, 190, f) * h, torso: lerp(82, 140, f) * h, headR: lerp(38, 33, f) * (k.head ?? 1), neck: lerp(8, 16, f),
    sh: lerp(30, 46, f) * w, hipW: lerp(26, 36, f) * w, upper: lerp(44, 78, f) * h, fore: lerp(40, 72, f) * h,
    thigh: lerp(52, 98, f) * h, shin: lerp(48, 92, f) * h, potR: lerp(25, 40, f) * (k.pot ?? 1), limbW: lerp(15, 24, f) * w,
  };
  d.thigh = d.legLen * .515; d.shin = d.legLen * .485;
  return d;
}
// ------------------------------------------------------------------ looks
const SKIN = { a: "#C98F5E", b: "#B87A4C", c: "#D9A271", d: "#E1B98C", e: "#A8683F" };
export const LOOK = {
  hero:    { skin: SKIN.a, hair: "#1C1612", hairStyle: "messy", top: "#E7A23C", sleeve: "#E7A23C", pants: "#3F5E8C", shoe: "#3A2A22", garment: "tee" },
  heroKid: { skin: SKIN.a, hair: "#1C1612", hairStyle: "messy", top: "#E7A23C", sleeve: "#E7A23C", pants: "#3F5E8C", shoe: "#3A2A22", garment: "tee" },
  heroGrown: { skin: SKIN.a, hair: "#1C1612", hairStyle: "messy", top: "#4F7A6E", sleeve: "#4F7A6E", pants: "#3A4252", shoe: "#2E241E", garment: "shirt" },
  heroWork: { skin: SKIN.a, hair: "#1C1612", hairStyle: "messy", top: "#8E9BAD", sleeve: "#8E9BAD", pants: "#3A3F4A", shoe: "#26211F", garment: "shirt" },
  heroHood: { skin: SKIN.a, hair: "#1C1612", hairStyle: "messy", top: "#4A4470", sleeve: "#4A4470", pants: "#2E3040", shoe: "#26211F", garment: "hoodie" },
  heroCold: { skin: "#A9805C", hair: "#1C1612", hairStyle: "messy", top: "#3F434C", sleeve: "#3F434C", pants: "#2B2D33", shoe: "#1C1B1E", garment: "hoodie" },
  heroEnd: { skin: SKIN.a, hair: "#1C1612", hairStyle: "messy", top: "#E7A23C", sleeve: "#E7A23C", pants: "#3F5E8C", shoe: "#3A2A22", garment: "shirt" },
  heroKnight: { skin: SKIN.a, hair: "#1C1612", hairStyle: "messy", top: "#3F66A8", sleeve: "#3F66A8", pants: "#262B44", shoe: "#1E2036", garment: "armor", trim: "#E6B44C" },
  allyA: { skin: SKIN.c, hair: "#3B2A20", hairStyle: "short", top: "#3E8F6E", sleeve: "#3E8F6E", pants: "#22362E", shoe: "#1E2A24", garment: "armor", trim: "#E6B44C" },
  allyB: { skin: SKIN.e, hair: "#1E1713", hairStyle: "bob", top: "#8C6BB1", sleeve: "#8C6BB1", pants: "#33264A", shoe: "#241C34", garment: "armor", trim: "#E6B44C" },
  allyC: { skin: SKIN.b, hair: "#2A1D18", hairStyle: "short", top: "#B0884A", sleeve: "#B0884A", pants: "#3A3022", shoe: "#2A2218", garment: "armor", trim: "#E6B44C" },
  mother:  { skin: SKIN.b, hair: "#2A1D18", hairStyle: "bun", bindi: true, top: "#B5483E", sleeve: "#B5483E", pants: "#B5483E", shoe: "#4A3326", garment: "dress", scale: { h: .98 } },
  father:  { skin: SKIN.a, hair: "#6A6A6A", hairStyle: "short", glasses: true, top: "#7C8A9A", sleeve: "#7C8A9A", pants: "#4B4A4E", shoe: "#2E241E", garment: "shirt" },
  teacher: { skin: SKIN.c, hair: "#3A2A24", hairStyle: "bob", top: "#6F9A86", sleeve: "#6F9A86", pants: "#6F9A86", shoe: "#3A2A22", garment: "dress" },
  manager: { skin: SKIN.d, hair: "#2A2A2E", hairStyle: "slick", top: "#2F3440", sleeve: "#2F3440", pants: "#2F3440", shoe: "#16161A", garment: "suit", tie: "#8C2F2F" },
  queen:   { skin: SKIN.c, hair: "#14101A", hairStyle: "pony", top: "#7B2D4F", sleeve: "#7B2D4F", pants: "#2A2038", shoe: "#1C1424", garment: "armor", trim: "#E5B44C", tint: "queen", scale: { h: 1.1, w: .9, head: .94 } },
  girl2:   { skin: SKIN.b, hair: "#2A1B16", hairStyle: "braid", top: "#F1E3C3", sleeve: "#F1E3C3", pants: "#E3C77E", shoe: "#8A5A3A", garment: "kurta", tint: "golden", flower: "#F2A07B", scale: { h: .97 } },
  friend:  { skin: SKIN.e, hair: "#1E1713", hairStyle: "bob", top: "#8C6BB1", sleeve: "#8C6BB1", pants: "#5A4B7A", shoe: "#2E241E", garment: "dress", tint: "soft" },
  pal:     { skin: SKIN.c, hair: "#3B2A20", hairStyle: "short", top: "#5E9C8E", sleeve: "#5E9C8E", pants: "#3E4A5E", shoe: "#2E241E", garment: "tee" },
  colleague:{ skin: SKIN.b, hair: "#2A1D18", hairStyle: "short", top: "#A9A39A", sleeve: "#A9A39A", pants: "#6E6A66", shoe: "#2E241E", garment: "shirt" },
};

// ------------------------------------------------------------------ faces
// face: { eyes: open|closed|happy|wide|sad|cold|empty|down, brows: neutral|sad|angry|raised|worried, mouth: smile|grin|flat|frown|o|sob|smirk|small,
//         blush, tears (0..1), look:[dx,dy], sweat }
function drawFace(ctx, hr, f, t, look) {
  const eyeY = -hr * .02, ex = hr * .36, ew = hr * .115, eh = hr * .15;
  const lk = f.look || [0, 0], blink = f.eyes !== "closed" && ((t * 1 + (look.blink || 0)) % 4.1) < .11;
  // brows: inner/outer end offsets carry the mood
  const BR = { neutral: [0, 0], sad: [-.13, .05], angry: [.11, -.05], raised: [-.1, -.1], worried: [-.1, .02] }[f.brows || "neutral"] || [0, 0];
  for (const sd of [-1, 1]) { const by = eyeY - hr * .32 - (f.eyes === "wide" ? hr * .06 : 0);
    const xi = sd * (ex - hr * .15), xo = sd * (ex + hr * .17), yi = by + BR[0] * hr, yo = by + BR[1] * hr;
    ctx.beginPath(); ctx.moveTo(xi, yi); ctx.quadraticCurveTo((xi + xo) / 2, Math.min(yi, yo) - hr * .05, xo, yo);
    ctx.lineWidth = hr * .08; ctx.strokeStyle = INKC; ctx.lineCap = "round"; ctx.stroke(); }
  // eyes
  for (const sd of [-1, 1]) {
    const px = sd * ex + lk[0] * hr * .08, py = eyeY + lk[1] * hr * .08;
    if (blink || f.eyes === "closed") { ctx.beginPath(); ctx.moveTo(sd * ex - ew * 1.25, eyeY); ctx.quadraticCurveTo(sd * ex, eyeY + hr * .09, sd * ex + ew * 1.25, eyeY); ctx.lineWidth = hr * .07; ctx.strokeStyle = INKC; ctx.stroke(); continue; }
    if (f.eyes === "happy") { ctx.beginPath(); ctx.moveTo(sd * ex - ew * 1.3, eyeY + hr * .05); ctx.quadraticCurveTo(sd * ex, eyeY - hr * .13, sd * ex + ew * 1.3, eyeY + hr * .05); ctx.lineWidth = hr * .08; ctx.strokeStyle = INKC; ctx.stroke(); continue; }
    const sc = f.eyes === "wide" ? 1.35 : f.eyes === "cold" ? .8 : f.eyes === "empty" ? .8 : 1;
    ctx.beginPath(); ctx.ellipse(px, py, ew * sc, eh * sc * (f.eyes === "cold" ? .62 : 1), 0, 0, TAU); ctx.fillStyle = f.eyes === "empty" ? "#3A3430" : "#231712"; ctx.fill();
    if (f.eyes !== "empty" && f.eyes !== "cold") { ctx.beginPath(); ctx.arc(px - ew * .3, py - eh * .32, ew * .36, 0, TAU); ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.fill(); }
    if (f.eyes === "cold") { ctx.beginPath(); ctx.arc(px + sd * -ew * .2, py - eh * .1, ew * .22, 0, TAU); ctx.fillStyle = "rgba(190,215,255,.9)"; ctx.fill(); }
    if (f.eyes === "sad" || f.eyes === "empty" || f.eyes === "down") { ctx.beginPath(); ctx.moveTo(px - ew * 1.4, py - eh * (f.eyes === "empty" ? .35 : .55)); ctx.lineTo(px + ew * 1.4, py - eh * (f.eyes === "empty" ? .35 : .55)); ctx.lineTo(px + ew * 1.4, py - eh * 1.5); ctx.lineTo(px - ew * 1.4, py - eh * 1.5); ctx.closePath(); ctx.save(); ctx.fillStyle = look.skinC || "#C98F5E"; ctx.globalAlpha = .96; ctx.fill(); ctx.restore(); ctx.beginPath(); ctx.moveTo(px - ew * 1.35, py - eh * (f.eyes === "empty" ? .35 : .55)); ctx.lineTo(px + ew * 1.35, py - eh * (f.eyes === "empty" ? .35 : .55)); ctx.lineWidth = hr * .06; ctx.strokeStyle = INKC; ctx.stroke(); }
    if (f.eyes === "cold") { ctx.beginPath(); ctx.moveTo(px - ew * 1.5, py - eh * .62); ctx.lineTo(px + ew * 1.5, py - eh * .62); ctx.lineWidth = hr * .08; ctx.strokeStyle = INKC; ctx.stroke(); }
  }
  // nose: a small soft hook
  ctx.beginPath(); ctx.moveTo(0, eyeY + hr * .14); ctx.quadraticCurveTo(hr * .07, eyeY + hr * .27, -hr * .02, eyeY + hr * .31); ctx.lineWidth = hr * .045; ctx.strokeStyle = "rgba(90,50,30,.55)"; ctx.stroke();
  // mouth
  const my = hr * .5, mw = hr * .2, m = f.mouth || "small";
  ctx.lineWidth = hr * .065; ctx.strokeStyle = INKC; ctx.lineCap = "round";
  if (m === "smile") { ctx.beginPath(); ctx.moveTo(-mw, my - hr * .02); ctx.quadraticCurveTo(0, my + hr * .22, mw, my - hr * .02); ctx.stroke(); }
  else if (m === "grin") { ctx.beginPath(); ctx.moveTo(-mw * 1.25, my - hr * .03); ctx.quadraticCurveTo(0, my + hr * .38, mw * 1.25, my - hr * .03); ctx.closePath(); ctx.fillStyle = "#6E1F1F"; ctx.fill(); ctx.stroke(); ctx.save(); ctx.clip(); ctx.fillStyle = "#F4EDE0"; ctx.fillRect(-mw, my - hr * .04, mw * 2, hr * .09); ctx.restore(); }
  else if (m === "flat") { ctx.beginPath(); ctx.moveTo(-mw * .8, my); ctx.lineTo(mw * .8, my); ctx.stroke(); }
  else if (m === "frown") { ctx.beginPath(); ctx.moveTo(-mw, my + hr * .09); ctx.quadraticCurveTo(0, my - hr * .12, mw, my + hr * .09); ctx.stroke(); }
  else if (m === "o") { ctx.beginPath(); ctx.ellipse(0, my + hr * .04, hr * .08, hr * .11, 0, 0, TAU); ctx.fillStyle = "#6E1F1F"; ctx.fill(); ctx.stroke(); }
  else if (m === "sob") { ctx.beginPath(); ctx.moveTo(-mw * 1.2, my + hr * .1); for (let i = 1; i <= 6; i++) ctx.lineTo(-mw * 1.2 + i * mw * .4, my + hr * (i % 2 ? -.02 : .13)); ctx.stroke(); }
  else if (m === "smirk") { ctx.beginPath(); ctx.moveTo(-mw * .8, my + hr * .03); ctx.quadraticCurveTo(0, my + hr * .08, mw * 1.1, my - hr * .1); ctx.stroke(); }
  else if (m === "shout") { ctx.beginPath(); ctx.ellipse(0, my + hr * .08, hr * .2, hr * .17, 0, 0, TAU); ctx.fillStyle = "#5A1818"; ctx.fill(); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-mw * .6, my); ctx.quadraticCurveTo(0, my + hr * .07, mw * .6, my); ctx.stroke(); }
  if (f.blush) { ctx.save(); ctx.globalAlpha *= f.blush * .5; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * hr * .52, hr * .27, hr * .17, hr * .09, 0, 0, TAU); ctx.fillStyle = "#E7736B"; ctx.fill(); } ctx.restore(); }
  if (f.tears) { const k = f.tears; for (const sd of [-1, 1]) { const ph = (t * .9 + (sd > 0 ? .4 : 0)) % 1; ctx.beginPath(); ctx.moveTo(sd * ex, eyeY + hr * .12); ctx.quadraticCurveTo(sd * (ex + hr * .12), eyeY + hr * .45, sd * (ex + hr * .1), eyeY + hr * (.5 + ph * .55)); ctx.lineWidth = hr * .09; ctx.strokeStyle = `rgba(150,200,235,${.8 * k})`; ctx.stroke();
      ctx.beginPath(); ctx.arc(sd * (ex + hr * .1), eyeY + hr * (.5 + ph * .55), hr * .06, 0, TAU); ctx.fillStyle = `rgba(170,215,245,${.9 * k})`; ctx.fill(); } }
  if (f.sweat) { ctx.beginPath(); ctx.moveTo(hr * .9, -hr * .45); ctx.quadraticCurveTo(hr * 1.05, -hr * .15, hr * .9, -hr * .08); ctx.quadraticCurveTo(hr * .75, -hr * .15, hr * .9, -hr * .45); ctx.fillStyle = "rgba(160,205,235,.9)"; ctx.fill(); }
}
// ------------------------------------------------------------------ hair (back layer + front layer)
function hairBack(ctx, hr, look, t, wind) {
  const c = look.hair, st = look.hairStyle;
  if (st === "pony") { // a long ponytail streaming with the run
    const sw = Math.sin(t * 5) * 8 * wind, base = [-hr * .5, -hr * .5];
    const P = [[base[0], base[1]], [base[0] - hr * 1.2, base[1] - hr * .35 + sw], [base[0] - hr * 2.4, base[1] + hr * .1 + sw * 1.4], [base[0] - hr * 3.4, base[1] + hr * .9 + sw * 2]];
    tube(ctx, catmull(P, false, 5), hr * .55, hr * .06, c, { ew: 2.2 });
  } else if (st === "bob") { paint(ctx, () => { ctx.beginPath(); ctx.moveTo(-hr * .98, -hr * .1); ctx.quadraticCurveTo(-hr * 1.15, hr * .8, -hr * .6, hr * 1.05); ctx.lineTo(hr * .6, hr * 1.05); ctx.quadraticCurveTo(hr * 1.15, hr * .8, hr * .98, -hr * .1); ctx.closePath(); }, c, { ew: 2.5, sz: hr, grain: .25 }); }
  else if (st === "braid") { paint(ctx, () => { ctx.beginPath(); ctx.moveTo(-hr, -hr * .1); ctx.quadraticCurveTo(-hr * 1.2, hr * 1.1, -hr * .5, hr * 1.5); ctx.lineTo(hr * .5, hr * 1.5); ctx.quadraticCurveTo(hr * 1.2, hr * 1.1, hr, -hr * .1); ctx.closePath(); }, c, { ew: 2.5, sz: hr, grain: .25 }); }
  else if (st === "bun") { ellipse(ctx, 0, -hr * 1.15, hr * .42, hr * .36); paint(ctx, () => ellipse(ctx, 0, -hr * 1.1, hr * .42, hr * .36), c, { ew: 2.5, sz: hr * .4 }); }
}
function hairFront(ctx, hr, look, t, wind) {
  const c = look.hair, st = look.hairStyle;
  if (st === "none") return;
  const cap = () => { ctx.beginPath(); ctx.moveTo(-hr * .98, hr * .05); ctx.quadraticCurveTo(-hr * 1.1, -hr * 1.05, 0, -hr * 1.12); ctx.quadraticCurveTo(hr * 1.1, -hr * 1.05, hr * .98, hr * .05); ctx.quadraticCurveTo(hr * .85, -hr * .55, hr * .2, -hr * .62); ctx.quadraticCurveTo(-hr * .35, -hr * .5, -hr * .55, -hr * .38); ctx.quadraticCurveTo(-hr * .8, -hr * .3, -hr * .98, hr * .05); ctx.closePath(); };
  if (st === "messy") { // tousled tufts
    paint(ctx, () => { ctx.beginPath(); ctx.moveTo(-hr * .98, hr * .02); ctx.lineTo(-hr * 1.1, -hr * .5); ctx.lineTo(-hr * .8, -hr * .75); ctx.lineTo(-hr * .85, -hr * 1.1); ctx.lineTo(-hr * .35, -hr * .95); ctx.lineTo(-hr * .2, -hr * 1.28); ctx.lineTo(hr * .15, -hr * 1.02); ctx.lineTo(hr * .5, -hr * 1.2); ctx.lineTo(hr * .62, -hr * .88); ctx.lineTo(hr * 1.0, -hr * .8); ctx.lineTo(hr * 1.05, -hr * .35); ctx.lineTo(hr * .98, hr * .02); ctx.quadraticCurveTo(hr * .8, -hr * .5, hr * .3, -hr * .55); ctx.lineTo(hr * .05, -hr * .35); ctx.lineTo(-hr * .2, -hr * .56); ctx.lineTo(-hr * .5, -hr * .36); ctx.quadraticCurveTo(-hr * .85, -hr * .4, -hr * .98, hr * .02); ctx.closePath(); }, c, { ew: 2.6, sz: hr, grain: .25 });
  } else if (st === "short" || st === "slick") { paint(ctx, cap, c, { ew: 2.6, sz: hr, grain: .25 }); }
  else if (st === "bob" || st === "braid" || st === "bun") { paint(ctx, () => { ctx.beginPath(); ctx.moveTo(-hr * 1.0, hr * .1); ctx.quadraticCurveTo(-hr * 1.1, -hr * 1.1, 0, -hr * 1.12); ctx.quadraticCurveTo(hr * 1.1, -hr * 1.1, hr * 1.0, hr * .1); ctx.quadraticCurveTo(hr * .9, -hr * .4, hr * .1, -hr * .64); ctx.quadraticCurveTo(-hr * .6, -hr * .5, -hr * 1.0, hr * .1); ctx.closePath(); }, c, { ew: 2.6, sz: hr, grain: .25 }); }
  else if (st === "pony") { paint(ctx, () => { ctx.beginPath(); ctx.moveTo(-hr * 1.0, hr * .15); ctx.quadraticCurveTo(-hr * 1.1, -hr * 1.1, 0, -hr * 1.12); ctx.quadraticCurveTo(hr * 1.1, -hr * 1.1, hr * 1.0, hr * .1); ctx.quadraticCurveTo(hr * .7, -hr * .2, hr * .12, -hr * .72); ctx.quadraticCurveTo(-hr * .5, -hr * .6, -hr * 1.0, hr * .15); ctx.closePath(); }, c, { ew: 2.6, sz: hr, grain: .25 }); }
}
// ------------------------------------------------------------------ the person
const bobFor = (p) => p.bob ?? 0;
export function person(ctx, x, y, s, look, pose = {}, st = null, t = 0) {
  const d = dims(pose.age ?? 26, look.scale || {}), fl = pose.flip ? -1 : 1, face = { ...(pose.face || {}) };
  const crouch = pose.crouch || 0, lean = pose.lean || 0, hipDx = pose.hipDx || 0;
  const pelvisY = -(d.legLen - crouch) + (pose.bob || 0), hipJ = d.hipW * .55, torso = d.torso;
  const skin = look.skin, shirt = look.top, pants = look.pants;
  look.skinC = skin;
  const anchors = {};
  const toW = (lx, ly) => [x + s * fl * lx, y + s * ly];
  const bodyPt = (px, py) => { const c = Math.cos(lean), sn = Math.sin(lean); return toW(hipDx + c * px - sn * py, pelvisY + sn * px + c * py); };
  ctx.save(); ctx.translate(x, y); ctx.scale(s * fl, s);
  if (!pose.noShadow) { ctx.save(); ctx.globalAlpha *= .22; ellipse(ctx, hipDx * .6, 3, d.hipW * 2.1, 9); ctx.fillStyle = "#2A1A10"; ctx.fill(); ctx.restore(); }
  // ---- legs
  const f = pose.facing ?? 1;
  const defFoot = (sd) => [hipDx + sd * (hipJ + 7), 0];
  const fL = pose.fL || defFoot(-1), fR = pose.fR || defFoot(1);
  const legs = [[-1, fL], [1, fR]];
  const legCol = look.garment === "dress" || look.garment === "kurta" ? (look.garment === "kurta" ? look.pants : skin) : pants;
  for (const [sd, ft] of legs) {
    const hip = [hipDx + sd * hipJ, pelvisY], knee = ik(hip, ft, d.thigh, d.shin, (sd < 0 ? pose.kneeL : pose.kneeR) || [f * .9, -.4]);
    tube(ctx, [hip, knee, ft], d.limbW * 1.05, d.limbW * .82, legCol, { ew: 3 });
    // shoe
    ctx.save(); ctx.translate(ft[0], ft[1]); const sh = () => { ctx.beginPath(); ctx.ellipse(f * d.limbW * .35, -d.limbW * .1, d.limbW * .95, d.limbW * .5, 0, 0, TAU); };
    paint(ctx, sh, look.shoe, { ew: 2.6, sz: d.limbW, grain: .2 }); ctx.restore();
  }
  // ---- torso frame
  ctx.save(); ctx.translate(hipDx, pelvisY); ctx.rotate(lean);
  const sh = d.sh, hw = d.hipW, g = look.garment;
  // skirt / long tunic behind the torso for dresses
  if (g === "dress" || g === "kurta") {
    const L = g === "dress" ? d.thigh * .95 : d.thigh * 1.2, fl2 = g === "dress" ? 1.75 : 1.3;
    paint(ctx, () => { ctx.beginPath(); ctx.moveTo(-hw * 1.05, -torso * .1); ctx.quadraticCurveTo(-hw * fl2, L * .55, -hw * (fl2 + .15), L); ctx.lineTo(hw * (fl2 + .15), L); ctx.quadraticCurveTo(hw * fl2, L * .55, hw * 1.05, -torso * .1); ctx.closePath(); }, shirt, { ew: 3, sz: torso, c: [0, L * .4] });
    if (g === "kurta") { line(ctx, [[0, L * .1], [0, L]], 2, "rgba(120,80,40,.4)"); }
  }
  // torso
  const T = () => { ctx.beginPath(); ctx.moveTo(-hw * 1.02, 4); ctx.quadraticCurveTo(-hw * .95, -torso * .45, -sh * 1.0, -torso * .88); ctx.quadraticCurveTo(-sh * .8, -torso * 1.03, -sh * .5, -torso * 1.02); ctx.lineTo(sh * .5, -torso * 1.02); ctx.quadraticCurveTo(sh * .8, -torso * 1.03, sh * 1.0, -torso * .88); ctx.quadraticCurveTo(hw * .95, -torso * .45, hw * 1.02, 4); ctx.closePath(); };
  paint(ctx, T, shirt, { ew: 3.2, sz: torso, c: [0, -torso * .5] });
  if (g === "suit") { ctx.save(); T(); ctx.clip(); ctx.beginPath(); ctx.moveTo(-sh * .45, -torso * 1.02); ctx.lineTo(0, -torso * .45); ctx.lineTo(sh * .45, -torso * 1.02); ctx.closePath(); ctx.fillStyle = "#EDE8E0"; ctx.fill(); ctx.beginPath(); ctx.moveTo(-3, -torso * 1.0); ctx.lineTo(3, -torso * 1.0); ctx.lineTo(7, -torso * .5); ctx.lineTo(0, -torso * .42); ctx.lineTo(-7, -torso * .5); ctx.closePath(); ctx.fillStyle = look.tie || "#8C2F2F"; ctx.fill(); ctx.restore(); }
  if (g === "armor") { ctx.save(); T(); ctx.clip(); ctx.beginPath(); ctx.moveTo(-sh * 1.0, -torso * .9); ctx.lineTo(0, -torso * .35); ctx.lineTo(sh * 1.0, -torso * .9); ctx.lineWidth = 5; ctx.strokeStyle = look.trim; ctx.stroke(); ctx.restore(); }
  // the heart window: a round opening with the pot nested inside
  const pr = Math.min(d.potR, sh * 1.25), gy = -torso * .6;
  anchors.chest = bodyPt(0, gy); anchors.slot = bodyPt(0, gy - pr * .88);
  ctx.save(); ctx.translate(0, gy);
  const hollow = st && st.hollow;
  const winR = pr * 1.2;
  paint(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, winR, winR * .98, 0, 0, TAU); }, hollow ? "#0A0A0F" : mixc(shirt, "#2A1A12", .55), { ew: 3, sz: winR, lit: 0, grain: .2 });
  if (hollow) { // the empty place: dark, with slow swirling nothing
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, winR * .96, winR * .94, 0, 0, TAU); ctx.clip(); for (let i = 0; i < 5; i++) { const a = t * .4 + i * 1.26, rr = winR * (.3 + .5 * ((i * .37) % 1)); const g2 = ctx.createRadialGradient(Math.cos(a) * rr * .4, Math.sin(a) * rr * .4, 0, Math.cos(a) * rr * .4, Math.sin(a) * rr * .4, winR * .6); g2.addColorStop(0, "rgba(40,45,70,.55)"); g2.addColorStop(1, "rgba(10,10,15,0)"); ctx.fillStyle = g2; ctx.fillRect(-winR, -winR, winR * 2, winR * 2); } ctx.restore();
  }
  if (st && !hollow) gullak(ctx, 0, 0, pr, { ...st, tint: st.tint || look.tint || "warm", floor: (-pelvisY - gy) }, t);
  if (g === "armor") { ctx.beginPath(); ctx.ellipse(0, 0, winR, winR * .98, 0, 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = look.trim; ctx.stroke(); }
  ctx.restore();
  if (g === "armor") { for (const sd of [-1, 1]) paint(ctx, () => { ctx.beginPath(); ctx.ellipse(sd * sh * .95, -torso * .96, sh * .42, sh * .26, sd * .5, 0, TAU); }, look.trim, { ew: 2.6, sz: sh * .4 }); }
  // ---- arms (IK in the torso frame)
  const defHand = (sd) => [sd * (sh + 10 + (pose.armOut || 0)), -torso * 1.0 + d.upper + d.fore * .92];
  const hands = [[-1, pose.L || defHand(-1), pose.holdL], [1, pose.R || defHand(1), pose.holdR]];
  const sleeveLong = g === "shirt" || g === "suit" || g === "armor" || g === "kurta" || g === "hoodie";
  for (const [sd, hand, hold] of hands) {
    const S = [sd * sh * .86, -torso * .96], E = ik(S, hand, d.upper, d.fore, [sd * .6, .8]);
    tube(ctx, [S, E], d.limbW * .95, d.limbW * .85, look.sleeve, { ew: 3, caps: true });
    tube(ctx, [E, hand], d.limbW * .8, d.limbW * .66, sleeveLong && g !== "armor" ? look.sleeve : skin, { ew: 3 });
    if (g === "shirt" || g === "suit") { tube(ctx, [E, [lerp(E[0], hand[0], .45), lerp(E[1], hand[1], .45)]], d.limbW * .86, d.limbW * .82, look.sleeve, { ew: 3 }); tube(ctx, [[lerp(E[0], hand[0], .45), lerp(E[1], hand[1], .45)], hand], d.limbW * .66, d.limbW * .6, skin, { ew: 3 }); }
    ctx.save(); ctx.translate(hand[0], hand[1]); ctx.beginPath(); ctx.arc(0, 0, d.limbW * .62, 0, TAU); ctx.fillStyle = skin; ctx.fill(); ctx.lineWidth = 2.8; ctx.strokeStyle = INKC; ctx.stroke(); if (hold) hold(ctx, d); ctx.restore();
    (sd < 0 ? (anchors.handL = bodyPt(...hand)) : (anchors.handR = bodyPt(...hand)));
  }
  // ---- head
  const hr = d.headR, hp = pose.head || {}, ny = -torso * 1.02 - d.neck;
  ctx.save(); ctx.translate((hp.dx || 0), 0);
  tube(ctx, [[0, -torso * 1.0], [0, ny + 2]], d.limbW * .8, d.limbW * .8, skin, { ew: 3 });
  ctx.translate(0, ny - hr * .85 + (hp.dy || 0)); ctx.rotate(hp.tilt || 0);
  anchors.head = bodyPt((hp.dx || 0), ny - hr * .85 + (hp.dy || 0));
  const wind = pose.wind ?? 0;
  hairBack(ctx, hr, look, t, wind);
  for (const sd of [-1, 1]) paint(ctx, () => ellipse(ctx, sd * hr * .93, hr * .12, hr * .17, hr * .22), skin, { ew: 2.4, sz: hr * .3, lit: 0 });
  const F = () => { ctx.beginPath(); ctx.moveTo(-hr * .94, -hr * .1); ctx.bezierCurveTo(-hr * 1.0, hr * .62, -hr * .5, hr * 1.02, 0, hr * 1.04); ctx.bezierCurveTo(hr * .5, hr * 1.02, hr * 1.0, hr * .62, hr * .94, -hr * .1); ctx.bezierCurveTo(hr * .94, -hr * .95, -hr * .94, -hr * .95, -hr * .94, -hr * .1); ctx.closePath(); };
  paint(ctx, F, skin, { ew: 3.2, sz: hr, c: [0, 0], lit: .12 });
  drawFace(ctx, hr, face, t, look);
  if (look.bindi) { ctx.beginPath(); ctx.arc(0, -hr * .38, hr * .055, 0, TAU); ctx.fillStyle = "#B01E2A"; ctx.fill(); }
  hairFront(ctx, hr, look, t, wind);
  if (look.glasses) { ctx.lineWidth = hr * .06; ctx.strokeStyle = "#3A3A40"; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * hr * .36, -hr * .02, hr * .26, hr * .22, 0, 0, TAU); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-hr * .1, -hr * .04); ctx.lineTo(hr * .1, -hr * .04); ctx.stroke(); }
  if (look.flower) { ctx.save(); ctx.translate(-hr * .62, -hr * .6); for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); ctx.beginPath(); ctx.ellipse(0, -hr * .13, hr * .08, hr * .13, 0, 0, TAU); ctx.fillStyle = look.flower; ctx.fill(); } ctx.beginPath(); ctx.arc(0, 0, hr * .06, 0, TAU); ctx.fillStyle = "#F7D56A"; ctx.fill(); ctx.restore(); }
  if (look.hairStyle === "braid") { // the braid falls over her shoulder
    const sw = Math.sin(t * 1.3) * 2; const P = [[hr * .75, hr * .6], [hr * .95 + sw, hr * 1.6], [hr * .85 + sw * 1.4, hr * 2.6], [hr * .9 + sw * 2, hr * 3.5]];
    ctx.save(); ctx.rotate(-(hp.tilt || 0)); ctx.translate(0, 0); tube(ctx, catmull(P, false, 5), hr * .42, hr * .16, look.hair, { ew: 2.4 }); for (let i = 1; i < 6; i++) { const u = i / 6.5, a = [lerp(P[0][0], P[3][0], u) - hr * .12, lerp(P[0][1], P[3][1], u)], b = [a[0] + hr * .26, a[1] + hr * .08]; line(ctx, [a, b], 1.8, "rgba(0,0,0,.45)"); } ctx.restore(); }
  ctx.restore(); // head
  ctx.restore(); // torso frame
  ctx.restore(); // root
  return anchors;
}

// ------------------------------------------------------------------ pose helpers
export const gait = (ph, d, f = 1, stride = 54, lift = 26) => {
  const hipJ = d.hipW * .55, sw = (i) => Math.sin(ph + i * Math.PI), up = (i) => Math.max(0, Math.cos(ph + i * Math.PI));
  return { fL: [-hipJ - 7 + f * sw(0) * stride, -up(0) * lift], fR: [hipJ + 7 + f * sw(1) * stride, -up(1) * lift], bob: -Math.abs(Math.cos(ph)) * 6, facing: f };
};
export const armSwing = (ph, d, k = 28) => ({ L: [-(d.sh + 8) + Math.sin(ph) * -k * .25, -d.torso + d.upper + d.fore * .85 + Math.sin(ph + Math.PI) * 4 - Math.abs(Math.sin(ph)) * 4], R: [(d.sh + 8) + Math.sin(ph) * k * .25, -d.torso + d.upper + d.fore * .85 + Math.sin(ph) * 4 - Math.abs(Math.sin(ph)) * 4] });
export const armsUp = (d, k = 1) => ({ L: [-(d.sh + 24 * k), -d.torso - d.fore * .7 * k], R: [(d.sh + 24 * k), -d.torso - d.fore * .7 * k] });
