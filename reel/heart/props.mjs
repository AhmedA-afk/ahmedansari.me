// props.mjs — the things people hold: the boy's drawing, crayons, a newspaper, a school paper, a bag.
import { clamp, lerp, hash, TAU, rgba, mixc } from "./lib.mjs";

// a waxy crayon stroke: several thin, slightly wandering passes
function crayon(ctx, P, col, w, seed = 1, a = .9) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (let k = 0; k < 4; k++) { ctx.globalAlpha = a * (.35 + .2 * hash(seed + k)); ctx.lineWidth = w * (.45 + .4 * hash(seed * 3 + k)); ctx.beginPath();
    P.forEach(([x, y], i) => { const jx = (hash(seed * 7 + i * 13 + k) - .5) * w * .5, jy = (hash(seed * 11 + i * 17 + k) - .5) * w * .5; i ? ctx.lineTo(x + jx, y + jy) : ctx.moveTo(x + jx, y + jy); }); ctx.stroke(); }
  ctx.restore();
}
const circ = (cx, cy, r, n = 14, s = 1) => Array.from({ length: n + 2 }, (_, i) => [cx + Math.cos(i / n * TAU + s) * r * (1 + (hash(i + s) - .5) * .12), cy + Math.sin(i / n * TAU + s) * r * (1 + (hash(i * 3 + s) - .5) * .12)]);

// the drawing: his family under a big sun — mother, father and him holding hands outside their house.
// drawn in a w x h box (landscape), `prog` 0..1 = how much of it is drawn yet
export function drawing(ctx, w, h, prog = 1, back = 0) {
  const s = w / 300, P = (pts) => pts.map(([x, y]) => [x * s, y * s]), on = (a, b) => clamp((prog - a) / (b - a));
  // paper
  ctx.fillStyle = mixc("#F1E6CF", "#FFD8A0", back * .5); ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(120,90,60,.25)"; ctx.lineWidth = 1.2 * s; ctx.strokeRect(.5, .5, w - 1, h - 1);
  const A = 1 - back * .45;
  const k = (a, b, fn) => { const p = on(a, b); if (p > 0) { ctx.save(); ctx.globalAlpha = p; fn(); ctx.restore(); } };
  // ground and house
  k(0, .12, () => crayon(ctx, P([[8, 168], [80, 164], [160, 170], [240, 165], [292, 168]]), "#4E8A3A", 6 * s, 2, A));
  k(.08, .3, () => { crayon(ctx, P([[200, 166], [200, 112], [270, 112], [270, 166]]), "#B0452E", 4 * s, 3, A); crayon(ctx, P([[192, 114], [235, 78], [278, 114]]), "#7A2A20", 5 * s, 4, A);
    crayon(ctx, P([[228, 166], [228, 138], [244, 138], [244, 166]]), "#5A3A22", 3.5 * s, 5, A); crayon(ctx, P([[208, 124], [222, 124], [222, 136], [208, 136], [208, 124]]), "#2E5A9A", 3 * s, 6, A); });
  // sun, with rays
  k(.25, .45, () => { crayon(ctx, P(circ(52, 42, 22, 16, 1)), "#F2A421", 6 * s, 7, A); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .3; crayon(ctx, P([[52 + Math.cos(a) * 30, 42 + Math.sin(a) * 30], [52 + Math.cos(a) * 42, 42 + Math.sin(a) * 42]]), "#F2B431", 4 * s, 8 + i, A); } });
  // three people holding hands: big, big, small
  const person = (x, hgt, col, sd) => { const hy = 166 - hgt; crayon(ctx, P(circ(x, hy + 9, 9, 12, sd)), "#6A3A22", 3.5 * s, sd, A);
    crayon(ctx, P([[x, hy + 18], [x, hy + hgt * .62]]), col, 5 * s, sd + 1, A); crayon(ctx, P([[x, hy + hgt * .62], [x - 8, 166]]), "#3A3A5A", 4 * s, sd + 2, A); crayon(ctx, P([[x, hy + hgt * .62], [x + 8, 166]]), "#3A3A5A", 4 * s, sd + 3, A);
    crayon(ctx, P([[x - 16, hy + hgt * .42], [x, hy + 26], [x + 16, hy + hgt * .42]]), col, 3.5 * s, sd + 4, A); };
  k(.4, .6, () => person(70, 74, "#A3302A", 20));
  k(.55, .75, () => person(112, 80, "#3E6A9A", 30));
  k(.7, .9, () => { person(148, 50, "#E0A030", 40); crayon(ctx, P([[86, 115], [96, 112]]), "#6A3A22", 3 * s, 50, A); crayon(ctx, P([[128, 118], [133, 128]]), "#6A3A22", 3 * s, 51, A); });
  // a heart above them (he knows what it is about)
  k(.88, 1, () => crayon(ctx, P([[110, 60], [102, 50], [104, 42], [110, 46], [116, 42], [118, 50], [110, 60]]), "#D8343A", 4 * s, 60, A));
}

// a newspaper, folded, seen from the side (held up: tall thin plane; on the lap: a flat fold)
export function newspaper(ctx, a, b, thick = 6, lit = 0) {
  ctx.save(); ctx.strokeStyle = mixc("#5A564E", "#E8E0CC", lit); ctx.lineWidth = thick; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.restore();
}
