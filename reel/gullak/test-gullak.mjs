import { createCanvas, tex } from "./lib.mjs";
import { gullak, coin, coinSpray } from "./art.mjs";
import fs from "node:fs";
const W=1800,H=900,c=createCanvas(W,H),x=c.getContext("2d");
x.drawImage(tex.paper(W,H),0,0);
const S=[
 {fill:.05,halo:.3},{fill:.5,halo:.5},{fill:.95,halo:.7,pulse:.4},{fill:.1,web:1},{fill:.4,crack:.9},
 {stone:1,fill:0},{stone:.5,lump:1,fill:0},{fill:.8,kint:1},{broken:.18,seed:1},{broken:.7},{broken:1.6},{fill:.6,tint:"queen"}];
S.forEach((st,i)=>{const cx=150+(i%6)*300, cy=250+Math.floor(i/6)*420; gullak(x,cx,cy,90,{floor:130,...st},2.0);});
fs.writeFileSync("out-test.png",c.toBuffer("image/png"));
