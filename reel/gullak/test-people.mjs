import { createCanvas, tex } from "./lib.mjs";
import { person, LOOK, dims, gait, armsUp } from "./person.mjs";
import { bgState, heroState } from "./story.mjs";
import fs from "node:fs";
const W=2400,H=1000,c=createCanvas(W,H),x=c.getContext("2d");
x.drawImage(tex.paper(W,H),0,0);
const st=(f)=>({...bgState(f)});
const faces=[
 ["hero",6,{eyes:"open",mouth:"smile",brows:"neutral"}, st(.1)],
 ["hero",10,{eyes:"happy",mouth:"grin",brows:"raised",blush:1}, st(.4)],
 ["hero",26,{eyes:"sad",mouth:"frown",brows:"sad"}, st(.3)],
 ["hero",26,{eyes:"empty",mouth:"flat",brows:"sad"}, {...bgState(0),hollow:true}],
 ["queen",24,{eyes:"cold",mouth:"flat",brows:"angry"}, {...st(.5),tint:"queen"}],
 ["girl2",25,{eyes:"happy",mouth:"smile",brows:"neutral",blush:1}, {...st(.9)}],
 ["friend",24,{eyes:"sad",mouth:"sob",brows:"worried",tears:1}, st(.05)],
 ["father",40,{eyes:"open",mouth:"smile"}, st(.8)],
 ["mother",38,{eyes:"happy",mouth:"smile"}, st(.8)],
 ["manager",45,{eyes:"cold",mouth:"flat",brows:"angry"}, st(.4)],
];
faces.forEach(([lk,age,face,state],i)=>{
  const L=LOOK[lk], d=dims(age,L.scale||{});
  person(x,130+i*235,900,.75,L,{age,face,...(i==1?{...armsUp(d)}:{})},state,1.3);
});
fs.writeFileSync("out-people.png",c.toBuffer("image/png"));
