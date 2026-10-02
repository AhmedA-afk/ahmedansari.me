import { createCanvas } from "./lib.mjs";
import { gullak } from "./art.mjs";
import fs from "node:fs";
const S = { normal: { fill: .25, halo: .3 }, glowing: { fill: .9, halo: .8, pulse: .3 }, cobweb: { fill: .2, web: 1 }, cracked: { fill: .4, crack: .9 }, stone: { stone: 1, fill: 0 }, kintsugi: { fill: .85, kint: 1, halo: .6 } };
for (const [k, st] of Object.entries(S)) { const c = createCanvas(1024, 1024), x = c.getContext("2d"); x.fillStyle = "#D9D9D9"; x.fillRect(0, 0, 1024, 1024); gullak(x, 512, 560, 300, { floor: 400, ...st }, 2); await new Promise(r => setTimeout(r, 50)); fs.writeFileSync(`out/refs/gullak_${k}.png`, c.toBuffer("image/png")); }
console.log("ok");
