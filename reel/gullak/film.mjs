// film.mjs — harness for "Gullak".  Always a 1080x1920 file; landscape scenes are the world rolled 90deg CW (phone turned CCW).
//   node film.mjs sheet 0,5,10         contact sheet (scaled)           -> out/sheet.png
//   node film.mjs strip 12.0 12        12 consecutive frames            -> out/strip.png
//   node film.mjs render [fps-div]     parallel render                  -> out/picture.mp4
//   node film.mjs cues                 writes cues.json for the audio
import path from "node:path";
import fs from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { createCanvas, tex, clamp, ss, lerp, Image, core } from "./lib.mjs";
import * as story from "./story.mjs";
import { SC } from "./scenes.mjs";
import { PENDING } from "./env.mjs";
const { W, H, FPS, DUR, SCENES, gradeAt } = story;
const OUT = path.resolve("out"); fs.mkdirSync(OUT, { recursive: true });

const S = {};
function makeFinish() {
  const tiles = Array.from({ length: 4 }, (_, i) => { const im = new Image(); const c = core.grainCanvas(256, 90, 101 + i * 7); im.src = c.toBuffer("image/png"); PENDING.push(im); return im; });
  const vc = createCanvas(W, H), vx = vc.getContext("2d"), g = vx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.hypot(W, H) * .55); g.addColorStop(0, "rgba(40,30,20,0)"); g.addColorStop(1, "rgba(40,30,20,.2)"); vx.fillStyle = g; vx.fillRect(0, 0, W, H);
  const vim = new Image(); vim.src = vc.toBuffer("image/png"); PENDING.push(vim); const pats = new WeakMap();
  return (ctx, frame) => {
    ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = .075; const ox = Math.floor(core.hash(frame) * 256), oy = Math.floor(core.hash(frame + 5) * 256), tl = tiles[frame % 4]; for (let gx = -ox; gx < W; gx += 256) for (let gy = -oy; gy < H; gy += 256) ctx.drawImage(tl, gx, gy); ctx.restore();
    ctx.drawImage(vim, 0, 0);
    const f = (core.hash(frame * 1.3) - .5) * 2 * .012; if (f) { ctx.save(); ctx.globalCompositeOperation = f > 0 ? "screen" : "multiply"; ctx.fillStyle = f > 0 ? `rgba(255,250,240,${f})` : `rgba(0,0,0,${-f})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  };
}
let finish = null, tmp = null, tmpx = null;
function setup() {
  if (finish) return;
  for (const k of Object.keys(SCENES)) S[k] = SC[k].build ? SC[k].build() : {};
  finish = makeFinish();
  tmp = createCanvas(W, H); tmpx = tmp.getContext("2d");
}
function scene(ctx, key, t) {
  const [a] = SCENES[key], lt = t - a, cam = SC[key].cam ? SC[key].cam(lt, t) : { x: 960, y: 540, z: 1, phi: Math.PI / 2 };
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(cam.phi); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  SC[key].draw(ctx, t, lt, S[key], cam); ctx.restore();
}
const keys = Object.keys(SCENES);
function finishDraw(ctx, i) { ctx.restore(); }
export function draw(ctx, t, i) {
  setup();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#0B0A0D"; ctx.fillRect(0, 0, W, H);
  const key = story.sceneAt(t), idx = keys.indexOf(key), [a] = SCENES[key], fi = SC[key].fi ?? .7;
  if (idx > 0 && t - a < fi && !SC[key].cut) {
    scene(ctx, keys[idx - 1], t);
    tmpx.setTransform(1, 0, 0, 1, 0, 0); tmpx.clearRect(0, 0, W, H); scene(tmpx, key, t);
    const k = ss(0, 1, (t - a) / fi), A = ctx.getImageData(0, 0, W, H), B = tmpx.getImageData(0, 0, W, H), da = A.data, db = B.data; for (let q = 0; q < da.length; q += 4) { da[q] += (db[q] - da[q]) * k; da[q + 1] += (db[q + 1] - da[q + 1]) * k; da[q + 2] += (db[q + 2] - da[q + 2]) * k; } ctx.putImageData(A, 0, 0);
  } else if (process.env.SKIP !== "scene") scene(ctx, key, t);
  // colour grade: the emotion of the whole film lives here
  if (process.env.SKIP === "grade") { return finishDraw(ctx, i); }
  const g = gradeAt(t);
  if (g.sat < 1) { ctx.save(); ctx.globalCompositeOperation = "saturation"; ctx.globalAlpha = clamp(1 - g.sat); ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (g.tint[3] > 0) { ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.globalAlpha = clamp(g.tint[3] * 3); ctx.fillStyle = `rgb(${g.tint[0]},${g.tint[1]},${g.tint[2]})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (g.dark > .01) { ctx.save(); const v = ctx.createRadialGradient(W / 2, H / 2, H * .2, W / 2, H / 2, H * .75); v.addColorStop(0, `rgba(4,6,14,${g.dark * .35})`); v.addColorStop(1, `rgba(4,6,14,${Math.min(.92, g.dark * 1.6)})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (process.env.SKIP !== "finish") finish(ctx, i);
  // open and close in black
  const fin = 1 - ss(0, 1.4, t), fout = ss(DUR - 1.6, DUR, t) * (SC.__fadeOut === false ? 0 : 1);
  if (fin > 0 || fout > 0) { ctx.save(); ctx.fillStyle = `rgba(11,10,13,${Math.max(fin, fout)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  ctx.restore();
}
const cv = createCanvas(W, H), cx = cv.getContext("2d");
const frameCanvas = (i) => { draw(cx, i / FPS, i); return cv; };

setup(); for (let k = 0; k < 4000 && PENDING.some((im) => !im.complete); k++) await new Promise((r) => setTimeout(r, 5));
await new Promise((r) => setTimeout(r, 800));
const [, , mode = "render", a1, a2, a3] = process.argv;
if (mode === "sheet") {
  const ts = a1.split(",").map(Number), sc = Number(a2 || .3), cols = Math.min(ts.length, 8), rows = Math.ceil(ts.length / cols);
  const tw = Math.round(W * sc), th = Math.round(H * sc), c = createCanvas(tw * cols, th * rows), x = c.getContext("2d");
  ts.forEach((t, k) => { frameCanvas(Math.round(t * FPS)); x.drawImage(cv, (k % cols) * tw, Math.floor(k / cols) * th, tw, th); x.fillStyle = "rgba(0,0,0,.65)"; x.fillRect((k % cols) * tw, Math.floor(k / cols) * th, 70, 22); x.fillStyle = "#fff"; x.font = "16px sans-serif"; x.fillText(t.toFixed(1) + "s", (k % cols) * tw + 5, Math.floor(k / cols) * th + 16); });
  fs.writeFileSync(path.join(OUT, a3 || "sheet.png"), c.toBuffer("image/png")); console.log("wrote sheet", ts.length);
} else if (mode === "lsheet") {   // landscape tiles: un-roll the frame (rotate CCW) so we see what the viewer sees
  const ts = a1.split(",").map(Number), sc = Number(a2 || .4), cols = Number(process.env.COLS || 3), tw = Math.round(H * sc), th = Math.round(W * sc), rows = Math.ceil(ts.length / cols), c = createCanvas(tw * cols, th * rows), x = c.getContext("2d");
  ts.forEach((t, k) => { frameCanvas(Math.round(t * FPS)); x.save(); x.translate((k % cols) * tw, Math.floor(k / cols) * th + th); x.rotate(-Math.PI / 2); x.drawImage(cv, 0, 0, W * sc, H * sc); x.restore(); x.fillStyle = "rgba(0,0,0,.65)"; x.fillRect((k % cols) * tw, Math.floor(k / cols) * th, 64, 20); x.fillStyle = "#fff"; x.font = "15px sans-serif"; x.fillText(t.toFixed(1) + "s", (k % cols) * tw + 4, Math.floor(k / cols) * th + 15); });
  fs.writeFileSync(path.join(OUT, a3 || "lsheet.png"), c.toBuffer("image/png")); console.log("wrote lsheet", ts.length);
} else if (mode === "strip") {
  const t0 = Number(a1), n = Number(a2 || 12), sc = .2, tw = Math.round(W * sc), th = Math.round(H * sc), cols = Math.min(n, 8), rows = Math.ceil(n / cols), c = createCanvas(tw * cols, th * rows), x = c.getContext("2d");
  const i0 = Math.round(t0 * FPS); for (let k = 0; k < n; k++) { frameCanvas(i0 + k); x.drawImage(cv, (k % cols) * tw, Math.floor(k / cols) * th, tw, th); }
  fs.writeFileSync(path.join(OUT, "strip.png"), c.toBuffer("image/png")); console.log("wrote strip");
} else if (mode === "seg") {          // render frames [i0, i1) to a segment file
  const i0 = Number(a1), i1 = Number(a2), file = a3;
  const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", String(FPS), "-i", "-", "-c:v", "libx264", "-crf", "17", "-preset", "fast", "-pix_fmt", "yuv420p", file], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = i0; i < i1; i++) { draw(cx, i / FPS, i); const d = cx.getImageData(0, 0, W, H).data; await new Promise((r) => ff.stdin.write(Buffer.from(d.buffer, d.byteOffset, d.byteLength)) ? r() : ff.stdin.once("drain", r)); if ((i - i0) % 4 === 0) { if (global.gc) global.gc(); await new Promise((r) => setImmediate(r)); } if (process.env.MEM && (i - i0) % 24 === 0) console.log("rss", i, (process.memoryUsage().rss / 1048576) | 0, "MB"); if ((i - i0) % 240 === 0) console.log(`  seg ${i0}: ${((i - i0) / (i1 - i0) * 100) | 0}%`); }
  ff.stdin.end(); await new Promise((r) => ff.on("close", r));
} else if (mode === "memtest") {
  const i0 = Number(a1), n = Number(a2), withData = a3 === "data";
  for (let i = i0; i < i0 + n; i++) { draw(cx, i / FPS, i); if (withData) cx.getImageData(0, 0, W, H); if (i % 4 === 0) { global.gc(); await new Promise((r) => setImmediate(r)); } if ((i - i0) % 24 === 0) console.log("rss", i, (process.memoryUsage().rss / 1048576) | 0); }
} else if (mode === "render") {
  const N = Math.round(DUR * FPS), P = Number(a1 || 4), per = Math.ceil(N / P), segs = [], procs = [];
  fs.mkdirSync(path.join(OUT, "seg"), { recursive: true });
  for (let p = 0; p < P; p++) { const i0 = p * per, i1 = Math.min(N, i0 + per); if (i0 >= i1) break; const f = path.join(OUT, "seg", `s${p}.mp4`); segs.push(f);
    procs.push(new Promise((res) => spawn("node", ["--expose-gc", "--max-old-space-size=1500", process.argv[1], "seg", String(i0), String(i1), f], { stdio: "inherit", env: process.env }).on("close", res))); }
  await Promise.all(procs);
  fs.writeFileSync(path.join(OUT, "seg", "list.txt"), segs.map((f) => `file '${f}'`).join("\n"));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", path.join(OUT, "seg", "list.txt"), "-c", "copy", path.join(OUT, "picture.mp4")]);
  console.log("rendered out/picture.mp4");
} else if (mode === "cues") {
  const cues = { events: story.EV, T_BREAK_H: story.T_BREAK_H, T_BREAK_Q: story.T_BREAK_Q, T_STONE: story.T_STONE, T_THAW0: story.T_THAW0, T_THAW1: story.T_THAW1, T_SEAMS0: story.T_SEAMS0, scenes: story.SCENES, dur: DUR, extra: SC.__cues || [] };
  fs.writeFileSync("cues.json", JSON.stringify(cues, null, 1)); console.log("wrote cues.json");
}
