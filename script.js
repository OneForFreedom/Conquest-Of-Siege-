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
  count: 0,           // soldiers in fleet
  rebirths: 0,        // castles conquered
  soldiersPerSecond: 0,
  itemPrices: items.map(i => i.cost)
};

// DOM elements
const countDisplay = document.getElementById("count");
const rebirthDisplay = document.getElementById("rebirths");
const mpsDisplay = document.getElementById("tps");
const mpcDisplay = document.getElementById("tpc");
const messageBox = document.getElementById("message");
const rebirthButton = document.getElementById("rebirthBtn");

// Threshold for "rebirth" = head to war
function rebirthThreshold(level) {
  return 1000 * Math.pow(10, level);
}

// Update display
function updateGame() {
  countDisplay.textContent = Math.round(gameState.count).toLocaleString();
  rebirthDisplay.textContent = Math.round(gameState.rebirths);
  mpsDisplay.textContent = Math.round(gameState.soldiersPerSecond).toLocaleString();
  mpcDisplay.textContent = Math.round(Math.pow(gameState.rebirths + 1, 2));
  checkRebirthUnlock();
}

// Show "Head to War" button only when threshold met
function checkRebirthUnlock() {
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
    messageBox.textContent = `⚔️ Trained ${items[index].rate} soldiers per second!`;
  } else {
    messageBox.textContent = "Not enough soldiers. Keep training!";
  }
}

// ✅ Auto-updating prices with "swords"
function updatePrices() {
  gameState.itemPrices.forEach((price, i) => {
    document.getElementById("price" + i).textContent = Math.round(price).toLocaleString() + " swords";
  });
}

// Passive gain
function passiveGain() {
  gameState.count += gameState.soldiersPerSecond;
  updateGame();
}

// Save / load
function saveGame() {
  localStorage.setItem("siegeSave", JSON.stringify(gameState));
}

function loadGame() {
  const save = JSON.parse(localStorage.getItem("siegeSave"));
  if (save) {
    gameState = Object.assign(gameState, save);
  }
  updatePrices();
  updateGame();
}

// Reaction Test Logic
rebirthButton.addEventListener("click", startReactionTest);

const reactionTest = document.getElementById("reactionTest");
const reactionMessage = document.getElementById("reactionMessage");
const reactionScreen = document.getElementById("reactionScreen");

function startReactionTest() {
  rebirthButton.style.display = "none";
  reactionTest.style.display = "block";
  reactionMessage.textContent = "Prepare for battle…";

  const delay = Math.random() * 2000 + 1000; // 1-3s

  setTimeout(() => {
    reactionMessage.textContent = "⚡ Strike Now!";
    reactionScreen.style.background = "green";
    const startTime = Date.now();

    function handleClick() {
      const reactionTime = Date.now() - startTime;
      reactionScreen.removeEventListener("click", handleClick);

      if (reactionTime <= 500) {
        reactionMessage.textContent = `Perfect strike! ${reactionTime}ms ✅ Castle conquered.`;
        performRebirth(true);
      } else {
        reactionMessage.textContent = `Too slow! ${reactionTime}ms ❌ Soldiers retreat.`;
        performRebirth(false);
      }

      reactionScreen.style.background = "red";
      rebirthButton.style.display = "inline-block";
    }

    reactionScreen.addEventListener("click", handleClick);
  }, delay);
}

// Rebirth logic
function performRebirth(success = true) {
  if (gameState.count >= rebirthThreshold(gameState.rebirths)) {
    if (success) {
      gameState.rebirths++;
      gameState.count = 0;
      gameState.soldiersPerSecond = 0;
      gameState.itemPrices = items.map(item => item.cost);
      updatePrices();
      updateGame();
      messageBox.textContent = `🏰 Castle conquered! Soldiers per click is now ${Math.round(Math.pow(gameState.rebirths + 1, 2))}.`;
    } else {
      // Failed mini-game: normal rebirth, but no bonus
      gameState.count = 0;
      gameState.soldiersPerSecond = 0;
      gameState.itemPrices = items.map(item => item.cost);
      updatePrices();
      updateGame();
      messageBox.textContent = `❌ Mini-game failed. Normal rebirth, no bonus gained.`;
    }
  }
}

// Intervals
setInterval(passiveGain, 1000);
setInterval(saveGame, 5000);
window.addEventListener("beforeunload", saveGame);

// On load
window.onload = () => {
  loadGame();
  loadTheme();
};
