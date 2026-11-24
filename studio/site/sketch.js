// A4T line studies, drawn in a shuffled sequence.
const palette={fine:'#778174',ink:'#3d4a40',accent:'#526044'};
const study=(title, outlines, details=[])=>({
 title, strokes:[...outlines.map(d=>({d,tone:'ink',width:1.2})),...details.map(d=>({d,tone:'fine',width:.8}))]
});
const studies=[
 study('A front-facing camera beside a studio light', [
  // A front elevation gives the camera body and glass a consistent perspective.
  'M105 185Q105 174 117 174H175L193 151Q197 147 204 147H242Q249 147 253 153L269 174H313Q329 174 329 190V278Q329 293 313 293H120Q105 293 105 278Z',
  'M122 174V166Q122 161 127 161H151Q156 161 156 166V174',
  'M279 174V166Q279 161 285 161H302Q308 161 308 166V174',
  'M105 205H167M277 205H329M105 272H175M269 272H329',
  'M125 208Q118 208 118 219V263M125 216V260',
  'M198 163H242L249 173H192Z',
  'M310 190a4 4 0 1 1 -8 0a4 4 0 1 1 8 0',
  // Concentric circles keep the lens round and centred on its mount.
  'M279 232a57 57 0 1 1 -114 0a57 57 0 1 1 114 0',
  'M272 232a50 50 0 1 1 -100 0a50 50 0 1 1 100 0',
  'M258 232a36 36 0 1 1 -72 0a36 36 0 1 1 72 0',
  'M248 232a26 26 0 1 1 -52 0a26 26 0 1 1 52 0',
  // The softbox sits behind the camera, aimed toward the lens.
  'M361 143L431 116L448 129L415 198L359 178Z',
  'M361 143L415 198M431 116L436 131L411 185L370 173Z',
  'M431 166L442 182L442 280M442 280L417 296M442 280L464 294M442 280V300'
 ], [
  'M350 161L332 170M354 176L336 185M367 187L344 200',
  'M191 223Q196 208 209 202M191 235Q192 226 197 221',
  'M207 234L226 216M216 244L237 224',
  'M228 261Q242 256 249 246',
  'M113 298Q162 307 225 309Q287 309 335 300M130 301L142 305M147 303L161 307M291 305L307 301',
  'M410 303Q437 308 465 300'
 ]),
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
const ink = document.querySelector('#ink');
const title = document.querySelector('#drawing-title');
const toggle = document.querySelector('#sketch-toggle');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const drawingTime = 8800;
const cameraDrawingTime = 12800;
const holdTime = 3800;
const fadeTime = 650;
// Open with the complete camera composition, then vary the order of the other studies.
const [camera, ...sequence] = studies;
for (let index = sequence.length - 1; index > 0; index--) {
 const other = Math.floor(Math.random() * (index + 1));
 [sequence[index], sequence[other]] = [sequence[other], sequence[index]];
}

sequence.unshift(camera);

let current = 0;
let studyTime = drawingTime;
let strokes = [];
let elapsed = 0;
let previousTime;
let frame;
let inView = false;
let paused = false;

function renderStudy() {
 const study = sequence[current];
 studyTime = study === camera ? cameraDrawingTime : drawingTime;
 title.textContent = study.title;
 const paths = study.strokes.flatMap(({d,tone,width}) => d.split(/(?=[Mm])/).map(segment => {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const attributes = {d:segment,stroke:palette[tone],'stroke-width':width,'stroke-linecap':'round','stroke-linejoin':'round'};
  for (const [name,value] of Object.entries(attributes)) path.setAttribute(name,value);
  return path;
 }));
 ink.replaceChildren(...paths);
 const lengths = paths.map(path => Math.max(1, path.getTotalLength()));
 const totalLength = lengths.reduce((sum,length) => sum + length, 0);
 let start = 0;
 strokes = paths.map((path,index) => {
  const duration = lengths[index] / totalLength * studyTime;
  const stroke = {path,length:lengths[index] + 1,start,duration,progress:null};
  start += duration;
  return stroke;
 });
}

function paint(time) {
 for (const stroke of strokes) {
  const progress = time >= studyTime ? 1 : Math.max(0, Math.min(1, (time - stroke.start) / stroke.duration));
  if (progress === stroke.progress) continue;
  stroke.progress = progress;
  if (progress === 1) {
   stroke.path.removeAttribute('stroke-dasharray');
   stroke.path.removeAttribute('stroke-dashoffset');
  } else {
   stroke.path.setAttribute('stroke-dasharray', stroke.length);
   stroke.path.setAttribute('stroke-dashoffset', stroke.length * (1 - progress));
  }
 }
 ink.setAttribute('opacity', 1 - Math.max(0, time - studyTime - holdTime) / fadeTime);
}

function advance(now) {
 frame = undefined;
 if (previousTime !== undefined) elapsed += Math.min(now - previousTime, 64);
 previousTime = now;
 if (elapsed >= studyTime + holdTime + fadeTime) {
  elapsed = 0;
  current = (current + 1) % sequence.length;
  renderStudy();
 }
 paint(elapsed);
 frame = requestAnimationFrame(advance);
}

function updatePlayback() {
 toggle.hidden = motion.matches;
 toggle.setAttribute('aria-label', paused ? 'Resume drawing' : 'Pause drawing');
 toggle.dataset.paused = String(paused);
 if (!motion.matches && !paused && inView && !document.hidden) {
  if (frame === undefined) frame = requestAnimationFrame(advance);
  return;
 }
 cancelAnimationFrame(frame);
 frame = undefined;
 previousTime = undefined;
 // Reduced motion shows a finished study without cycling.
 if (motion.matches) paint(studyTime);
}

renderStudy();
paint(motion.matches ? studyTime : 0);
updatePlayback();
toggle.addEventListener('click', () => {
 paused = !paused;
 updatePlayback();
});
new IntersectionObserver(([entry]) => {
 inView = entry.intersectionRatio >= .2;
 updatePlayback();
}, {threshold:.2}).observe(ink.ownerSVGElement);
motion.addEventListener('change', updatePlayback);
document.addEventListener('visibilitychange', updatePlayback);
