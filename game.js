const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const scoreEl = document.querySelector("#score");
const timeEl = document.querySelector("#time");
const levelEl = document.querySelector("#level");
const fuelEl = document.querySelector("#fuel");
const livesEl = document.querySelector("#lives");
const startScreen = document.querySelector("#startScreen");
const gameOverScreen = document.querySelector("#gameOverScreen");
const finalResult = document.querySelector("#finalResult");
const startButton = document.querySelector("#startButton");
const restartButton = document.querySelector("#restartButton");
const levelBanner = document.querySelector("#levelBanner");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const lanes = [108, 200, 292, 384];
const roadLeft = 62;
const roadWidth = 356;
const player = {
  width: 54,
  height: 92,
  lane: 1,
  x: lanes[1],
  y: HEIGHT - 132,
  targetX: lanes[1],
  invincibleUntil: 0,
};

const state = {
  mode: "start",
  score: 0,
  level: 1,
  lives: 3,
  fuel: 100,
  elapsed: 0,
  speed: 270,
  roadOffset: 0,
  obstacleTimer: 0,
  itemTimer: 0,
  lastTime: 0,
  obstacles: [],
  items: [],
  keys: new Set(),
};

const LEVEL_DURATION = 18;
const levels = [
  { name: "City Sprint", speed: 270, grass: "#1f7a49", road: "#242932", line: "#f6d44d", traffic: ["#3ca66f", "#d34c4c", "#4f7fd9"], spawn: 1.12, fuelDrain: 3.8 },
  { name: "Sunset Run", speed: 305, grass: "#a55a2a", road: "#31313a", line: "#ffd365", traffic: ["#ee704f", "#6d7dd8", "#f0bf46"], spawn: 0.94, fuelDrain: 4.2 },
  { name: "Night Highway", speed: 345, grass: "#102f3c", road: "#161c29", line: "#82d8ff", traffic: ["#a65ad1", "#e75c70", "#35b5c7"], spawn: 0.79, fuelDrain: 4.7 },
  { name: "Desert Rush", speed: 390, grass: "#b77932", road: "#3a3430", line: "#fff1a6", traffic: ["#d64b45", "#4187c8", "#e2a33a"], spawn: 0.67, fuelDrain: 5.2 },
  { name: "Final Storm", speed: 440, grass: "#29394c", road: "#1a1e29", line: "#ffffff", traffic: ["#ed4c62", "#7a6be8", "#e6bd39", "#39b98d"], spawn: 0.56, fuelDrain: 5.8 },
];

function activeLevel() {
  return levels[(state.level - 1) % levels.length];
}

function showLevelBanner() {
  const stage = activeLevel();
  levelBanner.innerHTML = `<span>Level ${state.level}</span><strong>${stage.name}</strong>`;
  levelBanner.classList.remove("show");
  void levelBanner.offsetWidth;
  levelBanner.classList.add("show");
}

function resetGame() {
  state.mode = "playing";
  state.score = 0;
  state.level = 1;
  state.lives = 3;
  state.fuel = 100;
  state.elapsed = 0;
  state.speed = 270;
  state.roadOffset = 0;
  state.obstacleTimer = 0.7;
  state.itemTimer = 2.2;
  state.obstacles = [];
  state.items = [];
  player.lane = 1;
  player.x = lanes[1];
  player.targetX = lanes[1];
  player.invincibleUntil = 0;
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  showLevelBanner();
  updateHud();
}

function endGame() {
  state.mode = "over";
  finalResult.textContent = `Score: ${Math.floor(state.score)} | Time: ${Math.floor(state.elapsed)}s | Level: ${state.level}`;
  gameOverScreen.classList.remove("hidden");
}

function updateHud() {
  scoreEl.textContent = Math.floor(state.score);
  timeEl.textContent = `${Math.floor(state.elapsed)}s`;
  levelEl.textContent = state.level;
  fuelEl.textContent = `${Math.max(0, Math.ceil(state.fuel))}%`;
  livesEl.textContent = state.lives;
}

function movePlayer(direction) {
  if (state.mode !== "playing") return;
  player.lane = Math.max(0, Math.min(lanes.length - 1, player.lane + direction));
  player.targetX = lanes[player.lane];
}

function spawnObstacle() {
  const stage = activeLevel();
  const lane = Math.floor(Math.random() * lanes.length);
  state.obstacles.push({
    x: lanes[lane],
    y: -110,
    width: 56,
    height: 90,
    color: stage.traffic[Math.floor(Math.random() * stage.traffic.length)],
    passed: false,
  });
}

function spawnItem() {
  const lane = Math.floor(Math.random() * lanes.length);
  const type = Math.random() > 0.35 ? "coin" : "fuel";
  state.items.push({
    type,
    x: lanes[lane],
    y: -44,
    size: type === "coin" ? 28 : 34,
  });
}
// Check if two rectangles (a and b) are colliding./......................
// git commit 
// git add .
// git commit -m "Add collision detection and game update logic"
// git push
// git add .
// git commit -m "Add collision detection and game update logic"
// // git push

function hit(a, b) {
  return (
    Math.abs(a.x - b.x) < (a.width + b.width) / 2 - 8 &&
    Math.abs(a.y - b.y) < (a.height + b.height) / 2 - 8
  );
}

function update(dt, now) {
  if (state.mode !== "playing") return;

  const previousLevel = state.level;
  state.elapsed += dt;
  state.level = 1 + Math.floor(state.elapsed / LEVEL_DURATION);
  const stage = activeLevel();
  state.speed = stage.speed + Math.floor((state.level - 1) / levels.length) * 42;
  if (state.level !== previousLevel) showLevelBanner();
  state.score += dt * (10 + state.level * 3);
  state.fuel -= dt * (stage.fuelDrain + Math.floor((state.level - 1) / levels.length) * 0.25);
  state.roadOffset = (state.roadOffset + state.speed * dt) % 96;
  player.x += (player.targetX - player.x) * Math.min(1, dt * 13);

  state.obstacleTimer -= dt;
  if (state.obstacleTimer <= 0) {
    spawnObstacle();
    state.obstacleTimer = Math.max(0.38, stage.spawn) + Math.random() * 0.3;
  }

  state.itemTimer -= dt;
  if (state.itemTimer <= 0) {
    spawnItem();
    state.itemTimer = 2.3 + Math.random() * 1.9;
  }

  for (const obstacle of state.obstacles) {
    obstacle.y += state.speed * dt;
    if (!obstacle.passed && obstacle.y > player.y + player.height / 2) {
      obstacle.passed = true;
      state.score += 20;
    }
    if (now > player.invincibleUntil && hit(player, obstacle)) {
      state.lives -= 1;
      player.invincibleUntil = now + 1400;
      obstacle.y = HEIGHT + 200;
      if (state.lives <= 0) endGame();
    }
  }

  for (const item of state.items) {
    item.y += (state.speed + 35) * dt;
    const box = { x: item.x, y: item.y, width: item.size, height: item.size };
    if (hit(player, box)) {
      if (item.type === "coin") state.score += 100;
      if (item.type === "fuel") state.fuel = Math.min(100, state.fuel + 28);
      item.y = HEIGHT + 100;
    }
  }

  state.obstacles = state.obstacles.filter((obstacle) => obstacle.y < HEIGHT + 130);
  state.items = state.items.filter((item) => item.y < HEIGHT + 70);

  if (state.fuel <= 0) endGame();
  updateHud();
}

function drawRoad() {
  const stage = activeLevel();
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = stage.road;
  ctx.fillRect(roadLeft, 0, roadWidth, HEIGHT);

  ctx.fillStyle = "#e5e9f0";
  ctx.fillRect(roadLeft - 7, 0, 7, HEIGHT);
  ctx.fillRect(roadLeft + roadWidth, 0, 7, HEIGHT);

  ctx.strokeStyle = stage.line;
  ctx.lineWidth = 6;
  ctx.setLineDash([44, 52]);
  ctx.lineDashOffset = -state.roadOffset;
  for (let i = 1; i < lanes.length; i += 1) {
    const x = (lanes[i - 1] + lanes[i]) / 2;
    ctx.beginPath();
    ctx.moveTo(x, -96);
    ctx.lineTo(x, HEIGHT + 96);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawCar(x, y, width, height, color, isPlayer = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  roundRect(-width / 2, -height / 2, width, height, 12);
  ctx.fill();

  ctx.fillStyle = isPlayer ? "#82d8ff" : "#111821";
  roundRect(-width / 2 + 9, -height / 2 + 16, width - 18, 24, 7);
  ctx.fill();
  roundRect(-width / 2 + 11, height / 2 - 36, width - 22, 18, 6);
  ctx.fill();

  ctx.fillStyle = "#101217";
  ctx.fillRect(-width / 2 - 5, -height / 2 + 14, 8, 22);
  ctx.fillRect(width / 2 - 3, -height / 2 + 14, 8, 22);
  ctx.fillRect(-width / 2 - 5, height / 2 - 36, 8, 22);
  ctx.fillRect(width / 2 - 3, height / 2 - 36, 8, 22);

  ctx.fillStyle = isPlayer ? "#ffffff" : "#f2f4f8";
  ctx.fillRect(-width / 2 + 10, -height / 2 + 4, 12, 8);
  ctx.fillRect(width / 2 - 22, -height / 2 + 4, 12, 8);
  ctx.restore();
}

function drawItem(item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  if (item.type === "coin") {
    ctx.fillStyle = "#ffd84d";
    ctx.beginPath();
    ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#b98518";
    ctx.lineWidth = 4;
    ctx.stroke();
  } else {
    ctx.fillStyle = "#38c172";
    roundRect(-15, -18, 30, 36, 5);
    ctx.fill();
    ctx.fillStyle = "#f5f7fb";
    ctx.fillRect(-7, -6, 14, 5);
    ctx.fillRect(-3, -10, 6, 14);
  }
  ctx.restore();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function draw() {
  drawRoad();
  for (const item of state.items) drawItem(item);
  for (const obstacle of state.obstacles) drawCar(obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacle.color);

  const flicker = state.mode === "playing" && performance.now() < player.invincibleUntil;
  if (!flicker || Math.floor(performance.now() / 90) % 2 === 0) {
    drawCar(player.x, player.y, player.width, player.height, "#f04e4e", true);
  }

  if (state.mode === "start") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function frame(timestamp) {
  const dt = Math.min(0.033, (timestamp - state.lastTime) / 1000 || 0);
  state.lastTime = timestamp;
  update(dt, timestamp);
  draw();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    event.preventDefault();
    if (!state.keys.has(event.key)) movePlayer(-1);
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    event.preventDefault();
    if (!state.keys.has(event.key)) movePlayer(1);
  }
  if ((event.key === "Enter" || event.key === " ") && state.mode !== "playing") {
    event.preventDefault();
    resetGame();
  }
  state.keys.add(event.key);
});

window.addEventListener("keyup", (event) => {
  state.keys.delete(event.key);
});

startButton.addEventListener("click", resetGame);
restartButton.addEventListener("click", resetGame);

updateHud();
draw();
requestAnimationFrame(frame);
