// story.mjs — the single source of truth for time. Picture and sound both read this.
// Times are seconds. A scene draws coins at EV[name]; the audio synth places a chime at the same instant.
import { clamp, ss, kf } from "./lib.mjs";

export const FPS = 24;
export const W = 1080, H = 1920;                 // the file is always portrait; landscape scenes are the world rolled 90deg CW

// ------------------------------------------------------------------ scenes (start, end)
export const SCENES = {
  room:    [0, 24],      // kid draws the river, rolls to landscape, shows parents
  exam:    [24, 31],
  sports:  [31, 38],
  leave:   [38, 46],     // young adult leaves home
  grind:   [46, 64],     // cobwebs, time-lapse
  mistake: [64, 72],
  friends: [72, 80],
  cry:     [80, 94],
  game:    [94, 108],
  queen:   [108, 120],
  fight:   [120, 130],   // argument
  hammer:  [130, 140],
  kneel:   [140, 152],
  cold:    [152, 168],   // friends try, stone
  turn:    [168, 178],   // people turn away, solitude
  newgirl: [178, 188],
  river:   [188, 200],
  touch:   [200, 208],
  heal:    [208, 220],   // days pass, stone -> clay
  mould:   [220, 228],   // kintsugi
  show:    [228, 238],   // her gullak, coins
  end:     [238, 252],   // side by side, title
};
export const DUR = 252;
export const sceneAt = (t) => Object.entries(SCENES).find(([, [a, b]]) => t >= a && t < b)?.[0] ?? "end";

// ------------------------------------------------------------------ events (coins and the two breaks)
// who: h = hero, q = queen, f = crying friend, g = new girl, p = parents(no state)
// d: change of fill level (+ love in, - love out)
export const EV = {
  // childhood: every kind word is a coin
  mum1:   { t: 23.2, who: "h", d: +.13 },
  exam1:  { t: 28.0, who: "h", d: +.12 },
  exam2:  { t: 29.0, who: "h", d: +.10 },
  race1:  { t: 35.6, who: "h", d: +.12 },
  race2:  { t: 36.6, who: "h", d: +.10 },
  home1:  { t: 41.6, who: "h", d: +.10 },
  home2:  { t: 42.6, who: "h", d: +.10 },
  // the grind: nothing in, nothing out for a long time
  boss1:  { t: 68.0, who: "h", d: -.14, out: true },
  leave1: { t: 76.5, who: "h", d: -.12, out: true },
  give1:  { t: 87.2, who: "h", d: -.13, out: true },     // he lifts one out...
  take1:  { t: 88.4, who: "f", d: +.34 },                // ...and it lands in her gullak
  // the game
  win1:   { t: 101.4, who: "h", d: +.12 },
  win2:   { t: 102.2, who: "h", d: +.12 },
  win3:   { t: 103.0, who: "h", d: +.12 },
  qA:     { t: 111.0, who: "h", d: +.10 },
  qB:     { t: 111.6, who: "q", d: +.12 },
  qC:     { t: 115.2, who: "h", d: +.10 },
  qD:     { t: 116.0, who: "q", d: +.10 },
  slip1:  { t: 122.2, who: "h", d: -.10, out: true },
  slip2:  { t: 123.6, who: "q", d: -.12, out: true },
  slip3:  { t: 125.4, who: "h", d: -.10, out: true },
  slip4:  { t: 126.8, who: "q", d: -.10, out: true },
  // thaw: they pour coins into each other
  pour1:  { t: 232.0, who: "h", d: +.14 },
  pour2:  { t: 233.0, who: "g", d: +.06 },
  pour3:  { t: 234.0, who: "h", d: +.14 },
  pour4:  { t: 235.0, who: "g", d: +.06 },
  pour5:  { t: 236.2, who: "h", d: +.14 },
  pour6:  { t: 237.2, who: "g", d: +.06 },
};
export const T_BREAK_H = 133.2;      // her hammer lands: his gullak shatters
export const T_BREAK_Q = 134.1;      // his slipping hammer lands on hers: it cracks, and breaks 0.25s later
export const T_STONE   = 156.0;      // black takes the empty place and goes cold
export const T_THAW0 = 208.5, T_THAW1 = 218.0, T_SEAMS0 = 222.0, T_SEAMS1 = 226.0;

// fill level of a gullak at time t from its events
const base = { h: 0.03, q: 0.16, f: 0.06, g: 0.88 };
export function level(who, t) {
  let v = base[who] ?? 0;
  for (const e of Object.values(EV)) if (e.who === who) v += e.d * ss(e.t, e.t + .9, t);
  return clamp(v, 0, 1);
}

// ------------------------------------------------------------------ state of each gullak over time
// st: fill (inner light), halo, web (cobweb), crack, stone (0 clay .. 1 stone), lump, kint (gold seams), broken (seconds since shatter, -1 none), hollow
export function heroState(t) {
  const stone = t < T_THAW0 ? 1 : kf([[T_THAW0, 1], [T_THAW1, 0]])(t);
  const appear = t < T_STONE - 1.2 ? 0 : t < T_THAW0 ? kf([[T_STONE - 1.2, 0], [T_STONE + 1.8, 1]])(t) : 1;
  const gone = t >= T_BREAK_H && t < T_STONE - 1.2;
  const fill = level("h", t);
  const born = t >= T_STONE - 1.2;                 // before the break: clay. after the stone arrives: the stone, thawing back to clay
  return {
    who: "h", fill: t >= T_BREAK_H && t < T_THAW0 ? 0 : fill, appear: t >= T_BREAK_H ? appear : 1,
    halo: kf([[0, .25], [24, .5], [46, .55], [94, .6], [128, .5], [T_BREAK_H, .5]])(t),
    web: kf([[46, 0], [54, .5], [63, 1], [64, 1], [67.6, 1]])(t) * (t < 94 ? 1 : 0),
    crack: kf([[121, 0], [T_BREAK_H - .1, .9]])(t) * (t < T_BREAK_H ? 1 : 0),
    stone: t < T_BREAK_H ? 0 : stone, lump: kf([[T_THAW0 + 3, 1], [T_THAW1 + 1, .6], [T_SEAMS0, 0]])(t) * (t >= T_THAW0 ? 1 : 0),
    kint: kf([[T_SEAMS0, 0], [T_SEAMS1, 1]])(t),
    broken: t >= T_BREAK_H && t < T_STONE - 1.2 ? t - T_BREAK_H : -1,
    hollow: gone,
  };
}
const lerpN = (a, b, k) => a + (b - a) * k;
export function queenState(t) {
  return { who: "q", fill: level("q", t), halo: .4, crack: kf([[T_BREAK_Q - .02, 0], [T_BREAK_Q + .12, .95]])(t), broken: t >= T_BREAK_Q + .25 ? t - (T_BREAK_Q + .25) : -1, web: 0, stone: 0, lump: 0, kint: 0, hollow: t >= T_BREAK_Q + .35 };
}
export const friendState = (t) => ({ who: "f", fill: level("f", t), halo: .35 + .4 * ss(88.4, 90, t), web: 0, crack: 0, stone: 0, lump: 0, kint: 0, broken: -1 });
export const girlState = (t) => ({ who: "g", fill: level("g", t), halo: .7, web: 0, crack: 0, stone: 0, lump: 0, kint: 0, broken: -1 });
// background people: every human has one
export const bgState = (fill = .5) => ({ who: "b", fill, halo: .35, web: 0, crack: 0, stone: 0, lump: 0, kint: 0, broken: -1 });

// the colour grade that carries the emotion: [t, saturation, warm tint rgba, darkness]
export const GRADE = [
  [0,   1.05, [255, 214, 150, .10], 0],
  [44,  1.0,  [255, 214, 150, .10], 0],
  [50,  .45,  [170, 175, 170, .16], .05],
  [64,  .55,  [160, 165, 160, .14], .05],
  [80,  .8,   [210, 190, 150, .10], 0],
  [94,  1.15, [60, 70, 200, .16], .10],
  [118, 1.25, [80, 60, 220, .16], .10],
  [124, .8,   [150, 80, 90, .16], .10],
  [T_BREAK_H - .2, .8, [120, 60, 70, .12], .12],
  [T_BREAK_H + .1, .05, [20, 30, 50, .30], .17],
  [152, .06, [30, 40, 60, .30], .16],
  [T_STONE + 6, .06, [30, 40, 60, .30], .16],
  [178, .12, [40, 55, 80, .26], .12],
  [186, .3,  [255, 190, 120, .10], .06],
  [190, .78, [255, 190, 120, .12], .04],
  [200, .85, [255, 190, 120, .12], .03],
  [T_THAW0, .72, [170, 170, 200, .12], .06],
  [T_THAW1, 1.05, [255, 200, 130, .14], 0],
  [226, 1.15, [255, 205, 130, .14], 0],
  [252, 1.2,  [255, 210, 140, .16], 0],
];
export function gradeAt(t) {
  let i = 0; while (i < GRADE.length - 1 && t >= GRADE[i + 1][0]) i++;
  const a = GRADE[i], b = GRADE[Math.min(i + 1, GRADE.length - 1)], k = a === b ? 0 : ss(a[0], b[0], t);
  const m = (x, y) => x + (y - x) * k;
  return { sat: m(a[1], b[1]), tint: a[2].map((v, j) => m(v, b[2][j])), dark: m(a[3], b[3]) };
}

// ------------------------------------------------------------------ helpers shared by scenes and audio
// a coin enters the slot at EV[x].t: the chime and the pulse land there; its flight starts FLIGHT seconds earlier
export const FLIGHT = .8;
export function pulseOf(who, t) {            // 0..1, decays over ~0.7s after any coin enters
  let p = 0;
  for (const e of Object.values(EV)) if (e.who === who && !e.out) { const d = t - e.t; if (d >= 0 && d < .9) p = Math.max(p, Math.exp(-d * 5.5)); }
  return p;
}
export function rattleOf(who, t) {           // a shake after a coin falls out
  let p = 0;
  for (const e of Object.values(EV)) if (e.who === who && e.out) { const d = t - e.t; if (d >= -.25 && d < .8) p = Math.max(p, Math.exp(-Math.max(0, d) * 4) * (d < 0 ? 1 + d * 2 : 1)); }
  return p;
}
