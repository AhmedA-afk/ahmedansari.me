// common.mjs — helpers every scene uses.
import { core, createCanvas, clamp, lerp, ss, eIO, eOut, eIn, TAU, hash, R } from "./lib.mjs";
import { Pen } from "./pen.mjs";
import { person, dims, gait, armSwing, armsUp, LOOK } from "./person.mjs";
import { flight, dropOut, coin, coinSpray } from "./art.mjs";
import { EV, FLIGHT, pulseOf, rattleOf, heroState, queenState, friendState, girlState, bgState } from "./story.mjs";
export { person, dims, gait, armSwing, armsUp, LOOK, flight, dropOut, coin, coinSpray, EV, FLIGHT, pulseOf, rattleOf, heroState, queenState, friendState, girlState, bgState };

const pens = new WeakMap();
export const penFor = (ctx) => { let p = pens.get(ctx); if (!p) { p = new Pen(ctx); pens.set(ctx, p); } return p; };
export const PHI = Math.PI / 2;
export const cam = (x = 960, y = 540, z = 1, phi = PHI) => ({ x, y, z, phi });
export const U = (a, b, t) => clamp((t - a) / (b - a));       // 0..1 window
export const sm = (a, b, t) => ss(a, b, t);
export const mix = (a, b, k) => a + (b - a) * k;
// state with pulse + rattle for a coin-keeper
export const withFx = (st, who, t) => ({ ...st, pulse: pulseOf(who, t) });
export const rattle = (who, t, amp = 5) => Math.sin(t * 70) * rattleOf(who, t) * amp;
// a person standing on the ground with age/prop defaults; returns anchors
export function stand(ctx, x, y, s, look, age, face, st, t, extra = {}) {
  return person(ctx, x, y, s, look, { age, face, bob: Math.sin(t * 1.8 + x) * 1.2, ...extra }, st, t);
}
// seated pose: pelvis lowered to seatH (px above ground), legs sticking out sideways towards `f`
export function sitPose(age, look, seatH, f = 1, extra = {}) {
  const d = dims(age, look.scale || {}); const crouch = d.legLen - seatH, hipJ = d.hipW * .55;
  return { age, crouch, facing: f, fL: [-hipJ + f * d.thigh * .98, 0], fR: [hipJ + f * d.thigh * .98 - 12, 0], kneeL: [f * .2, -1], kneeR: [f * .2, -1], ...extra };
}

// ------------------------------------------------------------------ more helpers
export const drift = (lt, a, b, dur, ease = eIO) => [mix(a[0], b[0], ease(U(0, dur, lt))), mix(a[1], b[1], ease(U(0, dur, lt))), mix(a[2] ?? 1, b[2] ?? 1, ease(U(0, dur, lt)))];
export const giveCoin = (ctx, t, ev, from, to, o = {}) => flight(ctx, t, EV[ev].t - FLIGHT, FLIGHT, from, to, o);
export const lerp2 = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k)];
// a background person with a faint gullak, cheering, clapping or standing
export function extra(ctx, x, y, s, look, t, o = {}) {
  const d = dims(o.age ?? 30, look.scale || {}), ph = (o.seed ?? 0) * 3 + t * (o.rate ?? 6), mode = o.mode || "stand";
  let pose = { age: o.age ?? 30, face: o.face || { eyes: "happy", mouth: "smile" }, bob: Math.abs(Math.sin(ph)) * (mode === "cheer" ? -10 : 0) };
  if (mode === "cheer") { const k = .7 + .3 * Math.sin(ph * 1.3); Object.assign(pose, { L: [-(d.sh + 26 * k), -d.torso - d.fore * .6 * k], R: [(d.sh + 26 * k), -d.torso - d.fore * .6 * k] }); }
  if (mode === "clap") { const k = Math.abs(Math.sin(ph * 1.5)); Object.assign(pose, { L: [-8 - 14 * k, -d.torso * .55], R: [8 + 14 * k, -d.torso * .55] }); }
  Object.assign(pose, o.pose || {});
  return person(ctx, x, y, s, look, pose, bgState(o.fill ?? .55), t);
}
export const CROWD = ["pal", "mother", "father", "friend", "teacher", "colleague"].map((k) => LOOK[k]);
// a thin outlined bar across the screen: letterbox for the cold
export function seedRand(i) { return R(i, 3); }

// hands that actually meet: target (world) -> hand target in a figure's torso frame
export function toTorso(x, gy, s, age, look, crouch, flip, M, bob = 0) { const d = dims(age, look.scale || {}); const py = gy - (d.legLen - crouch) * s + bob * s; return [(M[0] - x) / (s * (flip ? -1 : 1)), (M[1] - py) / s]; }
// the hero's clothes warm back up as he heals
import { T_THAW1, T_SEAMS1 } from "./story.mjs";
import { mixc } from "./lib.mjs";
export function heroLookAt(t) { const k = clamp((t - T_THAW1) / (T_SEAMS1 + 4 - T_THAW1)), a = LOOK.heroCold, b = LOOK.heroEnd;
  return { ...b, top: mixc(a.top, b.top, k), sleeve: mixc(a.sleeve, b.sleeve, k), pants: mixc(a.pants, b.pants, k), skin: mixc(a.skin, b.skin, k), garment: k > .5 ? "shirt" : a.garment }; }
