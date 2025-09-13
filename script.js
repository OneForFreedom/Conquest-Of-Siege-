const body = document.body;

// Theme toggle
function toggleTheme() {
  body.classList.toggle("dark-mode");
  localStorage.setItem("theme", body.classList.contains("dark-mode") ? "dark" : "light");
}
function loadTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") body.classList.add("dark-mode");
}

// Siege items
const items = [
  { cost: 100, rate: 1 },
  { cost: 500, rate: 10 },
  { cost: 2500, rate: 50 },
  { cost: 12000, rate: 200 },
  { cost: 60000, rate: 1000 },
  { cost: 300000, rate: 5000 },
  { cost: 1500000, rate: 25000 },
  { cost: 7000000, rate: 100000 }
];

let gameState = {
  count: 0,
  rebirths: 0,
  soldiersPerSecond: 0,
  itemPrices: items.map(i => i.cost)
};

// DOM
const countDisplay = document.getElementById("count");
const rebirthDisplay = document.getElementById("rebirths");
const mpsDisplay = document.getElementById("tps");
const mpcDisplay = document.getElementById("tpc");
const messageBox = document.getElementById("message");
const rebirthButton = document.getElementById("rebirthBtn");

// Threshold
function rebirthThreshold(level) {
  return 1000 * Math.pow(10, level);
}

// Update display
function updateGame() {
  countDisplay.textContent = Math.round(gameState.count).toLocaleString();
  rebirthDisplay.textContent = Math.round(gameState.rebirths);
  mpsDisplay.textContent = Math.round(gameState.soldiersPerSecond).toLocaleString();
  mpcDisplay.textContent = Math.round(Math.pow(gameState.rebirths + 1, 2));
  rebirthButton.style.display = (gameState.count >= rebirthThreshold(gameState.rebirths)) ? "inline-block" : "none";
}

// Click sword
document.getElementById("sword").addEventListener("click", () => {
  const spc = Math.round(Math.pow(gameState.rebirths + 1, 2));
  gameState.count += spc;
  updateGame();
});

// Buy items
function buyItem(index) {
  if (gameState.count >= gameState.itemPrices[index]) {
    gameState.count -= gameState.itemPrices[index];
    gameState.soldiersPerSecond += items[index].rate;
    gameState.itemPrices[index] = Math.floor(gameState.itemPrices[index] * 1.25);
    updateGame();
    updatePrices();
    messageBox.textContent = ⚔ Trained ${items[index].rate} soldiers per second!;
  } else {
    messageBox.textContent = "Not enough soldiers!";
  }
}

// Auto-update prices
function updatePrices() {
  gameState.itemPrices.forEach((price, i) => {
    document.getElementById("price" + i).textContent = Math.round(price).toLocaleString() + " swords";
  });
}

// Passive gain
setInterval(() => {
  gameState.count += gameState.soldiersPerSecond;
  updateGame();
}, 1000);

// Save / Load
function saveGame() { localStorage.setItem("siegeSave", JSON.stringify(gameState)); }
function loadGame() {
  const save = JSON.parse(localStorage.getItem("siegeSave"));
  if (save) gameState = Object.assign(gameState, save);
  updatePrices();
  updateGame();
}
setInterval(saveGame, 5000);
window.addEventListener("beforeunload", saveGame);

// ----- Mini-game overlay rebirth -----
const overlay = document.createElement("div");
overlay.id = "miniGameOverlay";
overlay.style.cssText = "display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:1000;color:#FFDFA0;text-align:center;padding-top:50px;";
overlay.innerHTML = `
  <div id="overlayContent" style="display:inline-block;background:#333;padding:20px;border-radius:12px;">
    <h2>Mini-Game Challenge!</h2>
    <p>Hold SPACE to move the yellow box right, release to move left.<br>Keep the box on the red line to fill the bar before time runs out!</p>
    <button id="startMiniBtn">Start</button>
    <canvas id="gameCanvas" width="800" height="60" style="background:#222;border:2px solid #fff;margin:20px auto;display:block;"></canvas>
    <div id="fillBarContainer" style="width:80%;height:20px;background:#444;margin:10px auto;border-radius:10px;overflow:hidden;">
      <div id="fillBar" style="width:0%;height:100%;background:limegreen;"></div>
    </div>
    <div id="timer" style="font-size:18px;margin-top:10px;">Time left: 30s</div>
    <div id="messageMini" style="margin-top:10px;font-size:18px;"></div>
  </div>
`;
document.body.appendChild(overlay);

const startBtn = document.getElementById("startMiniBtn");
const miniCanvas = document.getElementById("gameCanvas");
const ctx = miniCanvas.getContext("2d");
const fillBarEl = document.getElementById("fillBar");
const timerDisplay = document.getElementById("timer");
const messageMini = document.getElementById("messageMini");

let mini = {
  player:{x:400,y:0,width:30,height:miniCanvas.height,speed:0,maxSpeed:6,momentum:0.95},
  line:{x:200,y:miniCanvas.height/2-5,width:100,height:10,speed:0,direction:1,pauseTimer:0},
  fill:50,duration:30,startTime:0,running:false,spaceHeld:false
};

// Show overlay
rebirthButton.addEventListener("click", () => { overlay.style.display="block"; });

// Controls
document.addEventListener("keydown", e => { if(e.code==="Space") mini.spaceHeld=true; });
document.addEventListener("keyup", e => { if(e.code==="Space") mini.spaceHeld=false; });

startBtn.addEventListener("click", () => { startMiniGame(); });

function startMiniGame() {
  mini.fill=50; mini.startTime=Date.now(); mini.running=true; mini.spaceHeld=false;
  messageMini.textContent=""; startBtn.style.display="none";
  gameLoopMini();
}

function updateLineMini() {
  if(mini.line.pauseTimer>0){ mini.line.pauseTimer--; return; }
  if(Math.random()<0.01){ mini.line.pauseTimer=Math.floor(Math.random()*30); return; }
  if(Math.random()<0.02) mini.line.speed=Math.random()*3+1;
  mini.line.x+=mini.line.direction*mini.line.speed;
  if(mini.line.x<0){ mini.line.x=0; mini.line.direction=1; mini.line.speed=Math.random()*3+1; }
  if(mini.line.x+mini.line.width>miniCanvas.width){ mini.line.x=miniCanvas.width-mini.line.width; mini.line.direction=-1; mini.line.speed=Math.random()*3+1; }
}

function updatePlayerMini() {
  mini.player.speed+=mini.spaceHeld?0.5:-0.3;
  if(mini.player.speed>mini.player.maxSpeed) mini.player.speed=mini.player.maxSpeed;
  if(mini.player.speed<-mini.player.maxSpeed) mini.player.speed=-mini.player.maxSpeed;
  mini.player.x+=mini.player.speed*mini.player.momentum;
  if(mini.player.x<0) mini.player.x=0;
  if(mini.player.x+mini.player.width>miniCanvas.width) mini.player.x=miniCanvas.width-mini.player.width;
  mini.player.speed*=0.95;
}

function drawMini() {
  ctx.clearRect(0,0,miniCanvas.width,miniCanvas.height);
  ctx.fillStyle='red'; ctx.fillRect(mini.line.x,mini.line.y,mini.line.width,mini.line.height);
  ctx.fillStyle='rgba(255,255,0,0.5)';
  ctx.fillRect(mini.player.x, mini.player.y, mini.player.width, mini.player.height);
  ctx.strokeStyle='yellow'; ctx.strokeRect(mini.player.x, mini.player.y, mini.player.width, mini.player.height);
}

function updateFillMini() {
  const overlap = Math.max(0, Math.min(mini.player.x+mini.player.width, mini.line.x+mini.line.width)-Math.max(mini.player.x, mini.line.x));
  if(overlap>0) mini.fill+=0.18; else mini.fill-=0.2; // slower fill
  mini.fill=Math.max(0, Math.min(mini.fill,100));
  fillBarEl.style.width=mini.fill+'%';
  if(mini.fill>=100) endMini(true);
  if(mini.fill<=0) endMini(false);
}

function updateTimerMini() {
  const elapsed = Math.floor((Date.now()-mini.startTime)/1000);
  const timeLeft = Math.max(0, mini.duration-elapsed);
  timerDisplay.textContent=Time left: ${timeLeft}s;
  if(timeLeft<=0) endMini(false);
}

function endMini(win) {
  mini.running=false;
  overlay.style.display="none";
  startBtn.style.display="inline-block";
  if(win) {
    messageBox.textContent="🏆 Mini-game success! Multiplier applied!";
    performRebirth(true);
  } else {
    messageBox.textContent="❌ Mini-game failed. Normal rebirth.";
    // Reset soldiers and SPS
    gameState.count = 0;
    gameState.soldiersPerSecond = 0;
    gameState.itemPrices = items.map(item => item.cost);
    updatePrices();
    updateGame();
  }
}

function gameLoopMini() {
  if(!mini.running) return;
  updateLineMini();
  updatePlayerMini();
  drawMini();
  updateFillMini();
  updateTimerMini();
  requestAnimationFrame(gameLoopMini);
}

// On load
window.onload = () => {
  loadGame();
  loadTheme();
  updateGame();
};
