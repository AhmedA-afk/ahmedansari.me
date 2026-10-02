import { createCanvas, tex } from "./lib.mjs";
import { person, LOOK, dims } from "./person.mjs";
import { bgState } from "./story.mjs";
import fs from "node:fs";
const W=2600,H=700,c=createCanvas(W,H),x=c.getContext("2d");
x.drawImage(tex.paper(W,H),0,0);
const F=[
 ["hero",26,{eyes:"open",mouth:"smile",brows:"neutral"}],
 ["hero",26,{eyes:"happy",mouth:"grin",brows:"raised",blush:1}],
 ["hero",26,{eyes:"sad",mouth:"frown",brows:"sad"}],
 ["hero",26,{eyes:"empty",mouth:"flat",brows:"sad"}],
 ["hero",26,{eyes:"wide",mouth:"o",brows:"worried",sweat:1}],
 ["queen",24,{eyes:"cold",mouth:"flat",brows:"angry"}],
 ["queen",24,{eyes:"cold",mouth:"shout",brows:"angry"}],
 ["girl2",25,{eyes:"happy",mouth:"smile",blush:1}],
 ["friend",24,{eyes:"sad",mouth:"sob",brows:"worried",tears:1}],
 ["manager",45,{eyes:"cold",mouth:"flat",brows:"angry"}],
];
F.forEach(([lk,age,face],i)=>{
  const L=LOOK[lk], d=dims(age,L.scale||{}), s=2.2;
  person(x,130+i*260,260+(d.legLen+d.torso*1.02+d.neck+d.headR*.85)*s,s,L,{age,face},bgState(.6),1.3);
});
fs.writeFileSync("out-faces.png",c.toBuffer("image/png"));
