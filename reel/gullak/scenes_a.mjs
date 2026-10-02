// scenes_a.mjs — Arc 1: growing up.  room (draws, rolls to landscape, shows parents), exam, sports, leave.
import { core, tex, createCanvas, clamp, lerp, ss, eIO, eOut, eIn, eBack, TAU, hash, R, mixc, rgba, noise1 } from "./lib.mjs";
import { SCENES, EV, FLIGHT, heroState, bgState, pulseOf } from "./story.mjs";
import { layer, grad, glow, wallPaint, planks, windowFrame, shaft, motes, lamp, shelf, plant, sofa, rug, box, rr, grainRect, hills, tree, skyline, poly } from "./env.mjs";
import { paint, tube, flight, dropOut, coin, INKC } from "./art.mjs";
import { person, dims, gait, armsUp, LOOK } from "./person.mjs";
import { penFor, PHI, cam, U, sm, mix, withFx, rattle, sitPose } from "./common.mjs";

export const bake = (x0, y0, x1, y1, fn) => { const c = layer(x1 - x0, y1 - y0, (x) => { x.translate(-x0, -y0); fn(x); }); return { img: c, x: x0, y: y0 }; };
export const put = (ctx, b) => ctx.drawImage(b.img, b.x, b.y);
const T0 = (k) => SCENES[k][0];

// ------------------------------------------------------------------ the child's drawing: a vertical river and a sun that, turned sideways, is a landscape
export const PW = 300, PH = 400;
export function sketch(ctx, p, t = 0) {
  const pen = penFor(ctx), w = (a, b) => clamp((p - a) / (b - a));
  // paper
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, PW, PH); ctx.fillStyle = "#FBF4E2"; ctx.fill(); grainRect(ctx, 0, 0, PW, PH, .4); ctx.restore();
  // river, then banks (under the sun)
  pen.begin("sk/river", w(.25, .5)); pen.wash([[128, 138], [172, 138], [236, 400], [64, 400]], "#6FA8CC", { alpha: .8, ox: 150, oy: 140 }); pen.end();
  pen.begin("sk/ripples", w(.45, .56)); for (let i = 0; i < 7; i++) { const y = 175 + i * 33, x = 150 + Math.sin(i * 2) * 20, hw = 14 + i * 7; pen.stroke([[x - hw, y], [x - hw * .3, y - 5], [x + hw * .3, y + 4], [x + hw, y]], { w: 2.4, color: "#EAF6FF", jit: .8 }); } pen.end();
  pen.begin("sk/bankL", w(.56, .66)); pen.wash([[0, 150], [126, 140], [60, 400], [0, 400]], "#92B66B", { alpha: .75, ox: 70, oy: 200 }); pen.end();
  pen.begin("sk/bankR", w(.6, .7)); pen.wash([[300, 150], [174, 140], [240, 400], [300, 400]], "#A9BF72", { alpha: .75, ox: 230, oy: 220 }); pen.end();
  pen.begin("sk/edgeL", w(.56, .7)); pen.stroke([[126, 140], [100, 230], [78, 320], [62, 400]], { w: 2.6, color: "#47663A", jit: 1.2 }); pen.stroke([[174, 140], [200, 230], [222, 320], [238, 400]], { w: 2.6, color: "#47663A", jit: 1.2 }); pen.end();
  // sun
  pen.begin("sk/sunwash", w(.08, .2)); pen.wash([[116, 78], [124, 55], [150, 44], [176, 55], [184, 78], [176, 101], [150, 112], [124, 101]], "#F7B538", { alpha: .95, ox: 150, oy: 78 }); pen.end();
  pen.begin("sk/sun", w(0, .12)); pen.ring(150, 78, 34, 34, { w: 3.4, color: "#D9731F" }); pen.end();
  pen.begin("sk/rays", w(.16, .26)); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; pen.stroke([[150 + Math.cos(a) * 44, 78 + Math.sin(a) * 44], [150 + Math.cos(a) * (58 + (i % 2) * 8), 78 + Math.sin(a) * (58 + (i % 2) * 8)]], { w: 3.2, color: "#E58A24", jit: .8, smooth: false }); } pen.end();
  // paper lanterns on the water, and two small figures on the bank holding hands
  pen.begin("sk/lant", w(.7, .82)); [[150, 205], [122, 262], [188, 296], [100, 352], [206, 372]].forEach(([x, y], i) => { pen.wash([[x - 7, y], [x, y - 9], [x + 7, y], [x, y + 9]], "#FFD25A", { alpha: .95, solid: true, over: true }); pen.stroke([[x - 7, y], [x, y - 9], [x + 7, y], [x, y + 9], [x - 7, y]], { w: 1.6, color: "#B8741C", jit: .4, smooth: false }); }); pen.end();
  // two small figures holding hands on the bank. drawn lying along the page's x so that, turned sideways, they stand upright
  pen.begin("sk/pair", w(.82, .98));
  [[250, 316], [250, 344]].forEach(([x, y]) => { pen.ring(x - 36, y, 7, 7, { w: 2.6, color: "#3A2A22" }); pen.stroke([[x - 28, y], [x - 6, y]], { w: 2.6, color: "#3A2A22", jit: .5 }); pen.stroke([[x - 6, y], [x + 12, y - 5]], { w: 2.4, color: "#3A2A22", jit: .4 }); pen.stroke([[x - 6, y], [x + 12, y + 5]], { w: 2.4, color: "#3A2A22", jit: .4 }); });
  pen.stroke([[236, 318], [236, 330], [236, 342]], { w: 2.4, color: "#3A2A22", jit: .3 });
  pen.stroke([[212, 332], [206, 326], [200, 332], [206, 342], [212, 332]], { w: 1.8, color: "#D1453A", jit: .3, smooth: false }); pen.end();
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(60,40,20,.25)"; ctx.strokeRect(0, 0, PW, PH); ctx.restore();
}

export function bakeRoom() {
  return bake(-300, -300, 2300, 1700, (x) => {
    wallPaint(x, -300, -300, 2600, 1100, "#F4DFBC", "#E9C795", 5);
    planks(x, -300, 800, 2600, 900, "#CF9C66", "#A9763E", 4, 130);
    x.fillStyle = "#EBD9B8"; x.fillRect(-300, 786, 2600, 24); x.fillStyle = "rgba(60,30,10,.35)"; x.fillRect(-300, 808, 2600, 3);
    windowFrame(x, 640, 250, 260, 310, "#BFE3F0", "#FBE9B8", { curtain: "#DE9585", inner: (c, wx, wy, ww, wh) => { c.fillStyle = "rgba(255,255,255,.7)"; c.beginPath(); c.ellipse(wx + 90, wy + 90, 60, 20, 0, 0, TAU); c.ellipse(wx + 130, wy + 80, 44, 18, 0, 0, TAU); c.fill(); hills(c, wx, wx + ww, wy + wh - 30, 40, "#9DBB7E", 3); } });
    // framed pictures + shelf
    box(x, 1120, 300, 150, 170, "#F7EFE0", { r: 4, ew: 4 }); box(x, 1136, 316, 118, 138, "#B88A64", { r: 2, ew: 2 });
    box(x, 1330, 270, 110, 120, "#F7EFE0", { r: 4, ew: 4 }); box(x, 1344, 284, 82, 92, "#7FA3A8", { r: 2, ew: 2 });
    shelf(x, 1020, 470, 280, 6); plant(x, 1860, 800, 1.1, 0); rug(x, 960, 1130, 700, 130, "#B5483E", "#E8C27A");
    sofa(x, 1400, 1010, 440, "#9C5B4A"); lamp(x, 1350, 800, 1.5, 1, 0);
  });
}

// ------------------------------------------------------------------ the slanted school desk (drawn after the kid so it hides his legs)
function desk(ctx, cx, topY) {
  ctx.save();
  paint(ctx, () => { ctx.beginPath(); ctx.moveTo(cx - 250, topY + 130); ctx.lineTo(cx - 210, topY); ctx.lineTo(cx + 210, topY); ctx.lineTo(cx + 250, topY + 130); ctx.closePath(); }, "#B8814E", { ew: 3.4, sz: 250, c: [cx, topY + 70], lit: .16 });
  box(ctx, cx - 250, topY + 130, 500, 22, "#8A5A34", { r: 4 });
  box(ctx, cx - 230, topY + 152, 36, 120, "#7A4E2C", { r: 4 }); box(ctx, cx + 194, topY + 152, 36, 120, "#7A4E2C", { r: 4 });
  ctx.restore();
}
const crayon = (col) => (c, d) => { c.save(); c.rotate(.9); c.fillStyle = col; c.strokeStyle = INKC; c.lineWidth = 2.4; c.beginPath(); c.rect(-5, -36, 10, 34); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-5, -2); c.lineTo(0, 8); c.lineTo(5, -2); c.closePath(); c.fill(); c.stroke(); c.restore(); };

export const room = {
  fi: 0,
  build() { return { bg: bakeRoom() }; },
  cam(lt) {
    const roll = eIO(U(9.9, 12.7, lt)), z = lt < 9.4 ? 1.3 + Math.sin(lt * .3) * .01 : mix(1.3, 1.0, eIO(U(9.4, 12.9, lt)));
    // portrait window around the kid, then settle on the wide room
    return { x: mix(960, 960, roll), y: mix(800, 640, roll), z, phi: roll * PHI };
  },
  draw(ctx, t, lt, S) {
    put(ctx, S.bg);
    // window light, breathing
    const br = .9 + .1 * Math.sin(lt * .4);
    shaft(ctx, [[650, 560], [900, 560], [1330, 1130], [820, 1130]], "#FFE3A0", .26 * br); shaft(ctx, [[670, 560], [760, 560], [1050, 1130], [900, 1130]], "#FFF1C8", .16 * br);
    motes(ctx, lt, [700, 560, 600, 560], 22, "#FFF4D0", .55);
    const L = LOOK.hero, d = dims(6, {}), s = 2.0, kx = 960, ground = 1130, st0 = heroState(t);
    // ---------------- kid timeline
    const pDraw = lt < 9 ? mix(0, .55, U(1.4, 8.4, lt)) : lt < 14 ? .55 : mix(.55, 1, U(14, 16.4, lt));
    const lifted = U(8.9, 9.8, lt) * (1 - U(13.0, 13.9, lt)) + U(16.5, 17.3, lt);      // paper off the desk (face-on) 0..1
    const lift2 = U(16.5, 17.2, lt);
    const th = eIO(U(9.9, 12.2, lt)) * PHI;                                           // paper turned in his hand
    let x = kx, gy = ground, run = 0, standing = U(18.4, 19.3, lt);
    if (lt >= 18.4) { const u = U(18.4, 21.0, lt); x = mix(kx, 1360, eIO(u) ); gy = mix(1130, 1030, U(19.4, 21.0, lt)); run = U(19.3, 20.8, lt) * (1 - U(20.8, 21.1, lt)); }
    const asleepFace = lt < 8.6 ? { eyes: "open", mouth: "small", brows: "neutral", look: [Math.sin(lt * 1.3) * .6, 1.4] } : lt < 12.2 ? { eyes: "wide", mouth: "o", brows: "raised", look: [-1, -.6] } : lt < 17 ? { eyes: "happy", mouth: "smile", brows: "neutral", blush: .8 } : { eyes: "happy", mouth: "grin", brows: "raised", blush: 1 };
    const sk = pDraw;
    const bodyS = s, pelvisYw = gy - (d.legLen - 30 * (1 - standing)) * bodyS;
    const tb = (wx, wy) => [(wx - x) / bodyS, (wy - pelvisYw) / bodyS];
    // pencil hand target on the squashed paper
    const hx = 960 + Math.sin(lt * 3.1) * 55 + Math.sin(lt * 7.3) * 12, hy = 1010 + 18 + Math.sin(lt * 2.3) * 14 + (sm(1.4, 1.5, lt) * 0);
    let Lh, Rh, lean = .1, hold = null;
    if (lt < 8.6 || (lt >= 13.6 && lt < 16.5)) { Rh = tb(hx, hy); Lh = tb(900, 1000); hold = crayon("#E0731F"); }
    else if (lt < 13.6) { const k = U(8.6, 9.5, lt); const g = tb(780, 800); Lh = [mix(tb(900, 1000)[0], g[0], eOut(k)), mix(tb(900, 1000)[1], g[1], eOut(k))]; Rh = tb(1010, 1000); lean = mix(.1, 0, k); }
    else if (lt < 18.4) { const k = eOut(U(16.4, 17.3, lt)), g = tb(1150, 806); Lh = tb(900, 1000); Rh = [mix(tb(1010, 1000)[0], g[0], k), mix(tb(1010, 1000)[1], g[1], k)]; lean = 0; }
    else { const k = 1 - eOut(U(20.9, 21.6, lt)); const g = [1, -1].map((sd) => [sd * (d.sh + 20), -d.torso - d.fore * 1.1]); const rest = [-1, 1].map((sd) => [sd * (d.sh + 10), -d.torso + d.upper + d.fore * .9]); Lh = [mix(rest[0][0], g[0][0], k), mix(rest[0][1], g[0][1], k)]; Rh = [mix(rest[1][0], g[1][0], k), mix(rest[1][1], g[1][1], k)]; lean = 0; }
    const sitting = standing < 1;
    const pose = { age: 6, flip: false, face: asleepFace, lean, crouch: 30 * (1 - standing), L: Lh, R: Rh, holdR: hold, bob: sitting ? 0 : -Math.abs(Math.sin(lt * 9)) * 7 * run, head: { dy: lt < 8.6 ? 8 : 0, tilt: lt < 8.6 ? .06 * Math.sin(lt * .8) : 0 }, noShadow: false };
    if (sitting) { pose.fL = [-18, 0]; pose.fR = [18, 0]; pose.kneeL = [0, -1]; pose.kneeR = [0, -1]; }
    else { const g = gait(lt * 11 * (run > .2 ? 1 : 0), d, 1, 40 * run, 24 * run); pose.fL = g.fL; pose.fR = g.fR; pose.facing = 1; pose.hipDx = 0; }
    // ---- parents are in the room all along (we only see them once the world rolls)
    const mum = LOOK.mother, dad = LOOK.father, gk = U(20.4, 21.3, lt);
    const dadPose = { ...sitPose(40, dad, 100, -1), face: { eyes: lt > 20.5 ? "happy" : "open", mouth: "smile", brows: "neutral", look: [-1, 0] }, bob: Math.sin(lt * 1.5) * 1, L: [-34, -14], R: [34, -14] };
    const mumPose = { ...sitPose(38, mum, 100, -1), face: { eyes: lt > 21.2 ? "happy" : "open", mouth: "smile", brows: lt > 20.6 ? "raised" : "neutral", look: [-1, 0] }, lean: -.04 - gk * .09, bob: Math.sin(lt * 1.5 + 1) * 1, L: [mix(-34, -96, eOut(U(20.5, 21.1, lt)) * (1 - eOut(U(22.3, 22.9, lt)))), mix(-14, -70, eOut(U(20.5, 21.1, lt)) * (1 - eOut(U(22.3, 22.9, lt))))], R: [mix(34, -80, eOut(U(20.9, 21.4, lt)) * (1 - eOut(U(22.3, 22.9, lt)))), mix(-14, -74, eOut(U(20.9, 21.4, lt)) * (1 - eOut(U(22.3, 22.9, lt))))] };
    person(ctx, 1560, 1010, 1.25, dad, dadPose, bgState(.8), t);
    const mumA = person(ctx, 1730, 1010, 1.25, mum, mumPose, bgState(.85), t);
    // ---- the kid
    const st = { ...st0, pulse: pulseOf("h", t) };
    const A = person(ctx, x, gy, s, L, pose, st, t);
    if (sitting) desk(ctx, kx, 960);
    // ---- paper: a flat sheet on the slanted desk, lifted face-on into his hand, turned, laid back, then held up to show
    const paperAt = (C, squash, rot, ps, shadow = true) => { ctx.save(); ctx.translate(C[0], C[1]); ctx.scale(1, squash); ctx.rotate(rot); ctx.scale(ps, ps); ctx.translate(-PW / 2, -PH / 2);
      if (shadow) { ctx.shadowColor = "rgba(40,20,10,.3)"; ctx.shadowBlur = 14; ctx.fillStyle = "#FBF4E2"; ctx.fillRect(0, 0, PW, PH); ctx.shadowBlur = 0; } sketch(ctx, sk, lt); ctx.restore(); };
    const ps = .72, deskC = [960, 1040];
    if (lt < 8.9) paperAt(deskC, .4, 0, 1, false);
    else if (lt < 13.9) {
      const k = eOut(U(8.9, 9.8, lt)) * (1 - eIO(U(13.0, 13.9, lt))), G = [780, 800], Cl = [G[0] + Math.cos(th) * -PW * ps / 2, G[1] + Math.sin(th) * -PW * ps / 2];
      paperAt([mix(deskC[0], Cl[0], k), mix(deskC[1], Cl[1], k)], mix(.4, 1, k), mix(0, th, 1), mix(1, ps, k), k > .02);
    } else if (lt < 16.5) paperAt(deskC, .4, PHI, 1, false);
    else if (lt < 18.4) { const k = eOut(U(16.5, 17.4, lt)); paperAt([mix(deskC[0], 1150, k), mix(deskC[1], 700, k)], mix(.4, 1, k), PHI, mix(1, ps, k), k > .02); }
    else { const hand = A.handL, hand2 = A.handR, cxp = (hand[0] + hand2[0]) / 2, cyp = (hand[1] + hand2[1]) / 2 - 140, toM = U(20.7, 21.4, lt);
      const mx = (mumA.handL[0] + mumA.handR[0]) / 2, my = (mumA.handL[1] + mumA.handR[1]) / 2, lowK = eIO(U(22.3, 22.9, lt));
      if (lt < 22.95) paperAt([mix(cxp, mx, eIO(toM)), mix(cyp, my - 40, eIO(toM)) + lowK * 70], 1, PHI, mix(.62, .5, eIO(toM))); }
    // ---- mother's coin: love goes in
    flight(ctx, t, EV.mum1.t - FLIGHT, FLIGHT, [mumA.handR[0] - 10, mumA.handR[1] - 10], A.slot, { r: 17, h: 140 });
    return { A, mumA };
  },
};

export const SCENES_A = { room };
