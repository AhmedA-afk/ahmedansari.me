// film.mjs — render Arc 1.
//   node film.mjs sheet [t0 t1 n]      contact sheet of n frames (landscape shots unrolled for reading)
//   node film.mjs still t [unroll]     one frame -> out/f_<t>.png
//   node film.mjs render [workers]     the real thing: 1080x1920, 24 fps -> out/arc1_video.mp4
//   node film.mjs seg i0 i1 file       (internal) render frames [i0, i1) to an mp4 segment
import { createCanvas } from "./lib.mjs";
import { init, frame, FPS, DUR } from "./arc1.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const [, , mode = "sheet", ...args] = process.argv;
const OUT = new URL("./out/", import.meta.url).pathname;

if (mode === "still") {
  const A = await init(), t = +args[0], un = args[1] === "unroll", W = un ? 1920 : 1080, H = un ? 1080 : 1920, cv = createCanvas(W, H);
  const t0 = Date.now(); frame(cv.getContext("2d"), A, t, { W, H, unroll: un, i: Math.round(t * FPS) }); console.log("ms", Date.now() - t0);
  fs.writeFileSync(`${OUT}f_${t}.png`, cv.toBuffer("image/png"));
}
if (mode === "sheet") {
  const A = await init(), t0 = +(args[0] ?? 0), t1 = +(args[1] ?? DUR - .05), n = +(args[2] ?? 12), cols = 4, w = 480, h = 270, cv = createCanvas(cols * w, Math.ceil(n / cols) * h), c = cv.getContext("2d");
  const fr = createCanvas(1920, 1080), fc = fr.getContext("2d"), pr = createCanvas(1080, 1920), pc = pr.getContext("2d");
  for (let k = 0; k < n; k++) { const t = n === 1 ? t0 : t0 + (t1 - t0) * k / (n - 1), x = (k % cols) * w, y = Math.floor(k / cols) * h;
    if (t < 8) { frame(pc, A, t, { W: 1080, H: 1920, i: k }); const im = await toImage(pr); c.drawImage(im, x + w / 2 - 76, y, 152, 270); }
    else { frame(fc, A, t, { W: 1920, H: 1080, unroll: true, i: k }); const im = await toImage(fr); c.drawImage(im, x, y, w, h); }
    c.fillStyle = "#fff"; c.font = "16px DejaVu Sans"; c.fillText(t.toFixed(2), x + 6, y + 18); }
  fs.writeFileSync(`${OUT}sheet_${t0}_${t1}.png`, cv.toBuffer("image/png")); console.log("sheet done");
}
async function toImage(cv) { const { decode } = await import("./paint.mjs"); return decode(cv.toBuffer("image/png")); }

if (mode === "seg") {
  const [i0, i1, file] = [+args[0], +args[1], args[2]], A = await init(), W = 1080, H = 1920, cv = createCanvas(W, H), ctx = cv.getContext("2d");
  const ff = spawn("ffmpeg", ["-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", `${FPS}`, "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", file], { stdio: ["pipe", "inherit", "inherit"] });
  for (let i = i0; i < i1; i++) { frame(ctx, A, i / FPS, { W, H, i });
    const buf = Buffer.from(ctx.getImageData(0, 0, W, H).data.buffer); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 12 === 0) { globalThis.gc?.(); await new Promise((r) => setImmediate(r)); process.stdout.write(`${file.split("/").pop()} ${i}/${i1}\n`); } }
  ff.stdin.end(); await new Promise((r) => ff.on("close", r));
}
if (mode === "render") {
  const N = +(args[0] ?? 4), total = Math.round(DUR * FPS), per = Math.ceil(total / N), segs = [];
  const jobs = []; for (let k = 0; k < N; k++) { const i0 = k * per, i1 = Math.min(total, i0 + per), f = `${OUT}seg_${k}.mp4`; segs.push(f);
    jobs.push(new Promise((res, rej) => { const p = spawn("node", ["--expose-gc", "--max-old-space-size=3000", new URL(import.meta.url).pathname, "seg", i0, i1, f], { stdio: ["ignore", "ignore", "inherit"] }); p.on("close", (c) => (c ? rej(new Error("seg " + k + " failed " + c)) : res())); })); }
  const t0 = Date.now(); await Promise.all(jobs); console.log("rendered in", ((Date.now() - t0) / 1000).toFixed(0), "s");
  fs.writeFileSync(`${OUT}segs.txt`, segs.map((f) => `file '${f}'`).join("\n"));
  await new Promise((r) => spawn("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", `${OUT}segs.txt`, "-c", "copy", `${OUT}arc1_video.mp4`], { stdio: "inherit" }).on("close", r));
  console.log("done");
}
