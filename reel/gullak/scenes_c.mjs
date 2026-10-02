// scenes_c.mjs — the game: bedroom → arena, the warrior queen, the argument, the hammers, kneeling in the dark.
import { core, createCanvas, clamp, lerp, ss, eIO, eOut, eIn, eBack, TAU, R, mixc, rgba, noise1 } from "./lib.mjs";
import { SCENES, EV, FLIGHT, T_BREAK_H, T_BREAK_Q, heroState, queenState, bgState, pulseOf } from "./story.mjs";
import { layer, grad, glow, wallPaint, box, rr, grainRect, hills, stars, poly, shade } from "./env.mjs";
import { paint, tube, flight, dropOut, coin, coinSpray, INKC } from "./art.mjs";
import { person, dims, gait, armsUp, LOOK } from "./person.mjs";
import { penFor, PHI, cam, U, sm, mix, drift, giveCoin, lerp2, extra } from "./common.mjs";
import { bake, put } from "./scenes_a.mjs";
import { burstParticles, shake } from "/root/.claude/skills/claude-animation/lib/fx.mjs";

const T = (k) => SCENES[k][0];
const hs = (t) => ({ ...heroState(t), pulse: pulseOf("h", t) });
const qs = (t) => ({ ...queenState(t), pulse: pulseOf("q", t), tint: "queen" });

// ------------------------------------------------------------------ weapons and effects
const blade = (len, ang, col = "#BFE8FF", glowc = "#7FD6FF", glowA = .9) => (c) => { c.save(); c.rotate(ang);
  c.shadowColor = glowc; c.shadowBlur = 22; c.fillStyle = col; c.beginPath(); c.moveTo(-14, -6); c.lineTo(len, -4); c.lineTo(len + 26, 0); c.lineTo(len, 4); c.lineTo(-14, 6); c.closePath(); c.fill(); c.shadowBlur = 0;
  c.lineWidth = 2.4; c.strokeStyle = INKC; c.stroke(); c.fillStyle = "#6B4A2A"; c.fillRect(-30, -7, 26, 14); c.fillStyle = "#E6B44C"; c.fillRect(-6, -18, 8, 36); c.restore(); };
const hammer = (ang, wob = 0) => (c) => { c.save(); c.rotate(ang + wob); c.fillStyle = "#6B4A2A"; c.strokeStyle = INKC; c.lineWidth = 3; c.beginPath(); c.rect(-70, -8, 330, 16); c.fill(); c.stroke();
  c.save(); c.translate(260, 0); paint(c, () => rr(c, -20, -62, 130, 124, 12), "#6C7280", { ew: 4, sz: 90, c: [45, 0], lit: .25 }); c.fillStyle = "#E6B44C"; c.fillRect(-20, -14, 130, 8); c.fillRect(-20, 8, 130, 8);
  c.fillStyle = "rgba(255,200,100,.8)"; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(10 + i * 38, 0, 6, 0, TAU); c.fill(); } c.restore(); c.restore(); };
function hearts(ctx, x, y, t, n = 3, col = "#FF7A9A") {
  for (let i = 0; i < n; i++) { const ph = ((t * .8 + i / n) % 1), px = x + Math.sin(ph * 6 + i * 2) * 18 + (i - 1) * 24, py = y - ph * 120, a = Math.sin(ph * Math.PI) * .95, h = 14 + 6 * Math.sin(i);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(px, py); ctx.beginPath(); ctx.moveTo(0, h * .9); ctx.bezierCurveTo(-h * 1.7, -h * .2, -h * .7, -h * 1.3, 0, -h * .4); ctx.bezierCurveTo(h * .7, -h * 1.3, h * 1.7, -h * .2, 0, h * .9); ctx.fillStyle = col; ctx.fill(); ctx.restore(); }
}
function imp(ctx, x, y, s, t, i) {
  const hop = Math.abs(Math.sin(t * 6 + i * 1.7)) * 26 * s;
  ctx.save(); ctx.translate(x, y - hop); ctx.scale(s, s);
  paint(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -36, 34, 38, 0, 0, TAU); }, "#3A2A52", { ew: 3, sz: 40, c: [0, -36] });
  for (const sd of [-1, 1]) { paint(ctx, () => { ctx.beginPath(); ctx.moveTo(sd * 18, -64); ctx.lineTo(sd * 30, -92); ctx.lineTo(sd * 36, -60); ctx.closePath(); }, "#2A1C3C", { ew: 2.4, sz: 20 }); ctx.beginPath(); ctx.ellipse(sd * 12, -42, 7, 9, 0, 0, TAU); ctx.fillStyle = "#FF5A6A"; ctx.shadowColor = "#FF5A6A"; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0; }
  ctx.beginPath(); ctx.moveTo(-14, -22); for (let k = 0; k < 6; k++) ctx.lineTo(-14 + k * 6, -22 + (k % 2 ? 8 : 0)); ctx.strokeStyle = "#FFB0B8"; ctx.lineWidth = 2.4; ctx.stroke(); ctx.restore();
}
function boss(ctx, x, y, s, t, o = {}) {
  const { hit = 0, swipe = 0, dead = 0 } = o, br = Math.sin(t * 1.4) * 8; if (dead >= 1) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = 1 - ss(0, 1, dead);
  const sh = hit * 14 * Math.sin(t * 90);
  ctx.translate(sh, 0);
  const g = ctx.createRadialGradient(-60, -380, 20, 0, -260, 300); g.addColorStop(0, hit > .1 ? "#8A5AD0" : "#5A3A86"); g.addColorStop(1, "#1E122F");
  // arms
  for (const sd of [-1, 1]) { const sw = sd > 0 ? swipe : 0; const A = [[sd * 190, -420], [sd * (300 + sw * -60), -300 + sw * 70], [sd * (360 - sw * 280), -120 + sw * 120]]; tube(ctx, A, 90, 50, "#35204D", { ew: 5 });
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(A[2][0] + k * 24, A[2][1]); ctx.lineTo(A[2][0] + k * 30 + sd * 18, A[2][1] + 56); ctx.lineTo(A[2][0] + k * 14, A[2][1] + 10); ctx.closePath(); ctx.fillStyle = "#EAD9FF"; ctx.fill(); } }
  paint(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -250, 230, 270 + br, 0, 0, TAU); }, g, { ew: 6, sz: 260, c: [0, -250], lit: .05 });
  // glowing fissures
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, -250, 226, 266 + br, 0, 0, TAU); ctx.clip(); ctx.strokeStyle = `rgba(255,120,80,${.55 + .3 * Math.sin(t * 3)})`; ctx.lineWidth = 5; ctx.shadowColor = "#FF6A3A"; ctx.shadowBlur = 16;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); let px = (i - 2) * 80, py = -420; ctx.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (R(i * 7 + k, 2) - .5) * 60; py += 50 + R(i * 7 + k, 3) * 30; ctx.lineTo(px, py); } ctx.stroke(); } ctx.restore();
  // head, horns, eyes, maw
  paint(ctx, () => { ctx.beginPath(); ctx.ellipse(0, -520 + br * .5, 130, 112, 0, 0, TAU); }, g, { ew: 6, sz: 130, c: [0, -520] });
  for (const sd of [-1, 1]) paint(ctx, () => { ctx.beginPath(); ctx.moveTo(sd * 70, -590); ctx.quadraticCurveTo(sd * 190, -640, sd * 210, -770); ctx.quadraticCurveTo(sd * 130, -690, sd * 40, -620); ctx.closePath(); }, "#E9DCC4", { ew: 4, sz: 100, c: [sd * 120, -660] });
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 52, -532, 26, 18 - hit * 8, sd * -.3, 0, TAU); ctx.fillStyle = hit > .1 ? "#FFFFFF" : "#FF4B5C"; ctx.shadowColor = "#FF2A4A"; ctx.shadowBlur = 24; ctx.fill(); ctx.shadowBlur = 0; }
  ctx.beginPath(); ctx.moveTo(-70, -470); for (let k = 0; k <= 8; k++) ctx.lineTo(-70 + k * 17.5, -470 + (k % 2 ? 22 : 0)); ctx.lineWidth = 6; ctx.strokeStyle = "#FFB8B8"; ctx.shadowColor = "#FF5A5A"; ctx.shadowBlur = 14; ctx.stroke(); ctx.shadowBlur = 0;
  ctx.restore();
}
function arenaBake(tone = 0) {
  return bake(-300, -300, 2300, 1500, (x) => {
    grad(x, -300, -300, 2600, 1100, "#161040", "#B0489A"); grad(x, -300, 520, 2600, 400, "rgba(240,130,120,0)", "#F29A7A", true, .55);
    stars(x, -300, -300, 2600, 600, 130, 8); glow(x, 1500, 330, 440, "#FFF0C8", .55);
    x.beginPath(); x.arc(1500, 330, 150, 0, TAU); x.fillStyle = "#FBEBC8"; x.fill(); x.beginPath(); x.arc(1450, 300, 130, 0, TAU); x.fillStyle = "#E7D2A6"; x.globalAlpha = .45; x.fill(); x.globalAlpha = 1;
    // floating islands
    for (const [ix, iy, iw] of [[300, 420, 300], [760, 300, 220], [1850, 500, 340], [1180, 560, 180]]) { x.fillStyle = "#33295E"; x.beginPath(); x.moveTo(ix - iw / 2, iy); x.quadraticCurveTo(ix, iy + 40, ix + iw / 2, iy); x.lineTo(ix + iw * .18, iy + iw * .5); x.lineTo(ix - iw * .1, iy + iw * .28); x.closePath(); x.fill(); x.fillStyle = "#5CB48A"; x.fillRect(ix - iw / 2 + 8, iy - 8, iw - 16, 14); x.fillStyle = "#FFD98A"; x.fillRect(ix - 8, iy - 54, 16, 46); glow(x, ix, iy - 40, 90, "#FFD98A", .6); }
    // crystals
    for (let i = 0; i < 9; i++) { const cx0 = -150 + i * 270 + R(i, 1) * 120, h = 160 + R(i, 2) * 220; x.fillStyle = i % 2 ? "#37B8C4" : "#7A5CD6"; x.globalAlpha = .75; x.beginPath(); x.moveTo(cx0 - 38, 880); x.lineTo(cx0 - 14, 880 - h); x.lineTo(cx0 + 18, 880 - h * .8); x.lineTo(cx0 + 44, 880); x.closePath(); x.fill(); x.globalAlpha = 1; glow(x, cx0, 880 - h * .5, 120, i % 2 ? "#3FD0E0" : "#9A7CFF", .3); }
    // the ground
    grad(x, -300, 880, 2600, 640, "#3A2D72", "#1B1440"); for (let k = 0; k < 14; k++) { x.strokeStyle = "rgba(160,200,255,.14)"; x.lineWidth = 2; x.beginPath(); x.moveTo(-300, 900 + k * 40 + k * k * 1.5); x.lineTo(2300, 900 + k * 40 + k * k * 1.5); x.stroke(); }
    for (let k = -8; k < 16; k++) { x.strokeStyle = "rgba(160,200,255,.12)"; x.lineWidth = 2; x.beginPath(); x.moveTo(960 + k * 90, 880); x.lineTo(960 + k * 360 - 960 * (k) * 0 + 0, 1500); x.stroke(); }
    x.beginPath(); x.ellipse(960, 1060, 640, 130, 0, 0, TAU); x.strokeStyle = "rgba(120,220,255,.45)"; x.lineWidth = 5; x.stroke(); x.beginPath(); x.ellipse(960, 1060, 450, 90, 0, 0, TAU); x.stroke();
    grainRect(x, -300, 880, 2600, 640, .3);
  });
}
function embers(ctx, t, n = 40, col = "#FFD27A") { for (let i = 0; i < n; i++) { const ph = (t * (.05 + R(i, 1) * .05) + R(i, 2)) % 1, px = R(i, 3) * 2000 - 40 + Math.sin(t + i) * 20, py = 1000 - ph * 1100; ctx.globalAlpha = (1 - ph) * .7; ctx.beginPath(); ctx.arc(px, py, 1.6 + R(i, 4) * 2.4, 0, TAU); ctx.fillStyle = col; ctx.fill(); } ctx.globalAlpha = 1; }

// ================================================================== GAME: the bedroom, then the arena
function bakeBedroom() {
  return bake(-300, -300, 2300, 1500, (x) => {
    wallPaint(x, -300, -300, 2600, 1200, "#1F2248", "#2E2C64", 3); grad(x, -300, 900, 2600, 700, "#2A2540", "#1A1730"); grainRect(x, -300, 900, 2600, 700, .4);
    x.fillStyle = "#FF3FA8"; x.shadowColor = "#FF3FA8"; x.shadowBlur = 30; x.fillRect(-300, 60, 2600, 8); x.fillStyle = "#3FE0FF"; x.shadowColor = "#3FE0FF"; x.fillRect(-300, 900, 2600, 6); x.shadowBlur = 0;
    box(x, 220, 260, 220, 300, "#2A2A52", { r: 6 }); box(x, 238, 280, 184, 260, "#6A3FD0", { r: 4 }); x.fillStyle = "#FFD27A"; x.beginPath(); x.arc(330, 400, 50, 0, TAU); x.fill();
    box(x, 520, 300, 160, 200, "#2A2A52", { r: 6 }); box(x, 536, 316, 128, 168, "#1FB8C8", { r: 4 });
    box(x, 1640, 240, 260, 340, "#1B1D3E", { r: 8 }); for (let i = 0; i < 40; i++) { x.fillStyle = R(i, 3) < .5 ? "#FFD27A" : "#9AB0FF"; x.fillRect(1660 + (i % 8) * 30, 260 + Math.floor(i / 8) * 60, 12, 20); }
  });
}
export const game = {
  fi: 1.0,
  build() { return { bed: bakeBedroom(), arena: arenaBake() }; },
  cam(lt) { if (lt < 4.2) return { x: mix(960, 1010, U(0, 4.2, lt)), y: 640, z: mix(1.15, 1.35, U(0, 4.2, lt)), phi: PHI }; const [sx, sy] = shake(lt, [[6.55, 14], [6.0, 8], [5.75, 8]]); return { x: 960 + sx, y: 640 + sy, z: 1.0, phi: PHI }; },
  draw(ctx, t, lt, S) {
    if (lt < 4.2) return bedroom(ctx, t, lt, S);
    const a = lt - 4.2; put(ctx, S.arena); embers(ctx, t, 36);
    const d = dims(27), s = 1.4, gy = 940, dd = dims(30);
    const kill = 6.6 - 4.2;
    // boss
    const dead = U(kill, kill + .22, a), hit = ((a > 1.4 && a < 1.6) || (a > 1.7 && a < 1.9)) ? 1 : (a > 2.35 && a < 2.55 ? 1 : 0), swipeK = Math.sin(U(.8, 1.5, a) * Math.PI) * (a < 1.5 ? 1 : 0);
    boss(ctx, 1500, 960, 1.0, t, { hit, swipe: swipeK, dead });
    // hero: crouches, dodges, charges, slashes, leaps for the finishing blow
    const dodge = Math.sin(U(.9, 1.7, a) * Math.PI) * (a > .9 && a < 1.7 ? 1 : 0), jump = Math.sin(U(1.9, 2.5, a) * Math.PI) * (a > 1.9 && a < 2.5 ? 1 : 0) * 140;
    const hx = 800 - dodge * 90 + eIO(U(1.1, 2.2, a)) * 330 - U(2.5, 3.0, a) * 40;
    const sw = a < 1.2 ? -.4 : a < 1.7 ? mix(-1.9, .6, U(1.4, 1.7, a)) : a < 2.3 ? mix(-2.0, .8, U(1.9, 2.4, a)) : a < 2.6 ? 1.2 : -.3;
    const charge = U(1.1, 1.6, a) * (1 - U(1.9, 2.0, a));
    const handR = [d.sh + 70 * Math.cos(sw), -d.torso * .85 + 70 * Math.sin(sw)];
    const hero = { age: 27, face: a < 2.6 ? { eyes: "open", mouth: "o", brows: "angry" } : { eyes: "happy", mouth: "grin", brows: "raised", blush: .6 }, lean: a < 2.6 ? .1 : 0, bob: -jump, R: a < 2.7 ? handR : [d.sh + 30, d.upper * .3], L: a < 2.7 ? [-(d.sh + 24), -d.torso * .35] : [-(d.sh + 26), -d.torso * 1.1 * U(2.7, 3.0, a)], holdR: a < 2.9 ? blade(180, a < 2.7 ? sw * .0 - .2 : -.9) : blade(180, -1.1), crouch: a < 1.0 ? 22 : 0, fL: [-26, -jump * 0], fR: [34, 0], facing: 1, noShadow: jump > 10 };
    const hA = person(ctx, hx, gy, s, LOOK.heroKnight, hero, hs(t), t);
    // sword trails
    if ((a > 1.45 && a < 1.75) || (a > 1.95 && a < 2.45)) { ctx.save(); ctx.strokeStyle = "rgba(190,235,255,.85)"; ctx.lineWidth = 16; ctx.shadowColor = "#7FD6FF"; ctx.shadowBlur = 24; ctx.beginPath(); const k = a < 1.8 ? U(1.45, 1.75, a) : U(1.95, 2.45, a); ctx.arc(hA.handR[0] + 40, hA.handR[1], 220, -2.2 + k * 1.3, -2.2 + k * 2.0); ctx.stroke(); ctx.restore(); }
    // allies cheer from behind
    const allies = [[LOOK.allyA, 480, 960, "win1", 3], [LOOK.allyB, 330, 985, "win2", 5], [LOOK.allyC, 180, 1010, "win3", 7]];
    allies.forEach(([lk, ax, ay, ev, sd]) => { const win = a > kill; const aA = person(ctx, ax, ay, 1.2, lk, { age: 28, face: win ? { eyes: "happy", mouth: "grin", brows: "raised" } : { eyes: "open", mouth: "o", brows: "angry" }, bob: win ? -Math.abs(Math.sin(t * 7 + sd)) * 16 : 0, ...(win ? armsUp(dd, 1.2) : { R: [dd.sh + 40, -dd.torso * .7] }) }, bgState(.65), t); giveCoin(ctx, t, ev, [aA.handR[0], aA.handR[1] - 20], hA.slot, { r: 19, h: 150 }); });
    if (a > kill && a < kill + .6) { burstParticles(ctx, t, T("game") + kill + 4.2, 1500, 600, { n: 60, kind: "debris", colors: ["#6A3FB0", "#FF5A6A", "#FFD27A", "#8A5AD0"], speed: 900, life: 1.3, size: 14, gravity: 700, spread: TAU, seed: 4 }); burstParticles(ctx, t, T("game") + kill + 4.2, 1500, 600, { n: 50, kind: "ember", colors: ["#FFD27A", "#FF8A5A"], speed: 600, life: 1.6, size: 12, spread: TAU, seed: 9 }); }
    if (a > kill && a < kill + .6) { ctx.save(); ctx.fillStyle = `rgba(255,255,255,${(1 - U(kill, kill + .45, a)) * .85})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore(); }
    // the world warms after the win
    ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = `rgba(255,210,140,${.35 * ss(kill + .5, kill + 3, a)})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore();
    // transition flash from the screen
    if (a < .45) { ctx.save(); ctx.fillStyle = `rgba(190,240,255,${1 - a / .45})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore(); }
  },
};
function bedroom(ctx, t, lt, S) {
  put(ctx, S.bed); const d = dims(27), s = 1.5, gy = 1000, flick = .75 + .25 * Math.sin(lt * 17) * Math.sin(lt * 5.3);
  // desk + monitor with a big glow
  glow(ctx, 1280, 600, 760, "#6FD0FF", .22 * flick); glow(ctx, 1280, 600, 420, "#FF5ACB", .12 * flick);
  box(ctx, 600, 880, 820, 24, "#3A3556", { r: 3 }); box(ctx, 620, 904, 780, 140, "#2A2640", { r: 3 });
  paint(ctx, () => { ctx.beginPath(); ctx.moveTo(1130, 520); ctx.lineTo(1480, 480); ctx.lineTo(1480, 720); ctx.lineTo(1130, 740); ctx.closePath(); }, "#1B1B26", { ew: 4, sz: 200, c: [1300, 620] });
  ctx.save(); ctx.beginPath(); ctx.moveTo(1148, 538); ctx.lineTo(1462, 500); ctx.lineTo(1462, 702); ctx.lineTo(1148, 722); ctx.closePath(); ctx.clip(); grad(ctx, 1140, 480, 340, 260, "#B8F0FF", "#6A4AE0");
  for (let i = 0; i < 8; i++) { ctx.fillStyle = `rgba(255,255,255,${.12 + .12 * Math.sin(lt * 9 + i)})`; ctx.fillRect(1160 + R(i, 1) * 200, 520 + i * 24, 40 + R(i, 2) * 100, 8); } ctx.restore();
  box(ctx, 1280, 740, 36, 150, "#2A2A34", { r: 3 });
  const exc = U(2.6, 4.0, lt);
  const pose = { age: 27, crouch: d.legLen - 96, facing: 1, fL: [-d.hipW * .55 + 80, 0], fR: [d.hipW * .55 + 70, 0], kneeL: [.1, -1], kneeR: [.1, -1], lean: .12 + exc * .06, face: { eyes: exc > .3 ? "wide" : "open", mouth: exc > .5 ? "grin" : "small", brows: exc > .3 ? "raised" : "angry", look: [1, 0], blush: exc * .6 }, L: [-30, -6 + Math.sin(lt * 14) * 5], R: [30, -6 + Math.sin(lt * 12) * 5], bob: Math.sin(lt * 1.2) * 1.2 };
  box(ctx, 800, gy - 40, 160, 18, "#2A2A44", { r: 8 });
  person(ctx, 860, gy, s, LOOK.heroHood, pose, hs(t), t);
  box(ctx, 600, 880, 820, 24, "#3A3556", { r: 3 }); box(ctx, 620, 904, 780, 140, "#2A2640", { r: 3 });
  ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.fillStyle = `rgba(80,180,255,${.12 * flick})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore();
}

// ================================================================== QUEEN
export const queen = {
  fi: .8,
  build() { return { arena: arenaBake() }; },
  cam(lt) { return { x: mix(900, 1020, eIO(U(0, 12, lt))), y: 640, z: 1.05, phi: PHI }; },
  draw(ctx, t, lt, S) {
    put(ctx, S.arena); embers(ctx, t, 30);
    const d = dims(27), dq = dims(25, LOOK.queen.scale), s = 1.4, gy = 940, sq = 1.42;
    const qx = lt < .6 ? mix(-200, 420, eOut(U(0, .6, lt))) : lt < 3.3 ? 420 + Math.sin(lt * 1.6) * 80 : lt < 7.4 ? mix(480, 1060, eIO(U(3.3, 7.4, lt))) : 1060;
    const hx = lt < 7.2 ? 860 + Math.sin(lt * 1.3) * 40 : 860;
    // imps: a swarm that the queen cuts down
    for (let i = 0; i < 9; i++) { const dies = 1.2 + i * .55, ix = 1750 - U(0, dies + .3, lt) * (700 + i * 40) + (i % 3) * 80, alive = lt < dies; if (alive) imp(ctx, ix, 960 + (i % 3) * 22, 1.2, t, i); else if (lt < dies + .45) { burstParticles(ctx, t, T("queen") + dies, 1750 - (700 + i * 40) * U(0, dies + .3, dies) + (i % 3) * 80, 900, { n: 12, kind: "ember", colors: ["#FF5A6A", "#C8A0FF"], speed: 400, life: .6, size: 8, seed: i }); } }
    // queen: dashes in, then spins and slashes; her gaze and ambition pull toward the far tower
    const ph = lt * 9, running = lt < .7, fast = (lt > 1 && lt < 7), spin = fast ? Math.sin(lt * 6) : 0;
    const gq = running ? gait(ph, dq, 1, 70, 40) : { fL: [-dq.hipW * .55 - 22 + spin * 30, 0], fR: [dq.hipW * .55 + 30 - spin * 30, 0], facing: 1 };
    const a1 = fast ? lt * 8 : -.4, ang = fast ? Math.sin(a1) * 1.6 : -.4;
    const qpose = { age: 25, face: lt < 7.2 ? { eyes: "open", mouth: "grin", brows: "angry" } : { eyes: "open", mouth: "smirk", brows: "neutral", look: [-1, 0] }, ...gq, lean: fast ? Math.sin(lt * 6) * .12 : .05, wind: 1, bob: running ? gq.bob : fast ? -Math.abs(Math.sin(lt * 4.5)) * 22 : 0, R: [dq.sh + 70 * Math.cos(ang), -dq.torso * .85 + 70 * Math.sin(ang)], L: [-(dq.sh + 60 * Math.cos(ang + 1.2)), -dq.torso * .85 + 60 * Math.sin(ang + 1.2)], holdR: blade(150, ang * .0 - .6, "#FFD6E8", "#FF7AB8"), holdL: blade(150, -2.6, "#FFD6E8", "#FF7AB8") };
    if (lt > 8.4) { qpose.R = [dq.sh + 60, -dq.torso * 1.2]; qpose.L = [-(dq.sh + 6), dq.upper * .3]; qpose.holdR = null; qpose.holdL = null; qpose.face = { eyes: "open", mouth: "smirk", brows: "neutral", look: [1, -.5] }; }
    if (lt > 7 && lt < 7.6) { qpose.R = [dq.sh + 70, -dq.torso * .9]; qpose.holdR = null; qpose.holdL = null; }
    const qA = person(ctx, qx, gy, sq, LOOK.queen, qpose, qs(t), t);
    // him: struck, hearts rising, then keeps up
    const hero = { age: 27, face: lt < 7 ? { eyes: lt < 4 ? "wide" : "happy", mouth: lt < 4 ? "o" : "smile", brows: "raised", blush: 1, look: [1, 0] } : { eyes: "happy", mouth: "grin", brows: "raised", blush: 1, look: [1, 0] }, lean: .08, R: [d.sh + 60, -d.torso * .7 + Math.sin(lt * 10) * 20], L: [-(d.sh + 20), -d.torso * .3], holdR: blade(180, -.5), bob: Math.sin(lt * 2) * 2, fL: [-26, 0], fR: [34, 0] };
    if (lt > 6.9 && lt < 7.5) { hero.R = [d.sh + 80, -d.torso * .85]; hero.holdR = null; }
    if (lt > 8.4) { hero.R = [d.sh + 12, d.upper * .5]; hero.holdR = null; hero.face = { eyes: "open", mouth: "small", brows: "worried", blush: .8, look: [1, 0] }; }
    const hA = person(ctx, hx, gy, s, LOOK.heroKnight, hero, hs(t), t);
    if (lt > 1 && lt < 8.2) hearts(ctx, hA.head[0] - 6, hA.head[1] - 60, t, 3);
    giveCoin(ctx, t, "qA", [qA.handR[0], qA.handR[1] - 10], hA.slot, { r: 19, h: 120 }); giveCoin(ctx, t, "qB", [hA.handR[0], hA.handR[1] - 10], qA.slot, { r: 19, h: 120 });
    giveCoin(ctx, t, "qC", [qA.handR[0], qA.handR[1] - 10], hA.slot, { r: 19, h: 120 }); giveCoin(ctx, t, "qD", [hA.handR[0], hA.handR[1] - 10], qA.slot, { r: 19, h: 120 });
    // the far tower: the next level she wants
    const tow = 1700; ctx.save(); ctx.globalAlpha = .55 + .3 * ss(8, 10, lt); ctx.fillStyle = "#4A3A8A"; ctx.beginPath(); ctx.moveTo(tow - 60, 760); ctx.lineTo(tow - 30, 300); ctx.lineTo(tow, 220); ctx.lineTo(tow + 30, 300); ctx.lineTo(tow + 60, 760); ctx.closePath(); ctx.fill(); glow(ctx, tow, 220, 200, "#FFD27A", .5 * ss(7.6, 10, lt)); ctx.restore();
    if (lt > 6.9 && lt < 7.7) burstParticles(ctx, t, T("queen") + 7.0, (qA.handR[0] + hA.handR[0]) / 2, qA.handR[1] - 30, { n: 14, kind: "spark", colors: ["#FFD27A", "#FFF3C4"], speed: 420, life: .5, size: 6, seed: 6 });
  },
};

// ================================================================== FIGHT (the argument)
export const fight = {
  fi: .8,
  build() { return { arena: arenaBake() }; },
  cam(lt) { return { x: 960, y: 620, z: mix(1.0, 1.1, eIO(U(0, 10, lt))), phi: PHI }; },
  draw(ctx, t, lt, S) {
    put(ctx, S.arena);
    ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = `rgba(120,40,50,${.55 * ss(0, 2, lt)})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore();
    // cracks spreading through the floor
    ctx.save(); ctx.strokeStyle = "rgba(255,90,70,.7)"; ctx.shadowColor = "#FF4A3A"; ctx.shadowBlur = 14; ctx.lineWidth = 4; for (let i = 0; i < 7; i++) { const k = U(1 + i * .2, 8, lt); if (k <= 0) continue; ctx.beginPath(); let px = 960 + (i - 3) * 20, py = 1000; ctx.moveTo(px, py); for (let j = 0; j < 8 * k; j++) { px += (R(i * 9 + j, 1) - .5) * 220; py += 14 + R(i * 9 + j, 2) * 26; ctx.lineTo(px, py); } ctx.stroke(); } ctx.restore();
    const d = dims(27), dq = dims(25, LOOK.queen.scale), s = 1.55, gy = 960, sq = 1.52;
    const heated = ss(2, 6, lt), shout = (lt > 2 && lt < 8.2) ? Math.abs(Math.sin(lt * 7)) : 0;
    const hero = { age: 27, face: lt < 2 ? { eyes: "open", mouth: "small", brows: "worried" } : { eyes: "open", mouth: shout > .4 ? "shout" : "o", brows: "angry", sweat: 1 }, lean: -.04 * heated, R: [d.sh + 50 + Math.sin(lt * 5) * 14, -d.torso * .6], L: [-(d.sh + 50 - Math.sin(lt * 5 + 1) * 14), -d.torso * .6], bob: Math.sin(lt * 2) * 1, fL: [-26, 0], fR: [34, 0] };
    const queenP = { age: 25, face: lt < 2 ? { eyes: "cold", mouth: "flat", brows: "angry" } : { eyes: "cold", mouth: shout > .5 ? "shout" : "flat", brows: "angry" }, flip: true, wind: .6, lean: .03, R: [dq.sh + 18, -dq.torso * .45], L: [-(dq.sh + 18), -dq.torso * .45], bob: Math.sin(lt * 1.6) * 1 };
    if (lt > 5.5 && lt < 8) { queenP.R = [dq.sh + 90, -dq.torso * .85]; }
    // hammers rise out of the cracked ground between them
    const hamK = U(7.4, 8.6, lt), hhx = 960;
    const hA = person(ctx, 680, gy, s, LOOK.heroKnight, { ...hero, ...(hamK > .8 ? { holdR: hammer(-1.5), R: [d.sh + 20, -d.torso * .6] } : {}) }, hs(t), t);
    const qA = person(ctx, 1240, gy, sq, LOOK.queen, { ...queenP, ...(hamK > .8 ? { holdR: hammer(-1.5), R: [dq.sh + 20, -dq.torso * .6] } : {}) }, qs(t), t);
    // coins slipping out of both of them, one after another
    for (const ev of ["slip1", "slip3"]) dropOut(ctx, t, EV[ev].t, hA.slot[0], hA.slot[1], { r: 20, floor: 1010, dir: -1, vx: 160 });
    for (const ev of ["slip2", "slip4"]) dropOut(ctx, t, EV[ev].t, qA.slot[0], qA.slot[1], { r: 20, floor: 1030, dir: 1, vx: 160 });
    // rising hammers
    if (hamK > 0 && hamK < .8) for (const hx2 of [820, 1100]) { ctx.save(); ctx.translate(hx2, 1020 - hamK * 220); ctx.rotate(-1.57); ctx.scale(.9, .9); hammer(0)(ctx); ctx.restore(); }
    // jagged, wordless shouting: the shapes of anger
    if (lt > 2 && lt < 8) for (const [bx, by, dir] of [[hA.head[0] + 110, hA.head[1] - 90, 1], [qA.head[0] - 110, qA.head[1] - 90, -1]]) { const flip = (lt * 3 + (dir > 0 ? 0 : 1.5)) % 3 < 1.5; if (!flip) continue; ctx.save(); ctx.translate(bx, by); ctx.scale(dir * .9, .9); ctx.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r = i % 2 ? 70 : 115; ctx.lineTo(Math.cos(a) * r * 1.2, Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = dir > 0 ? "rgba(255,230,200,.92)" : "rgba(30,30,50,.92)"; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INKC; ctx.stroke(); ctx.strokeStyle = dir > 0 ? "#D94040" : "#E8E8F0"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-30, -10); ctx.lineTo(0, 12); ctx.lineTo(30, -16); ctx.stroke(); ctx.restore(); }
  },
};

// ================================================================== HAMMER
const QX = 1060, HX = 700;
export const hammerScene = {
  fi: .5, cut: false,
  build() { return { arena: arenaBake() }; },
  cam(lt) { const [sx, sy] = shake(lt, [[3.2, 26], [4.1, 12], [4.35, 16]], .6); return { x: 880 + sx, y: 620 + sy, z: mix(1.08, 1.22, eIO(U(0, 3.2, lt))) - (lt > 4.5 ? .15 * U(4.5, 9, lt) : 0), phi: PHI }; },
  draw(ctx, t, lt, S) {
    put(ctx, S.arena); ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = "rgba(100,36,50,.5)"; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore();
    const d = dims(27), dq = dims(25, LOOK.queen.scale), s = 1.55, gy = 960, sq = 1.52, lh = lt + 130 - 130;
    const tH = T_BREAK_H - T("hammer"), tQ = T_BREAK_Q - T("hammer");       // 3.2 and 4.1
    // ---- queen: lift, wind-up, slam; then she walks away
    const qUp = eIO(U(.2, 1.6, lt)), wind = eIO(U(2.0, 2.7, lt)), after = lt > tH;
    const qAng = lt < 2.0 ? mix(-1.45, -2.0, qUp) : lt < 2.7 ? mix(-2.0, -2.5, wind) : lt < tH ? mix(-2.5, .25, eIn(U(2.7, tH, lt))) : mix(.25, 1.25, U(tH, tH + .5, lt));
    const qwalk = U(5.2, 9.6, lt), qx = QX + qwalk * 640;
    const reachTo = lt < 2.7 ? [dq.sh + 24, -dq.torso * 1.2] : [dq.sh + 90, -dq.torso * .8];
    const handR = lt < tH ? reachTo : [dq.sh + 90, -dq.torso * .55];
    const gqw = qwalk > 0 && qwalk < 1 ? gait(lt * 5.2, dq, 1, 46, 22) : { fL: [-dq.hipW * .55 - 20, 0], fR: [dq.hipW * .55 + 20, 0] };
    const qpose = { age: 25, flip: qwalk <= 0, face: lt < tH + .1 ? { eyes: "cold", mouth: "flat", brows: "angry", look: [-1, 0] } : lt < tQ + .5 ? { eyes: "cold", mouth: "flat", brows: "angry", look: [-1, 0] } : lt < 5.3 ? { eyes: "wide", mouth: "o", brows: "raised", look: [0, 1] } : { eyes: "cold", mouth: "flat", brows: "angry", look: [1, 0] }, ...gqw, wind: 1, bob: 0,
      R: lt < tH ? handR : (qwalk > 0 ? undefined : [dq.sh + 30, -dq.torso * .3]), L: lt < tH ? [handR[0] - 36, handR[1] + 30] : undefined, holdR: lt < tH + .55 ? hammer(qAng, 0) : null, lean: lt < tH ? mix(-.04, -.28, wind) + eIn(U(2.7, tH, lt)) * .55 : .02 };
    // ---- him: lifts weakly, shaking, eyes shut, turning his head away
    const hUp = eIO(U(.6, 2.2, lt)), tremble = Math.sin(lt * 38) * 10 * hUp * (lt < tH ? 1 : 0), hang = lt > 2.2 && lt < tH ? mix(-1.8, -1.2, U(2.2, tH, lt)) : mix(-1.45, -1.8, hUp);
    const hxm = HX - (lt > tH ? eOut(U(tH, tH + .5, lt)) * 70 : 0) - (lt > tQ ? U(tQ, tQ + .8, lt) * 30 : 0);
    const hh = [d.sh + 24 + tremble, -d.torso * 1.05 + 20 * (1 - hUp)];
    const dropH = lt > tH;       // after her blow he is thrown off-balance: the hammer slips from his hands
    const hpose = { age: 27, face: lt < tH ? { eyes: "closed", mouth: "sob", brows: "worried", tears: 1, look: [-1, 0] } : lt < tQ + 1 ? { eyes: "wide", mouth: "o", brows: "worried", tears: 1 } : { eyes: "sad", mouth: "o", brows: "sad", tears: 1 }, lean: lt < tH ? -.12 : lt < 5 ? -.3 : .1, head: { tilt: lt < tH ? -.2 : -.05, dy: lt > tQ + .6 ? 14 : 0 },
      R: dropH ? [d.sh + 34 + U(tH, tQ, lt) * 80, -d.torso * .55 - U(tH, tH + .4, lt) * 40] : [hh[0], hh[1]], L: dropH ? [-(d.sh * .35), -d.torso * .5] : [hh[0] - 30, hh[1] + 40],
      holdR: lt < tH + .25 ? hammer(hang, lt < tH ? Math.sin(lt * 31) * .05 : 0) : null, crouch: lt > 4.4 ? U(4.4, 6, lt) * 70 : 0, fL: lt > 4.4 ? [-d.hipW * .55 - 40, -6] : [-26, 0], fR: lt > 4.4 ? [d.hipW * .55 + 50, -6] : [34, 0], bob: lt < tH ? Math.sin(lt * 40) * 1.6 : 0 };
    // the order: draw her gullak first (she is behind), then him
    const qA = person(ctx, qx, gy, sq, LOOK.queen, qpose, { ...qs(t), floor: 130 }, t);
    const hA = person(ctx, hxm, gy, s, LOOK.heroKnight, { ...hpose, flip: false }, hs(t), t);
    // the hammer that slipped from his hands: tumbles to hers
    if (lt >= tH + .2 && lt < tQ + .1) { const k = U(tH + .2, tQ, lt), px = mix(hA.handR[0], qA.chest[0] - 40, eIn(k)), py = mix(hA.handR[1] - 60, qA.chest[1], eIn(k)) - Math.sin(k * Math.PI) * 140; ctx.save(); ctx.translate(px, py); ctx.rotate(mix(-1.2, .6, k) + k * 2); ctx.scale(1.45, 1.45); hammer(0)(ctx); ctx.restore(); }
    if (lt >= tQ + .1 && lt < tQ + .5) { ctx.save(); ctx.translate(qA.chest[0] - 60, qA.chest[1] + 60); ctx.rotate(.7 + Math.min(.6, (lt - tQ) * 2)); ctx.scale(1.45, 1.45); hammer(0)(ctx); ctx.restore(); }
    else if (lt >= tQ + .5) { ctx.save(); ctx.translate(qA.chest[0] - 120, 1000); ctx.rotate(.15); ctx.scale(1.45, 1.45); hammer(-.2)(ctx); ctx.restore(); }
    // queen's hammer after the blow rests on the ground
    if (lt >= tH + .35 && qwalk <= 0) { ctx.save(); ctx.translate(hA.chest[0] + 160, 980); ctx.rotate(-.05); ctx.scale(1.55, 1.55); hammer(.1)(ctx); ctx.restore(); }
    if (lt > tH - .2 && lt < tH + .06) { ctx.save(); ctx.strokeStyle = "rgba(255,245,230,.85)"; ctx.lineWidth = 34; ctx.lineCap = "round"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(qA.chest[0] + 40, qA.chest[1] - 160, 420, Math.PI * (.95 - .0), Math.PI * 1.35); ctx.stroke(); ctx.restore(); }
    // ---- impact: white flash, coins everywhere
    const tI = T("hammer") + tH;
    coinSpray(ctx, t, T_BREAK_H, hA.chest[0], hA.chest[1], 22, { floor: 1000, r: 20, life: 8, fadeFrom: 7, seed: 3 });
    coinSpray(ctx, t, T_BREAK_Q + .25, qA.chest[0], qA.chest[1], 12, { floor: 1010, r: 20, life: 6, fadeFrom: 5, seed: 8 });
    if (lt > tH && lt < tH + .35) { ctx.save(); ctx.fillStyle = `rgba(255,248,230,${(1 - (lt - tH) / .35) * .9})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore(); }
    if (lt > tQ && lt < tQ + .25) { ctx.save(); ctx.fillStyle = `rgba(255,230,200,${(1 - (lt - tQ) / .25) * .45})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore(); }
  },
};

// ================================================================== KNEEL
export const kneel = {
  fi: 1.2,
  build() { return { arena: arenaBake() }; },
  cam(lt) { return { x: 900, y: mix(780, 700, eIO(U(0, 12, lt))), z: mix(1.55, 1.12, eIO(U(0, 12, lt))), phi: PHI }; },
  draw(ctx, t, lt, S) {
    put(ctx, S.arena); ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = `rgba(40,56,90,${.4 + .12 * U(0, 10, lt)})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore();
    const d = dims(27), s = 1.55, gy = 960, hx = 900;
    // shards and coins still scattered on the floor
    coinSpray(ctx, t, T_BREAK_H, 700, 700, 22, { floor: 1000, r: 20, life: 30, fadeFrom: 30, seed: 3 }); coinSpray(ctx, t, T_BREAK_Q + .25, 1100, 700, 12, { floor: 1010, r: 20, life: 30, fadeFrom: 30, seed: 8 });
    // he gathers: sweeping coins into his hands and pressing them to the empty place
    const cyc = (lt - 1.2) / 2.6, n = Math.floor(cyc), f = cyc - n, act = lt > 1.2 && lt < 10.4;
    const press = act ? Math.sin(clamp(f, 0, 1) * Math.PI) : 0, reachDown = act ? 1 - ss(.0, .35, f) + ss(.75, 1, f) : 1;
    const hpose = { age: 27, crouch: 150, face: { eyes: lt < 9.4 ? "sad" : "empty", mouth: lt < 9.4 ? "o" : "flat", brows: "sad", tears: lt < 9.4 ? 1 : .2, look: [0, 1] }, lean: .22, head: { dy: 16 + 10 * ss(8, 11, lt) }, fL: [-d.hipW * .55 - 50, -6], fR: [d.hipW * .55 + 60, -6], kneeL: [.5, .3], kneeR: [.5, .3],
      R: [mix(d.sh + 10, d.sh * .2, press), mix(d.upper * .8, -d.torso * .55, press) + reachDown * 30], L: [mix(-(d.sh + 40), -d.sh * .2, press), mix(d.upper * .9, -d.torso * .6, press) + reachDown * 30], bob: Math.sin(lt * 7) * (lt < 10 ? 1.4 : 0) };
    const hA = person(ctx, hx, gy, s, LOOK.heroKnight, hpose, { ...hs(t), hollow: true }, t);
    // coin after coin pressed to the hollow and swallowed by it
    if (act) { for (let k = 0; k <= 3; k++) { const t0 = 1.2 + k * 2.6 + 1.0, dt = lt - t0; if (dt > 0 && dt < .7) { const u = dt / .7, from = [hA.handR[0], hA.handR[1] - 10]; coin(ctx, mix(from[0], hA.chest[0], eIO(u)), mix(from[1], hA.chest[1], eIO(u)), 20 * (1 - .6 * u), u * 8, 0, 1 - ss(.55, 1, u), 0); } } }
    // rain begins
    ctx.save(); ctx.strokeStyle = "rgba(180,200,230,.45)"; ctx.lineWidth = 2; ctx.beginPath(); const rk = ss(3, 8, lt); for (let i = 0; i < 160 * rk; i++) { const px = ((R(i, 1) * 2300 - 200 + t * 80) % 2300), py = ((R(i, 2) + t * (1.4 + R(i, 3))) % 1) * 1300 - 100; ctx.moveTo(px, py); ctx.lineTo(px - 14, py + 44); } ctx.stroke(); ctx.restore();
    if (lt > 9.4) { ctx.save(); ctx.fillStyle = `rgba(6,8,16,${.3 * ss(9.4, 12, lt)})`; ctx.fillRect(-300, -300, 2600, 1800); ctx.restore(); }
  },
};
export const SCENES_C = { game, queen, fight, hammer: hammerScene, kneel };
