// arc1.mjs — "Growing up". One pure function of time draws every frame of the arc.
//   S1  0.0– 8.0  portrait: a boy drawing in a beam of late sun; he lifts the drawing to the light and turns it,
//                 and the world turns with it (the cue to turn the phone)
//   S2  8.0–16.0  he runs to his parents; his mother gives him a coin from her own heart, his father flicks one too
//   S3 16.0–28.5  one long run, morning to golden afternoon: the lane, the school, the race. He grows as he runs.
//   S4 28.5–38.5  blue hour at home: one last coin from his mother, a wave, and the road to the city. "Gullak".
import { clamp, lerp, ss, hash, TAU, rgba, mixc } from "./lib.mjs";
import { figure, POSE, LOOKS, mixPose, body } from "./shade.mjs";
import { gullak, halo, coin } from "./heart.mjs";
import { initRoom, drawRoom, drawAir, floorShadow } from "./room.mjs";
import { initStrip, drawStrip, drawGround, drawCloth, drawOccluders, OCCLUDERS, TEACHER, FINISH, dayAt, sunCol, midCol, STRIP } from "./outside.mjs";
import { initHouse, drawHouse, drawFront, roadAt } from "./house.mjs";
import { drawing } from "./props.mjs";
import { post } from "./post.mjs";
import { grainTiles, glow, lin } from "./paint.mjs";
import { GlobalFonts } from "./lib.mjs";

export const FPS = 24, DUR = 38.5;
export const SHOT = { S1: 0, S2: 8, S3: 16, S4: 28.5, END: 38.5 };
// every coin that lands in his heart: [arrival time, who, how much it fills]
export const COINS = [[13.0, "mother", .14], [14.4, "father", .1], [21.5, "teacher", .1], [26.5, "crowd", .06], [26.85, "crowd", .06], [27.2, "crowd", .06], [27.6, "crowd", .06], [33.5, "mother", .08]];
export const fill = (t) => { let f = .22; for (const [ta, , d] of COINS) f += d * ss(ta, ta + .5, t); return f; };
export const pulse = (t) => { let p = 0; for (const [ta] of COINS) if (t >= ta) p = Math.max(p, Math.exp(-(t - ta) * 3.2)); return p; };
const E = (a, b, t) => ss(a, b, t);                         // eased 0..1 between a and b
const keys = (K, t) => { if (t <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [a, va] = K[i - 1], [b, vb] = K[i], k = ss(a, b, t); return Array.isArray(va) ? va.map((v, j) => lerp(v, vb[j], k)) : lerp(va, vb, k); } return K[K.length - 1][1]; };
const hf = (f, p = 0) => (c, pos, h) => gullak(c, pos[0], pos[1], h, { fill: f, pulse: p });

// a coin in flight: from -> to over [t0, t1], an arc that turns edge-on as it slips into the slit
function flight(ctx, from, to, t0, t1, t, lift = 120, r = 7) {
  if (t < t0 || t > t1) return; const u = (t - t0) / (t1 - t0), e = u * u * (3 - 2 * u), x = lerp(from[0], to[0], e), y = lerp(from[1], to[1], e) - Math.sin(u * Math.PI) * lift;
  const enter = clamp((u - .86) / .14); coin(ctx, x, y, r * (1 - enter * .5), { spin: t * 9 * (1 - enter) + enter * 1.5, glow: 1.2, a: 1 - enter * .4 });
}

// ---------------------------------------------------------------- looks over a life
const L_KID = LOOKS.boy;
const L_SCHOOL = (age) => ({ ...LOOKS.boy, bare: false, shoe: "#1A1614", top: { kind: "shirt", col: "#E4E0D4", sleeve: .45, hem: -.12, loose: 1.1 }, bottom: { kind: age > 11.6 ? "pants" : "shorts", col: "#2A3352", hem: age > 11.6 ? .98 : .45, loose: 1.14 } });
const L_SPORT = (col = "#B8302C") => ({ ...LOOKS.boy, bare: false, shoe: "#E8E4DA", top: { kind: "tee", col, sleeve: 0, hem: -.08, loose: 1.04 }, bottom: { kind: "shorts", col: "#1A1A22", hem: .36, loose: 1.16 } });
const L_MAN = { ...LOOKS.boy, hair: "man", bare: false, shoe: "#2A2220", top: { kind: "shirt", col: "#D49A3A", sleeve: .55, hem: -.12, loose: 1.1 }, bottom: { kind: "pants", col: "#2E3B5E", hem: .98, loose: 1.1 } };
const L_TEACHER = { ...LOOKS.mother, hairCol: "#1A1214", skin: "#8A5A40", age: 34, top: { kind: "blouse", col: "#2E6A6A", sleeve: .55, hem: .2, loose: 1 }, bottom: { kind: "saree", col: "#245458", border: "#E0C070" }, pallu: "#2A5E62" };

// ---------------------------------------------------------------- init
export async function init() {
  try { GlobalFonts.registerFromPath(new URL("./assets/fonts/CormorantGaramond.ttf", import.meta.url).pathname, "Cormorant"); } catch {}
  const [R, S, Hs, grain] = await Promise.all([initRoom(), initStrip(), initHouse(), grainTiles(6)]);
  return { R, S, Hs, grain };
}

// ---------------------------------------------------------------- camera helpers
function begin(ctx, W, H, cam, unroll) {
  const phi = cam.phi - (unroll ? Math.PI / 2 : 0);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(phi); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  const hw = W / 2 / cam.z, hh = H / 2 / cam.z, c = Math.abs(Math.cos(phi)), s = Math.abs(Math.sin(phi)), ex = c * hw + s * hh, ey = s * hw + c * hh;
  return [cam.x - ex, cam.y - ey, ex * 2, ey * 2];
}

// ================================================================= S1: the drawing
const KID1 = -720, PAPER_FLOOR = [KID1 + 205, -6];
function s1(ctx, A, t, W, H, unroll) {
  // the paper in his hands: where it is and how it is turned (world). It turns -90° while the camera rolls +90°.
  const lift = E(5.2, 6.3, t), turn = E(6.4, 7.9, t);
  const held = [KID1 + 190, -350], pc = [lerp(PAPER_FLOOR[0], held[0], lift), lerp(PAPER_FLOOR[1], held[1], lift)], rot = Math.PI / 2 * (1 - turn);
  const cam = { x: 0, y: 0, z: 1, phi: Math.PI / 2 * turn };
  const c0 = keys([[0, [KID1 + 110, -560, 1.0]], [4.4, [KID1 + 140, -470, 1.28]], [6.2, [held[0] - 40, -400, 1.32]], [6.4, [held[0], held[1], 1.32]], [8, [held[0], held[1], 1.2]]], t);
  [cam.x, cam.y, cam.z] = c0;
  const view = begin(ctx, W, H, cam, unroll);
  const sun = .25 + .75 * E(0, 2.2, t);
  drawRoom(ctx, A.R, t, { sun });
  // paper lying on the floor, then lifted
  const pw = 150, ph = 105;
  if (lift <= 0) { ctx.fillStyle = "#E8DCC4"; ctx.beginPath(); ctx.moveTo(PAPER_FLOOR[0] - 85, 2); ctx.lineTo(PAPER_FLOOR[0] + 85, 2); ctx.lineTo(PAPER_FLOOR[0] + 70, -10); ctx.lineTo(PAPER_FLOOR[0] - 70, -10); ctx.fill();
    for (let i = 0; i < 5; i++) { ctx.fillStyle = ["#D8343A", "#2E5A9A", "#F2A421", "#4E8A3A", "#6A3A22"][i]; ctx.save(); ctx.translate(PAPER_FLOOR[0] - 150 + i * 22 + (i > 2 ? 210 : 0), 6 + (i % 2) * 6); ctx.rotate(.3 + i); ctx.fillRect(-12, -3, 24, 6); ctx.restore(); } }
  // the boy
  const draw = 1 - E(4.2, 4.6, t), sitUp = E(4.4, 5.2, t);
  const base = POSE.kneelSit(t, { lean: lerp(.55, .12, sitUp), head: lerp(.55, lerp(.05, -.15, lift), sitUp), curl: lerp(.18, .05, sitUp) });
  const stroke = [PAPER_FLOOR[0] - 30 + Math.sin(t * 5.3) * 40 + Math.sin(t * 11.7) * 12, -12 + Math.abs(Math.sin(t * 8)) * -8];
  const halfH = (Math.abs(Math.sin(rot)) * pw + Math.abs(Math.cos(rot)) * ph) / 2;
  const grip = lift > 0 ? [[pc[0] + 26, pc[1] + halfH * .85], [pc[0] - 18, pc[1] + halfH * .9]] : [draw > .5 ? stroke : [PAPER_FLOOR[0] - 40, -14], [PAPER_FLOOR[0] - 70, -8]];
  const reach = lift > 0 || sitUp > .6 ? grip.map((g, i) => [lerp(g[0], grip[i][0], 1), g[1]]) : grip;
  const L = { key: [.75, -.66], keyCol: "#FFCB90", rim: .95 * sun, dark: .8, amb: .16 * sun, shadow: "#120C0E", heart: fill(t), face: .1 + .25 * lift };
  floorShadow(ctx, () => figure(ctx, KID1, 0, 1.9, L_KID, base, L, t, { age: 6, sil: "#0A0405", reach }), KID1, .38 * sun, .8);
  const B = figure(ctx, KID1, 0, 1.9, L_KID, base, L, t, { age: 6, reach, heartFn: hf(fill(t)), face: { mouth: lift > .5 ? "smile" : "flat", eye: lift > .5 ? "wide" : "soft", look: .5, blush: .4 * lift }, curl: lift > 0 ? [.75, .75] : [.8, .5] });
  halo(ctx, B.heart[0], B.heart[1], B.potH, { fill: fill(t) });
  // the drawing, held up into the sun: the light comes through the paper
  if (lift > 0) { glow(ctx, pc[0], pc[1], 190, "#FFC07A", .16 * lift * sun);
    ctx.save(); ctx.translate(pc[0], pc[1]); ctx.rotate(rot); ctx.translate(-pw / 2, -ph / 2); drawing(ctx, pw, ph, 1, .3 * sun); ctx.restore(); }
  drawAir(ctx, A.R, t, view, { sun });
  ctx.restore();
  return { fade: 1 - E(0, 1.4, t), tint: [1.03, 1, .95] };
}

// ================================================================= S2: the first coin
const BOY2 = -120, MOM2 = 112, DAD2 = 760;
function s2(ctx, A, T, W, H, unroll) {
  const t = T, u = T - 8;
  const cam = { phi: Math.PI / 2 }; [cam.x, cam.y, cam.z] = keys([[0, [-60, -430, .92]], [1.8, [0, -420, .98]], [4.4, [40, -360, 1.5]], [5.6, [40, -360, 1.52]], [6.6, [250, -420, 1.02]], [8, [210, -430, .97]]], u);
  const view = begin(ctx, W, H, cam, unroll);
  drawRoom(ctx, A.R, t);
  const base = { key: [.78, -.62], keyCol: "#FFCB90", rim: .95, dark: .8, amb: .05, shadow: "#120C0E" };
  // ---- the boy runs in with his drawing above his head, stops in front of her
  const runEnd = 1.8, bx = u < runEnd ? lerp(-1250, BOY2, 1 - Math.pow(1 - u / runEnd, 1.6)) : BOY2;
  const speed = u < runEnd ? 1 - E(1.2, runEnd, u) : 0, ph = (bx + 1250) / 440;
  const happy = E(6.4, 6.8, u), bounce = happy * Math.abs(Math.sin((u - 6.4) * 9)) * 14 * (1 - E(7.4, 8, u));
  let bp = mixPose(POSE.stand(t), POSE.run(ph, 1, { kid: 1 }), speed);
  const boyHeart = fill(t), boyPulse = pulse(t);
  // ---- the mother: stands, sees the drawing, kneels, takes a coin from her heart and gives it
  const kneel = E(2.6, 3.6, u), mp = mixPose(POSE.stand(t), POSE.genuflect(t, { head: lerp(.3, .42, E(3.6, 4.6, u)) }), kneel);
  const momHeart = .7 + .2 * E(2.0, 3.0, u) - .04 * E(4.8, 5.2, u);
  // ---- the father: newspaper up, then down; then a coin flicked across the room
  const paperDown = E(3.0, 3.6, u), fp = mixPose(POSE.sit(t, 128, { head: lerp(.0, .12, paperDown) }), POSE.sit(t, 128, { head: .12, lean: .14 }), E(5.4, 5.8, u));
  // shadows
  floorShadow(ctx, () => figure(ctx, bx, -bounce, 1.36, L_KID, bp, base, t, { age: 6, sil: "#0A0405" }), bx, .35, .7);
  floorShadow(ctx, () => figure(ctx, MOM2, 0, 1.3, LOOKS.mother, mp, base, t, { flip: true, sil: "#0A0405" }), MOM2, .35, .7);
  // father first (he is further back)
  const dadReach = [u < 3.6 ? null : null, null];
  const Fa0 = figure(ctx, DAD2, -40, 1.12, LOOKS.father, fp, { ...base, heart: .62 }, t, { flip: true, probe: true });
  const fGrab = E(5.4, 5.8, u) * (1 - E(6.0, 6.3, u));
  const fReach = paperDown < 1 ? [[Fa0.eye[0] - 40, lerp(Fa0.eye[1] + 10, Fa0.pel[1] - 30, paperDown)], [Fa0.eye[0] - 30, lerp(Fa0.eye[1] + 30, Fa0.pel[1] - 20, paperDown)]] : [fGrab > 0 ? [lerp(Fa0.pel[0] - 60, Fa0.slot[0] - 6, fGrab), lerp(Fa0.pel[1] - 30, Fa0.slot[1], fGrab)] : (u > 6.0 && u < 6.5 ? [Fa0.slot[0] - 60, Fa0.slot[1] - 40] : null), null];
  const Fa = figure(ctx, DAD2, -40, 1.12, LOOKS.father, fp, { ...base, heart: .62 }, t, { flip: true, reach: fReach, heartFn: hf(.62, u > 5.8 && u < 6.2 ? .5 : 0), face: { mouth: paperDown > .5 ? "smile" : "flat", eye: u > 6.4 ? "joy" : "soft", brow: "soft", look: .3 } });
  if (paperDown < 1) { const a = fReach[0], b = fReach[1]; ctx.save(); ctx.fillStyle = mixc("#3A3630", "#CFC6B2", .25); ctx.translate((a[0] + b[0]) / 2 - 10, (a[1] + b[1]) / 2); ctx.rotate(lerp(0, -1.3, paperDown)); ctx.fillRect(-8, -70, 16, 140); ctx.restore(); }
  else { ctx.fillStyle = "#4A4640"; ctx.save(); ctx.translate(Fa.pel[0] - 40, Fa.pel[1] - 8); ctx.rotate(-.05); ctx.fillRect(-60, -6, 120, 10); ctx.restore(); }
  halo(ctx, Fa.heart[0], Fa.heart[1], Fa.potH, { fill: .5 });
  // the boy
  const giving = E(3.6, 4.2, u), carry = E(4.2, 5.0, u), back = E(5.4, 6.2, u);
  const pcHeld = u < runEnd + .3 ? null : [bx + 120, -330];
  const momC = [MOM2 - 22, -305];
  const ext = [{ p: momC, r: 460, a: .5 * (1 - speed) }];
  const showUp = u < runEnd ? 1 : 1 - E(runEnd, runEnd + .5, u), showFwd = E(runEnd, runEnd + .5, u) * (1 - E(4.4, 5.0, u));
  let boyReach = null; const B0 = figure(ctx, bx, -bounce, 1.36, L_KID, bp, base, t, { age: 6, probe: true });
  const over = [B0.head[0] + 30, B0.head[1] - 60], fwd = [bx + 78, B0.heart[1] - 30], side = [B0.pel[0] + 10, B0.pel[1] + 30];
  const target = [lerp(lerp(side[0], fwd[0], showFwd), over[0], showUp), lerp(lerp(side[1], fwd[1], showFwd), over[1], showUp)];
  boyReach = [[target[0] + 14, target[1] + 30], [target[0] - 12, target[1] + 34]];
  if (showUp < .05 && showFwd < .05) boyReach = [null, [side[0], side[1]]];
  const Boy = figure(ctx, bx, -bounce, 1.36, L_KID, bp, { ...base, heart: boyHeart, ext }, t, { age: 6, reach: boyReach, heartFn: hf(boyHeart, boyPulse),
    face: { mouth: u > 5.1 ? "grin" : u > 1.6 ? "smile" : "open", eye: u > 6.4 ? "joy" : "wide", look: .5, blush: .3 + .4 * E(5, 6, u) }, curl: [.75, .75] });
  // his drawing
  { const tp = showUp > .05 || showFwd > .05 ? target : Boy.handF, sx = lerp(.5, 1, showUp) * (showUp > .05 || showFwd > .05 ? 1 : .55);
    ctx.save(); ctx.translate(tp[0], tp[1]); ctx.rotate(showUp > .5 ? Math.sin(u * 8) * .05 : .1); ctx.scale(sx, 1); drawing(ctx, 150, 100, 1, 0); ctx.restore(); }
  // the mother, with her hand going to her own heart and then to his
  const MoA = figure(ctx, MOM2, 0, 1.3, LOOKS.mother, mp, base, t, { flip: true, probe: true });
  const slotB = [Boy.slot[0] + 4, Boy.slot[1] - 4];
  let mReach = null; if (giving > 0) { const own = [MoA.slot[0] - 22, MoA.slot[1] + 10]; const h0 = carry > 0 ? [lerp(own[0], slotB[0], carry), lerp(own[1], slotB[1], carry) - Math.sin(carry * Math.PI) * 30] : [lerp(MoA.pel[0] - 40, own[0], giving), lerp(MoA.pel[1] - 60, own[1], giving)]; mReach = [back > 0 ? [lerp(slotB[0], MoA.pel[0] - 50, back), lerp(slotB[1], MoA.pel[1] - 40, back)] : h0, null]; }
  const Mo = figure(ctx, MOM2, 0, 1.3, LOOKS.mother, mp, { ...base, heart: momHeart, ext: [{ p: Boy.heart, r: 300, a: .25 * boyPulse }] }, t, { flip: true, reach: mReach, heartFn: hf(momHeart, u > 4.1 && u < 4.4 ? .6 : 0), curl: [.65, .3],
    face: { mouth: u > 2.2 ? "smile" : "soft", eye: "soft", brow: "soft", look: u > 2 ? .5 : 0 } });
  halo(ctx, Mo.heart[0], Mo.heart[1], Mo.potH, { fill: momHeart });
  halo(ctx, Boy.heart[0], Boy.heart[1], Boy.potH, { fill: boyHeart, pulse: boyPulse });
  // the coins
  if (u > 4.15 && u < 5.0) { const k = clamp((u - 4.85) / .15); coin(ctx, Mo.handN[0], Mo.handN[1] - 4, 7 * (1 - k * .5), { spin: 1.25 + k * .3, glow: 1.2, a: 1 - k * .5 }); }
  flight(ctx, [Fa.slot[0] - 10, Fa.slot[1] - 20], slotB, 14.0, 14.4, t, 150, 6.5);
  drawAir(ctx, A.R, t, view);
  ctx.restore();
  return { tint: [1.03, 1, .95] };
}

// ================================================================= S3: the run
const S3T0 = 16, VRUN = 738, FIN_T = 26.3;
export const boyX3 = (t) => { const d = t - S3T0; if (t <= FIN_T) return -300 + VRUN * d; const e = Math.min(t - FIN_T, 1.4); return -300 + VRUN * (FIN_T - S3T0) + VRUN * e - .5 * (VRUN / 1.4) * e * e; };
const ageAt = (t) => keys([[16, 6], [19.85, 8.6], [19.95, 10], [22.95, 12.6], [23.05, 14.4], [26.3, 16.4], [28.5, 17]], t);
const strideAt = (age, s) => { const b = body(age); return 2.5 * (b.thigh + b.shin) * s; };
function phaseAt(t, s) { let ph = 0, prev = boyX3(S3T0); const n = Math.max(1, Math.ceil((t - S3T0) * 30)); for (let i = 1; i <= n; i++) { const ti = S3T0 + (t - S3T0) * i / n, x = boyX3(ti); ph += (x - prev) / strideAt(ageAt(ti), s); prev = x; } return ph; }
const CROWD_SRC = [[FINISH.x + 260, -250], [FINISH.x + 520, -300], [FINISH.x + 120, -330], [FINISH.x + 700, -230]];
function crowd(ctx, cam, t, view) {
  const k = dayAt(cam.x), col = mixc(midCol(k), "#120E14", .35), sc = sunCol(k), cheer = E(25.6, 26.4, t);
  const ox = cam.x * .4 - 2020;
  for (let i = 0; i < 4; i++) { const sx = ox + 5260 + i * 760; if (sx > view[0] + view[2] + 50 || sx + 700 < view[0] - 50) continue;
    for (let j = 0; j < 6; j++) { const ty = -36 - 240 * (j + 1) / 6, x0 = sx + j * 14, x1 = sx + 700 - j * 14;
      for (let px = x0 + 10; px < x1 - 10; px += 23) { const h = hash(px * 1.3 + j * 7); if (h < .2) continue; const jump = cheer * Math.max(0, Math.sin(t * (7 + h * 4) + h * 9)) * 6, y = ty - jump;
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, y - 30, 7.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.roundRect(px - 10, y - 22, 20, 24, 6); ctx.fill();
        if (cheer > 0 && h > .55) { ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = "round"; const w = Math.sin(t * 9 + h * 20) * 5; ctx.beginPath(); ctx.moveTo(px - 8, y - 18); ctx.lineTo(px - 14 + w, y - 46); ctx.moveTo(px + 8, y - 18); ctx.lineTo(px + 14 - w, y - 46); ctx.stroke(); }
        ctx.fillStyle = rgba(sc, .5); ctx.fillRect(px + 5, y - 36, 2.5, 10);
        if (h > .72) { ctx.fillStyle = rgba("#FFC070", .55 + .4 * cheer); ctx.beginPath(); ctx.arc(px + 2, y - 12, 2.4, 0, TAU); ctx.fill(); } } } }
  // the crowd's hearts glow as a soft band over them when they cheer
  if (cheer > 0) glow(ctx, FINISH.x + 400, -200, 900, "#FFB060", .12 * cheer);
}
function s3(ctx, A, t, W, H, unroll) {
  const s = 1.55, bx = boyX3(t), age = ageAt(t);
  const cam = { phi: Math.PI / 2, x: bx + 260 - 160 * E(26.3, 27.8, t), y: -470, z: .82 + .1 * E(26.3, 27.8, t) };
  const view = begin(ctx, W, H, cam, unroll);
  drawStrip(ctx, A.S, t, cam, view);
  crowd(ctx, cam, t, view);
  drawGround(ctx, cam, view, t); drawCloth(ctx, cam, view, t);
  const k = dayAt(cam.x), key = [.82, -.57], sc = sunCol(k);
  const base = { key, keyCol: mixc(sc, "#FFFFFF", .2), rim: 1, rimW: 2.4, dark: .82, amb: .04, shadow: "#14101A" };
  // the teacher at the school door
  if (Math.abs(TEACHER.x + 100 - cam.x) < 1600) { const T = figure(ctx, TEACHER.x + 100, 0, 1.22, L_TEACHER, POSE.stand(t, { head: .1 }), { ...base, heart: .7 }, t, { flip: true, heartFn: hf(.7, t > 21.0 && t < 21.3 ? .6 : 0), face: { mouth: "smile", eye: "soft", look: .5 } });
    halo(ctx, T.heart[0], T.heart[1], T.potH, { fill: .7 }); A._teacher = T.slot; }
  // other runners on the track
  if (t > 23) for (let i = 0; i < 2; i++) { const rx = bx - 230 - i * 170 - (t > FIN_T ? (t - FIN_T) * 200 : 0) + Math.sin(t * 1.3 + i) * 30, rp = phaseAt(Math.min(t, FIN_T), s) * .98 + .3 + i * .41;
    figure(ctx, rx, 0, 1.2, L_SPORT(i ? "#2E8050" : "#2E58A0"), POSE.run(rp, t > FIN_T ? lerp(1, .5, E(FIN_T, 27.5, t)) : 1), { ...base, heart: .35 }, t, { age: 15, heartFn: hf(.35) }); }
  // him
  const look = t < 19.9 ? L_KID : t < 23 ? L_SCHOOL(age) : L_SPORT();
  const runK = t < FIN_T ? 1 : 1 - E(FIN_T + .3, FIN_T + 1.4, t), ph = phaseAt(t, s);
  let pose = mixPose(POSE.stand(t), POSE.run(ph, 1, { kid: clamp((10 - age) / 4) }), runK);
  const fl = fill(t), pl = pulse(t);
  const win = E(26.4, 26.9, t);
  const B0 = figure(ctx, bx, 0, s, look, pose, base, t, { age, probe: true });
  let reach = null;
  const test = E(20.2, 20.5, t) * (1 - E(22.3, 22.7, t));
  if (test > 0) reach = [[B0.head[0] + 40, B0.head[1] - 40 * test - 10], null];
  if (win > 0) reach = [[B0.head[0] + 40, B0.head[1] - 90 * win], [B0.head[0] - 20, B0.head[1] - 85 * win]];
  floorShadow(ctx, () => figure(ctx, bx, 0, s, look, pose, base, t, { age, sil: "#0A0608", reach }), bx, .3, .35);
  const Bo = figure(ctx, bx, 0, s, look, pose, { ...base, heart: fl }, t, { age, reach, heartFn: hf(fl, pl), hair: 1.2,
    face: { mouth: win > .3 ? "grin" : test > .5 ? "smile" : "open", eye: win > .5 ? "joy" : "soft", brow: t > 23 && t < FIN_T ? "angry" : "soft" }, curl: win > 0 ? [.2, .2] : undefined });
  halo(ctx, Bo.heart[0], Bo.heart[1], Bo.potH, { fill: fl, pulse: pl });
  if (test > 0) { const h = Bo.handN; ctx.save(); ctx.translate(h[0] + 4, h[1] - 50); ctx.rotate(Math.sin(t * 7) * .1); ctx.fillStyle = "#EEE8DA"; ctx.fillRect(-36, -46, 72, 92); ctx.strokeStyle = "#C8302A"; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-4, 16); ctx.lineTo(22, -22); ctx.stroke();
    ctx.fillStyle = "rgba(60,60,80,.4)"; for (let i = 0; i < 4; i++) ctx.fillRect(-26, -38 + i * 9, 40, 3); ctx.restore(); }
  // the finish tape, then its two broken ends streaming from his chest
  if (t < FIN_T) { ctx.strokeStyle = "rgba(245,240,230,.9)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(FINISH.x, -250); ctx.lineTo(FINISH.x + 40, -120); ctx.stroke(); }
  else { const age2 = t - FIN_T; for (const sgn of [1, -1]) { ctx.strokeStyle = `rgba(245,240,230,${.9 - age2 * .3})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(Bo.heart[0] - 10, Bo.heart[1]); for (let i = 1; i <= 8; i++) ctx.lineTo(Bo.heart[0] - 10 - i * 22 - age2 * 40, Bo.heart[1] + sgn * (i * 3) + Math.sin(t * 14 + i) * 6 + i * i * age2 * 1.5); ctx.stroke(); } }
  // coins: the teacher's, then the crowd's
  const slot = [Bo.slot[0], Bo.slot[1]];
  if (A._teacher) flight(ctx, A._teacher, slot, 20.9, 21.5, t, 160, 6.5);
  COINS.filter((c) => c[1] === "crowd").forEach(([ta], i) => flight(ctx, CROWD_SRC[i], slot, ta - .75, ta, t, 220, 6.5));
  drawOccluders(ctx, cam, view);
  ctx.restore();
  return { tint: [1.02, 1, .97] };
}

// ================================================================= S4: leaving home
function s4(ctx, A, T, W, H, unroll) {
  const t = T, u = T - 28.5;
  const cam = { phi: Math.PI / 2 }; [cam.x, cam.y, cam.z] = keys([[0, [-260, -380, .98]], [6, [-200, -380, 1.0]], [10, [-60, -360, .96]]], u);
  const view = begin(ctx, W, H, cam, unroll);
  drawHouse(ctx, A.Hs, t, { lamp: E(1.0, 1.4, u) });
  const Lp = { key: [-.8, -.4], keyCol: "#FFB070", rim: .95, dark: .82, amb: .0, shadow: "#0A0812" };
  // parents in the door
  const wave = E(5.2, 5.8, u) * (1 - E(7.6, 8.4, u));
  const Fa0 = figure(ctx, -598, -24, .95, LOOKS.father, POSE.stand(t), Lp, t, { probe: true });
  const Fa = figure(ctx, -598, -24, .95, LOOKS.father, POSE.stand(t, { head: .05 }), { ...Lp, heart: .66 }, t, { heartFn: hf(.66), reach: wave > 0 ? [[Fa0.head[0] + 20, lerp(Fa0.pel[1], Fa0.head[1] - 30, wave)], null] : null, face: { mouth: "smile", eye: "soft" } });
  const give = E(2.4, 3.0, u), release = E(3.0, 3.4, u);
  const Mo0 = figure(ctx, -662, -24, .95, LOOKS.mother, POSE.stand(t), Lp, t, { probe: true });
  const mR = give > 0 ? [[lerp(Mo0.slot[0], Mo0.slot[0] + 40, release), lerp(Mo0.slot[1], Mo0.slot[1] - 30, release)], null] : [[Mo0.slot[0] - 2, Mo0.slot[1] + 4], null];
  const momF = .82 - .05 * E(3, 3.5, u);
  const Mo = figure(ctx, -662, -24, .95, LOOKS.mother, POSE.stand(t, { head: .08 }), { ...Lp, heart: momF }, t, { heartFn: hf(momF, u > 2.8 && u < 3.2 ? .6 : 0), reach: mR, face: { mouth: "soft", eye: u > 6 ? "half" : "soft", brow: "worried", tears: u > 6.5 ? .6 : 0 } });
  halo(ctx, Fa.heart[0], Fa.heart[1], Fa.potH, { fill: .66 }); halo(ctx, Mo.heart[0], Mo.heart[1], Mo.potH, { fill: momF });
  drawFront(ctx, A.Hs);
  // him: at the gate, then the road
  const turn = E(6.3, 7.2, u), walkU = clamp((u - 7.0) / 3.0), r = roadAt(Math.pow(walkU, 1.35) * .62), facingLeft = turn < .5;
  const dist = (r.x + 150) / Math.max(.2, r.s), ph = dist / 300;
  const pose = walkU > 0 ? mixPose(POSE.stand(t), POSE.walk(ph, 1), E(7.0, 7.5, u)) : POSE.stand(t, { head: -.05 });
  const fl = fill(t), pl = pulse(t);
  const myWave = E(4.9, 5.4, u) * (1 - E(6.2, 6.6, u));
  const B0 = figure(ctx, r.x, r.y, r.s, L_MAN, pose, Lp, t, { age: 18, flip: facingLeft, probe: true });
  const Bo = figure(ctx, r.x, r.y, r.s, L_MAN, pose, { key: [-.8, -.5], keyCol: "#FFB070", rim: .85, rimW: 2, heart: fl, dark: .82, shadow: "#0A0812", ext: [{ p: [194, -575], r: 500, a: .12 * E(1.2, 1.6, u) }] }, t,
    { age: 18, flip: facingLeft, heartFn: hf(fl, pl), reach: myWave > 0 ? [[B0.head[0] - 30 * (facingLeft ? 1 : -1), lerp(B0.pel[1], B0.head[1] - 30, myWave)], null] : null, face: { mouth: u > 5.2 ? "soft" : "flat", eye: "soft", brow: "sad" } });
  halo(ctx, Bo.heart[0], Bo.heart[1], Bo.potH, { fill: fl, pulse: pl });
  // his bag, a strap across the chest
  { const b = Bo.b, s = r.s, hp = [Bo.pel[0] - 14 * s * (facingLeft ? -1 : 1), Bo.pel[1] - 10 * s]; ctx.fillStyle = "#1E1A20"; ctx.beginPath(); ctx.roundRect(hp[0] - 34 * s, hp[1] - 22 * s, 68 * s, 44 * s, 12 * s); ctx.fill();
    ctx.strokeStyle = "#141016"; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(Bo.shoulder[0], Bo.shoulder[1]); ctx.lineTo(hp[0], hp[1] - 20 * s); ctx.stroke(); }
  // her coin drifts across the dusk to him, slowly, like a firefly
  if (u > 3.0 && u < 5.0) { const k = (u - 3.0) / 2.0, e = k * k * (3 - 2 * k), from = [Mo0.slot[0] + 40, Mo0.slot[1] - 30], to = Bo.slot;
    const x = lerp(from[0], to[0], e), y = lerp(from[1], to[1], e) - Math.sin(k * Math.PI) * 140 + Math.sin(k * 9) * 10, enter = clamp((k - .9) / .1);
    coin(ctx, x, y, 6.5 * (1 - .5 * enter), { spin: u * 4, glow: 1.4 }); }
  // the title in the sky
  const ta = E(36.0, 37.2, t);
  if (ta > 0) { ctx.save(); ctx.globalAlpha = ta; ctx.font = "300 168px Cormorant"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.letterSpacing = "18px";
    const tx = cam.x + 260, ty = -760; ctx.shadowColor = "rgba(255,190,120,.55)"; ctx.shadowBlur = 40; ctx.fillStyle = "#F4E6CC"; ctx.fillText("Gullak", tx, ty); ctx.restore(); }
  ctx.restore();
  return { fade: E(37.6, 38.5, t), tint: [.98, 1, 1.04] };
}

// ================================================================= one frame
export function frame(ctx, A, t, { W = 1080, H = 1920, unroll = false, i = 0 } = {}) {
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const fn = t < SHOT.S2 ? s1 : t < SHOT.S3 ? s2 : t < SHOT.S4 ? s3 : s4;
  const g = fn(ctx, A, t, W, H, unroll) || {};
  post(ctx, W, H, { fade: g.fade || 0, tint: g.tint, grain: { tiles: A.grain, i, amt: .07 } });
}
