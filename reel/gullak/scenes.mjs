import { SCENES } from "./story.mjs";
import { SCENES_A } from "./scenes_a.mjs";
import { SCENES_B } from "./scenes_b.mjs";
import { SCENES_C } from "./scenes_c.mjs";
import { SCENES_D } from "./scenes_d.mjs";
export const SC = { ...SCENES_A, ...SCENES_B, ...SCENES_C, ...SCENES_D };
for (const k of Object.keys(SCENES)) if (!SC[k]) SC[k] = { draw(ctx, t, lt) { ctx.fillStyle = "#334"; ctx.fillRect(-500, -500, 3000, 2000); ctx.fillStyle = "#fff"; ctx.font = "90px sans-serif"; ctx.fillText(k + " " + lt.toFixed(1), 600, 540); } };
