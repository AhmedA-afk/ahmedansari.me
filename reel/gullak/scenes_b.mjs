// scenes_b.mjs — exam, sports, leave, grind, mistake, friends, cry.
import { core, createCanvas, clamp, lerp, ss, eIO, eOut, eIn, TAU, R, mixc, rgba, noise1 } from "./lib.mjs";
import { SCENES, EV, FLIGHT, heroState, friendState, bgState, pulseOf, rattleOf } from "./story.mjs";
import { layer, grad, glow, wallPaint, planks, windowFrame, shaft, motes, lamp, plant, box, rr, grainRect, hills, tree, skyline, poly, stars, clockWall } from "./env.mjs";
import { paint, tube, flight, dropOut, coin, coinSpray, INKC } from "./art.mjs";
import { person, dims, gait, armsUp, LOOK } from "./person.mjs";
import { penFor, PHI, cam, U, sm, mix, drift, giveCoin, lerp2, extra, CROWD } from "./common.mjs";
import { bake, put, bakeRoom } from "./scenes_a.mjs";
import { burstParticles } from "/root/.claude/skills/claude-animation/lib/fx.mjs";

const hs = (t) => ({ ...heroState(t), pulse: pulseOf("h", t) });
const walkPh = (x, stride = 54) => x / (stride * 1.15);

// a little exam paper held by a hand: red tick + gold star
const testPaper = (c) => { c.save(); c.translate(6, -100); c.rotate(.08); c.fillStyle = "#FFFDF4"; c.strokeStyle = INKC; c.lineWidth = 2.4; c.fillRect(-52, -72, 104, 144); c.strokeRect(-52, -72, 104, 144);
  c.strokeStyle = "#BDB6A6"; c.lineWidth = 1.6; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-38, -48 + i * 14); c.lineTo(38, -48 + i * 14); c.stroke(); }
  c.strokeStyle = "#D2362E"; c.lineWidth = 7; c.lineCap = "round"; c.beginPath(); c.moveTo(-26, 24); c.lineTo(-8, 44); c.lineTo(30, -6); c.stroke();
  c.fillStyle = "#F2B947"; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 7 : 17; c.lineTo(34 + Math.cos(a) * r, -50 + Math.sin(a) * r); } c.closePath(); c.fill(); c.lineWidth = 2; c.strokeStyle = "#8A5A12"; c.stroke(); c.restore(); };

// ================================================================== EXAM
export const exam = {
  build() { return { bg: bakeRoom() }; },
  cam: (lt) => cam(960 + Math.sin(lt * .2) * 6, 640, 1),
  draw(ctx, t, lt, S) {
    put(ctx, S.bg); shaft(ctx, [[650, 560], [900, 560], [1330, 1130], [820, 1130]], "#FFC878", .22);
    ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = "rgba(255,190,130,.16)"; ctx.fillRect(-300, -300, 2600, 2000); ctx.restore();   // evening
    const d = dims(10), s = 1.9, gy = 1050;
    const x = lt < 3 ? mix(300, 880, eOut(U(0, 3, lt))) : mix(880, 1190, eIO(U(3, 5, lt)));
    const walking = lt < 3 || (lt > 3 && lt < 5), ph = lt * 12;
    const jump = lt > 4.1 ? Math.max(0, Math.sin((lt - 4.1) * 7)) * Math.exp(-(lt - 4.1) * .35) * 40 * (lt > 4.1 && lt < 7 ? 1 : 0) : 0;
    const g = walking ? gait(ph, d, 1, 44, 24) : { fL: [-21, 0], fR: [21, 0] };
    const kid = { age: 10, face: { eyes: lt < 4 ? "happy" : "happy", mouth: "grin", brows: "raised", blush: 1 }, ...g, bob: -jump + (walking ? g.bob : 0), L: [-(d.sh + 10), -d.torso + d.upper + d.fore * .9], R: [d.sh + 20, -d.torso - d.fore * .4], holdR: testPaper };
    if (lt > 4.6) { kid.R = [d.sh + 26, -d.torso * .5 - d.fore * .3]; }
    // parents stand and watch
    const dad = LOOK.father, mum = LOOK.mother;
    const clap = lt > 4.8 && lt < 6.4, kc = Math.abs(Math.sin(lt * 9));
    const dadA = person(ctx, 1500, 1040, 1.4, dad, { age: 42, face: { eyes: "open", mouth: "smile", brows: lt > 2 ? "raised" : "neutral", look: [-1, 0] }, bob: Math.sin(lt * 1.6) * 1.2, R: lt > 4.4 ? [-10, -d.torso * 2.5 - 20] : undefined, L: [-70, -90] }, bgState(.8), t);
    const mumA = person(ctx, 1700, 1040, 1.4, mum, { age: 38, face: { eyes: "happy", mouth: "smile", brows: "raised", look: [-1, 0] }, bob: Math.sin(lt * 1.6 + 1) * 1.2, L: clap ? [-6 - kc * 18, -dims(38, mum.scale || {}).torso * .56] : undefined, R: clap ? [6 + kc * 18, -dims(38, mum.scale || {}).torso * .56] : undefined }, bgState(.85), t);
    const A = person(ctx, x, gy, s, LOOK.heroKid, { ...kid, flip: false }, hs(t), t);
    giveCoin(ctx, t, "exam1", [dadA.handR[0], dadA.handR[1] - 20], A.slot, { r: 17, h: 130 });
    giveCoin(ctx, t, "exam2", [mumA.handL[0], mumA.handL[1] - 10], A.slot, { r: 17, h: 120 });
    burstParticles(ctx, t, EV.exam1.t, A.chest[0], A.chest[1] - 40, { n: 12, kind: "confetti", colors: ["#F2B947", "#FFF3C4", "#E58A24"], speed: 380, life: .9, size: 7, seed: 3 });
  },
};

// ================================================================== SPORTS
const FINISH = 1420;
function bakeField() {
  return bake(-300, -300, 2300, 1500, (x) => {
    grad(x, -300, -300, 2600, 880, "#9ED2E6", "#FBE9C4"); glow(x, 1500, 160, 520, "#FFF2C0", .6);
    hills(x, -300, 2300, 520, 90, "#A9C98B", 4); hills(x, -300, 2300, 600, 60, "#8DB772", 7);
    // stands
    x.fillStyle = "#6E7F95"; x.fillRect(-300, 520, 2600, 120); x.fillStyle = "#8394AA"; x.fillRect(-300, 520, 2600, 12);
    for (let i = 0; i < 160; i++) { const px = -280 + (i % 80) * 32 + (Math.floor(i / 80) * 14), py = 548 + Math.floor(i / 80) * 36; x.fillStyle = ["#E9B44C", "#D1624A", "#4E8A8B", "#B0A0D4", "#F4D9A2", "#7FAF5A"][Math.floor(R(i, 2) * 6)]; x.beginPath(); x.arc(px, py - 12, 9, 0, TAU); x.fill(); x.fillRect(px - 8, py - 3, 16, 22); }
    grad(x, -300, 640, 2600, 130, "#7DB35B", "#69A04B");                       // infield
    grad(x, -300, 770, 2600, 190, "#C9684A", "#B15139");                        // track
    for (let k = 0; k < 4; k++) { x.fillStyle = "rgba(255,255,255,.75)"; x.fillRect(-300, 770 + k * 48, 2600, 4); }
    grad(x, -300, 960, 2600, 700, "#76AE56", "#5E9444"); grainRect(x, -300, 640, 2600, 900, .35);
    // finish posts
    x.fillStyle = "#F3EBDD"; x.fillRect(FINISH - 6, 700, 12, 270); x.fillRect(FINISH + 120 - 6, 700, 12, 270);
    for (let i = 0; i < 12; i++) { x.fillStyle = i % 2 ? "#1E1E22" : "#F7F3EA"; x.fillRect(FINISH + 14, 770 + i * 16, 12, 16); }
  });
}
export const sports = {
  build() { return { bg: bakeField() }; },
  cam(lt) { const px = lt < 3.6 ? mix(300, FINISH, eIO(U(0, 3.6, lt))) : FINISH; return cam(clamp(px + 300, 900, 1150), 560, 1.02); },
  draw(ctx, t, lt, S) {
    put(ctx, S.bg);
    // the crowd in the stands, cheering
    for (let i = 0; i < 46; i++) { const px = 40 + i * 42, y0 = 600 + (i % 3) * 26, a = Math.abs(Math.sin(t * (4 + R(i, 1) * 3) + i)); ctx.fillStyle = ["#E9B44C", "#D1624A", "#4E8A8B", "#B0A0D4", "#F4D9A2"][i % 5]; ctx.fillRect(px - 9, y0 - 5 - a * 16, 18, 24); ctx.beginPath(); ctx.arc(px, y0 - 14 - a * 16, 10, 0, TAU); ctx.fillStyle = "#C98F5E"; ctx.fill();
      if (lt > 2.6) { ctx.strokeStyle = "#C98F5E"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px - 8, y0 - a * 16); ctx.lineTo(px - 18, y0 - 30 - a * 22); ctx.moveTo(px + 8, y0 - a * 16); ctx.lineTo(px + 18, y0 - 30 - a * 22); ctx.stroke(); }
      if (R(i, 5) > .6) { ctx.beginPath(); ctx.arc(px, y0 + 2 - a * 16, 3.5, 0, TAU); ctx.fillStyle = "rgba(255,200,100,.9)"; ctx.fill(); } }
    const d = dims(14), s = 1.6, gy = 920, tape = 3.9;
    // the tape breaks
    const broke = lt > tape;
    ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = "#E83A3A"; ctx.beginPath();
    if (!broke) { ctx.moveTo(FINISH, 840); ctx.lineTo(FINISH + 120, 840); } else { const k = U(tape, tape + .8, lt); ctx.moveTo(FINISH, 840); ctx.quadraticCurveTo(FINISH - 30 - k * 60, 880 + k * 90, FINISH - 60 - k * 90, 930 + k * 120); ctx.moveTo(FINISH + 120, 840); ctx.quadraticCurveTo(FINISH + 150 + k * 60, 880 + k * 90, FINISH + 180 + k * 90, 930 + k * 120); }
    ctx.stroke(); ctx.restore();
    // rivals, a stride behind
    const run = (lt0, x0, x1, look, off) => { const kx = lt < 3.9 ? mix(x0, x1, eIO(U(lt0, lt0 + 3.9, lt))) : x1 + U(3.9, 5.2, lt) * 70, ph = lt * 12 + off, gg = gait(ph, d, 1, 46, 30); person(ctx, kx, gy + off * 8, s * .96, look, { age: 14, face: { eyes: "open", mouth: "o", brows: "worried" }, ...gg, L: [-(d.sh + 20 + Math.sin(ph) * 10), -d.torso + d.upper * .8], R: [d.sh + 20 - Math.sin(ph) * 10, -d.torso + d.upper * .8], lean: .12 }, bgState(.4), t); };
    run(0, 200, FINISH - 330, LOOK.pal, 1.5); run(0, 130, FINISH - 560, LOOK.friend, 3);
    // the runner
    const x = lt < tape ? mix(420, FINISH + 20, eIO(U(0, tape, lt))) : mix(FINISH + 20, FINISH + 150, eOut(U(tape, 5.4, lt)));
    const running = lt < tape + .6, ph = lt * 13, gg = running ? gait(ph, d, 1, 54, 36) : { fL: [-21, 0], fR: [21, 0] };
    const after = U(tape, tape + .5, lt), breathe = lt > 5.6 ? Math.sin(lt * 8) * .03 : 0;
    const kid = { age: 14, face: lt < tape ? { eyes: "open", mouth: "o", brows: "angry" } : { eyes: "happy", mouth: "grin", brows: "raised", blush: 1 }, ...gg, lean: lt < tape ? .15 : lt > 5.4 ? .26 : 0, bob: running ? gg.bob : 0,
      L: lt < tape ? [-(d.sh + 18 + Math.sin(ph) * 14), -d.torso + d.upper * .8] : [-(d.sh + 30), -d.torso - d.fore * .6 * (1 - U(5.2, 5.8, lt) * .8)], R: lt < tape ? [d.sh + 18 - Math.sin(ph) * 14, -d.torso + d.upper * .8] : [d.sh + 30, -d.torso - d.fore * .6 * (1 - U(5.2, 5.8, lt) * .8)] };
    if (lt > 5.6) { kid.L = [-(d.sh * .6), -d.torso * .2]; kid.R = [d.sh * .6, -d.torso * .2]; kid.lean = .28; kid.face = { eyes: "closed", mouth: "o", brows: "neutral", blush: 1 }; }
    const A = person(ctx, x, gy, s, LOOK.heroKid, kid, hs(t), t);
    // coach and best friend at the line
    const coach = person(ctx, FINISH + 300, 940, 1.5, LOOK.father, { age: 44, face: { eyes: "happy", mouth: "grin", brows: "raised", look: [-1, 0] }, L: [-60, -d.torso * 2.2], R: [d.sh + 30, -d.torso * 1.9], bob: -Math.abs(Math.sin(lt * 6)) * 6 }, bgState(.7), t);
    const pal = person(ctx, FINISH + 470, 960, 1.5, LOOK.pal, { age: 16, face: { eyes: "happy", mouth: "grin", brows: "raised", look: [-1, 0] }, bob: -Math.abs(Math.sin(lt * 7)) * 18, ...armsUp(d, 1.2) }, bgState(.6), t);
    giveCoin(ctx, t, "race1", [coach.handL[0], coach.handL[1] - 20], A.slot, { r: 18, h: 150 }); giveCoin(ctx, t, "race2", [pal.handR[0], pal.handR[1] - 10], A.slot, { r: 18, h: 130 });
    burstParticles(ctx, t, tape + .05, FINISH + 60, 800, { n: 40, kind: "confetti", colors: ["#F2B947", "#E8483A", "#4E8A8B", "#FFF3C4", "#B0A0D4"], speed: 640, life: 1.8, size: 10, spread: 2.4, gravity: 700, seed: 2 });
  },
};

// ================================================================== LEAVE
function bakeStreet() {
  return bake(-300, -300, 2500, 1500, (x) => {
    grad(x, -300, -300, 2800, 1000, "#F2B88E", "#7A6FA0"); glow(x, 1750, 560, 380, "#FFD7A0", .65);
    skyline(x, 900, 2500, 760, 260, "#5B5280", 3, (r) => r < .4 ? "#FFD27A" : "#E8A85A"); skyline(x, 1000, 2500, 800, 170, "#463E66", 9, (r) => "#FFD27A");
    hills(x, -300, 900, 700, 60, "#7E8C6E", 5);
    // the house: warm wall, open door glowing
    grad(x, -300, 300, 1000, 600, "#EBCFA1", "#D8B382"); grainRect(x, -300, 300, 1000, 600, .35);
    x.fillStyle = "#B3744A"; x.beginPath(); x.moveTo(-340, 310); x.lineTo(320, 130); x.lineTo(1000, 310); x.closePath(); x.fill(); grainRect(x, -340, 130, 1400, 200, .3);
    box(x, 420, 520, 230, 380, "#3A2A22", { r: 4 }); grad(x, 440, 540, 190, 360, "#FFD98A", "#F2A94E"); glow(x, 535, 780, 340, "#FFC878", .5);
    windowFrame(x, 40, 500, 200, 200, "#FFE7B8", "#FFC878", { frame: "#F6EEDD" });
    grad(x, -300, 900, 2800, 600, "#6E6A78", "#4F4C5C"); x.fillStyle = "#8D8896"; x.fillRect(-300, 900, 2800, 14);
    for (let i = 0; i < 10; i++) { x.fillStyle = "rgba(240,230,200,.5)"; x.fillRect(120 + i * 220, 1110, 110, 10); }
    box(x, 380, 884, 310, 24, "#9C968E", { r: 3 });   // step
  });
}
const suitcase = (c) => { c.save(); c.translate(0, 56); paint(c, () => rr(c, -42, -34, 84, 68, 8), "#8C5A3C", { ew: 3, sz: 60 }); c.lineWidth = 6; c.strokeStyle = "#5A3826"; c.beginPath(); c.moveTo(-14, -34); c.lineTo(-14, -48); c.lineTo(14, -48); c.lineTo(14, -34); c.stroke(); c.fillStyle = "#E2B04C"; c.fillRect(-4, -4, 8, 8); c.restore(); };
export const leave = {
  build() { return { bg: bakeStreet() }; },
  cam(lt) { return cam(mix(900, 1150, eIO(U(4, 8, lt))), 600, 1.0); },
  draw(ctx, t, lt, S) {
    put(ctx, S.bg); const gy = 1010, d = dims(22), s = 1.5;
    const walk = U(4.2, 7.6, lt), x = mix(870, 1650, eIO(walk)), ph = walkPh(x) * 4.2;
    const g = walk > 0 && walk < 1 ? gait(ph, d, 1, 50, 28) : { fL: [-21, 0], fR: [21, 0] };
    const mum = LOOK.mother, dad = LOOK.father;
    const hug = lt > 1.5 && lt < 3.6;
    const mumA = person(ctx, 560, gy, 1.4, mum, { age: 38, face: { eyes: lt > 3.4 ? "closed" : "happy", mouth: "smile", brows: "worried", blush: .5, look: [1, 0] }, bob: Math.sin(lt * 1.4) * 1, L: [(d.sh + 40), -90], R: lt > 4.4 ? [58, -d.torso * 2.2 + Math.sin(lt * 9) * 14] : [d.sh + 28, -78] }, bgState(.85), t);
    const dadA = person(ctx, 420 - 60, gy - 6, 1.4, dad, { age: 42, face: { eyes: "open", mouth: "small", brows: "sad", look: [1, 0] }, bob: Math.sin(lt * 1.4 + 2), L: [-60, -80], R: lt > 5 ? [-(60), -d.torso * 2 + Math.sin(lt * 9 + 1) * 10] : undefined }, bgState(.8), t);
    const face = lt < 1.4 ? { eyes: "open", mouth: "small", brows: "sad", look: [-1, 0] } : lt < 4 ? { eyes: "closed", mouth: "smile", brows: "sad", blush: .6 } : { eyes: "open", mouth: "small", brows: "neutral", look: [1, 0] };
    const A = person(ctx, x, gy, s, LOOK.heroGrown, { age: 22, face, ...g, bob: g.bob || 0, holdR: lt > 3.4 ? suitcase : null, L: lt > 3.4 && lt < 4.2 ? undefined : undefined, lean: walk > 0 ? .05 : 0, flip: false }, hs(t), t);
    giveCoin(ctx, t, "home1", [mumA.handL[0], mumA.handL[1]], A.slot, { r: 19, h: 120 }); giveCoin(ctx, t, "home2", [dadA.handR[0], dadA.handR[1]], A.slot, { r: 19, h: 120 });
    // dusk lamps along the road switch on as he goes
    for (let i = 0; i < 5; i++) { const lx = 1000 + i * 300; ctx.fillStyle = "#3A3A46"; ctx.fillRect(lx - 4, 700, 8, 210); glow(ctx, lx, 700, 160, "#FFD27A", .55 * ss(5 + i * .3, 6.5 + i * .3, lt)); }
  },
};

// ================================================================== GRIND (office)
const OFFICE = { wall0: "#C9C6BC", wall1: "#B4B1A7", floor0: "#8C8A86", floor1: "#74726F" };
export function bakeOffice() {
  return bake(-300, -300, 2300, 1500, (x) => {
    wallPaint(x, -300, -300, 2600, 1250, OFFICE.wall0, OFFICE.wall1, 3);
    grad(x, -300, 940, 2600, 600, OFFICE.floor0, OFFICE.floor1); grainRect(x, -300, 940, 2600, 600, .4);
    for (let i = 0; i < 24; i++) { x.fillStyle = "rgba(0,0,0,.06)"; x.fillRect(-300 + i * 120, 940, 2, 600); }
    x.fillStyle = "#A8A59B"; x.fillRect(-300, 930, 2600, 14);
    // ceiling light strips
    for (let i = 0; i < 6; i++) { x.fillStyle = "#EAF0F2"; x.fillRect(120 + i * 320, -20, 200, 14); }
  });
}
export function skyAt(c) {               // c in [0,1) day cycle -> [top, bottom]
  const stops = [[0, "#101830", "#2B2F58"], [.2, "#F4A66A", "#FBD79A"], [.4, "#8FC4E4", "#DCEEF4"], [.6, "#8FC4E4", "#DCEEF4"], [.8, "#E27A5A", "#F3B07A"], [1, "#101830", "#2B2F58"]];
  let i = 0; while (i < stops.length - 2 && c >= stops[i + 1][0]) i++; const a = stops[i], b = stops[i + 1], k = ss(a[0], b[0], c); return [mixc(a[1], b[1], k), mixc(a[2], b[2], k)];
}
export function officeWindow(ctx, t, lt, x, y, w, h) {
  const cyc = (lt / 3.2) % 1, [c0, c1] = skyAt(cyc);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); grad(ctx, x, y, w, h, c0, c1);
  const night = cyc < .12 || cyc > .93; if (night) stars(ctx, x, y, w, h * .6, 40, 2, t);
  const ang = cyc * TAU - Math.PI / 2, sx = x + w / 2 + Math.cos(ang) * w * .45, sy = y + h * .75 + Math.sin(ang) * h * .7; glow(ctx, sx, sy, 160, cyc > .15 && cyc < .85 ? "#FFE8A8" : "#E8EEFF", .7); ctx.beginPath(); ctx.arc(sx, sy, 30, 0, TAU); ctx.fillStyle = cyc > .15 && cyc < .85 ? "#FFF2C0" : "#F4F6FF"; ctx.fill();
  skyline(ctx, x, x + w, y + h, h * .55, night ? "#1B2040" : "#6D7A93", 4, night ? (r) => (r < .6 ? "#FFD27A" : "#9AB0FF") : null); ctx.restore();
  ctx.lineWidth = 8; ctx.strokeStyle = "#E8E4DA"; ctx.strokeRect(x, y, w, h); ctx.beginPath(); for (let i = 1; i < 4; i++) { ctx.moveTo(x + w * i / 4, y); ctx.lineTo(x + w * i / 4, y + h); } ctx.stroke();
  return cyc;
}
export function monitor(ctx, x, y, glowOn = 1, red = 0, t = 0) {
  box(ctx, x - 12, y + 150, 24, 50, "#3A3A40", { r: 3 }); box(ctx, x - 60, y + 190, 120, 14, "#3A3A40", { r: 5 });
  paint(ctx, () => { ctx.beginPath(); ctx.moveTo(x - 130, y + 20); ctx.lineTo(x + 100, y); ctx.lineTo(x + 100, y + 150); ctx.lineTo(x - 130, y + 160); ctx.closePath(); }, "#2A2A30", { ew: 3, sz: 120, c: [x, y + 80] });
  const col = red > .01 ? mixc("#8FB4FF", "#FF3A3A", red) : "#8FB4FF";
  ctx.save(); ctx.beginPath(); ctx.moveTo(x - 118, y + 30); ctx.lineTo(x + 90, y + 12); ctx.lineTo(x + 90, y + 140); ctx.lineTo(x - 118, y + 148); ctx.closePath(); ctx.clip(); grad(ctx, x - 120, y, 220, 160, mixc(col, "#FFFFFF", .5), col);
  ctx.fillStyle = "rgba(20,40,90,.35)"; for (let i = 0; i < 9; i++) ctx.fillRect(x - 100, y + 40 + i * 12, 60 + (R(i, 4) * 120), 5); ctx.restore();
  glow(ctx, x - 20, y + 90, 360, col, .28 * glowOn);
}
export function desk(ctx, x, y, w, t) { box(ctx, x - w / 2, y, w, 22, "#8A6F55", { r: 3 }); box(ctx, x - w / 2 + 10, y + 22, w - 20, 160, "#6F5843", { r: 3 }); box(ctx, x - w / 2 + 40, y + 36, 100, 70, "#5E4A39", { r: 3 }); }
export const grind = {
  fi: 1.0,
  build() { return { bg: bakeOffice() }; },
  cam(lt) { const k = eIO(U(0, 18, lt)); return { x: mix(1000, 990, k), y: mix(600, 790, k), z: mix(1.0, 2.1, k * k), phi: PHI }; },
  draw(ctx, t, lt, S) { officeScene(ctx, t, lt, S, 46); },
};
function officeScene(ctx, t, lt, S, t0) {
  put(ctx, S.bg);
  const cyc = officeWindow(ctx, t, lt, 300, 150, 1320, 420);
  clockWall(ctx, 1000, 120, 62, lt, 9);
  // colleagues come and go in the back rows, each with a quiet glow of their own
  const back = [[330, LOOK.colleague], [560, LOOK.pal], [1560, LOOK.friend], [1790, LOOK.teacher]];
  back.forEach(([bx, lk], i) => { desk(ctx, bx, 820, 220, t); const d2 = dims(28), here = Math.sin(lt * .5 + i * 1.7) > -.5; if (here) person(ctx, bx, 920, 1.05, lk, { age: 28, crouch: d2.legLen - 105, facing: 1, fL: [-d2.hipW * .55 + 70, 0], fR: [d2.hipW * .55 + 60, 0], face: { eyes: "down", mouth: "flat" }, L: [-30, -2 + Math.sin(lt * 10 + i) * 4], R: [30, -2 + Math.sin(lt * 9 + i) * 4] }, bgState(.5 + .1 * i), t); desk(ctx, bx, 820, 220, t); });
  // him
  const hx = 1000, gy = 1000, s = 1.45, d = dims(26), seat = 98;
  desk(ctx, hx, 860, 640, t);
  const sit = { age: 26, crouch: d.legLen - seat, face: { eyes: "down", mouth: "flat", brows: "neutral", look: [1, .6] }, facing: 1, fL: [-d.hipW * .55 + 80, 0], fR: [d.hipW * .55 + 70, 0], kneeL: [.1, -1], kneeR: [.1, -1], L: [-34, -2 + Math.sin(lt * 11) * 4], R: [34, -2 + Math.sin(lt * 9.2) * 4], bob: Math.sin(lt * 1.1) * 1.5, head: { dy: 6, tilt: Math.sin(lt * .5) * .02 } };
  const st = { ...heroState(t), pulse: 0 };
  // chair
  box(ctx, hx - 80, gy - 40, 160, 18, "#3A3A44", { r: 8 }); ctx.fillStyle = "#2A2A30"; ctx.fillRect(hx - 6, gy - 22, 12, 22);
  person(ctx, hx, gy, s, LOOK.heroWork, sit, st, t);
  desk(ctx, hx, 860, 640, t);
  // stacks of paper and mugs: time piling up on the desk
  const n = Math.floor(lt / 3.2); for (let i = 0; i < Math.min(n, 5); i++) { box(ctx, 1190 + i * 18, 840 - i * 12, 74, 18, "#F4F0E4", { r: 2, ew: 2 }); ctx.save(); ctx.translate(780 - i * 36, 842); box(ctx, -14, -26, 28, 26, i % 2 ? "#C8523E" : "#E8E4DA", { r: 4, ew: 2 }); ctx.restore(); }
  monitor(ctx, 1250, 650, 1, 0, t);
  motes(ctx, lt, [700, 400, 700, 600], 18, "#FFFFFF", .35);
  ctx.save(); ctx.globalCompositeOperation = "multiply"; const dn = cyc < .15 || cyc > .85 ? .45 : cyc < .3 || cyc > .7 ? .18 : 0; ctx.fillStyle = `rgba(40,50,90,${dn})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore();
}

// ================================================================== MISTAKE
export const mistake = {
  fi: .9,
  build() { return { bg: bakeOffice() }; },
  cam(lt) { return { x: mix(1060, 1000, eIO(U(0, 8, lt))), y: 700, z: mix(1.35, 1.5, eIO(U(0, 8, lt))), phi: PHI }; },
  draw(ctx, t, lt, S) {
    put(ctx, S.bg); officeWindow(ctx, t, 0.45 * 3.2, 300, 150, 1320, 420);
    ctx.fillStyle = "rgba(60,60,70,.35)"; ctx.fillRect(-300, -300, 2600, 1800);                     // late and grey
    const hx = 1000, gy = 1000, s = 1.45, d = dims(26), seat = 98, dm = dims(45, LOOK.manager.scale || {});
    const shakeK = Math.sin(U(2.4, 4.4, lt) * Math.PI) * (lt > 2.4 && lt < 4.4 ? 1 : 0), jit = Math.sin(lt * 52) * 10 * shakeK;
    const err = U(.2, .5, lt) * (1 - U(5, 7, lt) * .5);
    monitor(ctx, 1250, 650, 1, err * (.6 + .4 * Math.sin(lt * 14)), t);
    const mx = lt < 2.0 ? mix(260, 760, eOut(U(0, 2.0, lt))) : lt < 5.4 ? 760 : mix(760, 280, eIn(U(5.4, 8, lt)));
    const walking = lt < 2.0 || lt > 5.4, g = walking ? gait(lt * 9, dm, mx < 700 && lt > 5 ? -1 : 1, 56, 26) : { fL: [-30, 0], fR: [30, 0] };
    desk(ctx, hx, 860, 640, t);
    const sit = { age: 26, crouch: d.legLen - seat, facing: 1, fL: [-d.hipW * .55 + 80, 0], fR: [d.hipW * .55 + 70, 0], kneeL: [.1, -1], kneeR: [.1, -1], L: [-34, -2], R: [34, -2], face: lt < .8 ? { eyes: "down", mouth: "flat", brows: "neutral", look: [1, .6] } : lt < 2.2 ? { eyes: "wide", mouth: "o", brows: "worried", sweat: 1, look: [-1, 0] } : lt < 5.2 ? { eyes: "wide", mouth: "o", brows: "worried", look: [-1, 0], sweat: 1 } : { eyes: "sad", mouth: "frown", brows: "sad", look: [1, 1.2] }, lean: lt > 5.4 ? .12 : 0, head: { dy: lt > 5.4 ? 18 : 0 } };
    if (lt > 2.4 && lt < 4.5) { sit.L = [-d.sh - 20, -d.torso * .5]; sit.R = [d.sh + 20, -d.torso * .5]; }
    box(ctx, hx - 80, gy - 40, 160, 18, "#3A3A44", { r: 8 }); ctx.fillStyle = "#2A2A30"; ctx.fillRect(hx - 6, gy - 22, 12, 22);
    const st = { ...heroState(t), pulse: 0, tilt: shakeK * Math.sin(lt * 50) * .15 };
    // manager arrives, points, grabs, shakes
    const near = mx > 700;
    const mpose = { age: 45, face: { eyes: "cold", mouth: lt > 1.6 && lt < 5.2 ? "shout" : "flat", brows: "angry" }, ...g, facing: 1, bob: g.bob || 0, lean: near ? .08 : 0 };
    if (lt > 1.6 && lt < 2.4) { mpose.R = [dm.sh + 70, -dm.torso * .75]; mpose.L = [-(dm.sh + 10), dm.upper * .4]; }
    if (lt >= 2.4 && lt < 4.6) { const sh = Math.sin(lt * 52) * 12; mpose.L = [dm.sh + 60, -dm.torso * .38 + sh]; mpose.R = [dm.sh + 80, -dm.torso * .5 - sh]; mpose.lean = .16; }
    const mA = person(ctx, mx, 1010, 1.55, LOOK.manager, mpose, bgState(.35), t);
    person(ctx, hx + jit, gy, s, LOOK.heroWork, sit, st, t);
    desk(ctx, hx, 860, 640, t);
    if (lt > 2.4 && lt < 4.5) { /* grip lines */ ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(hx - 130 + i * 50 + jit, 560 - Math.abs(Math.sin(lt * 52 + i)) * 20); ctx.lineTo(hx - 130 + i * 50 + jit, 530 - Math.abs(Math.sin(lt * 52 + i)) * 20); ctx.stroke(); } ctx.restore(); }
    // the coin that falls out of him
    const slot = [hx + jit, gy - (d.legLen - (d.legLen - seat)) * s - d.torso * s * .6 - 58];
    dropOut(ctx, t, EV.boss1.t, slot[0], 765, { r: 20, floor: 985, dir: -1, vx: 190 });
    // manager's red zigzag speech
    if (lt > 1.6 && lt < 5.2) { ctx.save(); ctx.strokeStyle = "#D94040"; ctx.lineWidth = 6; ctx.lineJoin = "miter"; for (let k = 0; k < 3; k++) { const ph = (lt * 4 + k * .35) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); const bx = mA.head[0] + 70 + ph * 120, by = mA.head[1] - 20 - k * 28; for (let i = 0; i < 7; i++) ctx.lineTo(bx + i * 14, by + (i % 2 ? 14 : -14)); ctx.stroke(); } ctx.restore(); }
  },
};

// ================================================================== FRIENDS (the train)
function bakeStation() {
  return bake(-300, -300, 2600, 1500, (x) => {
    grad(x, -300, -300, 2900, 1000, "#F3B27A", "#6C6A9A"); glow(x, 300, 650, 560, "#FFD7A0", .7);
    skyline(x, -300, 2600, 800, 240, "#4E4A70", 3, (r) => r < .4 ? "#FFD27A" : "#E8A85A");
    grad(x, -300, 820, 2900, 700, "#9C958C", "#7B756E"); grainRect(x, -300, 820, 2900, 700, .35);
    x.fillStyle = "#E8C34A"; x.fillRect(-300, 960, 2900, 12);
    grad(x, -300, 1020, 2900, 200, "#3A3840", "#27252B");                                        // track bed
    for (let i = 0; i < 30; i++) { x.fillStyle = "#4B3D35"; x.fillRect(-300 + i * 100, 1030, 50, 140); }
    x.fillStyle = "#8D8B93"; x.fillRect(-300, 1060, 2900, 8); x.fillRect(-300, 1130, 2900, 8);
  });
}
function carriage(ctx, x, lit) {
  paint(ctx, () => rr(ctx, x, 470, 1700, 480, 28), "#4D7C8A", { ew: 4, sz: 400, c: [x + 800, 700], lit: .12 });
  box(ctx, x, 700, 1700, 26, "#3A5C66", { r: 0, ew: 3 }); box(ctx, x, 900, 1700, 36, "#2E4A52", { r: 0, ew: 3 });
  for (let i = 0; i < 5; i++) { const wx = x + 120 + i * 320; rr(ctx, wx, 540, 230, 220, 18); ctx.fillStyle = "#FFD98A"; ctx.fill(); }
  for (const dx of [260, 1300]) { ctx.fillStyle = "#2B2B33"; ctx.beginPath(); ctx.arc(x + dx, 960, 52, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x + dx + 150, 960, 52, 0, TAU); ctx.fill(); }
}
export const friends = {
  fi: .9,
  build() { return { bg: bakeStation() }; },
  cam(lt) { return cam(960, 600, 1.0); },
  draw(ctx, t, lt, S) {
    put(ctx, S.bg);
    const depart = lt < 3.1 ? 0 : (lt - 3.1), tx = 880 + (depart * depart * 130), gy = 975, d = dims(26), s = 1.5;
    // the friend, framed in the doorway/window of the carriage
    const fx = lt < 2.2 ? mix(900, 1180, U(0, 2.2, lt)) : 1180 + (tx - 880);
    // train body (behind the friend until he steps in)
    carriage(ctx, tx, 1);
    // friend on the platform, then waving from the window
    if (lt < 2.6) { person(ctx, mix(760, 1040, eOut(U(0, 1.4, lt))), gy, s, LOOK.pal, { age: 26, face: { eyes: "sad", mouth: "smile", brows: "worried", look: [-1, 0] }, L: [-(d.sh + 30), -d.torso * .5 + Math.sin(lt * 6) * 10], R: [d.sh + 10, d.upper * .6] }, bgState(.6), t); }
    else { ctx.save(); const wx = tx + 120, wy = 540; rr(ctx, wx, wy, 230, 220, 18); ctx.clip(); ctx.fillStyle = "#FFD98A"; ctx.fillRect(wx, wy, 230, 220); person(ctx, wx + 115, 925, .62, LOOK.pal, { age: 26, face: { eyes: "sad", mouth: "smile", brows: "worried", look: [-1, 0] }, noShadow: true, L: [-(d.sh + 40), -d.torso * 1.05 + Math.sin(lt * 7) * 26], R: [d.sh + 10, d.upper] }, bgState(.6), t); ctx.restore(); ctx.lineWidth = 12; ctx.strokeStyle = "#2E4A52"; rr(ctx, wx, wy, 230, 220, 18); ctx.stroke(); }
    // him on the platform
    const hx = 500, face = lt < 2.6 ? { eyes: "open", mouth: "small", brows: "sad", look: [1, 0] } : lt < 6 ? { eyes: "open", mouth: "frown", brows: "sad", look: [1, 0] } : { eyes: "sad", mouth: "frown", brows: "sad", look: [1, 1] };
    const A = person(ctx, hx, 1060, s, LOOK.heroWork, { age: 26, face, L: [-(d.sh + 12), d.upper * .8], R: lt > 3.4 && lt < 5.5 ? [d.sh + 42, -d.torso * .7 + Math.sin(lt * 5) * 14] : undefined, head: { dy: lt > 6.2 ? 14 : 0 }, bob: Math.sin(lt * 1.3) * 1.2 }, hs(t), t);
    dropOut(ctx, t, EV.leave1.t, A.slot[0], A.slot[1], { r: 20, floor: 1085, dir: 1, vx: 70 });
  },
};

// ================================================================== CRY (the bench)
function bakePark() {
  return bake(-300, -300, 2300, 1500, (x) => {
    grad(x, -300, -300, 2600, 1000, "#E39A86", "#4F4A78"); glow(x, 1500, 640, 520, "#FFC896", .6); stars(x, -300, -300, 2600, 500, 40, 7);
    hills(x, -300, 2300, 700, 80, "#4A4F63", 3); hills(x, -300, 2300, 770, 50, "#3D435A", 8);
    for (let i = 0; i < 9; i++) tree(x, 100 + i * 260, 830, 1.2 + R(i, 1) * .5, mixc("#3C5A52", "#2A3C46", R(i, 2)), 0, i + 3);
    grad(x, -300, 830, 2600, 700, "#5E7A58", "#44603F"); grainRect(x, -300, 830, 2600, 700, .35);
    x.fillStyle = "#B7A58C"; x.beginPath(); x.moveTo(300, 1500); x.lineTo(780, 900); x.lineTo(1260, 900); x.lineTo(1700, 1500); x.closePath(); x.fill(); grainRect(x, 300, 900, 1400, 600, .3);
  });
}
export const cry = {
  fi: .9,
  build() { return { bg: bakePark() }; },
  cam(lt) { const k = eIO(U(0, 14, lt)); return { x: mix(960, 1090, k), y: mix(620, 700, k), z: mix(1.0, 1.35, k), phi: PHI }; },
  draw(ctx, t, lt, S) {
    put(ctx, S.bg); const d = dims(26), s = 1.5, gy = 1000, warm = ss(8.4, 9.6, lt);
    glow(ctx, 1280, 560, 560, "#FFC878", .4 + .3 * warm);
    // lamp post
    ctx.fillStyle = "#2E2A30"; ctx.fillRect(1470, 520, 12, 470); box(ctx, 1440, 480, 72, 52, "#FFE7A8", { r: 8, ew: 3 });
    // bench
    const bench = () => { box(ctx, 1000, 800, 520, 30, "#8A5C3A", { r: 6 }); box(ctx, 1000, 740, 520, 26, "#9A6A46", { r: 6 }); box(ctx, 1020, 830, 24, 160, "#3A2A22", { r: 3 }); box(ctx, 1476, 830, 24, 160, "#3A2A22", { r: 3 }); };
    bench();
    // her, curled over, crying
    const fk = U(8.4, 9.6, lt), sob = Math.sin(lt * 9) * (1 - fk) * 3;
    const girl = { ...sitPoseLocal(26, LOOK.friend, 96, 1), lean: .18 * (1 - fk), bob: sob, face: fk > .5 ? { eyes: "happy", mouth: "smile", brows: "worried", blush: .8, tears: .3 * (1 - fk) } : { eyes: "sad", mouth: "sob", brows: "worried", tears: 1 }, head: { dy: 20 * (1 - fk) }, L: [-20, -d.torso * 1.0 + 6 + (1 - fk) * 0], R: [20, -d.torso * 1.0 + 6], };
    if (fk < .5) { girl.L = [-12, -d.torso * 1.04]; girl.R = [12, -d.torso * 1.04]; }
    const fA = person(ctx, 1340, 990, s, LOOK.friend, girl, friendState(t), t);
    // him: walks in, sits, listens, gives
    const walk = U(0, 3.4, lt), hxx = mix(380, 1100, eIO(walk)), sit = U(3.4, 4.4, lt);
    const gg = walk < 1 ? gait(lt * 7.5, d, 1, 48, 24) : { fL: [-d.hipW * .55 + 80 * sit, 0], fR: [d.hipW * .55 + 70 * sit, 0] };
    const hpose = { age: 26, crouch: (d.legLen - 96) * sit, face: lt < 3.4 ? { eyes: "open", mouth: "small", brows: "worried", look: [1, 0] } : lt < 7.6 ? { eyes: "open", mouth: "small", brows: "sad", look: [-1, 0] } : { eyes: "happy", mouth: "smile", brows: "neutral", blush: .4, look: [-1, 0] }, ...gg, kneeL: [.1, -1], kneeR: [.1, -1], facing: 1, bob: walk < 1 ? gg.bob : 0 };
    const reach = U(6.0, 7.1, lt) * (1 - U(8.0, 8.4, lt));
    if (lt > 6.0 && lt < 8.5) { hpose.R = [d.sh + 26 + 50 * reach, -d.torso * .55 + 20 * (1 - reach)]; hpose.L = [-d.sh * .4, -d.torso * .5]; }
    const A = person(ctx, hxx, 1000, s, LOOK.heroWork, hpose, hs(t), t);
    // the coin rises from his slot, is held out to her, and drops into hers
    const t1 = EV.give1.t, hand = A.handR;
    flight(ctx, t, t1, EV.take1.t - FLIGHT - t1, A.slot, [hand[0] + 20, hand[1] - 10], { r: 19, h: 50 });
    giveCoin(ctx, t, "take1", [hand[0] + 20, hand[1] - 10], fA.slot, { r: 19, h: 80 });
    if (lt > 8.0 && lt < 12) { glow(ctx, fA.chest[0], fA.chest[1], 260 + Math.sin(lt * 2) * 14, "#FFC878", .25 * ss(8.4, 10, lt)); }
  },
};
function sitPoseLocal(age, look, seatH, f) { const d = dims(age, look.scale || {}); const hipJ = d.hipW * .55; return { age, crouch: d.legLen - seatH, facing: f, fL: [-hipJ + f * d.thigh * .98, 0], fR: [hipJ + f * d.thigh * .98 - 12, 0], kneeL: [f * .2, -1], kneeR: [f * .2, -1] }; }

export const SCENES_B = { exam, sports, leave, grind, mistake, friends, cry };
