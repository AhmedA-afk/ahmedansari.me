// scenes_d.mjs — the cold, and the thaw: night street, solitude, the new girl, the lit river, the touch, healing, mending, showing, the end.
import { core, createCanvas, clamp, lerp, ss, eIO, eOut, eIn, eBack, TAU, R, mixc, rgba, noise1 } from "./lib.mjs";
import { SCENES, EV, FLIGHT, T_STONE, T_THAW0, T_THAW1, T_SEAMS0, T_SEAMS1, heroState, girlState, friendState, bgState, pulseOf } from "./story.mjs";
import { layer, grad, glow, wallPaint, box, rr, grainRect, hills, tree, skyline, stars, lantern, water, rain, shade } from "./env.mjs";
import { paint, tube, flight, dropOut, coin, coinSpray, gullak, INKC } from "./art.mjs";
import { person, dims, gait, armsUp, LOOK } from "./person.mjs";
import { PHI, U, sm, mix, giveCoin, lerp2, extra, toTorso, heroLookAt } from "./common.mjs";
import { bake, put, sketch, PW, PH } from "./scenes_a.mjs";
import { bakeOffice, officeWindow, monitor, desk, skyAt } from "./scenes_b.mjs";

const T = (k) => SCENES[k][0];
const hs = (t) => ({ ...heroState(t), pulse: pulseOf("h", t) });
const gs = (t) => ({ ...girlState(t), pulse: pulseOf("g", t), tint: "golden" });
const GIRL = { ...LOOK.girl2, scale: { h: .97, pot: 1.0 } };
const GIRL_BIG = { ...LOOK.girl2, scale: { h: .97, pot: 1.28 } };

// a coin offered into the dark: it travels, is swallowed, and nothing answers
function intoDark(ctx, t, t0, dur, a, b, r = 19) { const u = (t - t0) / dur; if (u < 0 || u > 1) return; const k = eIO(u); coin(ctx, mix(a[0], b[0], k), mix(a[1], b[1], k) - Math.sin(k * Math.PI) * 50, r * (1 - .5 * ss(.7, 1, u)), u * 5, 0, 1 - ss(.78, 1, u), 0); }

// ================================================================== COLD: the night street
function bakeNight() {
  return bake(-300, -300, 2300, 1500, (x) => {
    grad(x, -300, -300, 2600, 1100, "#0A0E1C", "#1E2840"); stars(x, -300, -300, 2600, 400, 50, 5);
    skyline(x, -300, 2300, 760, 420, "#121828", 3, (r) => (r < .12 ? "#6E7C9C" : "#222A40")); skyline(x, -300, 2300, 800, 260, "#0E1322", 8, (r) => (r < .08 ? "#5A6A88" : "#1B2236"));
    grad(x, -300, 800, 2600, 700, "#2A3246", "#141A2A"); grainRect(x, -300, 800, 2600, 700, .4);
    // wet reflection streaks
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(150,170,210,${.04 + .06 * R(i, 1)})`; x.fillRect(R(i, 2) * 2400 - 200, 840 + R(i, 3) * 500, 8 + R(i, 4) * 40, 4); }
    // stairs / low wall to sit on
    box(x, 520, 900, 900, 28, "#4A5266", { r: 3, ew: 3 }); box(x, 560, 928, 820, 44, "#3A4254", { r: 3, ew: 3 }); box(x, 600, 972, 740, 44, "#2E3546", { r: 3, ew: 3 });
    // lamp post
    x.fillStyle = "#1A1F2E"; x.fillRect(1500, 420, 14, 480); box(x, 1450, 390, 114, 44, "#8A94AE", { r: 10, ew: 3 });
  });
}
function streetFx(ctx, t, lt, rainK = 1) {
  glow(ctx, 1507, 440, 520, "#9FB4E8", .22); ctx.save(); ctx.globalAlpha = .12; ctx.fillStyle = "#BFD0FF"; ctx.beginPath(); ctx.moveTo(1470, 430); ctx.lineTo(1545, 430); ctx.lineTo(1900, 1010); ctx.lineTo(1100, 1010); ctx.closePath(); ctx.fill(); ctx.restore();
  if (rainK > 0) rain(ctx, t, -100, -100, 2200, 1300, 150 * rainK, .4 * rainK, "#B8C8DC", .22);
}
export const cold = {
  fi: 1.4,
  build() { return { bg: bakeNight() }; },
  cam(lt) { const k = eIO(U(0, 16, lt)); return { x: mix(1000, 940, k), y: mix(640, 700, k), z: mix(1.0, 1.35, k), phi: PHI }; },
  draw(ctx, t, lt, S) {
    put(ctx, S.bg); streetFx(ctx, t, lt, 1);
    const d = dims(27), s = 1.55, hx = 960, gy = 990;
    // him, on the step. empty eyes. barely breathing.
    const hp = { age: 27, crouch: d.legLen - 86, facing: 1, fL: [-d.hipW * .55 + 78, 0], fR: [d.hipW * .55 + 66, 0], kneeL: [.1, -1], kneeR: [.1, -1], lean: .2, head: { dy: 22 }, face: { eyes: "empty", mouth: "flat", brows: "sad", look: [0, 1] }, L: [-d.sh * .55, d.upper * .3], R: [d.sh * .55, d.upper * .3], bob: Math.sin(lt * 1.1) * 1.8 };
    const st = hs(t);
    const A = person(ctx, hx, gy, s, LOOK.heroCold, hp, st, t);
    // friends try, one by one: warm coins vanish into the dark; the stone only answers with a dull knock
    const tries = [[1.2, LOOK.pal, 480, 1], [3.2, LOOK.friend, 1480, -1], [8.4, LOOK.colleague, 480, 1], [11.8, LOOK.father, 1480, -1]];
    tries.forEach(([t0, lk, fx0, f], i) => {
      const walk = U(t0 - 1.2, t0 + .2, lt), leave = U(t0 + 3.0, t0 + 4.6, lt), fx = fx0 - 0 + (f > 0 ? 330 : -330) * (1 - walk) * 0 + (f > 0 ? (-1 + walk) * 520 : (1 - walk) * 520) + (f > 0 ? -leave * 520 : leave * 520);
      const dd = dims(28, lk.scale || {}), near = walk >= .98 && leave < .02, ph = lt * 6.5;
      const g = walk > 0 && walk < .98 || leave > .02 ? gait(ph, dd, f, 46, 22) : { fL: [-dd.hipW * .55 - 14, 0], fR: [dd.hipW * .55 + 14, 0] };
      const reach = near ? Math.sin(U(t0 + .3, t0 + 1.4, lt) * Math.PI) : 0;
      const pose = { age: 28, flip: f < 0, face: { eyes: leave > .02 ? "sad" : "sad", mouth: "frown", brows: "worried", look: [f > 0 ? 1 : -1, 0] }, ...g, lean: .12 * near, [f > 0 ? "R" : "L"]: near ? [dd.sh + 40 + 40 * reach, -dd.torso * .55] : undefined, bob: g.bob || 0 };
      const P = person(ctx, fx, 1000 - (i % 2) * 12, 1.5, lk, pose, bgState(.7), t);
      if (near) intoDark(ctx, t, t0 + .75, .7, [P.handR[0], P.handR[1] - 10].map((v, j) => f > 0 ? v : (j ? v : P.handL[0])), A.chest, 19);
    });
    // a last, careful coin against the stone: it bounces off
    if (lt > 12.3 && lt < 13.6) { const u = U(12.4, 13.0, lt); coin(ctx, mix(1380, A.chest[0] + 20, eIO(u)) + (lt > 13 ? (lt - 13) * 160 : 0), mix(740, A.chest[1], eIO(u)) + (lt > 13 ? 340 * (lt - 13) ** 1.6 : 0), 19, lt * 9, 0, 1 - ss(13.2, 13.6, lt), 0); }
    streetFx(ctx, t, lt, 0);
    ctx.save(); ctx.fillStyle = `rgba(6,8,16,${.1})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore();
  },
};

// ================================================================== TURN: they stop coming. the city flows around him.
export const turn = {
  fi: 1.2,
  build() { return { bg: bakeNight() }; },
  cam(lt) { return { x: 940, y: 700, z: mix(1.35, 1.2, eIO(U(0, 10, lt))), phi: PHI }; },
  draw(ctx, t, lt, S) {
    put(ctx, S.bg);
    // seasons in a breath: rain -> snow -> leaves -> grey
    const rk = 1 - ss(2.5, 3.5, lt), sk = ss(2.5, 3.5, lt) * (1 - ss(5.5, 6.5, lt)), lk = ss(5.5, 6.5, lt) * (1 - ss(8, 9, lt));
    streetFx(ctx, t, lt, rk);
    for (let i = 0; i < 90 * sk; i++) { const px = ((R(i, 1) * 2300 - 200 + Math.sin(t * .8 + i) * 40) % 2300), py = ((R(i, 2) + t * (.12 + R(i, 3) * .1)) % 1) * 1300 - 100; ctx.fillStyle = "rgba(235,242,255,.85)"; ctx.beginPath(); ctx.arc(px, py, 2.4 + R(i, 4) * 3, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 40 * lk; i++) { const px = ((R(i, 1) * 2300 + t * 60) % 2300) - 200, py = ((R(i, 2) + t * (.09 + R(i, 3) * .08)) % 1) * 1300 - 100; ctx.save(); ctx.translate(px, py); ctx.rotate(t + i); ctx.fillStyle = i % 2 ? "#8A5A3A" : "#B0803A"; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse(0, 0, 9, 4, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    const d = dims(27), s = 1.55, hx = 960, gy = 990, st = hs(t);
    // the stone grows frost
    const hp = { age: 27, crouch: d.legLen - 86, facing: 1, fL: [-d.hipW * .55 + 78, 0], fR: [d.hipW * .55 + 66, 0], kneeL: [.1, -1], kneeR: [.1, -1], lean: .22, head: { dy: 24 }, face: { eyes: "empty", mouth: "flat", brows: "sad", look: [0, 1] }, L: [-d.sh * .55, d.upper * .3], R: [d.sh * .55, d.upper * .3], bob: Math.sin(lt * 1.1) * 1.6 };
    // the city streams past him in long exposure: smeared figures, never stopping
    for (let i = 0; i < 12; i++) { const dir = i % 2 ? 1 : -1, sp = .06 + R(i, 1) * .05, u = ((t * sp * dir + R(i, 2) * 3) % 1 + 1) % 1, px = mix(-200, 2200, u), look = [LOOK.pal, LOOK.friend, LOOK.colleague, LOOK.father, LOOK.mother, LOOK.teacher][i % 6];
      ctx.save(); ctx.globalAlpha = .26 + .1 * R(i, 5); const dd = dims(30, look.scale || {}); const g = gait(t * 6 + i * 1.3, dd, dir, 48, 24); const P = person(ctx, px, 1030 + (i % 3) * 14, 1.4, look, { age: 30, flip: dir < 0, face: { eyes: "open", mouth: "flat" }, ...g, noShadow: true, L: [-(dd.sh + 12), dd.upper * .8], R: [dd.sh + 12, dd.upper * .8] }, bgState(.5), t); ctx.restore(); }
    person(ctx, hx, gy, s, LOOK.heroCold, hp, st, t);
    // day and night flash by
    const cyc = (lt / 2.2) % 1; ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = `rgba(${cyc < .5 ? "120,140,200" : "40,50,90"},${.25})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore();
    ctx.save(); ctx.fillStyle = "rgba(6,8,16,.08)"; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore();
  },
};

// ================================================================== NEW GIRL
export const newgirl = {
  fi: 1.4,
  build() { return { bg: bakeOffice() }; },
  cam(lt) { return { x: mix(1100, 1300, eIO(U(0, 10, lt))), y: mix(660, 700, eIO(U(0, 10, lt))), z: mix(1.15, 1.45, eIO(U(0, 10, lt))), phi: PHI }; },
  draw(ctx, t, lt, S) {
    put(ctx, S.bg); officeWindow(ctx, t, 3.2 * .45, 300, 150, 1320, 420);
    ctx.fillStyle = "rgba(60,70,90,.3)"; ctx.fillRect(-300, -300, 2600, 1800);
    // light slowly warms around her
    const warm = ss(2.5, 9, lt);
    const hx = 1000, gy = 1000, s = 1.45, d = dims(26), seat = 98;
    desk(ctx, hx, 860, 640, t); desk(ctx, 1560, 860, 520, t);
    const hp = { age: 26, crouch: d.legLen - seat, facing: 1, fL: [-d.hipW * .55 + 80, 0], fR: [d.hipW * .55 + 70, 0], kneeL: [.1, -1], kneeR: [.1, -1], face: { eyes: "empty", mouth: "flat", brows: "sad", look: [0, 1] }, lean: .08, head: { dy: 18 }, L: [-34, -2 + Math.sin(lt * 9) * 2], R: [34, -2 + Math.sin(lt * 8) * 2], bob: Math.sin(lt * 1.1) * 1.2 };
    box(ctx, hx - 80, gy - 40, 160, 18, "#3A3A44", { r: 8 }); ctx.fillStyle = "#2A2A30"; ctx.fillRect(hx - 6, gy - 22, 12, 22);
    const A = person(ctx, hx, gy, s, LOOK.heroCold, hp, hs(t), t);
    desk(ctx, hx, 860, 640, t);
    monitor(ctx, 1250, 650, 1, 0, t);
    // she arrives: bright, easy, noticing
    const dg = dims(25, GIRL.scale), wk = U(0, 3.2, lt), gx = mix(2000, 1570, eOut(wk)), gph = lt * 7;
    const turnK = U(3.4, 4.4, lt), eyeK = U(4.2, 5, lt), wave = U(5.2, 6.4, lt) * (1 - U(7.2, 7.8, lt));
    const g = wk < .98 ? gait(gph, dg, -1, 44, 22) : { fL: [-dg.hipW * .55 - 12, 0], fR: [dg.hipW * .55 + 12, 0] };
    const gp = { age: 25, flip: true, face: lt < 3 ? { eyes: "happy", mouth: "smile", brows: "raised", blush: .4 } : lt < 5 ? { eyes: "open", mouth: "small", brows: "raised", look: [-1, 0], blush: .5 } : { eyes: "happy", mouth: "smile", brows: "raised", blush: .8, look: [-1, 0] }, ...g, facing: -1, head: { tilt: .14 * eyeK }, bob: g.bob || 0, R: wave > 0 ? [dg.sh + 40 + Math.sin(lt * 9) * 14, -dg.torso * 1.0] : undefined };
    const G = person(ctx, gx, 1004, 1.4, GIRL, gp, gs(t), t);
    // a tiny plant she sets down on his desk
    if (lt > 6.8) { const k = eBack(U(6.8, 7.4, lt)); ctx.save(); ctx.translate(1120, 858); ctx.scale(k, k); ctx.fillStyle = "#C8523E"; ctx.beginPath(); ctx.moveTo(-18, -22); ctx.lineTo(18, -22); ctx.lineTo(12, 0); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INKC; ctx.lineWidth = 3; ctx.stroke(); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse((i - 1) * 12, -42 - (i % 2) * 8, 8, 18, (i - 1) * .5, 0, TAU); ctx.fillStyle = "#5E9A4C"; ctx.fill(); ctx.stroke(); } ctx.restore(); }
    glow(ctx, G.chest[0], G.chest[1], 480 * ss(1, 5, lt), "#FFC878", .3 * warm);
    ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = `rgba(255,190,120,${.4 * warm})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore();
  },
};

// ================================================================== THE LIT RIVER
function skyCycle(c) { // 0 night .. .25 dawn .. .5 day .. .75 dusk
  const S = [[0, "#0B1030", "#27306B", "#4A4A8A"], [.22, "#5B5AA0", "#F08A7A", "#FFD39A"], [.4, "#6FB4E4", "#BFE0F0", "#F0F4E8"], [.62, "#6FB4E4", "#CFE6F0", "#FAF0D0"], [.78, "#2C2A66", "#C8527A", "#FFB45A"], [1, "#0B1030", "#27306B", "#4A4A8A"]];
  let i = 0; while (i < S.length - 2 && c >= S[i + 1][0]) i++; const a = S[i], b = S[i + 1], k = ss(a[0], b[0], c); return [mixc(a[1], b[1], k), mixc(a[2], b[2], k), mixc(a[3], b[3], k)];
}
const SUNSET = .78;
function riverBg(ctx, t, lt, cyc, o = {}) {
  const [c0, c1, c2] = skyCycle(cyc), hz = 566;
  const g = ctx.createLinearGradient(0, -300, 0, hz); g.addColorStop(0, c0); g.addColorStop(.6, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(-300, -300, 2600, hz + 300);
  const night = cyc < .2 || cyc > .92; if (night) stars(ctx, -300, -300, 2600, 700, 100, 3, t);
  // sun (or moon), travelling the sky
  const ang = (cyc - .25) * TAU / 1, isDay = cyc > .2 && cyc < .85;
  const sunX = o.fixedSun ? 1380 : 960 + Math.cos(ang) * -820, sunY = o.fixedSun ? hz - 70 : hz - 30 - Math.sin(ang) * 700;
  glow(ctx, sunX, sunY, 520, isDay ? "#FFD27A" : "#DCE6FF", isDay ? .6 : .45); ctx.beginPath(); ctx.arc(sunX, sunY, o.fixedSun ? 140 : 70, 0, TAU); ctx.fillStyle = isDay ? "#FFE9A8" : "#F4F6FF"; ctx.fill();
  hills(ctx, -300, 1300, hz + 6, 80, "#3D4A6E", 3, .003); hills(ctx, 1980, 2300, hz + 6, 80, "#3D4A6E", 3, .003); hills(ctx, -300, 2300, hz + 24, 36, "#2C3858", 9, .004);
  for (let i = 0; i < 18; i++) { const tx = -120 + i * 130 + R(i, 1) * 60; if (tx > 1130 && tx < 1700) continue; tree(ctx, tx, hz + 28, .5 + R(i, 2) * .3, "#233149", 0, i + 2); }
  // river: a wedge that opens toward us, mirroring the child's drawing (sun right, river widening left)
  const rv = () => { ctx.beginPath(); ctx.moveTo(1600, hz + 4); ctx.lineTo(1600, hz + 14); ctx.lineTo(-300, 860); ctx.lineTo(-300, 250 + 60); ctx.closePath(); };
  ctx.save(); rv(); ctx.clip(); const wg = ctx.createLinearGradient(1600, 0, -300, 0); wg.addColorStop(0, mixc(c2, "#FFFFFF", .15)); wg.addColorStop(.5, mixc(c1, "#223A66", .35)); wg.addColorStop(1, mixc(c0, "#102040", .4)); ctx.fillStyle = wg; ctx.fillRect(-300, 250, 2000, 700);
  // sun streak on the water
  const sg = ctx.createLinearGradient(0, 0, 1600, 0); ctx.globalCompositeOperation = "lighter"; for (let i = 0; i < 26; i++) { const u = (i + (t * .6) % 1) / 26, px = mix(1560, -200, u), hw = 4 + u * 90, py = hz + 10 + u * 120 * (R(i, 1) - .3) + (i % 3) * 5; ctx.fillStyle = `rgba(255,210,130,${(1 - u) * .22 * (isDay ? 1 : .3)})`; ctx.fillRect(px, py - 2, 90 * (1 - u) + 12, 3 + u * 5); }
  ctx.globalCompositeOperation = "source-over"; ctx.restore();
  // near bank (where they stand)
  const bank = () => { ctx.beginPath(); ctx.moveTo(-300, 860); ctx.lineTo(1600, hz + 14); ctx.lineTo(2300, hz + 40); ctx.lineTo(2300, 1500); ctx.lineTo(-300, 1500); ctx.closePath(); };
  ctx.save(); bank(); const bg = ctx.createLinearGradient(0, 600, 0, 1200); bg.addColorStop(0, mixc("#3A5A44", c1, .15)); bg.addColorStop(1, "#1F3328"); ctx.fillStyle = bg; ctx.fill(); ctx.clip(); grainRect(ctx, -300, 560, 2600, 900, .4); for (let i = 0; i < 70; i++) { ctx.strokeStyle = "rgba(120,160,100,.4)"; ctx.lineWidth = 2; ctx.beginPath(); const gx = R(i, 1) * 2400 - 200, gy = 880 + R(i, 2) * 500; ctx.moveTo(gx, gy); ctx.lineTo(gx + (R(i, 3) - .5) * 14, gy - 22); ctx.stroke(); } ctx.restore();
  // lanterns drifting down the river toward us
  const lc = (cyc > .6 || cyc < .25) ? 1 : .35;
  for (let i = 0; i < 18; i++) { const u = ((t * .028 * (o.lanternSpeed ?? 1) + i / 18) % 1), side = R(i, 4) - .5, x = mix(1580, -150, u), halfW = lerp(4, 300, u ** 1.1), cy = mix(hz + 10, 560, u * .6), y = cy + side * halfW * 1.6 + u * 90; lantern(ctx, x, y, .2 + u * 1.0, t + i, i % 3 ? "#FFB347" : "#FF8F6B"); ctx.globalAlpha = 1; }
}
export const river = {
  fi: 1.4,
  build() { return {}; },
  cam(lt) { return { x: mix(1000, 900, eIO(U(0, 12, lt))), y: 560, z: mix(1.0, 1.25, eIO(U(0, 12, lt))), phi: PHI }; },
  draw(ctx, t, lt, S) {
    riverBg(ctx, t, lt, SUNSET, { fixedSun: true });
    const d = dims(26), dg = dims(25, GIRL.scale), s = 1.55, gy = 1010;
    // she leads him in by the hand, then they stop and look
    const walk = U(0, 4.6, lt), hx = mix(-220, 640, eOut(walk)), gx = hx + 230 * 1;
    const moving = walk < .97, ph = lt * 6.4, gh = moving ? gait(ph, d, 1, 46, 22) : { fL: [-d.hipW * .55 - 10, 0], fR: [d.hipW * .55 + 10, 0] }, gg = moving ? gait(ph + 1, dg, 1, 44, 22) : { fL: [-dg.hipW * .55 - 10, 0], fR: [dg.hipW * .55 + 10, 0] };
    const struck = U(4.2, 6.2, lt), look = U(5, 8, lt);
    const hp = { age: 26, ...gh, flip: false, face: lt < 4.2 ? { eyes: "empty", mouth: "flat", brows: "sad", look: [0, 1] } : lt < 6.2 ? { eyes: "wide", mouth: "o", brows: "raised", look: [1, 0] } : { eyes: "open", mouth: "small", brows: "sad", look: [1, -.3], tears: ss(7, 9, lt) * .6 }, head: { dy: mix(22, 0, struck), tilt: 0 }, lean: mix(.16, 0, struck), L: [-d.sh * .5, d.upper * .3], R: toTorso(hx, gy, s, 26, LOOK.heroCold, 0, false, [(hx + gx) / 2 + 20, gy - 280]), bob: moving ? gh.bob : 0 };
    const gp = { age: 25, ...gg, face: { eyes: lt < 4.6 ? "happy" : "open", mouth: "smile", brows: "raised", blush: .8, look: lt > 4.6 ? [1, 0] : [0, 0] }, head: { tilt: lt > 4.6 ? -.04 : 0 }, L: toTorso(gx, gy + 6, 1.5, 25, GIRL, 0, false, [(hx + gx) / 2 + 20, gy - 280]), R: [dg.sh * .5, dg.upper * .3], bob: moving ? gg.bob : 0 };
    const A = person(ctx, hx, gy, s, LOOK.heroCold, hp, hs(t), t);
    const G = person(ctx, gx, gy + 6, 1.5, GIRL, { ...gp, flip: false }, gs(t), t);
    // light from a thousand lanterns on his face and on the stone
    glow(ctx, A.chest[0], A.chest[1], 260, "#FFB347", .12 * ss(5, 8, lt));
  },
};

// ================================================================== TOUCH
export const touch = {
  fi: .6,
  build() { return {}; },
  cam(lt) { return { x: 880, y: 640, z: mix(1.35, 1.55, eIO(U(0, 8, lt))), phi: PHI }; },
  draw(ctx, t, lt, S) {
    riverBg(ctx, t, lt, SUNSET, { fixedSun: true, lanternSpeed: .6 });
    const d = dims(26), dg = dims(25, GIRL.scale), s = 1.55, gy = 1010;
    // beat 1: she reaches for his chest. he flinches and wrenches her hand away. beat 2: she waits. beat 3: she holds both his hands. beat 4: she lays her palm on the stone.
    const reach = U(.4, 1.6, lt) * (1 - U(1.9, 2.2, lt)), flinch = U(1.8, 2.2, lt) * (1 - U(3.4, 4.6, lt)), cover = flinch, hold = U(5.0, 5.8, lt) * (1 - U(7.0, 7.4, lt)), calm = U(5.4, 7.4, lt), palm = U(7.0, 7.7, lt);
    const hxx = 760 - flinch * 70 + palm * 40, gxx = 1010 + flinch * 60 - palm * 30;
    const hp = { age: 26, face: lt < 1.8 ? { eyes: "wide", mouth: "o", brows: "worried", look: [1, 0] } : lt < 5 ? { eyes: "wide", mouth: "frown", brows: "worried", look: [1, 0], sweat: 1 } : lt < 7.4 ? { eyes: "open", mouth: "small", brows: "sad", look: [1, 0], tears: calm * .7 } : { eyes: "closed", mouth: "small", brows: "sad", tears: .8 }, lean: -.06 - flinch * .12 + calm * .08, head: { dy: 8 * (1 - calm) }, L: cover > .05 ? [mix(-d.sh * .5, d.sh * .3, cover), mix(d.upper * .3, -d.torso * .6, cover)] : [-d.sh * .5, d.upper * .3], R: cover > .05 ? [mix(d.sh + 20, -d.sh * .3, cover), mix(d.upper * .3, -d.torso * .55, cover)] : hold > 0 ? lerp2([d.sh + 20, d.upper * .3], toTorso(hxx, gy, s, 26, LOOK.heroCold, 0, false, [(hxx + gxx) / 2, gy - 270]), hold) : [d.sh + 20, d.upper * .3], bob: Math.sin(lt * 2.4) * 1.6 * (1 - calm * .7) + (flinch > .1 ? Math.sin(lt * 40) * 2 * flinch : 0) };
    // keep the stone where we can see it, then let the arms drop open when he calms
    if (calm > .6 && palm < .1) { hp.L = [-d.sh - 14 + 0, -d.torso * .15]; hp.R = [d.sh + 14, -d.torso * .15]; }
    const gp = { age: 25, flip: true, face: lt < 1.8 ? { eyes: "open", mouth: "small", brows: "raised", look: [-1, 0], blush: .5 } : lt < 4.6 ? { eyes: "open", mouth: "small", brows: "worried", look: [-1, 0] } : { eyes: "happy", mouth: "smile", brows: "neutral", look: [-1, 0], blush: .8 }, lean: .06 + palm * .06, head: { tilt: .06 }, R: palm > 0 ? lerp2(toTorso(gxx, gy + 6, 1.5, 25, GIRL, 0, true, [(hxx + gxx) / 2, gy - 270]), toTorso(gxx, gy + 6, 1.5, 25, GIRL, 0, true, [hxx + 40, gy - 420]), palm) : hold > 0 ? lerp2([dg.sh + 40, -dg.torso * .5], toTorso(gxx, gy + 6, 1.5, 25, GIRL, 0, true, [(hxx + gxx) / 2, gy - 270]), hold) : reach > .02 ? [dg.sh + 40 + reach * 90, -dg.torso * .5] : undefined, bob: Math.sin(lt * 1.9) * 1.2 };
    const A = person(ctx, hxx, gy, s, LOOK.heroCold, hp, hs(t), t);
    const G = person(ctx, gxx, gy + 6, 1.5, GIRL, gp, gs(t), t);
    // his hand batting hers away: a small white shock at the contact
    if (lt > 1.8 && lt < 2.1) { ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 6; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.beginPath(); ctx.moveTo(A.chest[0] + 110 + Math.cos(a) * 30, A.chest[1] + Math.sin(a) * 30); ctx.lineTo(A.chest[0] + 110 + Math.cos(a) * 70, A.chest[1] + Math.sin(a) * 70); ctx.stroke(); } ctx.restore(); }
    if (palm > .3) glow(ctx, A.chest[0], A.chest[1], 180 * ss(.3, 1, palm), "#FFD27A", .5 * ss(.3, 1, palm));
  },
};

// ================================================================== HEAL: days pass by the river
export const heal = {
  fi: .8,
  build() { return {}; },
  cam(lt) { return { x: 900, y: 700, z: mix(1.25, 1.12, eIO(U(0, 12, lt))), phi: PHI }; },
  draw(ctx, t, lt, S) {
    const cyc = ((SUNSET + lt / 3.6) % 1), cycSmooth = lt < 1 ? SUNSET : cyc;
    riverBg(ctx, t, lt, lt < 1 ? SUNSET : cyc, { fixedSun: false, lanternSpeed: 2.5 });
    ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = "rgba(40,50,90,.3)"; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore();
    const d = dims(26), dg = dims(25, GIRL.scale), s = 1.55, gy = 1010, hx = 780, gx = 1060, ht = T("heal") + lt;
    const warm = ss(T_THAW0, T_THAW1, ht);
    // a stone ledge: they sit side by side
    box(ctx, 560, 925, 760, 40, "#6A6A72", { r: 8, ew: 3 }); box(ctx, 600, 965, 680, 60, "#55555E", { r: 8, ew: 3 });
    const sit = (age, look) => { const dd = dims(age, look.scale || {}); return { age, crouch: dd.legLen - 78, facing: 1, fL: [-dd.hipW * .55 + 75, 0], fR: [dd.hipW * .55 + 65, 0], kneeL: [.1, -1], kneeR: [.1, -1] }; };
    const hp = { ...sit(26, LOOK.heroCold), face: warm < .4 ? { eyes: "closed", mouth: "small", brows: "sad", tears: .3 } : warm < .85 ? { eyes: "open", mouth: "small", brows: "sad", look: [1, 0], tears: .5 } : { eyes: "happy", mouth: "small", brows: "neutral", look: [1, 0], blush: .5 }, lean: mix(.1, 0, warm), head: { dy: mix(14, 0, warm) }, L: [-d.sh * .55, d.upper * .3], R: [d.sh * .5, d.upper * .3], bob: Math.sin(lt * 1.3) * 1.4 };
    const gp = { ...sit(25, GIRL), flip: true, face: { eyes: "happy", mouth: "smile", brows: "neutral", blush: .7, look: [-1, 0] }, head: { tilt: .06 }, lean: .06, R: [dg.sh + 56, -dg.torso * .55], bob: Math.sin(lt * 1.2) * 1.2 };
    const bodyY = gy - 12;
    const A = person(ctx, hx, bodyY, s, heroLookAt(t), hp, hs(t), t);
    const G = person(ctx, gx, bodyY + 6, 1.5, GIRL, gp, gs(t), t);
    // her palm on the stone glows, warmer each day
    glow(ctx, A.chest[0], A.chest[1], 150 + 130 * warm, "#FFC060", .35 + .5 * warm);
    for (let i = 0; i < 18 * warm; i++) { const ph = (t * .4 + R(i, 1)) % 1; ctx.globalAlpha = (1 - ph) * .8; ctx.fillStyle = "#FFD98A"; ctx.beginPath(); ctx.arc(A.chest[0] + (R(i, 2) - .5) * 160, A.chest[1] - ph * 200, 2 + R(i, 3) * 3, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    // the first moment the stone cracks: a small bright seam
    if (ht > T_THAW0 - .2 && ht < T_THAW0 + 1.2) glow(ctx, A.chest[0], A.chest[1], 260, "#FFE6A0", .9 * (1 - U(T_THAW0 - .2, T_THAW0 + 1.2, ht)));
  },
};

// ================================================================== MOULD
export const mould = {
  fi: .8,
  build() { return {}; },
  cam(lt) { return { x: 900, y: 690, z: mix(1.7, 1.55, eIO(U(0, 8, lt))), phi: PHI }; },
  draw(ctx, t, lt, S) {
    riverBg(ctx, t, lt, .74 + lt * .004, { fixedSun: false, lanternSpeed: 1 });
    ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = `rgba(255,190,120,.35)`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore();
    const d = dims(26), dg = dims(25, GIRL.scale), s = 1.55, gy = 1010, hx = 840, gx = 1090, ht = T("mould") + lt;
    const smile = ss(5.2, 6.2, lt);
    box(ctx, 600, 925, 760, 40, "#6A6A72", { r: 8, ew: 3 }); box(ctx, 640, 965, 680, 60, "#55555E", { r: 8, ew: 3 });
    const sit = (age, look) => { const dd = dims(age, look.scale || {}); return { age, crouch: dd.legLen - 78, facing: 1, fL: [-dd.hipW * .55 + 75, 0], fR: [dd.hipW * .55 + 65, 0], kneeL: [.1, -1], kneeR: [.1, -1] }; };
    const hp = { ...sit(26, LOOK.heroCold), face: lt < 5.2 ? { eyes: "open", mouth: "small", brows: "sad", look: [0, 1], tears: .3 } : { eyes: "happy", mouth: "smile", brows: "neutral", blush: .7, look: [1, 0] }, lean: lt < 5.2 ? .06 : 0, head: { dy: mix(10, -2, smile) }, L: [-d.sh - 20, d.upper * .2], R: [d.sh + 20, d.upper * .2], bob: Math.sin(lt * 1.3) * 1.2 };
    // she works the clay with both hands, like a potter: little circles, thumbs smoothing, then a gentle pat
    const work = Math.sin(lt * 5), gp = { ...sit(25, GIRL), flip: true, face: { eyes: "open", mouth: "small", brows: "neutral", look: [-1, 1], blush: .4 }, head: { dy: 8 }, lean: .1, R: [dg.sh + 60 + work * 8, -dg.torso * .5 + Math.cos(lt * 5) * 10], L: [-(dg.sh * .4) - 10, -dg.torso * .45 + work * 8], bob: Math.sin(lt * 1.2) };
    const A = person(ctx, hx, gy - 12, s, heroLookAt(t), hp, { ...hs(t), pulse: 0 }, t);
    const G = person(ctx, gx, gy - 6, 1.5, GIRL, gp, gs(t), t);
    // sparks of gold fall as the seams are drawn
    if (ht > T_SEAMS0 && ht < T_SEAMS1 + 1) for (let i = 0; i < 22; i++) { const ph = ((ht - T_SEAMS0) * .7 + R(i, 1)) % 1; ctx.globalAlpha = (1 - ph) * .9; ctx.fillStyle = "#FFD66B"; ctx.beginPath(); ctx.arc(A.chest[0] + (R(i, 2) - .5) * 130, A.chest[1] + (R(i, 3) - .4) * 120 + ph * 80, 2 + R(i, 4) * 3, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    glow(ctx, A.chest[0], A.chest[1], 260 + 120 * ss(T_SEAMS0, T_SEAMS1, ht), "#FFC060", .3 + .4 * ss(T_SEAMS0, T_SEAMS1, ht));
  },
};

// ================================================================== SHOW: her gullak, and the coins they give each other
export const show = {
  fi: .8,
  build() { return {}; },
  cam(lt) { return { x: 960, y: 660, z: mix(1.15, 1.1, eIO(U(0, 10, lt))), phi: PHI }; },
  draw(ctx, t, lt, S) {
    riverBg(ctx, t, lt, .78, { fixedSun: true, lanternSpeed: 1.3 });
    ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = "rgba(255,196,130,.3)"; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore();
    const d = dims(26), dg = dims(25, GIRL_BIG.scale), s = 1.55, gy = 1010, ht = T("show") + lt;
    const reveal = eBack(U(.6, 1.6, lt)), awe = U(1.2, 2.4, lt), hands = U(3.6, 4.4, lt);
    const hp = { age: 26, face: lt < 1.2 ? { eyes: "open", mouth: "small", brows: "sad", look: [1, 0] } : lt < 3.4 ? { eyes: "wide", mouth: "o", brows: "raised", look: [1, 0], blush: .6 } : { eyes: "happy", mouth: "smile", brows: "raised", blush: .8, look: [1, 0] }, lean: -.03, head: { tilt: -.04 * awe }, L: [-d.sh * .6, d.upper * .3], R: hands > 0 ? lerp2([d.sh + 28, d.upper * .4], toTorso(700, gy, s, 26, LOOK.heroEnd, 0, false, [890, gy - 330]), hands) : [d.sh + 28, d.upper * .4], bob: Math.sin(lt * 1.6) * 1.4 };
    const gp = { age: 25, flip: true, face: { eyes: "happy", mouth: lt > 4 ? "grin" : "smile", brows: "raised", blush: .9, look: [-1, 0] }, head: { tilt: .06 }, lean: .04, L: [-(dg.sh * .5 + 6), -dg.torso * .55], R: hands > 0 ? lerp2([dg.sh + 40, -dg.torso * .5], toTorso(1080, gy + 6, 1.5, 25, GIRL_BIG, 0, true, [890, gy - 330]), hands) : [dg.sh + 40 + reveal * 10, -dg.torso * .5], bob: Math.sin(lt * 1.5) };
    const A = person(ctx, 700, gy, s, heroLookAt(t), hp, hs(t), t);
    const G = person(ctx, 1080, gy + 6, 1.5, GIRL_BIG, gp, gs(t), t);
    // they hold hands
    
    // coins: she gives, he gives, back and forth, until both are full
    giveCoin(ctx, t, "pour1", [G.handL[0] - 40, G.handL[1] - 20], A.slot, { r: 20, h: 130 }); giveCoin(ctx, t, "pour2", [A.handR[0], A.handR[1] - 40], G.slot, { r: 20, h: 130 });
    giveCoin(ctx, t, "pour3", [G.handL[0] - 40, G.handL[1] - 20], A.slot, { r: 20, h: 130 }); giveCoin(ctx, t, "pour4", [A.handR[0], A.handR[1] - 40], G.slot, { r: 20, h: 130 });
    giveCoin(ctx, t, "pour5", [G.handL[0] - 40, G.handL[1] - 20], A.slot, { r: 20, h: 130 }); giveCoin(ctx, t, "pour6", [A.handR[0], A.handR[1] - 40], G.slot, { r: 20, h: 130 });
    glow(ctx, G.chest[0], G.chest[1], 340, "#FFC878", .25 + .2 * ss(228, 238, ht)); glow(ctx, A.chest[0], A.chest[1], 300, "#FFC878", .2 + .3 * ss(231, 238, ht));
  },
};

// ================================================================== END: side by side, then the title
export const end = {
  fi: .8, cut: false,
  build() { return {}; },
  cam(lt) { const k = eIO(U(0, 12, lt)); return { x: mix(960, 960, k), y: mix(640, 600, k), z: mix(1.3, 0.98, k), phi: PHI }; },
  draw(ctx, t, lt, S) {
    const sunk = U(0, 13, lt);
    riverBg(ctx, t, lt, .78, { fixedSun: true, lanternSpeed: 1.6 });
    ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = `rgba(255,196,130,${.3 + .15 * sunk})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore();
    const d = dims(26), dg = dims(25, GIRL_BIG.scale), s = 1.5, gy = 1010;
    const turn = eIO(U(3.0, 7.0, lt)), look = turn;                  // they turn to face each other, slowly
    const hp = { age: 26, face: { eyes: turn > .5 ? "happy" : "open", mouth: "smile", brows: "neutral", blush: .9, look: [mix(0, 1, turn), 0] }, head: { tilt: .08 * turn, dx: 4 * turn }, lean: .04 * turn, L: [-d.sh * .6, d.upper * .3], R: toTorso(880, gy, s, 26, LOOK.heroEnd, 0, false, [1010, gy - 300]), bob: Math.sin(lt * 1.4) * 1.2 };
    const gp = { age: 25, flip: true, face: { eyes: turn > .5 ? "happy" : "open", mouth: "smile", brows: "neutral", blush: .9, look: [mix(0, -1, turn), 0] }, head: { tilt: -.08 * turn }, lean: -.04 * turn, L: [-(dg.sh + 10), dg.upper * .3], R: toTorso(1140, gy + 4, 1.45, 25, GIRL_BIG, 0, true, [1010, gy - 300]), bob: Math.sin(lt * 1.3 + 1) * 1.2 };
    const A = person(ctx, 880, gy, s, heroLookAt(t), hp, hs(t), t);
    const G = person(ctx, 1140, gy + 4, 1.45, GIRL_BIG, gp, gs(t), t);
    glow(ctx, (A.chest[0] + G.chest[0]) / 2, A.chest[1], 600, "#FFC878", .15 + .2 * turn);
    // hearts of light rise from both gullaks
    for (let i = 0; i < 16; i++) { const ph = (t * .12 + R(i, 1)) % 1, px = (i % 2 ? A.chest[0] : G.chest[0]) + (R(i, 2) - .5) * 160, py = A.chest[1] - ph * 520; ctx.globalAlpha = Math.sin(ph * Math.PI) * .8 * turn; ctx.fillStyle = "#FFD98A"; ctx.beginPath(); ctx.arc(px, py, 3 + R(i, 3) * 4, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    // the world dissolves into the child's drawing: the river, the sun, and two small figures holding hands
    const dk = ss(6.8, 9.2, lt), tk = U(9.6, 12.4, lt), fk = U(12.6, 14, lt);
    if (dk > 0) { ctx.save(); ctx.globalAlpha = dk; ctx.fillStyle = "#17110E"; ctx.fillRect(-300, -300, 2600, 1800);
      ctx.translate(960, 700); ctx.rotate(PHI); ctx.scale(2.45, 2.45); ctx.translate(-PW / 2, -PH / 2); ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 40; ctx.fillStyle = "#FBF4E2"; ctx.fillRect(0, 0, PW, PH); ctx.shadowBlur = 0; sketch(ctx, 1, lt); ctx.restore(); }
    if (tk > 0) { ctx.save(); const g = ctx.createLinearGradient(0, -300, 0, 330); g.addColorStop(0, `rgba(10,8,18,${.55 * ss(9.6, 11, lt)})`); g.addColorStop(1, "rgba(10,8,18,0)"); ctx.fillStyle = g; ctx.fillRect(-300, -300, 2600, 640); ctx.restore(); titleGullak(ctx, 960, 190, tk, t, tk >= 1 ? 1 : 0); }
    if (fk > 0) { ctx.save(); ctx.fillStyle = `rgba(11,10,13,${ss(0, 1, fk)})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore(); }
  },
};
function titleGullak(ctx, cx, cy, k, t, solid = 0) {
  ctx.save(); const word = "Gullak", size = 210; ctx.font = `italic bold ${size}px "DejaVu Serif"`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const w = ctx.measureText(word).width; ctx.beginPath(); ctx.rect(cx - w / 2 - 20, cy - size, (w + 40) * (solid ? 1 : eOut(k)), size * 2); ctx.clip();
  const g = ctx.createLinearGradient(0, cy - size / 2, 0, cy + size / 2); g.addColorStop(0, "#FFF0B8"); g.addColorStop(.5, "#F2B947"); g.addColorStop(1, "#C77A22");
  ctx.shadowColor = "rgba(255,190,90,.8)"; ctx.shadowBlur = 40; ctx.fillStyle = g; ctx.fillText(word, cx, cy); ctx.shadowBlur = 0; ctx.lineWidth = 3; ctx.strokeStyle = "rgba(120,60,10,.7)"; ctx.strokeText(word, cx, cy);
  // a coin dotting the rhythm: the heart-stamped love coin slips in under the word
  ctx.restore(); if (k > .85) coin(ctx, cx, cy + 190, 28 * Math.min(1, (k - .85) * 6), t * .6 * 0 + Math.sin(t * 2) * .9, 0, 1, .8);
}
export const SCENES_D = { cold, turn, newgirl, river, touch, heal, mould, show, end };
