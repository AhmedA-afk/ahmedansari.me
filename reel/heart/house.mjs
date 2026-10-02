// house.mjs — the last light of the day at home. Blue hour: the sky has gone deep, the sun has left a last ember on
// the right where the road runs to the city. The house is dark except for its open door and one window, and the
// two people standing in that door. He stands at the gate with a bag.
//
// World: feet line y = 0 for the road in front of the gate; the house veranda at y = -24. View is about x -1070..1070.
import { Path2D, PathOp, clamp, lerp, hash, TAU, rgba, mixc } from "./lib.mjs";
import { bake, poly, lin, rad, glow } from "./paint.mjs";
import { rimFill } from "./outside.mjs";

export const HOUSE = { door: [-640, -24], gate: -250, vanish: [820, -70], city: [560, 1100] };
const X0 = -1500, X1 = 1500, Y0 = -1300, Y1 = 500, W = X1 - X0, H = Y1 - Y0;
const P = () => new Path2D();
const rect = (p, x, y, w, h) => { p.rect(x, y, w, h); return p; };
const pts = (p, Q) => { Q.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
const circ = (p, x, y, r) => { p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); p.closePath(); return p; };
const U = (A, B) => { A.op(B, PathOp.Union); return A; };

// where the road goes: u = 0 at the gate (near us) .. 1 at the city
export function roadAt(u) { const e = 1 - Math.pow(1 - u, 1.7); return { x: lerp(-150, HOUSE.vanish[0], e), y: lerp(40, HOUSE.vanish[1] + 6, e), s: lerp(1.28, .08, Math.pow(e, .8)) }; }

export async function initHouse() {
  const sky = await bake(W, H, (c) => { c.translate(-X0, -Y0);
    c.fillStyle = lin(c, 0, Y0, 0, 0, [[0, "#0B1026"], [.45, "#1C2650"], [.78, "#3A4270"], [.93, "#7A5C78"], [1, "#B07060"]]); c.fillRect(X0, Y0, W, -Y0 + 10);
    // the ember where the sun went down, to the right, over the city
    c.fillStyle = rad(c, 900, -40, 0, 1100, [[0, "rgba(255,150,90,.55)"], [.3, "rgba(230,110,90,.22)"], [1, "rgba(120,80,120,0)"]]); c.fillRect(X0, Y0, W, -Y0 + 10);
    // stars, most at the top
    for (let i = 0; i < 260; i++) { const x = X0 + hash(i * 3.1) * W, y = Y0 + Math.pow(hash(i * 7.7), 1.8) * 900, r = .6 + hash(i * 1.3) * 1.4; c.fillStyle = `rgba(235,235,255,${(.25 + hash(i) * .6) * clamp((-y - 300) / 500)})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    // far hills and the city's glow
    c.fillStyle = "#1E2038"; c.beginPath(); c.moveTo(X0, -40); for (let x = X0; x <= X1; x += 40) c.lineTo(x, -70 - 30 * Math.sin(x * .003) - 18 * Math.sin(x * .011 + 1)); c.lineTo(X1, 10); c.lineTo(X0, 10); c.fill();
    c.fillStyle = rad(c, 820, -70, 0, 420, [[0, "rgba(255,190,120,.35)"], [1, "rgba(255,160,100,0)"]]); c.fillRect(300, -500, 1100, 520);
    for (let i = 0; i < 420; i++) { const x = 520 + hash(i * 1.9) * 640, y = -64 - Math.pow(hash(i * 4.3), 2) * 50 * (1 - Math.abs(x - 830) / 400), warm = hash(i * 5.1) > .3; c.fillStyle = warm ? `rgba(255,${190 + hash(i) * 50 | 0},130,${.5 + hash(i * 2) * .5})` : "rgba(190,215,255,.7)"; c.fillRect(x, y, 2, 2); }
    // the ground: a field, the road toward the city
    c.fillStyle = lin(c, 0, -60, 0, Y1, [[0, "#20192A"], [.2, "#17121E"], [1, "#0A080E"]]); c.fillRect(X0, -62, W, Y1 + 62);
    c.fillStyle = lin(c, 0, -70, 0, Y1, [[0, "#4A3A48"], [.3, "#2A222E"], [1, "#16121A"]]); poly(c, [[HOUSE.vanish[0] - 4, -68], [HOUSE.vanish[0] + 8, -68], [520, Y1], [-560, Y1]]); c.fill();
    c.strokeStyle = "rgba(255,200,150,.12)"; c.lineWidth = 2; c.beginPath(); c.moveTo(HOUSE.vanish[0] + 2, -66); c.lineTo(-20, Y1); c.stroke();
  });
  // the house and its garden as silhouettes, with the sky's last light on their right edges
  const house = await bake(W, H, (c) => { c.translate(-X0, -Y0);
    const p = rect(P(), -1220, -560, 960, 536); U(p, rect(P(), -1240, -600, 1000, 40)); for (let i = 0; i < 26; i++) U(p, rect(P(), -1236 + i * 38, -660, 7, 60)); U(p, rect(P(), -1240, -664, 1000, 8));
    U(p, rect(P(), -1020, -760, 150, 160)); U(p, rect(P(), -1032, -772, 174, 14));                         // stair room
    U(p, rect(P(), -1270, -40, 1060, 40)); for (const x of [-1180, -850, -400]) U(p, rect(P(), x, -430, 34, 406)); U(p, rect(P(), -1240, -460, 1000, 40)); // veranda, pillars, chajja
    // a tree on the right, by the road
    U(p, rect(P(), 330, -420, 26, 420)); for (let i = 0; i < 90; i++) { const a = hash(i * 9.1) * TAU, r = Math.sqrt(hash(i * 2.9)) * 170; U(p, circ(P(), 343 + Math.cos(a) * r * 1.3, -520 + Math.sin(a) * r * .8, 12 + hash(i * 4.4) * 22)); }
    // a street lamp
    U(p, rect(P(), 110, -560, 9, 560)); U(p, pts(P(), [[110, -560], [190, -590], [200, -584], [119, -548]]));
    // cut the door and the window out of it: they glow
    const holes = rect(P(), -700, -400, 130, 376); rect(holes, -1060, -360, 170, 150); p.op(holes, PathOp.Difference);
    rimFill(c, p, "#100C16", "#C88A80", [.85, -.5], 2.4, .55);
    // the door: warm inside; the window: warm with the grill across it
    c.fillStyle = lin(c, 0, -400, 0, -24, [[0, "#FFB868"], [1, "#FF9A50"]]); c.fillRect(-700, -400, 130, 376);
    c.fillStyle = rad(c, -1000, -300, 0, 160, [[0, "#FFC07A"], [1, "#E08848"]]); c.fillRect(-1060, -360, 170, 150);
    c.fillStyle = "#1A1016"; for (let i = 1; i < 6; i++) c.fillRect(-1060 + i * 170 / 6 - 2, -360, 4, 150); c.fillRect(-1060, -288, 170, 4);
    // light spilling from the door onto the veranda and the yard
    c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = lin(c, 0, -24, 0, 300, [[0, "rgba(255,170,90,.35)"], [1, "rgba(255,150,80,0)"]]); poly(c, [[-700, -24], [-570, -24], [-380, 300], [-820, 300]]); c.fill(); c.restore();
  });
  // the low front wall, the gate and the bougainvillea: in front of the people in the door
  const front = await bake(W, H, (c) => { c.translate(-X0, -Y0);
    const p = rect(P(), -330, -150, 40, 150); U(p, rect(P(), -150, -150, 40, 150)); U(p, rect(P(), -340, -162, 60, 16)); U(p, rect(P(), -160, -162, 60, 16));
    U(p, rect(P(), -1260, -112, 940, 112)); U(p, rect(P(), -1266, -118, 952, 10));
    for (let i = 0; i < 80; i++) { const a = hash(i * 3.3) * Math.PI, r = 50 + hash(i * 1.7) * 140; U(p, circ(P(), -440 + Math.cos(a) * r * 1.3, -120 - Math.sin(a) * r * .85, 9 + hash(i) * 16)); }
    rimFill(c, p, "#0E0A12", "#C88A80", [.85, -.5], 2.2, .5);
    c.save(); c.globalCompositeOperation = "source-atop"; for (let i = 0; i < 160; i++) { const a = hash(i * 7.3) * Math.PI, r = 50 + hash(i * 2.7) * 150; c.fillStyle = `rgba(200,60,110,${.25 + hash(i) * .3})`; c.beginPath(); c.arc(-440 + Math.cos(a) * r * 1.3, -120 - Math.sin(a) * r * .85, 4 + hash(i * 5) * 4, 0, TAU); c.fill(); } c.restore();
    // the gate itself, half open: thin iron bars
    c.strokeStyle = "#0E0A12"; c.lineWidth = 4; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-290 + i * 6, -130); c.lineTo(-290 + i * 6, -4); c.stroke(); } c.beginPath(); c.moveTo(-290, -128); c.lineTo(-240, -128); c.moveTo(-290, -60); c.lineTo(-240, -60); c.stroke();
  });
  return { sky, house, front };
}

export function drawHouse(ctx, Hs, t, o = {}) {
  ctx.drawImage(Hs.sky, X0, Y0);
  ctx.drawImage(Hs.house, X0, Y0);
  // the door light breathes like a lamp; the bulb over the door; the street lamp comes on
  glow(ctx, -635, -230, 380, "#FFA860", .32 + .03 * Math.sin(t * 3.1));
  glow(ctx, -1000, -290, 260, "#FFB070", .22);
  const lamp = o.lamp ?? 1; if (lamp > 0) { const fl = lamp < 1 ? (Math.sin(t * 40) > .3 ? 1 : .4) : 1; glow(ctx, 194, -575, 320, "#FFB070", .45 * lamp * fl); glow(ctx, 194, -575, 50, "#FFF0D0", .9 * lamp * fl);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = lin(ctx, 0, -575, 0, 120, [[0, `rgba(255,170,90,${.18 * lamp * fl})`], [1, "rgba(255,170,90,0)"]]); poly(ctx, [[180, -575], [208, -575], [420, 120], [-40, 120]]); ctx.fill(); ctx.restore(); }
}
export function drawFront(ctx, Hs) { ctx.drawImage(Hs.front, X0, Y0); }
