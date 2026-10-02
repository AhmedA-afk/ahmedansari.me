// still.mjs — style frame: the mother places the first coin (landscape preview, unrolled)
import { createCanvas, clamp } from "./lib.mjs";
import { figure, POSE, LOOKS, mixPose } from "./shade.mjs";
import { gullak, halo, coin } from "./heart.mjs";
import { initRoom, drawRoom, drawAir, floorShadow } from "./room.mjs";
import { drawing } from "./props.mjs";
import { post } from "./post.mjs";
import { grainTiles } from "./paint.mjs";
const W = 1920, H = 1080, cv = createCanvas(W, H), ctx = cv.getContext("2d");
let T0 = Date.now(); const R = await initRoom(), grain = await grainTiles(); console.log("init", Date.now() - T0);
for (const [name, cam] of [["wide", { x: 60, y: -430, z: .92 }], ["close", { x: 40, y: -360, z: 1.55 }]]) {
const t = 12.7;
T0 = Date.now();
ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
drawRoom(ctx, R, t);
const key = [.78, -.62], base = { key, keyCol: "#FFCB90", rim: .95, dark: .8, amb: .05, shadow: "#120C0E" };
const hf = (fill, pulse = 0) => (c, p, h) => gullak(c, p[0], p[1], h, { fill, pulse });
// father on the divan, newspaper on his lap, smiling
const fPose = POSE.sit(t, 128, { head: .12 });
const Fa = figure(ctx, 760, -40, 1.12, LOOKS.father, fPose, { ...base, heart: .62 }, t, { flip: true, heartFn: hf(.62), face: { mouth: "smile", eye: "soft", brow: "soft" } });
halo(ctx, Fa.heart[0], Fa.heart[1], Fa.potH, { fill: .5 });
// long shadows on the floor
const sil = (fn) => () => fn();
const boyPose = mixPose(POSE.stand(t), POSE.stand(t), 0);
const boyX = -120, momX = 112;
floorShadow(ctx, () => figure(ctx, boyX, 0, 1.36, LOOKS.boy, boyPose, base, t, { age: 6, sil: "#0A0405" }), boyX, .35, .7);
floorShadow(ctx, () => figure(ctx, momX, 0, 1.3, LOOKS.mother, POSE.genuflect(t), base, t, { flip: true, sil: "#0A0405" }), momX, .35, .7);
// the boy: holding his drawing down at his side, looking up at her
const momHeart = [momX - 22, -305];
const Boy = figure(ctx, boyX, 0, 1.36, LOOKS.boy, boyPose, { ...base, heart: .45, ext: [{ p: momHeart, r: 420, a: .55 }] }, t, { age: 6, heartFn: hf(.45, .5), face: { mouth: "grin", eye: "wide", look: .5, blush: .5 }, curl: [.6, .8] });
// the mother kneels and gives the first coin, from her heart into his
const target = [Boy.slot[0] + 4, Boy.slot[1] - 6];
const Mo = figure(ctx, momX, 0, 1.3, LOOKS.mother, mixPose(POSE.genuflect(t), { ...POSE.genuflect(t), head: .42 }, 1), { ...base, heart: .85 }, t, { flip: true, heartFn: hf(.85), reach: [target, null], curl: [.65, .3], face: { mouth: "smile", eye: "soft", brow: "soft" } });
halo(ctx, Mo.heart[0], Mo.heart[1], Mo.potH, { fill: .85 });
halo(ctx, Boy.heart[0], Boy.heart[1], Boy.potH, { fill: .45, pulse: .5 });
coin(ctx, target[0], target[1] - 2, 7, { spin: 1.25, glow: 1.2 });
// the drawing in his far hand
ctx.save(); ctx.translate(Boy.handF[0] - 4, Boy.handF[1] - 6); ctx.rotate(.1); ctx.scale(.5, 1); drawing(ctx, 150, 100, 1, 0); ctx.restore();
drawAir(ctx, R, t, [cam.x - W / 2 / cam.z, cam.y - H / 2 / cam.z, W / cam.z, H / cam.z]);
ctx.restore();
post(ctx, W, H, { grain: { tiles: grain, i: 3, amt: .08 }, tint: [1.02, 1, .96], shadowTint: [.0, .01, .03] });
console.log("frame", Date.now() - T0);
const fs = await import("node:fs"); fs.writeFileSync(`out/still_${name}.png`, cv.toBuffer("image/png"));
}
