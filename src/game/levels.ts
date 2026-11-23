export type Point={x:number;y:number}
export type Level={name:string;blurb:string;cols:number;rows:number;start:Point;goal:Point;flowers:Point[];rocks:Point[];water:Point[];spiders:Point[];gate?:Point;sequence?:string[]}
export const levels:Level[]=[
 {name:'The Green Garden',blurb:'Three flowers and a little walk home.',cols:7,rows:6,start:{x:0,y:5},goal:{x:6,y:0},flowers:[{x:1,y:4},{x:3,y:3},{x:5,y:1}],rocks:[],water:[],spiders:[]},
 {name:'The Flower Path',blurb:'Wiggle around the sleepy stones.',cols:7,rows:6,start:{x:0,y:5},goal:{x:6,y:0},flowers:[{x:1,y:5},{x:3,y:3},{x:5,y:1}],rocks:[{x:2,y:5},{x:2,y:4},{x:4,y:2},{x:4,y:1}],water:[{x:1,y:2},{x:2,y:2},{x:3,y:2}],spiders:[],gate:{x:5,y:0}},
 {name:'The Spider’s Garden',blurb:'Mind the little web wanderers.',cols:7,rows:6,start:{x:0,y:5},goal:{x:6,y:0},flowers:[{x:1,y:4},{x:4,y:4},{x:5,y:1}],rocks:[{x:2,y:5},{x:3,y:1}],water:[{x:2,y:2},{x:3,y:2}],spiders:[{x:3,y:4},{x:5,y:3}]},
 {name:'The Hidden Flowers',blurb:'Follow the petals in the right order.',cols:7,rows:6,start:{x:0,y:5},goal:{x:6,y:0},flowers:[{x:1,y:5},{x:5,y:4},{x:3,y:1}],rocks:[{x:2,y:4},{x:2,y:3},{x:4,y:3},{x:4,y:2}],water:[{x:1,y:2},{x:2,y:2},{x:3,y:2}],spiders:[{x:5,y:2}],sequence:['1,5','5,4','3,1']},
 {name:'Home Sweet Home',blurb:'One last flight to the hive.',cols:8,rows:6,start:{x:0,y:5},goal:{x:7,y:0},flowers:[{x:1,y:5},{x:3,y:4},{x:5,y:3},{x:6,y:1}],rocks:[{x:2,y:5},{x:2,y:4},{x:4,y:2},{x:5,y:2},{x:6,y:4}],water:[{x:1,y:2},{x:2,y:2},{x:3,y:2},{x:4,y:2}],spiders:[{x:4,y:4},{x:6,y:3}],gate:{x:7,y:1}}
]
