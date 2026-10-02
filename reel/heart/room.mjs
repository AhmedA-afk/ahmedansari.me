// room.mjs — the home, late afternoon. A lime-washed room with a red-oxide floor. The sun comes in low through a
// window on the right wall (we never see the window, only what its light does): long beams through the dust, the
// shape of the window grill printed in gold on the back wall and on the floor, a glossy floor that holds it all again.
//
// World: x from -2300 to 2000, the feet line at y = 0, back wall meets the floor at y = -110, ceiling at y = -1950.
import { createCanvas, clamp, lerp, hash, TAU, rgba, mixc } from "./lib.mjs";
import { bake, mottle, poly, soft, lin, rad, glow, shaft, motes, inQuad } from "./paint.mjs";

export const ROOM = { x0: -2300, x1: 2000, y0: -1950, y1: 760, wallBase: -110, sun: "#FFC27E" };
const W = ROOM.x1 - ROOM.x0, H = ROOM.y1 - ROOM.y0, OX = -ROOM.x0, OY = -ROOM.y0;   // world -> bake pixel offset

// the window's light on the back wall: a skewed rectangle (rays come down and to the left), with the grill's shadow
const PATCH = { x: -260, y: -1080, w: 760, h: 700, skew: -170 };
const FLOOR_PATCHES = [{ x: -1120, y: -70, w: 760, h: 120, skew: -260 }, { x: 160, y: -95, w: 820, h: 110, skew: -240 }];
// beams in the air (quads: source edge high right -> landing edge low left)
export const BEAMS = [
  { q: [[-40, -1600], [260, -1350], [-640, 70], [-1080, -40]], a: .26, seed: 1 },   // the beam the boy draws in
  { q: [[1500, -1500], [1800, -1250], [820, -60], [380, -100]], a: .2, seed: 2 },
  { q: [[1050, -1650], [1250, -1480], [180, -90], [-80, -110]], a: .14, seed: 3 },
];
export function lightAt(x, y) { let L = 0; for (const B of BEAMS) if (inQuad([x, y], B.q)) L += B.a * 3; return clamp(L); }

function grill(c, P, col, lw) { // shadow of a window grill inside a patch: bars, a rail, and a diamond lattice up top
  const { x, y, w, h, skew } = P, at = (u, v) => [x + u * w + skew * (1 - v), y + v * h];
  c.strokeStyle = col; c.lineWidth = lw; c.lineCap = "butt";
  const line = (a, b) => { c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); };
  for (let i = 1; i < 7; i++) line(at(i / 7, 0), at(i / 7, 1));
  line(at(0, .5), at(1, .5)); line(at(0, .04), at(1, .04)); line(at(0, .96), at(1, .96)); line(at(.5, 0), at(.5, 1));
  c.lineWidth = lw * .6; for (let i = -4; i < 9; i++) { line(at(i / 7, 0), at(i / 7 + 3 / 14, .36)); line(at(i / 7, .36), at(i / 7 + 3 / 14, 0)); }
}
function patchPath(c, P) { const { x, y, w, h, skew } = P; poly(c, [[x + skew, y], [x + w + skew, y], [x + w, y + h], [x, y + h]]); }

export async function initRoom() {
  const plaster = await mottle(512, 512, { scale: 128, seed: 4, col: "#0A0E10", a0: 0, a1: .2 });
  const plasterHi = await mottle(512, 512, { scale: 32, seed: 9, col: "#FFFFFF", a0: 0, a1: .045, streak: 3 });
  // ---------------------------------------------------------------- base: walls, floor, furniture (as they look in the shade)
  const base = await bake(W, H, (c) => {
    c.translate(OX, OY);
    // back wall: pale teal lime-wash, darker toward the ceiling, a little warmth near the floor from the bounce
    c.fillStyle = lin(c, 0, ROOM.y0, 0, ROOM.wallBase, [[0, "#141A1D"], [.45, "#253033"], [.85, "#33403F"], [1, "#3E3E36"]]); c.fillRect(ROOM.x0, ROOM.y0, W, -ROOM.y0 + ROOM.wallBase);
    for (let y = ROOM.y0; y < ROOM.wallBase; y += 512) for (let x = ROOM.x0; x < ROOM.x1; x += 512) { c.drawImage(plaster, x, y); c.drawImage(plasterHi, x, y); }
    // a ceiling beam shadow and a cornice line
    c.fillStyle = lin(c, 0, ROOM.y0, 0, ROOM.y0 + 260, [[0, "rgba(6,6,8,.9)"], [1, "rgba(6,6,8,0)"]]); c.fillRect(ROOM.x0, ROOM.y0, W, 260);
    c.fillStyle = "rgba(255,240,220,.04)"; c.fillRect(ROOM.x0, ROOM.y0 + 120, W, 6);
    // kitchen doorway (back wall, left): warm dim light inside, steel catching it
    { const x0 = -1760, x1 = -1290, y0 = -1180; c.fillStyle = "#2A1E16"; c.fillRect(x0 - 26, y0 - 26, x1 - x0 + 52, -y0 + ROOM.wallBase + 26);
      c.fillStyle = lin(c, 0, y0, 0, ROOM.wallBase, [[0, "#0E0A08"], [.6, "#2A1A10"], [1, "#4A2C16"]]); c.fillRect(x0, y0, x1 - x0, -y0 + ROOM.wallBase);
      c.fillStyle = rad(c, x0 + 120, y0 + 330, 0, 420, [[0, "rgba(255,170,90,.35)"], [1, "rgba(255,150,80,0)"]]); c.fillRect(x0, y0, x1 - x0, -y0 + ROOM.wallBase);
      c.fillStyle = "#1A120E"; c.fillRect(x0 + 40, y0 + 420, 330, 14);    // a shelf inside
      for (let i = 0; i < 6; i++) { const ux = x0 + 60 + i * 52, r = 16 + (i % 3) * 5; c.fillStyle = "#3A3430"; c.beginPath(); c.ellipse(ux, y0 + 420 - r, r, r, 0, 0, TAU); c.fill(); c.fillStyle = "rgba(255,220,180,.35)"; c.fillRect(ux - r * .5, y0 + 420 - r * 1.6, 3, r); }
      c.fillStyle = "#211812"; c.fillRect(x0 + 60, ROOM.wallBase - 300, 260, 300); c.fillStyle = "rgba(255,190,120,.12)"; c.fillRect(x0 + 60, ROOM.wallBase - 300, 260, 8); }
    // steel almirah (far left)
    { const x0 = -2240, x1 = -1880, y0 = -1150, y1 = -70; c.fillStyle = lin(c, x0, 0, x1, 0, [[0, "#22282A"], [.5, "#323A3C"], [1, "#2A3032"]]); c.fillRect(x0, y0, x1 - x0, y1 - y0);
      c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect((x0 + x1) / 2 - 1, y0 + 20, 3, y1 - y0 - 40); c.fillStyle = "#6A7072"; c.fillRect((x0 + x1) / 2 + 14, y0 + 470, 8, 70);
      c.fillStyle = "rgba(255,255,255,.06)"; c.fillRect(x0 + 6, y0 + 6, 4, y1 - y0 - 12); c.fillStyle = "#1A1E20"; c.fillRect(x0 - 6, y0 - 16, x1 - x0 + 12, 22); }
    // calendar (a mountain and a lake above a grid of dates)
    { const x = -1040, y = -1000, w = 190, h = 290; c.fillStyle = "#3A3632"; c.fillRect(x, y, w, h); c.fillStyle = lin(c, 0, y + 10, 0, y + 140, [[0, "#3A5060"], [1, "#24343A"]]); c.fillRect(x + 12, y + 12, w - 24, 128);
      c.fillStyle = "#1E2A2E"; poly(c, [[x + 12, y + 120], [x + 70, y + 50], [x + 110, y + 90], [x + 140, y + 60], [x + w - 12, y + 110], [x + w - 12, y + 140], [x + 12, y + 140]]); c.fill();
      for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) { c.fillStyle = (r === 2 && k === 4) ? "#7A2A22" : "rgba(30,28,26,.8)"; c.fillRect(x + 18 + k * 23, y + 160 + r * 24, 12, 10); }
      c.strokeStyle = "#2A2420"; c.lineWidth = 2; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y - 30); c.stroke(); }
    // switchboard with a wire running up the wall
    { const x = -430, y = -660; c.strokeStyle = "#1A1C1C"; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 40, y); c.lineTo(x + 40, ROOM.y0 + 140); c.stroke();
      c.fillStyle = "#4A4C48"; c.fillRect(x, y, 90, 130); for (let i = 0; i < 4; i++) { c.fillStyle = "#2E302E"; c.fillRect(x + 12 + i * 18, y + 22, 10, 22); } c.fillStyle = "#6A2A22"; c.beginPath(); c.arc(x + 45, y + 90, 6, 0, TAU); c.fill(); }
    // wall clock
    { const x = 140, y = -1330, r = 70; c.fillStyle = "#2A1C14"; c.beginPath(); c.arc(x, y, r + 10, 0, TAU); c.fill(); c.fillStyle = "#5A5650"; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.strokeStyle = "#1A1612"; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 30, y - 32); c.stroke(); c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 8, y + 52); c.stroke(); }
    // framed photo of the family (a wedding photo, faded)
    { const x = 860, y = -1110, w = 170, h = 210; c.fillStyle = "#2E1E14"; c.fillRect(x - 14, y - 14, w + 28, h + 28); c.fillStyle = "#4A443C"; c.fillRect(x, y, w, h);
      c.fillStyle = "#2A2420"; for (const [px, ph] of [[58, 150], [112, 140]]) { c.beginPath(); c.ellipse(x + px, y + h - ph + 18, 16, 19, 0, 0, TAU); c.fill(); c.fillRect(x + px - 24, y + h - ph + 36, 48, ph - 36); } }
    // shelf with a radio, a brass lota and a money plant whose vines hang down
    { const x0 = 560, x1 = 1060, y = -640; c.fillStyle = "#2A1A12"; c.fillRect(x0, y, x1 - x0, 18); c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(x0, y + 18, x1 - x0, 14);
      c.fillStyle = "#3A2418"; c.fillRect(x0 + 40, y - 110, 190, 110); c.fillStyle = "#2A1A12"; for (let i = 0; i < 6; i++) c.fillRect(x0 + 55 + i * 14, y - 92, 7, 70); c.fillStyle = "#6A5A40"; c.fillRect(x0 + 160, y - 90, 54, 30);
      c.fillStyle = "#6A4A1C"; c.beginPath(); c.ellipse(x0 + 300, y - 40, 38, 40, 0, 0, TAU); c.fill(); c.fillRect(x0 + 284, y - 98, 32, 30); c.beginPath(); c.ellipse(x0 + 300, y - 100, 26, 7, 0, 0, TAU); c.fill();
      c.fillStyle = "#3A2A20"; c.fillRect(x0 + 380, y - 80, 70, 80);
      c.strokeStyle = "#1E2A1A"; c.lineWidth = 4; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x0 + 400 + k * 12, y); for (let s = 1; s < 14; s++) c.lineTo(x0 + 400 + k * 12 + Math.sin(s * .7 + k) * 14, y + s * 26 * (1 + k * .15)); c.stroke();
        for (let s = 1; s < 14; s += 2) { c.fillStyle = "#22301E"; c.beginPath(); c.ellipse(x0 + 400 + k * 12 + Math.sin(s * .7 + k) * 14 + 9, y + s * 26 * (1 + k * .15), 11, 7, .6, 0, TAU); c.fill(); } } }
    // skirting band
    c.fillStyle = "#1E1614"; c.fillRect(ROOM.x0, ROOM.wallBase - 70, W, 70); c.fillStyle = "rgba(255,230,200,.05)"; c.fillRect(ROOM.x0, ROOM.wallBase - 70, W, 3);
    // floor: red oxide, glossy, darker toward us
    c.fillStyle = lin(c, 0, ROOM.wallBase, 0, ROOM.y1, [[0, "#3E1612"], [.25, "#34120F"], [1, "#1A0807"]]); c.fillRect(ROOM.x0, ROOM.wallBase, W, ROOM.y1 - ROOM.wallBase);
    c.globalAlpha = .5; for (let x = ROOM.x0; x < ROOM.x1; x += 512) c.drawImage(plaster, x, ROOM.wallBase, 512, 512); c.globalAlpha = 1;
    for (let i = 0; i < 9; i++) { c.fillStyle = "rgba(0,0,0,.18)"; const y = ROOM.wallBase + Math.pow(i / 9, 1.6) * (ROOM.y1 - ROOM.wallBase); c.fillRect(ROOM.x0, y, W, 2); }
    // divan (right): wooden frame, an indigo block-print cover, a round bolster
    { const x0 = 330, x1 = 1180, top = -250, y1 = -40; c.fillStyle = "#24160E"; c.fillRect(x0, top + 70, x1 - x0, y1 - top - 70); for (const lx of [x0 + 10, x1 - 40]) c.fillRect(lx, top + 60, 30, y1 - top - 30);
      c.fillStyle = "#1A1E30"; c.beginPath(); c.roundRect(x0 - 10, top + 8, x1 - x0 + 20, 86, 14); c.fill(); c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(x0 - 10, top + 74, x1 - x0 + 20, 20);
      c.fillStyle = "rgba(200,190,170,.07)"; for (let i = 0; i < 26; i++) for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(x0 + 20 + i * 32 + (j % 2) * 16, top + 30 + j * 24, 5, 0, TAU); c.fill(); }
      c.fillStyle = "#5A2418"; c.beginPath(); c.ellipse(x1 - 70, top - 20, 70, 40, 0, 0, TAU); c.fill(); c.fillStyle = "#4A1C12"; c.beginPath(); c.ellipse(x1 - 10, top - 20, 18, 40, 0, 0, TAU); c.fill(); }
    // ceiling fan rod (blades drawn per frame)
    c.fillStyle = "#16120E"; c.fillRect(-566, ROOM.y0, 12, 150); c.beginPath(); c.ellipse(-560, ROOM.y0 + 165, 44, 22, 0, 0, TAU); c.fill();
  });
  // ---------------------------------------------------------------- light: the window's light on the wall and floor, and its reflection
  const light = await bake(W, H, (c) => {
    c.translate(OX, OY);
    const panes = (P, col0, col1, bar) => { const { x, y, w, h, skew } = P, at = (u, v) => [x + u * w + skew * (1 - v), y + v * h], nx = 7, rows = [[.03, .34], [.38, .5], [.53, .97]];
      c.save(); c.filter = "blur(4px)"; c.fillStyle = lin(c, x, y, x + w, y + h, [[0, col0], [1, col1]]);
      for (const [v0, v1] of rows) for (let i = 0; i < nx; i++) { const u0 = i / nx + bar / w / 2, u1 = (i + 1) / nx - bar / w / 2; poly(c, [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)]); c.fill(); }
      // the top row of the grill is a lattice of small diamonds: darken a few crossings
      c.globalCompositeOperation = "destination-out"; c.fillStyle = "rgba(0,0,0,.85)"; for (let i = 0; i < nx * 2; i++) { const [cx, cy] = at((i + .5) / (nx * 2), .185); poly(c, [[cx, cy - 22], [cx + 9, cy], [cx, cy + 22], [cx - 9, cy]]); c.fill(); }
      c.restore(); };
    panes(PATCH, "rgba(255,178,104,.56)", "rgba(255,150,84,.44)", 16);
    for (const F of FLOOR_PATCHES) panes(F, "rgba(255,150,96,.30)", "rgba(255,176,112,.52)", 14);
    // the glossy floor holds a soft upside-down copy of the wall's light
    c.save(); c.filter = "blur(14px)"; c.globalAlpha = .28; c.translate(0, 2 * ROOM.wallBase); c.scale(1, -1); patchPath(c, { ...PATCH, y: PATCH.y + 120, h: PATCH.h * .55 }); c.fillStyle = "rgba(255,170,110,.9)"; c.fill(); c.restore();
    // the bounce: the lit floor warms the bottom of the wall
    c.fillStyle = lin(c, 0, ROOM.wallBase - 260, 0, ROOM.wallBase, [[0, "rgba(255,150,90,0)"], [1, "rgba(255,150,90,.10)"]]); c.fillRect(-1300, ROOM.wallBase - 260, 2400, 260);
  });
  // beams baked (blur is too slow per frame); two streak variants to breathe between
  const beams = []; for (const v of [0, 1]) beams.push(await bake(W, H, (c) => { c.translate(OX, OY); for (const B of BEAMS) shaft(c, B.q[0], B.q[1], B.q[3], B.q[2], ROOM.sun, B.a, v * 3.1, B.seed + v * 10, 9); }));
  return { base, light, beams };
}

// the fan turns slowly; its blades pass through the light
function fan(ctx, t) {
  const cx = -560, cy = ROOM.y0 + 175, a = t * 2.4;
  ctx.save(); ctx.fillStyle = "#120E0B";
  for (let i = 0; i < 3; i++) { const q = a + i * TAU / 3, sx = Math.cos(q); ctx.beginPath(); ctx.ellipse(cx + sx * 210, cy + Math.sin(q) * 10, Math.abs(sx) * 200 + 14, 16, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}

export function drawRoom(ctx, R, t, o = {}) {
  ctx.drawImage(R.base, ROOM.x0, ROOM.y0);
  // the sun breathes a little as the curtain on the window moves
  const breathe = .86 + .1 * Math.sin(t * .7) + .04 * Math.sin(t * 2.3 + 1), sun = (o.sun ?? 1) * breathe;
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = clamp(sun); ctx.drawImage(R.light, ROOM.x0, ROOM.y0); ctx.restore();
  fan(ctx, t);
}
// beams and dust go over the people (they are in the air between us and them)
export function drawAir(ctx, R, t, view, o = {}) {
  const sun = (o.sun ?? 1), k = .5 + .5 * Math.sin(t * .5);
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = clamp(sun * (1 - k) * .9); ctx.drawImage(R.beams[0], ROOM.x0, ROOM.y0); ctx.globalAlpha = clamp(sun * k * .9); ctx.drawImage(R.beams[1], ROOM.x0, ROOM.y0); ctx.restore();
  motes(ctx, view, o.motes ?? 520, t, (x, y) => lightAt(x, y) * sun, 7, "#FFE2B0", o.moteSize ?? 1.2);
}
// a long shadow on the floor, thrown to the left by the sun from the right
export function floorShadow(ctx, drawSil, x, a = .45, len = .9) {
  ctx.save(); ctx.translate(x, 0); ctx.transform(1, 0, len * 1.6, -.2, 0, 0); ctx.translate(-x, 0); ctx.globalAlpha = a; ctx.filter = "blur(3px)"; drawSil(); ctx.filter = "none"; ctx.restore();
}
