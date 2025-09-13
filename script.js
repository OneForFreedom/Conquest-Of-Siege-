// Theme toggle
const body = document.body;
function toggleTheme() {
  body.classList.toggle("dark-mode");
  localStorage.setItem("theme", body.classList.contains("dark-mode") ? "dark" : "light");
}
function loadTheme() {
  if(localStorage.getItem("theme")==="dark") body.classList.add("dark-mode");
}

// Siege items & game state
const items = [
  { cost:100, rate:1},{cost:500, rate:10},{cost:2500, rate:50},{cost:12000, rate:200},
  {cost:60000, rate:1000},{cost:300000, rate:5000},{cost:1500000, rate:25000},{cost:7000000, rate:100000}
];

let gameState = { count:0, rebirths:0, soldiersPerSecond:0, itemPrices: items.map(i=>i.cost) };

// DOM
const countDisplay=document.getElementById("count");
const rebirthDisplay=document.getElementById("rebirths");
const mpsDisplay=document.getElementById("tps");
const mpcDisplay=document.getElementById("tpc");
const messageBox=document.getElementById("message");
const rebirthButton=document.getElementById("rebirthBtn");

// Update display
function updateGame(){
  countDisplay.textContent=Math.round(gameState.count).toLocaleString();
  rebirthDisplay.textContent=gameState.rebirths;
  mpsDisplay.textContent=Math.round(gameState.soldiersPerSecond).toLocaleString();
  mpcDisplay.textContent=Math.round(Math.pow(gameState.rebirths+1,2));
  rebirthButton.style.display=(gameState.count>=rebirthThreshold(gameState.rebirths))?"inline-block":"none";
}
function rebirthThreshold(level){ return 1000*Math.pow(10,level); }

// Sword click
document.getElementById("sword").addEventListener("click",()=>{ gameState.count+=Math.round(Math.pow(gameState.rebirths+1,2)); updateGame(); });

// Buy item
function buyItem(index){
  if(gameState.count>=gameState.itemPrices[index]){
    gameState.count-=gameState.itemPrices[index];
    gameState.soldiersPerSecond+=items[index].rate;
    gameState.itemPrices[index]=Math.floor(gameState.itemPrices[index]*1.25);
    updatePrices(); updateGame();
    messageBox.textContent=`⚔️ Trained ${items[index].rate} soldiers per second!`;
  }else{ messageBox.textContent="Not enough soldiers!"; }
}
function updatePrices(){ gameState.itemPrices.forEach((p,i)=>{ document.getElementById("price"+i).textContent=p+" swords"; }); }
function passiveGain(){ gameState.count+=gameState.soldiersPerSecond; updateGame(); }

// Save/load
function saveGame(){ localStorage.setItem("siegeSave",JSON.stringify(gameState)); }
function loadGame(){ const save=JSON.parse(localStorage.getItem("siegeSave")); if(save) gameState=Object.assign(gameState,save); updatePrices(); updateGame(); }
setInterval(passiveGain,1000); setInterval(saveGame,5000); window.addEventListener("beforeunload",saveGame);

// Mini-game overlay
const overlay=document.getElementById("miniGameOverlay");
const startBtn=document.getElementById("startMiniBtn");
const canvas=document.getElementById("gameCanvas");
const ctx=canvas.getContext("2d");
const fillBarEl=document.getElementById("fillBar");
const timerEl=document.getElementById("timer");
const messageMini=document.getElementById("messageMini");

let mini={ player:{x:400,y:0,width:30,height:canvas.height,speed:0,momentum:0.95},
           line:{x:200,y:canvas.height/2-5,width:100,height:10,speed:0,direction:1,pause:0},
           fill:50, duration:30, startTime:0, running:false, spaceHeld:false };

function startMiniGameOverlay(){ overlay.style.display="block"; startBtn.style.display="inline-block"; messageMini.textContent=""; }
startBtn.addEventListener("click",()=>{ startMiniGame(); });

document.addEventListener("keydown",e=>{ if(e.code==="Space") mini.spaceHeld=true; });
document.addEventListener("keyup",e=>{ if(e.code==="Space") mini.spaceHeld=false; });

function startMiniGame(){
  mini.fill=50; mini.startTime=Date.now(); mini.running=true; mini.spaceHeld=false;
  startBtn.style.display="none"; messageMini.textContent="";
  gameLoop();
}

function updateLine(){
  if(mini.line.pause>0){ mini.line.pause--; return; }
  if(Math.random()<0.01){ mini.line.pause=Math.floor(Math.random()*30); return; }
  if(Math.random()<0.02) mini.line.speed=Math.random()*3+1;
  mini.line.x+=mini.line.direction*mini.line.speed;
  if(mini.line.x<0){ mini.line.x=0; mini.line.direction=1; mini.line.speed=Math.random()*3+1; }
  if(mini.line.x+mini.line.width>canvas.width){ mini.line.x=canvas.width-mini.line.width; mini.line.direction=-1; mini.line.speed=Math.random()*3+1; }
}

function updatePlayer(){
  mini.player.speed+=mini.spaceHeld?0.5:-0.3;
  if(mini.player.speed>6) mini.player.speed=6;
  if(mini.player.speed<-6) mini.player.speed=-6;
  mini.player.x+=mini.player.speed*mini.player.momentum;
  if(mini.player.x<0) mini.player.x=0;
  if(mini.player.x+mini.player.width>canvas.width) mini.player.x=canvas.width-mini.player.width;
  mini.player.speed*=0.95;
}

function drawMini(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='red'; ctx.fillRect(mini.line.x,mini.line.y,mini.line.width,mini.line.height);
  ctx.fillStyle='rgba(255,255,0,0.5)';
  ctx.fillRect(mini.player.x,mini.player.y,mini.player.width,mini.player.height);
}

function updateFill(){
  const overlap=Math.max(0,Math.min(mini.player.x+mini.player.width,mini.line.x+mini.line.width)-Math.max(mini.player.x,mini.line.x));
  if(overlap>0) mini.fill+=0.18; else mini.fill-=0.2; // slower fill
  if(mini.fill>100) mini.fill=100;
  if(mini.fill<0) mini.fill=0;
  fillBarEl.style.width=mini.fill+'%';
  if(mini.fill>=100) endMini(true);
  if(mini.fill<=0) endMini(false);
}

function updateTimer(){
  const elapsed=Math.floor((Date.now()-mini.startTime)/1000);
  const timeLeft=Math.max(0,mini.duration-elapsed);
  timerEl.textContent=`Time left: ${timeLeft}s`;
  if(timeLeft<=0) endMini(false);
}

function endMini(win){
  mini.running=false; overlay.style.display="none"; startBtn.style.display="inline-block";
  if(win){ messageBox.textContent="🏆 Mini-game success! Multiplier applied!"; performRebirth(true); }
  else{ messageBox.textContent="❌ Mini-game failed. No multiplier."; resetAfterLoss(); }
}

function resetAfterLoss(){
  gameState.soldiersPerSecond=0;
  gameState.count=0;
  gameState.itemPrices=items.map(i=>i.cost);
  updatePrices(); updateGame();
}

function gameLoop(){
  if(!mini.running) return;
  updateLine(); updatePlayer(); drawMini(); updateFill(); updateTimer();
  requestAnimationFrame(gameLoop);
}

// Rebirth
function performRebirth(multiplier=false){
  gameState.count=0; gameState.rebirths++;
  gameState.soldiersPerSecond=0; gameState.itemPrices=items.map(i=>i.cost);
  if(multiplier) gameState.count+=Math.pow(gameState.rebirths+1,2);
  updatePrices(); updateGame();
}

// On load
window.onload=()=>{ loadGame(); loadTheme(); };
