// shade.mjs — the people of "Gullak", seen in profile, in chiaroscuro.
// Everyone is dark against a lit world and edged by that world's light. What lights them from the front is the
// gullak in the chest: the more love a person holds, the further its light reaches — the chest, then the hands,
// then the face. A face we can read is a heart that is full.
//
//   figure(ctx, x, groundY, s, look, pose, light, t, ex) -> anchors in the caller's frame
//     look : LOOKS.*  (true colours; the light decides how much of them we see)
//     pose : POSE.*(...)  joint angles
//     light: { key:[x,y] toward the light, keyCol, rim, rimW, heart 0..1, heartCol, dark, shadow, amb, ambCol, cold, face }
//     ex   : { age, flip, face:{brow,eye,mouth,look,blush,tears}, reach:[nearTarget, farTarget] (world), heartFn, hair }
import { Path2D, PathOp, clamp, lerp, catmull, TAU, mixc, rgba } from "./lib.mjs";

// ------------------------------------------------------------------ proportions: a 6-year-old -> a grown man (lengths at s = 1)
const KID = { headH: 56, neck: 9, torso: 104, thigh: 70, shin: 64, ankle: 8, foot: 27, up: 46, fore: 40, hand: 19,
  chF: 21, chB: 16, waF: 22, waB: 14, hiF: 17, hiB: 20, thW: [34, 22], shW: [21, 14], upW: [16, 13], foW: [13, 10], neckW: 17 };
const MAN = { headH: 64, neck: 16, torso: 168, thigh: 120, shin: 114, ankle: 12, foot: 40, up: 82, fore: 74, hand: 30,
  chF: 34, chB: 26, waF: 24, waB: 20, hiF: 24, hiB: 32, thW: [52, 34], shW: [33, 21], upW: [26, 20], foW: [21, 15], neckW: 27 };
export function body(age, k = {}) {
  const f = clamp((age - 6) / 14), o = {};
  for (const key of Object.keys(MAN)) o[key] = Array.isArray(MAN[key]) ? MAN[key].map((v, i) => lerp(KID[key][i], v, f)) : lerp(KID[key], MAN[key], f);
  const h = k.h ?? 1, w = k.w ?? 1;
  for (const key of ["neck", "torso", "thigh", "shin", "up", "fore", "foot", "hand"]) o[key] *= h;
  for (const key of ["chF", "chB", "waF", "waB", "hiF", "hiB", "neckW"]) o[key] *= w * (k.curve?.[key] ?? 1);
  for (const key of ["thW", "shW", "upW", "foW"]) o[key] = o[key].map((v) => v * w * (k.limb ?? 1));
  o.headH *= k.head ?? 1; o.f = f; o.age = age;
  return o;
}

// ------------------------------------------------------------------ geometry
const add = (a, b) => [a[0] + b[0], a[1] + b[1]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
const dir = (ang) => [Math.sin(ang), Math.cos(ang)];            // angle from straight down; + swings forward (toward +x)
const len = (a) => Math.hypot(a[0], a[1]);
function area(P) { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
const ccw = (P) => (area(P) < 0 ? P.slice().reverse() : P);
function toPath(P) { const Q = ccw(P), p = new Path2D(); p.moveTo(Q[0][0], Q[0][1]); for (let i = 1; i < Q.length; i++) p.lineTo(Q[i][0], Q[i][1]); p.closePath(); return p; }
const smooth = (P, step = 3) => catmull(P, true, step);
const disc = (c, r, n = 14) => Array.from({ length: n }, (_, i) => [c[0] + Math.cos(i / n * TAU) * r, c[1] + Math.sin(i / n * TAU) * r]);
// a tapered limb a -> b with a soft swell (front = the +90° side of a->b)
function limb(a, b, wa, wb, swF = .1, swB = .1, n = 8) {
  const d = sub(b, a), L = len(d) || 1, u = mul(d, 1 / L), p = [-u[1], u[0]], F = [], B = [];
  for (let i = 0; i <= n; i++) { const t = i / n, w = lerp(wa, wb, t) / 2, sw = Math.sin(t * Math.PI) * w;
    F.push(add(add(a, mul(d, t)), mul(p, w + sw * swF))); B.push(add(add(a, mul(d, t)), mul(p, -(w + sw * swB)))); }
  const ang = Math.atan2(u[1], u[0]), capB = [], capA = [];
  for (let i = 1; i < 6; i++) { const q = ang + Math.PI / 2 - Math.PI * i / 6; capB.push([b[0] + Math.cos(q) * wb / 2, b[1] + Math.sin(q) * wb / 2]); }
  for (let i = 1; i < 6; i++) { const q = ang - Math.PI / 2 - Math.PI * i / 6; capA.push([a[0] + Math.cos(q) * wa / 2, a[1] + Math.sin(q) * wa / 2]); }
  return [...F, ...capB, ...B.reverse(), ...capA];
}
// two-bone IK in the local frame: returns the middle joint; `bend` chooses the side (+1 = joint toward -x / back-down)
function ik2(a, c, l1, l2, bend = 1) {
  const d = sub(c, a), D = Math.min(len(d), l1 + l2 - .01), base = Math.atan2(d[1], d[0]);
  const k = Math.acos(clamp((l1 * l1 + D * D - l2 * l2) / (2 * l1 * D), -1, 1)), a1 = base + bend * k;
  return add(a, [Math.cos(a1) * l1, Math.sin(a1) * l1]);
}

// ------------------------------------------------------------------ heads in profile (head frame: origin = top of the neck, facing +x, up = -y; ~66 units tall)
const HEAD_M = [[-12, 6], [-17, -6], [-25, -22], [-27, -38], [-22, -54], [-8, -65], [8, -66], [19, -58], [25, -46], [27, -38], [26, -34], [28, -30], [35, -21], [33, -18], [28, -17], [29, -13], [27, -11], [28, -9], [25, -6], [27, -1], [22, 3], [10, 5], [8, 12], [6, 18]];
const HEAD_F = [[-12, 6], [-17, -6], [-25, -22], [-27, -38], [-22, -54], [-8, -65], [8, -66], [19, -58], [24, -46], [25, -38], [24, -34], [26, -30], [32, -22], [30, -19], [26, -18], [28, -14], [26, -12], [27.5, -9.5], [24, -6], [25, -2], [20, 3], [9, 5], [7, 12], [5, 18]];
const HEAD_K = [[-12, 5], [-18, -6], [-28, -22], [-30, -40], [-25, -56], [-10, -66], [7, -67], [19, -60], [25, -48], [26, -40], [25, -35], [26, -31], [30, -24], [29, -21], [26, -20], [27, -16], [25, -14], [26, -11], [23, -8], [23, -4], [17, 1], [9, 3], [7, 10], [5, 15]];
const FEAT_A = { eye: [19.5, -35.5], brow: [21, -42], mouth: [26.5, -11.2], ear: [-3, -30], cheek: [15, -22], nose: [29, -19] };
const FEAT_K = { eye: [18.5, -34], brow: [20, -40.5], mouth: [24.5, -12.5], ear: [-4, -31], cheek: [15, -21], nose: [27, -21] };
const HAIR = {
  boy:    [[-18, -6], [-27, -16], [-32, -30], [-33, -46], [-29, -60], [-20, -70], [-8, -76], [-2, -81], [3, -75], [12, -78], [16, -71], [24, -68], [24, -62], [30, -56], [24, -52], [27, -46], [19, -48], [13, -51], [6, -48], [-6, -45], [-12, -36], [-14, -22]],
  man:    [[-18, -6], [-27, -16], [-31, -32], [-31, -50], [-24, -64], [-10, -72], [4, -76], [16, -72], [25, -66], [30, -58], [24, -55], [26, -50], [16, -54], [6, -50], [-6, -46], [-12, -36], [-14, -22]],
  mother: [[-20, -8], [-27, -18], [-30, -34], [-29, -50], [-22, -62], [-8, -70], [8, -70], [19, -63], [25, -53], [22, -52], [14, -56], [4, -54], [-6, -48], [-12, -38], [-15, -22]],
  father: [[-18, -6], [-27, -16], [-30, -32], [-29, -50], [-22, -62], [-8, -70], [8, -71], [18, -66], [23, -60], [16, -60], [6, -55], [-6, -48], [-12, -36], [-14, -22]],
};

// ------------------------------------------------------------------ hands and feet (outlines in their own frames)
// hand frame: u along the fingers (0 = wrist .. 1 = fingertips), v across (+ = thumb side). open -> fist, same point count
const H_OPEN = [[0, -.42], [.38, -.5], [.75, -.42], [1, -.2], [1.02, .02], [.9, .2], [.6, .3], [.55, .5], [.62, .78], [.52, .86], [.36, .62], [.14, .5], [0, .44]];
const H_FIST = [[0, -.45], [.28, -.56], [.52, -.5], [.66, -.28], [.68, -.02], [.62, .22], [.5, .34], [.46, .5], [.5, .62], [.4, .66], [.28, .6], [.12, .52], [0, .46]];
function handPts(W, ang, L, curl) { const d = dir(ang), p = [d[1], -d[0]], w = L * .46;
  return smooth(H_OPEN.map((o, i) => { const u = lerp(o[0], H_FIST[i][0], curl), v = lerp(o[1], H_FIST[i][1], curl) * w; return [W[0] + d[0] * u * L + p[0] * v, W[1] + d[1] * u * L + p[1] * v]; }), 2.5); }
// foot frame: x along the foot, y toward the sole; ankle at the origin, sole at y = a
const SHOE = [[-.2, -.55], [-.27, .1], [-.22, .85], [-.12, 1], [.55, 1], [.82, .98], [.97, .7], [.95, .3], [.75, .05], [.45, -.15], [.15, -.5], [0, -.85]];
const BARE = [[-.18, -.5], [-.24, .15], [-.18, .88], [-.08, 1], [.6, 1], [.86, .96], [.96, .72], [.88, .45], [.62, .25], [.36, .05], [.12, -.45], [0, -.8]];

// ------------------------------------------------------------------ poses
// { lean, curl (hunch), head (tilt, + = down), legs: [[thigh, knee, pf]] near/far, arms: [[shoulder, elbow]], curl: hand curl, lift }
const wrap = (u) => u - Math.floor(u);
const loop = (keys) => (u) => { u = wrap(u); const n = keys.length; let i = n - 1; for (let j = 0; j < n; j++) if (keys[j][0] <= u) i = j;
  const g = (j) => { const k = keys[((j % n) + n) % n]; return [k[0] + Math.floor(j / n), k[1]]; };
  const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2), t = (u - p1[0]) / (p2[0] - p1[0]), t2 = t * t, t3 = t2 * t;
  return .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3); };
const WALK = { th: loop([[0, .34], [.15, .22], [.5, -.3], [.62, -.18], [.8, .25], [.92, .38]]), kn: loop([[0, .06], [.12, .3], [.35, .12], [.55, .42], [.7, 1.02], [.85, .5], [.95, .08]]),
  pf: loop([[0, -.18], [.1, 0], [.45, .12], [.6, .65], [.7, .45], [.85, .02], [.95, -.2]]) };
const RUN = { th: loop([[0, .5], [.12, .15], [.3, -.45], [.42, -.32], [.6, .35], [.78, .82], [.92, .66]]), kn: loop([[0, .42], [.1, .78], [.3, .38], [.45, 1.5], [.6, 2.1], [.75, 1.4], [.9, .55]]),
  pf: loop([[0, -.05], [.12, .1], [.3, .85], [.45, .95], [.65, .4], [.85, .0]]), lift: loop([[0, 0], [.13, -.4], [.3, 0], [.4, 1], [.5, 0], [.63, -.4], [.8, 0], [.9, 1]]) };
export const POSE = {
  stand: (t = 0, k = {}) => { const sw = Math.sin(t * .9) * .015;
    return { lean: .02 + sw, curl: k.curl ?? 0, head: k.head ?? 0, legs: [[.03, .05, 0], [-.05, .06, 0]], arms: [[-.13 + Math.sin(t * 1.3) * .012, .16], [-.08, .18]], hands: [.35, .4], breathe: Math.sin(t * 1.7) }; },
  walk: (u, k = 1, o = {}) => { const leg = (q) => [WALK.th(q) * k, WALK.kn(q) * k, WALK.pf(q) * k], c = Math.cos(u * TAU);
    return { lean: .06 * k, curl: o.curl ?? 0, head: o.head ?? -.02, legs: [leg(u), leg(u + .5)], arms: [[-.3 * c * k - .02, .18 + .18 * Math.max(0, -c)], [.3 * c * k - .02, .18 + .18 * Math.max(0, c)]], hands: [.35, .35] }; },
  run: (u, k = 1, o = {}) => { const leg = (q) => [RUN.th(q) * k, RUN.kn(q) * k, RUN.pf(q) * k], c = Math.cos(u * TAU), kid = o.kid ?? 0;
    return { lean: .2 * k, curl: -.05, head: (o.head ?? -.1) * k, legs: [leg(u), leg(u + .5)], arms: [[(-.72 - kid * .2) * c * k + .1, 1.45 - .3 * c - kid * .5], [(.72 + kid * .2) * c * k + .1, 1.45 + .3 * c - kid * .5]],
      hands: [.8 - kid * .5, .8 - kid * .5], lift: RUN.lift(u) * k, bounce: Math.cos(u * TAU * 2) }; },
  kneelSit: (t = 0, o = {}) => ({ lean: o.lean ?? .5, curl: o.curl ?? .15, head: o.head ?? .5, legs: [[1.42, 3.02, 1.45], [1.34, 2.96, 1.4]], arms: [[.8, .6], [.6, .8]], hands: [.3, .3], breathe: Math.sin(t * 1.7) }),
  sit: (t = 0, seat = 150, o = {}) => ({ seat, lean: o.lean ?? .08, curl: o.curl ?? .12, head: o.head ?? .05, legs: [[1.42, 1.32, .1], [1.36, 1.22, .05]], arms: [[.35, .9], [.3, .95]], hands: [.45, .45], breathe: Math.sin(t * 1.5) }),
  genuflect: (t = 0, o = {}) => ({ lean: o.lean ?? .06, curl: o.curl ?? .05, head: o.head ?? .25, legs: [[1.38, 1.42, 0], [.02, 1.6, 1.35]], arms: [[.3, .5], [.1, .4]], hands: [.3, .35], breathe: Math.sin(t * 1.5) }),
};

export function mixPose(A, B, k) { // blend two poses (k = 0 -> A, 1 -> B)
  const m = (a, b) => (Array.isArray(a) ? a.map((v, i) => m(v, b?.[i] ?? v)) : typeof a === "number" ? lerp(a, b ?? a, k) : (k < .5 ? a : b));
  const o = {}; for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) { const a = A[key], b = B[key];
    if (key === "seat") o.seat = a != null && b != null ? lerp(a, b, k) : (k < .5 ? a : b); else o[key] = a == null ? b : b == null ? a : m(a, b); }
  return o;
}
// ------------------------------------------------------------------ light helpers
const HEART_STOPS = [[0, 1], [.1, .86], [.3, .6], [.55, .34], [.8, .12], [1, 0]];
const heartFall = (x) => { if (x >= 1) return 0; for (let i = 1; i < HEART_STOPS.length; i++) if (x <= HEART_STOPS[i][0]) { const [a, va] = HEART_STOPS[i - 1], [b, vb] = HEART_STOPS[i]; return lerp(va, vb, (x - a) / (b - a)); } return 0; };
const lit = (c, lc, k = .22) => mixc(mixc(c, lc, k), "#FFFFFF", .06);

// ------------------------------------------------------------------ the figure
export function figure(ctx, x, gy, s, look, pose, light = {}, t = 0, ex = {}) {
  const b = body(ex.age ?? look.age ?? 28, look.build || {}), fl = ex.flip ? -1 : 1, P = pose, kidK = 1 - b.f;
  const L = { key: [.7, -.7], keyCol: "#FFD7A0", rim: .9, rimW: 2.6, heart: .3, heartCol: "#FFB060", dark: .8, shadow: "#0D0A10", amb: 0, ambCol: "#FFE2C0", cold: 0, face: 0, ...light };
  // ---- legs relative to the pelvis at (0,0)
  const legs = (P.legs || [[0, 0, 0], [0, 0, 0]]).map(([th, kn, pf = 0]) => {
    const knee = mul(dir(th), b.thigh), sa = th - kn, ankle = add(knee, mul(dir(sa), b.shin)), fa = sa + Math.PI / 2 - pf, fd = dir(fa), fn = [-fd[1], fd[0]];
    const F = look.bare ? BARE : SHOE, foot = F.map(([u, v]) => add(ankle, add(mul(fd, u * b.foot), mul(fn, v * b.ankle))));
    return { th, kn, sa, knee, ankle, foot };
  });
  let low = -1e9; for (const Lg of legs) { for (const p of Lg.foot) low = Math.max(low, p[1]); low = Math.max(low, Lg.knee[1] + b.shW[0] * .5); }
  const py = P.seat != null ? -P.seat : -low - (P.lift || 0) * b.thigh * .12;
  // ---- spine: integrate a gently curving line from the pelvis to the neck
  const lean = P.lean || 0, curl = P.curl || 0, SP = [[0, 0]], SA = [lean];
  for (let i = 1; i <= 12; i++) { const tt = i / 12, a = lean + curl * tt * tt * 1.4, prev = SP[i - 1]; SP.push([prev[0] + Math.sin(a) * b.torso / 12, prev[1] - Math.cos(a) * b.torso / 12]); SA.push(a); }
  const along = (tt, off = 0) => { const q = clamp(tt, 0, 1) * 12, i = Math.min(11, Math.floor(q)), k = q - i, p = [lerp(SP[i][0], SP[i + 1][0], k), lerp(SP[i][1], SP[i + 1][1], k)], a = lerp(SA[i], SA[i + 1], k);
    const u = [Math.sin(a), -Math.cos(a)], f = [Math.cos(a), Math.sin(a)], ext = tt < 0 ? tt : tt > 1 ? tt - 1 : 0; return [p[0] + u[0] * ext * b.torso + f[0] * off, p[1] + u[1] * ext * b.torso + f[1] * off]; };
  const topA = SA[12], breathe = (P.breathe || 0) * .9;
  // ---- torso outline (front from the crotch up, back from the neck down)
  const loose = look.top?.loose ?? 1.06, hem = look.top?.hem ?? -.1;
  const front = [[hem, b.hiF * loose * 1.02], [0, b.hiF * loose], [.22, lerp(b.waF, b.hiF, .3) * loose], [.45, b.waF * loose], [.68, (b.chF + breathe) * loose], [.84, b.chF * .9 * loose], [.97, b.chF * .52], [1.03, b.neckW * .42]];
  const back = [[1.03, -b.neckW * .5], [.98, -b.chB * .62], [.86, -b.chB * loose], [.68, -b.chB * .96 * loose], [.45, -b.waB * loose], [.18, -b.hiB * .9 * loose], [.03, -b.hiB * loose], [hem, -b.hiB * loose * 1.02]];
  if (look.top?.kind === "kurta") { front[0] = [hem, b.hiF * 1.35]; back[back.length - 1] = [hem, -b.hiB * 1.3]; }
  const torsoPts = smooth([...front.map(([tt, o]) => along(tt, o)), ...back.map(([tt, o]) => along(tt, o))], 4);
  // ---- neck and head
  const neckBase = along(1, b.neckW * .05), headTilt = (P.head || 0) + topA * .35, na = topA * .5 + (P.head || 0) * .35;
  const neckTop = add(neckBase, [Math.sin(na) * b.neck, -Math.cos(na) * b.neck]);
  const hs = b.headH / 66, hc = Math.cos(headTilt), hsn = Math.sin(headTilt), hd = (p) => [neckTop[0] + (p[0] * hc - p[1] * hsn) * hs, neckTop[1] + (p[0] * hsn + p[1] * hc) * hs];
  const adultHead = look.sex === "f" ? HEAD_F : HEAD_M, headLocal = adultHead.map((p, i) => [lerp(HEAD_K[i][0], p[0], b.f), lerp(HEAD_K[i][1], p[1], b.f)]);
  const headPts = smooth(headLocal.map(hd), 2.5), neckPts = limb(neckBase, add(neckTop, mul(sub(neckTop, neckBase), .25)), b.neckW, b.neckW * .9, .05, .05);
  const ft = {}; for (const k of Object.keys(FEAT_A)) ft[k] = hd([lerp(FEAT_K[k][0], FEAT_A[k][0], b.f), lerp(FEAT_K[k][1], FEAT_A[k][1], b.f)]);
  const bounce = (P.bounce || 0) * (ex.hair ?? 1) * 2.2;
  const hairBase = HAIR[look.hair] || HAIR.man, hairPts = smooth(hairBase.map(([hx, hy]) => { const k = clamp((-hy - 48) / 30); return hd([hx - k * Math.abs(bounce) * .6, hy + k * bounce]); }), 2.5);
  // ---- arms (local frame); `reach` targets come in world coordinates
  const S0 = along(.86, -b.chB * .3), arms = (P.arms || [[0, .1], [0, .1]]).map(([sh, el], i) => {
    const S = add(S0, [i ? -2 : 0, i ? -1 : 0]), a1 = sh + topA * .4, E = add(S, mul(dir(a1), b.up)), a2 = a1 + el, W = add(E, mul(dir(a2), b.fore));
    return { S, E, W, ang: a2 };
  });
  if (ex.reach) ex.reach.forEach((tg, i) => { if (!tg) return; const A = arms[i]; let T = [(tg[0] - x) / (s * fl), (tg[1] - gy) / s - py];
    { const d0 = sub(T, A.S), D0 = len(d0), mx = (b.up + b.fore + b.hand * .35) * .985; if (D0 > mx) T = add(A.S, mul(d0, mx / D0)); }
    const E = ik2(A.S, T, b.up, b.fore + b.hand * .35, ex.elbow?.[i] ?? 1), d = sub(T, E), W = add(E, mul(d, b.fore / (b.fore + b.hand * .35)));
    A.E = E; A.W = W; A.ang = Math.atan2(d[0], d[1]); });
  const curls = P.hands || [.35, .35];
  // ---- pieces: { pts, col } grouped far / body / near-arm
  const skin = look.skin, top = look.top || { col: "#555555" }, bot = look.bottom || { col: "#333333", hem: 1 };
  const armPieces = (A, i) => { const out = [], upP = limb(A.S, A.E, b.upW[0], b.upW[1], .12, .08), foP = limb(A.E, A.W, b.foW[0], b.foW[1], .14, .06), hand = handPts(A.W, A.ang, b.hand, ex.curl?.[i] ?? curls[i]);
    out.push({ pts: hand, col: skin }, { pts: foP, col: skin }, { pts: upP, col: skin }, { pts: disc(A.E, b.upW[1] * .5), col: skin });
    const sl = top.sleeve ?? .5; if (sl > 0) { const end = sl <= 1 ? add(A.S, mul(sub(A.E, A.S), sl)) : add(A.E, mul(sub(A.W, A.E), Math.min(1, sl - 1)));
      out.push({ pts: limb(add(A.S, mul(sub(A.S, A.E), .15)), end, b.upW[0] * 1.3, (sl <= 1 ? lerp(b.upW[0], b.upW[1], sl) : b.foW[0]) * 1.35, .1, .1), col: top.col });
      if (sl > 1) out.push({ pts: limb(A.S, A.E, b.upW[0] * 1.3, b.upW[1] * 1.3, .1, .1), col: top.col }); }
    return out; };
  const legPieces = (Lg) => { const K = Lg.knee, A = Lg.ankle, lc = bot.kind === "saree" ? bot.col : skin, out = [{ pts: Lg.foot, col: look.shoe || skin }, { pts: limb(K, A, b.shW[0], b.shW[1], .06, .22), col: lc }, { pts: limb([0, 0], K, b.thW[0] * (bot.kind === "saree" ? 1.15 : 1), b.thW[1], .08, .12), col: lc }, { pts: disc(K, b.shW[0] * .5), col: lc }];
    const hm = bot.hem ?? 1; if (bot.kind !== "saree" && hm > 0) { const lo = bot.loose ?? 1.12;
      out.push({ pts: limb([0, -b.thW[0] * .15], hm <= .5 ? add(mul(K, hm * 2), [0, 0]) : K, b.thW[0] * lo, (hm <= .5 ? lerp(b.thW[0], b.thW[1], hm * 2) : b.thW[1]) * lo, .06, .1), col: bot.col });
      if (hm > .5) { const e2 = add(K, mul(sub(A, K), Math.min(1, (hm - .5) * 2))); out.push({ pts: limb(K, e2, b.shW[0] * lo * 1.08, lerp(b.shW[0], b.shW[1], (hm - .5) * 2) * lo * 1.12, .04, .1), col: bot.col }, { pts: disc(K, b.thW[1] * .5 * lo), col: bot.col }); } }
    return out; };
  const far = [...legPieces(legs[1]), ...armPieces(arms[1], 1)], mid = [...legPieces(legs[0])];
  if (bot.kind === "saree") { const sw = Math.sin(t * 1.3) * 3, fK = Math.max(legs[0].knee[0], legs[1].knee[0]), bK = Math.min(legs[0].knee[0], legs[1].knee[0]), fA = Math.max(legs[0].ankle[0], legs[1].ankle[0]), bA = Math.min(legs[0].ankle[0], legs[1].ankle[0]);
    const kY = Math.max(legs[0].knee[1], legs[1].knee[1]), hemY = Math.max(legs[0].ankle[1], legs[1].ankle[1]) - b.ankle * .1;
    const hemF = [fA + b.foot * .45 + sw, hemY], hemB = [Math.max(bA - b.foot * .35, bK - b.thigh * .55) + sw, hemY], hemM = [lerp(hemB[0], hemF[0], .5), hemY + 4];
    mid.push({ pts: smooth([along(.4, -b.waB * 1.05), along(.4, b.waF * 1.05), along(0, b.hiF * 1.15), [fK + b.thW[1] * .7 + sw, kY], hemF, hemM, hemB, [bK - b.thW[1] * .9 + sw * 1.3, kY * .9], along(0, -b.hiB * 1.12)], 4), col: bot.col, border: bot.border,
      edge: [[hemB[0] - 10, hemY - 6], [hemB[0], hemY - 4], hemM.map((v, i) => v - (i ? 5 : 0)), [hemF[0], hemY - 4], [hemF[0] + 10, hemY - 8]] }); }
  const bodyP = [{ pts: neckPts, col: skin }, { pts: torsoPts, col: top.col }, { pts: headPts, col: skin }, { pts: hairPts, col: look.hairCol }];
  if (look.hair === "mother") { const B = hd([-36, -38]), r = 12.5 * hs; bodyP.push({ pts: disc(B, r, 18), col: look.hairCol, bun: [B, r] }); }
  if (look.pallu) { const sw = Math.sin(t * 1.1 + .7) * 4, sh2 = along(.97, -b.chB * .2);
    const pe = [along(1.0, b.chF * .35), along(.8, b.chF * 1.04), along(.5, b.waF * .7), along(.42, -b.waB * 1.1), [sh2[0] - b.chB * 1.6 + sw, sh2[1] + b.torso * 1.05], [sh2[0] - b.chB * .9 + sw * .6, sh2[1] + b.torso * 1.12]];
    bodyP.push({ pts: smooth([...pe, along(.55, -b.chB * 1.0), sh2], 4), col: look.pallu, border: bot.border, edge: catmull([...pe.slice(0, 4).map((p) => add(p, [0, 2])), add(pe[5], [3, -2])], false, 4) }); }
  const near = armPieces(arms[0], 0);
  // ---- paint
  const keyL = [L.key[0] * fl, L.key[1]], heartPos = along(.66, (b.chF - b.chB) * .5 + 2), Rh = b.torso * (.42 + .85 * L.heart);
  const heartA = clamp(L.heart * 1.25) * .88;
  const ext = (L.ext || []).map((E) => ({ p: [(E.p[0] - x) / (s * fl), (E.p[1] - gy) / s - py], r: E.r / s, a: clamp(E.a), col: E.col || L.heartCol }));
  ctx.save(); ctx.translate(x, gy); ctx.scale(s * fl, s); ctx.translate(0, py);
  const group = (pieces, depth) => {
    if (ex.probe) return null;
    let U = null; for (const pc of pieces) { pc.path = toPath(pc.pts); if (!U) U = new Path2D(pc.path); else U.op(pc.path, PathOp.Union); }
    if (ex.sil) { ctx.fillStyle = ex.sil; ctx.fill(U); return U; }
    for (const pc of pieces) {
      ctx.fillStyle = mixc(pc.col, L.shadow, clamp(L.dark + depth * .08)); ctx.fill(pc.path);
      if (L.amb > 0) { ctx.fillStyle = rgba(lit(pc.col, L.ambCol), L.amb * (1 - depth * .4)); ctx.fill(pc.path); }
      if (heartA > .005) { const g = ctx.createRadialGradient(heartPos[0], heartPos[1], 0, heartPos[0], heartPos[1], Rh), lc = lit(pc.col, L.heartCol, .3);
        for (const [o, a] of HEART_STOPS) g.addColorStop(o, rgba(lc, a * heartA * (1 - depth * .35))); ctx.fillStyle = g; ctx.fill(pc.path); }
      for (const E of ext) { const g = ctx.createRadialGradient(E.p[0], E.p[1], 0, E.p[0], E.p[1], E.r), lc = lit(pc.col, E.col, .3);
        for (const [o, a] of HEART_STOPS) g.addColorStop(o, rgba(lc, a * E.a * (1 - depth * .35))); ctx.fillStyle = g; ctx.fill(pc.path); }
      if (pc.edge) { ctx.save(); ctx.clip(pc.path); ctx.strokeStyle = rgba(pc.border, clamp(.25 + heartA * .9 + L.amb)); ctx.lineWidth = 3.2; ctx.beginPath(); pc.edge.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); ctx.restore(); }
      if (pc.bun && (L.rim > .1)) { const [B, r] = pc.bun; for (let i = 0; i < 9; i++) { const a = -2.2 + i * .42, q = add(B, [Math.cos(a) * r * 1.02, Math.sin(a) * r * 1.02]); ctx.fillStyle = rgba("#FFF4E0", .35 + .5 * clamp(heartA + L.amb)); ctx.beginPath(); ctx.arc(q[0], q[1], 2.1 * hs, 0, TAU); ctx.fill(); } }
    }
    // inner edges (an arm over the chest) get only a faint line of light; the true rim is on the silhouette
    if (L.rim > .01) for (const [w, a] of [[L.rimW, .22 * (depth ? 0 : 1)]]) { const sh = new Path2D(); sh.addPath(U, { a: 1, b: 0, c: 0, d: 1, e: -keyL[0] * w / s, f: -keyL[1] * w / s }); const cr = new Path2D(U); cr.op(sh, PathOp.Difference);
      ctx.fillStyle = rgba(L.keyCol, a * L.rim * (1 - depth * .45)); ctx.fill(cr); }
    // a little of the heart's warmth on the surface (adds glow under the bloom)
    if (heartA > .01) { ctx.save(); ctx.clip(U); ctx.globalCompositeOperation = "lighter"; const g = ctx.createRadialGradient(heartPos[0], heartPos[1], 0, heartPos[0], heartPos[1], b.torso * .5); g.addColorStop(0, rgba(L.heartCol, .32 * heartA)); g.addColorStop(1, rgba(L.heartCol, 0)); ctx.fillStyle = g; ctx.fillRect(heartPos[0] - b.torso, heartPos[1] - b.torso, b.torso * 2, b.torso * 2); ctx.restore(); }
    if (L.cold > 0) { ctx.save(); ctx.clip(U); ctx.globalCompositeOperation = "color"; ctx.fillStyle = rgba("#2A3448", L.cold * .85); ctx.fillRect(-400, -1000, 800, 1200); ctx.restore(); }
    return U;
  };
  const U1 = group(far, 1), U2 = group([...mid, ...bodyP], 0);
  // ---- the face (seen only as far as the heart's light reaches)
  if (ex.sil || ex.probe) { if (ex.sil) group(near, 0); } else {
  let faceLight = heartFall(len(sub(ft.eye, heartPos)) / Rh) * heartA * 2.6 + L.amb * .9 + L.face;
  for (const E of ext) faceLight += heartFall(len(sub(ft.eye, E.p)) / E.r) * E.a * 2.2;
  faceLight = clamp(faceLight);
  if (faceLight > .02) drawFace(ctx, ft, hs, headTilt, faceLight, ex.face || {}, look, t, b);
  if (ex.heartFn) ex.heartFn(ctx, heartPos, b.torso * .34, { s, fl, b });
  const U3 = group(near, 0);
  // the world's light on the silhouette: a crescent on every edge that faces the light
  if (L.rim > .01) { const U = new Path2D(U1); U.op(U2, PathOp.Union); U.op(U3, PathOp.Union);
    for (const [w, a] of [[L.rimW * 2.6, .2], [L.rimW, .78]]) { const sh = new Path2D(); sh.addPath(U, { a: 1, b: 0, c: 0, d: 1, e: -keyL[0] * w / s, f: -keyL[1] * w / s }); const cr = new Path2D(U); cr.op(sh, PathOp.Difference);
      ctx.fillStyle = rgba(L.keyCol, a * L.rim); ctx.fill(cr); } }
  }
  ctx.restore();
  // anchors in the caller's frame
  const W = (p) => [x + p[0] * s * fl, gy + (p[1] + py) * s];
  return { heart: W(heartPos), slot: W([heartPos[0], heartPos[1] - b.torso * .34 * .265]), eye: W(ft.eye), head: W(hd([2, -66])), mouth: W(ft.mouth), chin: W(hd([22, 3])),
    handN: W(arms[0].W), handF: W(arms[1].W), shoulder: W(S0), footN: W(legs[0].ankle), footF: W(legs[1].ankle), pel: W([0, 0]), b, potH: b.torso * .34 * s, s, fl };
}

// ------------------------------------------------------------------ face features (profile)
function drawFace(ctx, ft, sc, tilt, a, exp, look, t, b) {
  const ink = "#1B0F0B", E = ft.eye; ctx.save(); ctx.globalAlpha = a; ctx.lineCap = "round"; ctx.lineJoin = "round";
  const R = (p, dx, dy) => [p[0] + (dx * Math.cos(tilt) - dy * Math.sin(tilt)) * sc, p[1] + (dx * Math.sin(tilt) + dy * Math.cos(tilt)) * sc];
  // ear
  { const c = ft.ear; ctx.beginPath(); ctx.ellipse(c[0], c[1], 4 * sc, 6.5 * sc, tilt + .25, -1.9, 2.2); ctx.strokeStyle = rgba(ink, .45); ctx.lineWidth = 1.5 * sc; ctx.stroke(); }
  // brow
  const bt = { worried: -3.2, sad: -2.6, angry: 3.6, joy: -1.6, soft: -1 }[exp.brow] ?? 0, br = ft.brow;
  ctx.beginPath(); { const p0 = R(br, -6.5, 1.2), p1 = R(br, -1, -2.4), p2 = R(br, 5.5, bt); ctx.moveTo(...p0); ctx.quadraticCurveTo(...p1, ...p2); }
  ctx.strokeStyle = rgba(ink, .85); ctx.lineWidth = (2.6 - b.f * .3) * sc; ctx.stroke();
  // eye
  const open = exp.eye === "closed" ? 0 : exp.eye === "joy" ? .1 : exp.eye === "half" ? .5 : exp.eye === "wide" ? 1.25 : exp.eye === "soft" ? .72 : 1;
  const blink = (Math.abs(((t + (exp.seed || 0)) % 4.1) - 2.0) < .06) ? .08 : 1, op = open * blink, kid = 1 - b.f, er = 1 + kid * .25;
  if (op < .2) { ctx.beginPath(); const p0 = R(E, -5 * er, 0), p1 = R(E, 0, (exp.eye === "joy" ? -3.4 : 2.4)), p2 = R(E, 4.2 * er, -.6); ctx.moveTo(...p0); ctx.quadraticCurveTo(...p1, ...p2); ctx.strokeStyle = rgba(ink, .95); ctx.lineWidth = 2.1 * sc; ctx.stroke(); }
  else {
    const p0 = R(E, -5 * er, 0), pt = R(E, -.6, -4.4 * op * er), p2 = R(E, 4.6 * er, -.7), pb = R(E, -.2, 2.9 * op * er);
    ctx.beginPath(); ctx.moveTo(...p0); ctx.quadraticCurveTo(...pt, ...p2); ctx.quadraticCurveTo(...pb, ...p0); ctx.fillStyle = "#EFE6DA"; ctx.fill();
    ctx.save(); ctx.clip(); const ic = R(E, 1.4 + (exp.look || 0) * 1.3, -.4); ctx.beginPath(); ctx.arc(ic[0], ic[1], 3.2 * sc * er, 0, TAU); ctx.fillStyle = "#2B170D"; ctx.fill();
    ctx.beginPath(); ctx.arc(ic[0], ic[1], 1.6 * sc * er, 0, TAU); ctx.fillStyle = "#120806"; ctx.fill(); ctx.restore();
    ctx.beginPath(); const q0 = R(E, -5.6 * er, .3), q1 = R(E, -.8, -5 * op * er), q2 = R(E, 5.2 * er, -1.1); ctx.moveTo(...q0); ctx.quadraticCurveTo(...q1, ...q2); ctx.strokeStyle = ink; ctx.lineWidth = 2.3 * sc; ctx.stroke();
    const gl = R(E, 2.6, -1.8); ctx.beginPath(); ctx.arc(gl[0], gl[1], 1.05 * sc * er, 0, TAU); ctx.fillStyle = "rgba(255,250,235,.95)"; ctx.fill();
    if (exp.wet) { ctx.beginPath(); const w0 = R(E, -3.5, 2.6), w1 = R(E, 3.5, 2.0); ctx.moveTo(...w0); ctx.lineTo(...w1); ctx.strokeStyle = `rgba(200,230,255,${.7 * exp.wet})`; ctx.lineWidth = 1.2 * sc; ctx.stroke(); }
  }
  // nostril
  { const n = ft.nose; ctx.beginPath(); const p0 = R(n, -2.5, -.5), p1 = R(n, -.5, 1.5); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.strokeStyle = rgba(ink, .4); ctx.lineWidth = 1.3 * sc; ctx.stroke(); }
  // mouth: the corner and the line of the lips carry the mood
  const mc = { smile: -2.4, grin: -3.2, sad: 2.2, flat: 0, open: 0, soft: -1.2 }[exp.mouth] ?? -.5, M = ft.mouth;
  ctx.beginPath(); { const p0 = R(M, -5.5, mc * .55), p1 = R(M, -2.4, .7 - mc * .12), p2 = R(M, 1.2, 0); ctx.moveTo(...p0); ctx.quadraticCurveTo(...p1, ...p2); }
  ctx.strokeStyle = rgba(ink, .8); ctx.lineWidth = 1.7 * sc; ctx.stroke();
  if (exp.mouth === "open" || exp.mouth === "grin") { const c = R(M, -1.5, 1.6); ctx.beginPath(); ctx.ellipse(c[0], c[1], 2.6 * sc, (exp.mouth === "open" ? 3 : 1.7) * sc, tilt, 0, TAU); ctx.fillStyle = "rgba(58,18,14,.9)"; ctx.fill(); }
  if (look.mustache) { ctx.beginPath(); const p0 = R(M, -6, -3.6), p1 = R(M, -1, -5.6), p2 = R(M, 2.2, -3.4); ctx.moveTo(...p0); ctx.quadraticCurveTo(...p1, ...p2); ctx.lineTo(...R(M, -1, -2.6)); ctx.closePath(); ctx.fillStyle = rgba(look.hairCol, .95); ctx.fill(); }
  if (look.glasses) { const g = R(E, 1.5, .2); ctx.beginPath(); ctx.ellipse(g[0], g[1], 1.6 * sc, 6.2 * sc, tilt, 0, TAU); ctx.strokeStyle = rgba("#2A2622", .95); ctx.lineWidth = 1.6 * sc; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(...R(E, 0, -3.5)); ctx.lineTo(...R(ft.ear, 2, -3)); ctx.stroke(); ctx.fillStyle = "rgba(255,240,210,.22)"; ctx.beginPath(); ctx.ellipse(g[0], g[1], 1.4 * sc, 6 * sc, tilt, 0, TAU); ctx.fill(); }
  if (exp.blush) { const c = ft.cheek, g2 = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], 9 * sc); g2.addColorStop(0, `rgba(235,105,95,${.42 * exp.blush})`); g2.addColorStop(1, "rgba(235,105,95,0)"); ctx.fillStyle = g2; ctx.fillRect(c[0] - 10 * sc, c[1] - 10 * sc, 20 * sc, 20 * sc); }
  if (exp.tears) { const ph = (t * .7) % 1, a0 = R(E, -1, 3); ctx.beginPath(); ctx.moveTo(...a0); ctx.quadraticCurveTo(...R(E, -2.5, 9), ...R(E, -1.5, 6 + ph * 14)); ctx.strokeStyle = `rgba(190,225,255,${.8 * exp.tears})`; ctx.lineWidth = 1.8 * sc; ctx.stroke(); }
  ctx.restore();
}

// ------------------------------------------------------------------ the people (true colours)
export const LOOKS = {
  boy:    { hair: "boy", hairCol: "#1C1412", skin: "#8C5B40", bare: true, top: { kind: "tee", col: "#D49A3A", sleeve: .45, hem: -.12, loose: 1.12 }, bottom: { kind: "shorts", col: "#2E3B5E", hem: .42, loose: 1.18 } },
  mother: { sex: "f", hair: "mother", hairCol: "#151011", skin: "#8E5E45", shoe: "#5A3A2C", age: 38, build: { h: .95, w: .92, curve: { chF: 1.05, hiB: 1.1, waF: .9 } },
            top: { kind: "blouse", col: "#A63A3A", sleeve: .55, hem: .2, loose: 1.0 }, bottom: { kind: "saree", col: "#7E2030", border: "#D8A648" }, pallu: "#8A2434" },
  father: { hair: "father", hairCol: "#2C2622", skin: "#7C4F37", shoe: "#2A2220", age: 42, glasses: true, mustache: true, build: { h: 1.02, w: 1.08, curve: { waF: 1.25 } },
            top: { kind: "shirt", col: "#7F98B4", sleeve: 1.55, hem: -.12, loose: 1.08 }, bottom: { kind: "pants", col: "#45464E", hem: .98, loose: 1.1 } },
};
