// lib.mjs — re-exports the claude-animation library plus a few helpers shared by every file.
import path from "node:path";
const LIB = process.env.CLAUDE_ANIMATION_LIB || path.join(process.env.HOME, ".claude/skills/claude-animation/lib");
export const core = await import(path.join(LIB, "core.mjs"));
export const { Image, PathOp, FillType, GlobalFonts } = await import(path.join(LIB, "../node_modules/@napi-rs/canvas/index.js"));
export const tex = await import(path.join(LIB, "textures.mjs"));
export const { createCanvas, Path2D, clamp, lerp, ss, hash, rng, noise1, eOut, eIn, eIO, eBack, eElastic, eBounce, popS, ik, catmull, ellPts, INK } = core;

export const TAU = Math.PI * 2;
export const ease = { out: eOut, in: eIn, io: eIO };
export const rad = (d) => d * Math.PI / 180;
export const mixc = (a, b, k) => { // hex -> hex mix
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b), kk = clamp(k);
  return "#" + A.map((v, i) => Math.round(lerp(v, B[i], kk)).toString(16).padStart(2, "0")).join("");
};
export const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
// piecewise-linear keyframes with smoothstep between: kf([[t,v],...])(t)
export const kf = (pts) => (t) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t < pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return lerp(va, vb, ss(a, b, t)); }
  return pts[pts.length - 1][1];
};
// a tiny seeded random keyed by integers: R(i) in [0,1)
export const R = (i, j = 0) => hash(i * 12.9898 + j * 78.233);
