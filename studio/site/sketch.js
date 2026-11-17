// A4T line studies. Choose once per visit and leave the finished drawing still.
const palette={fine:'#778174',ink:'#3d4a40',accent:'#526044'};
const angle=Math.random()-.5;
const point=(x,y,z)=>[276+x*.95-y*(.65+angle*.12),222+x*(.28+angle*.08)+y*.38-z];
const line=(points)=>points.map(([x,y],i)=>(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2)).join('');
const segment=(a,b)=>line([a,b]);
const sampled=(f,n=52)=>line(Array.from({length:n+1},(_,i)=>f(i/n)));
function compose(){
 const out=[];
 const add=(d,tone='ink',width=1)=>out.push({d,tone,width});
 const edge=(a,b,tone,width)=>add(segment(point(...a),point(...b)),tone,width);
  const ring=(x,r,a,b,tone,width)=>add(sampled(t=>{const theta=a+(b-a)*t;return point(x,Math.cos(theta)*r,Math.sin(theta)*r+10);}),tone,width);
  const full=(x,r,tone,width)=>ring(x,r,0,Math.PI*2,tone,width);
  const half=(x,r,tone,width)=>ring(x,r,Math.PI/2,3*Math.PI/2,tone,width);
  for(const [x,r] of [[-115,60],[-107,63],[-91,63],[-86,60],[-55,57],[-24,57],[-18,53],[20,53],[34,48],[84,48],[91,44]])half(x,r,'fine',.8);
  for(const a of [-Math.PI/2,Math.PI/2]){
   const z=r=>Math.sin(a)*r+10;
   add(line([[-115,60],[-107,63],[-91,63],[-86,60],[-55,57],[-24,57],[-18,53],[20,53],[34,48],[84,48],[91,44]].map(([x,r])=>point(x,0,z(r)))),'ink',1.2);
  }
  for(const r of [44,40,36,33,24,18])full(91,r,r===40?'accent':'ink',r===44?1.8:.85);
  for(const [lo,hi,r] of [[-83,-58,59],[-17,17,53],[37,80,48]]){
   for(let n=0;n<20;n++){const a=Math.PI*n/19+Math.PI/2,y=Math.cos(a)*r,z=Math.sin(a)*r+10;edge([lo,y,z],[hi,y,z],'fine',.55);}
  }
  ring(92,19,-2.4,-.8,'ink',2);ring(92,26,-2.1,-1.2,'fine',1);
 return out;
}
const study=(title, outlines, details=[])=>({
 title, strokes:[...outlines.map(d=>({d,tone:'ink',width:1.2})),...details.map(d=>({d,tone:'fine',width:.8}))]
});
const studies=[
 {title:'A camera lens in perspective',strokes:compose()},
 study('A heron at the water’s edge',[
  'M144 240C162 226 191 192 214 187C239 180 253 194 273 179C291 166 289 147 307 139C321 133 334 140 339 149L384 158L338 161C325 169 325 180 312 198C294 223 268 237 230 237C201 237 166 244 144 240',
  'M247 235L229 292L210 298M263 232L260 289L276 294',
  'M183 226C212 200 248 201 276 194C261 213 228 226 183 226'
 ],['M319 149a2 2 0 1 0 4 0a2 2 0 1 0-4 0','M199 219Q230 215 249 207','M166 299Q190 295 224 300M240 303Q264 298 302 301M309 288Q328 285 350 287']),
 study('A wind-shaped tree',[
  'M251 299C254 274 266 260 260 237C254 213 232 203 215 190M274 298C268 278 278 256 270 234C267 218 274 204 295 187',
  'M260 239Q242 227 217 225Q186 222 164 203M268 224Q274 198 256 179Q242 167 237 149',
  'M144 199Q122 188 149 174Q139 158 178 153Q180 135 211 142Q234 118 259 135Q281 122 302 142Q340 131 351 153Q388 151 388 174Q418 186 390 200Q372 212 344 204Q317 215 291 204'
 ],['M165 181Q190 166 215 174M224 153Q246 145 264 155M283 169Q308 154 331 165M333 189Q355 179 376 185','M226 302Q262 293 303 304M181 309Q209 305 236 309']),
 study('A quiet beach and headland',[
  'M109 195Q153 184 189 162L222 150L252 168L273 171L308 193',
  'M111 199C175 199 181 216 259 205C313 197 345 188 429 195',
  'M115 291C165 269 182 235 238 228C283 222 325 235 372 251C393 258 412 261 438 259',
  'M125 278C177 255 191 229 240 222C300 216 339 238 384 248'
 ],['M329 168a18 18 0 1 1 36 0','M292 212Q328 207 366 211M343 219Q382 216 411 221','M164 293Q186 284 199 273M208 301Q229 291 251 287','M197 158L218 155L204 175']),
 study('A ceramic vessel with an olive branch',[
  'M214 208Q255 196 299 208Q258 222 214 208Z',
  'M214 208C217 228 202 234 206 260C211 293 235 306 256 306C282 306 306 294 309 259C311 233 300 227 299 208',
  'M258 212Q250 178 280 147Q294 132 319 119'
 ],['M273 159Q253 144 259 128Q274 134 273 159M288 141Q289 119 305 111Q307 128 288 141M298 135Q321 130 331 112Q331 131 298 135','M211 257Q251 277 305 257M214 266Q251 288 302 266','M190 308Q252 299 327 309'])
];
const ink=document.querySelector('#ink');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const chosen=studies[Math.floor(Math.random()*studies.length)];
document.querySelector('#drawing-title').textContent=chosen.title;
const strokes=chosen.strokes.map(({d,tone,width})=>{
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 for(const [key,value] of Object.entries({d,stroke:palette[tone],'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'}))path.setAttribute(key,value);
 return {path,length:0,progress:0};
});
ink.replaceChildren(...strokes.map(s=>s.path));
for(const stroke of strokes)stroke.length=stroke.path.getTotalLength();
let frame=0;
function finish(){
 cancelAnimationFrame(frame);
 for(const {path} of strokes){path.removeAttribute('stroke-dasharray');path.removeAttribute('stroke-dashoffset');}
}
function draw(){
 finish();
 if(motion.matches||document.hidden)return;
 for(const stroke of strokes){
  stroke.progress=0;
  stroke.path.setAttribute('stroke-dasharray',stroke.length+1);
  stroke.path.setAttribute('stroke-dashoffset',stroke.length+1);
 }
 const start=performance.now();
 function tick(now){
  const elapsed=now-start;
  for(const [i,stroke] of strokes.entries()){
   const p=Math.max(0,Math.min(1,(elapsed-i/strokes.length*2100)/760));
   if(stroke.progress===p)continue;
   stroke.progress=p;
   stroke.path.setAttribute('stroke-dashoffset',(stroke.length+1)*(1-p*p*(3-2*p)));
  }
  if(elapsed<2860)frame=requestAnimationFrame(tick);else finish();
 }
 frame=requestAnimationFrame(tick);
}
// A deep link may land below the hero. Wait until the drawing is in view.
let entered=false, played=false;
const observer=new IntersectionObserver(([entry])=>{
 entered=entry.intersectionRatio>=.2;
 if(!entered && played)finish();
 maybeDraw();
},{threshold:.2});
function maybeDraw(){
 if(played||!entered||motion.matches||document.hidden)return;
 played=true;
 draw();
}
observer.observe(ink.ownerSVGElement);
motion.addEventListener('change',()=>{
 if(motion.matches)finish();
 else maybeDraw();
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)finish();
 else maybeDraw();
});
