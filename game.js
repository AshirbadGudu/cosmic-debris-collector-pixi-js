import * as PIXI from "pixi.js";

// Game state
let score = 0;
let timeLeft = 60;
let gameOver = false;
let debrisArray = [];
let spaceship;

// Initialize PixiJS Application
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x000000,
  resizeTo: window,
});

// Add the canvas to the DOM
document.getElementById("gameContainer").appendChild(app.view);

// Create spaceship
function createSpaceship() {
  const ship = new PIXI.Graphics();
  ship.beginFill(0xffffff);
  ship.moveTo(0, -20);
  ship.lineTo(10, 20);
  ship.lineTo(-10, 20);
  ship.lineTo(0, -20);
  ship.endFill();

  ship.x = app.screen.width / 2;
  ship.y = app.screen.height / 2;
  ship.pivot.x = 0;
  ship.pivot.y = 0;

  return ship;
}

// Create debris function
function createDebris() {
  const shape = Math.floor(Math.random() * 3);
  const size = Math.random() * 30 + 10;
  const x = app.screen.width + size;
  const y = Math.random() * app.screen.height;
  const speed = Math.random() * 2 + 1;

  const debris = new PIXI.Graphics();

  switch (shape) {
    case 0:
      debris.beginFill(0xffa500);
      debris.drawCircle(0, 0, size / 2);
      break;
    case 1:
      debris.beginFill(0x00ff00);
      debris.drawRect(-size / 2, -size / 2, size, size);
      break;
    case 2:
      debris.beginFill(0x0000ff);
      debris.drawPolygon([
        0,
        -size / 2,
        size / 2,
        size / 2,
        -size / 2,
        size / 2,
      ]);
      break;
  }

  debris.endFill();
  debris.x = x;
  debris.y = y;
  debris.vx = -speed;
  debris.vy = (Math.random() - 0.5) * speed;

  return debris;
}

// Initialize game
function initGame() {
  // Create and add spaceship
  spaceship = createSpaceship();
  app.stage.addChild(spaceship);

  // Set up keyboard controls
  const keys = {};
  window.addEventListener("keydown", (e) => (keys[e.key] = true));
  window.addEventListener("keyup", (e) => (keys[e.key] = false));

  // Game loop
  app.ticker.add(() => {
    if (gameOver) return;

    // Move spaceship
    if (keys["ArrowLeft"]) spaceship.x -= 5;
    if (keys["ArrowRight"]) spaceship.x += 5;
    if (keys["ArrowUp"]) spaceship.y -= 5;
    if (keys["ArrowDown"]) spaceship.y += 5;

    // Keep spaceship in bounds
    spaceship.x = Math.max(20, Math.min(app.screen.width - 20, spaceship.x));
    spaceship.y = Math.max(20, Math.min(app.screen.height - 20, spaceship.y));

    // Generate new debris
    if (Math.random() < 0.02 && debrisArray.length < 20) {
      const newDebris = createDebris();
      debrisArray.push(newDebris);
      app.stage.addChild(newDebris);
    }

    // Update debris positions and check collisions
    for (let i = debrisArray.length - 1; i >= 0; i--) {
      const debris = debrisArray[i];
      debris.x += debris.vx;
      debris.y += debris.vy;

      // Check collision
      const dx = debris.x - spaceship.x;
      const dy = debris.y - spaceship.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 30) {
        // Collision detected
        app.stage.removeChild(debris);
        debrisArray.splice(i, 1);
        score += 10;
        document.getElementById("scoreValue").textContent = score;
      } else if (debris.x < -50) {
        // Remove debris that's gone off screen
        app.stage.removeChild(debris);
        debrisArray.splice(i, 1);
      }
    }
  });

  // Start timer
  const timerInterval = setInterval(() => {
    if (gameOver) {
      clearInterval(timerInterval);
      return;
    }

    timeLeft--;
    document.getElementById("timeValue").textContent = timeLeft;

    if (timeLeft <= 0) {
      gameOver = true;
      showGameOver();
    }
  }, 1000);
}

// Show game over screen
function showGameOver() {
  const gameOverText = new PIXI.Text("Game Over!\nFinal Score: " + score, {
    fontFamily: "Arial",
    fontSize: 48,
    fill: 0xffffff,
    align: "center",
  });

  gameOverText.x = app.screen.width / 2;
  gameOverText.y = app.screen.height / 2;
  gameOverText.anchor.set(0.5);

  app.stage.addChild(gameOverText);
}

// Start the game
initGame();
