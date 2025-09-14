const body = document.body;
function toggleTheme() {
  body.classList.toggle("dark-mode");
  localStorage.setItem("theme", body.classList.contains("dark-mode") ? "dark" : "light");
}
function loadTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") body.classList.add("dark-mode");
}


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


const countDisplay = document.getElementById("count");
const rebirthDisplay = document.getElementById("rebirths");
const mpsDisplay = document.getElementById("tps");
const mpcDisplay = document.getElementById("tpc");
const messageBox = document.getElementById("message");
const rebirthButton = document.getElementById("rebirthBtn");


const overlay = document.getElementById("miniGameOverlay");
const startBtn = document.getElementById("startMiniBtn");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const fillBarEl = document.getElementById("fillBar");
const timerDisplay = document.getElementById("timer");
const messageMini = document.getElementById("messageMini");


function updateGame() {
  countDisplay.textContent = Math.round(gameState.count).toLocaleString();
  rebirthDisplay.textContent = gameState.rebirths;
  mpsDisplay.textContent = Math.round(gameState.soldiersPerSecond).toLocaleString();
  mpcDisplay.textContent = Math.round(Math.pow(gameState.rebirths + 1, 2));
  checkRebirthUnlock();
}

function rebirthThreshold(level) { return 1000 * Math.pow(10, level); }
function checkRebirthUnlock() {
  rebirthButton.style.display = (gameState.count >= rebirthThreshold(gameState.rebirths)) ? "inline-block" : "none";
}


function buyItem(index) {
  if (gameState.count >= gameState.itemPrices[index]) {
    gameState.count -= gameState.itemPrices[index];
    gameState.soldiersPerSecond += items[index].rate;
    gameState.itemPrices[index] = Math.floor(gameState.itemPrices[index] * 1.25);
    updateGame();
    updatePrices();
    messageBox.textContent = `⚔️ Trained ${items[index].rate} soldier(s) per second!`;
  } else {
    messageBox.textContent = "Not enough soldiers. Keep training!";
  }
}

function updatePrices() {
  gameState.itemPrices.forEach((price, i) => {
    document.getElementById("price" + i).textContent = Math.round(price).toLocaleString() + " Soldiers";
  });
}

// CLICK SWORD
document.getElementById("sword").addEventListener("click", () => {
  gameState.count += Math.round(Math.pow(gameState.rebirths + 1, 2));
  updateGame();
});

// AUTO INCREMENT SMOOTH
function incrementSmoothly(amountPerSecond) {
    if (amountPerSecond <= 0) return;

    let added = 0;
    const intervalTime = 1000 / amountPerSecond; 
    const interval = setInterval(() => {
        if (added >= amountPerSecond) {
            clearInterval(interval);
            return;
        }
        gameState.count++;
        added++;
        updateGame();
    }, intervalTime);
}


setInterval(() => {
    incrementSmoothly(gameState.soldiersPerSecond);
}, 1000);


function saveGame() { localStorage.setItem("siegeSave", JSON.stringify(gameState)); }

function loadGame() {
  const save = JSON.parse(localStorage.getItem("siegeSave"));
  if (save) gameState = Object.assign(gameState, save);
  updatePrices();
  updateGame();
}

setInterval(saveGame, 5000);
window.addEventListener("beforeunload", saveGame);


let mini = {
  player: { x: 400, y:0, width:30, height:canvas.height, speed:0, maxSpeed:6, momentum:0.95 },
  line: { x:200, y:canvas.height/2-5, width:100, height:10, speed:0, direction:1, pauseTimer:0 },
  fill:50, duration:30, startTime:0, running:false, spaceHeld:false
};


document.addEventListener("keydown", e => { if(e.code==="Space") mini.spaceHeld=true; });
document.addEventListener("keyup", e => { if(e.code==="Space") mini.spaceHeld=false; });


function startMiniGameOverlay() {
  overlay.style.display = "block";
  startBtn.style.display = "inline-block";
}
startBtn.addEventListener("click", startMiniGame);

function startMiniGame() {
  mini.fill = 50;
  mini.startTime = Date.now();
  mini.running = true;
  mini.spaceHeld = false;
  messageMini.textContent = "";
  startBtn.style.display = "none";
  gameLoopMini();
}

function updateLineMini() {
  if(mini.line.pauseTimer>0){ mini.line.pauseTimer--; return; }
  if(Math.random()<0.01){ mini.line.pauseTimer=Math.floor(Math.random()*30); return; }
  if(Math.random()<0.02) mini.line.speed=Math.random()*3+1;
  mini.line.x += mini.line.direction * mini.line.speed;
  if(mini.line.x < 0){ mini.line.x=0; mini.line.direction=1; mini.line.speed=Math.random()*3+1; }
  if(mini.line.x+mini.line.width > canvas.width){ mini.line.x=canvas.width-mini.line.width; mini.line.direction=-1; mini.line.speed=Math.random()*3+1; }
}

function updatePlayerMini() {
  mini.player.speed += mini.spaceHeld ? 0.5 : -0.3;
  if(mini.player.speed>mini.player.maxSpeed) mini.player.speed=mini.player.maxSpeed;
  if(mini.player.speed<-mini.player.maxSpeed) mini.player.speed=-mini.player.maxSpeed;
  mini.player.x += mini.player.speed * mini.player.momentum;
  if(mini.player.x<0) mini.player.x=0;
  if(mini.player.x+mini.player.width>canvas.width) mini.player.x=canvas.width-mini.player.width;
  mini.player.speed *= 0.95;
}

function drawMini() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='red';
  ctx.fillRect(mini.line.x, mini.line.y, mini.line.width, mini.line.height);
  ctx.fillStyle='rgba(255,255,0,0.5)';
  ctx.fillRect(mini.player.x, mini.player.y, mini.player.width, mini.player.height);
  ctx.strokeStyle='yellow';
  ctx.strokeRect(mini.player.x, mini.player.y, mini.player.width, mini.player.height);
}

function updateFillMini() {
  const overlap = Math.max(0, Math.min(mini.player.x+mini.player.width, mini.line.x+mini.line.width)-Math.max(mini.player.x, mini.line.x));
  mini.fill += overlap>0 ? 0.18 : -0.2;  
  mini.fill = Math.max(0, Math.min(100, mini.fill));
  fillBarEl.style.width = mini.fill+'%';
  if(mini.fill>=100) endMini(true);
  if(mini.fill<=0) endMini(false);
}

function updateTimerMini() {
  const elapsed = Math.floor((Date.now()-mini.startTime)/1000);
  const timeLeft = Math.max(0, mini.duration-elapsed);
  timerDisplay.textContent = `Time left: ${timeLeft}s`;
  if(timeLeft<=0) endMini(false);
}

function endMini(win) {
  mini.running = false;
  overlay.style.display = "none";
  startBtn.style.display = "inline-block";

  if (win) {
    messageBox.textContent = "🏆 Your siege was sucessful! Enjoy the bounties!";
    performRebirth(true); 
  } else {
    messageBox.textContent = "❌ Your siege failed. All your solders are held permanently captive. REBUILD YOUR ARMY!";
    
    // Punishment reset
    gameState.count = 0;                   
    gameState.soldiersPerSecond = 0;      
    gameState.itemPrices = items.map(i => i.cost); 

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

function performRebirth(multiplier=false) {
  gameState = {
    count: 0,
    rebirths: gameState.rebirths + 1,  
    soldiersPerSecond: multiplier ? gameState.soldiersPerSecond : 0,
    itemPrices: items.map(i => i.cost) 
  };

  updatePrices();
  updateGame();
  saveGame();
}


function resetAllData() {
  if (confirm("Are you sure? This will erase all saved progress! (You will kill all your solders!)")) {
    localStorage.removeItem("siegeSave");
    localStorage.removeItem("theme");

    gameState = {
      count: 0,
      rebirths: 0,
      soldiersPerSecond: 0,
      itemPrices: items.map(i => i.cost)
    };

    updatePrices();
    updateGame();

    alert("All data has been reset. Rip your army. They lived a good like");
  }
}


window.onload = () => { loadGame(); loadTheme(); updateGame(); };
