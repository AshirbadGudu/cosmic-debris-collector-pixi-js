import * as PIXI from "pixi.js";

// Game state
let score = 0;
let timeLeft = 60;
let gameOver = false;
let isPaused = true;
let debrisArray = [];
let spaceship;
let currentDifficulty = "normal";
let uiContainer;

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: {
    spawnRate: 0.01,
    debrisSpeed: 1,
    scoreMultiplier: 1,
    maxDebris: 15,
  },
  normal: {
    spawnRate: 0.02,
    debrisSpeed: 2,
    scoreMultiplier: 2,
    maxDebris: 20,
  },
  hard: {
    spawnRate: 0.03,
    debrisSpeed: 3,
    scoreMultiplier: 3,
    maxDebris: 25,
  },
};

// Initialize PixiJS Application
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x000000,
  resizeTo: window,
});

// Add the canvas to the DOM
document.getElementById("gameContainer").appendChild(app.view);

// Create UI Container
function createUIContainer() {
  const container = new PIXI.Container();

  // Create semi-transparent header background
  const headerBg = new PIXI.Graphics();
  headerBg.beginFill(0x000000, 0.7);
  headerBg.drawRect(0, 0, app.screen.width, 80);
  headerBg.endFill();
  container.addChild(headerBg);

  // Create game title
  const titleText = new PIXI.Text("COSMIC DEBRIS COLLECTOR", {
    fontFamily: "Arial",
    fontSize: 24,
    fontWeight: "bold",
    fill: 0xffffff,
  });
  titleText.x = 20;
  titleText.y = 25;
  container.addChild(titleText);

  // Add current difficulty display
  const difficultyContainer = new PIXI.Container();

  const diffLabel = new PIXI.Text("Current Difficulty:", {
    fontFamily: "Arial",
    fontSize: 16,
    fill: 0xcccccc,
  });
  diffLabel.x = app.screen.width - 600;
  diffLabel.y = 15;

  const diffValue = new PIXI.Text(currentDifficulty.toUpperCase(), {
    fontFamily: "Arial",
    fontSize: 20,
    fontWeight: "bold",
    fill: getDifficultyColor(currentDifficulty),
  });
  diffValue.x = app.screen.width - 460;
  diffValue.y = 13;

  difficultyContainer.addChild(diffLabel);
  difficultyContainer.addChild(diffValue);
  container.addChild(difficultyContainer);

  return container;
}

// Helper function to get difficulty color
function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case "easy":
      return 0x00ff00; // Green
    case "normal":
      return 0xffff00; // Yellow
    case "hard":
      return 0xff0000; // Red
    default:
      return 0xffffff;
  }
}

// Create UI buttons
function createButton(text, x, y, width = 120) {
  const button = new PIXI.Container();

  // Create button background with gradient
  const buttonBg = new PIXI.Graphics();
  buttonBg.lineStyle(2, 0x666666);
  buttonBg.beginFill(0x333333);
  buttonBg.drawRoundedRect(0, 0, width, 40, 8);
  buttonBg.endFill();

  // Add hover effect
  button.on("pointerover", () => {
    buttonBg.tint = 0x444444;
  });
  button.on("pointerout", () => {
    buttonBg.tint = 0xffffff;
  });

  const buttonText = new PIXI.Text(text, {
    fontFamily: "Arial",
    fontSize: 16,
    fontWeight: "bold",
    fill: 0xffffff,
  });
  buttonText.x = width / 2 - buttonText.width / 2;
  buttonText.y = 20 - buttonText.height / 2;

  button.addChild(buttonBg);
  button.addChild(buttonText);
  button.x = x;
  button.y = y;

  button.eventMode = "static";
  button.cursor = "pointer";

  return button;
}

// Create difficulty selector
function createDifficultySelector() {
  const container = new PIXI.Container();

  // Create background for difficulty selector
  const selectorBg = new PIXI.Graphics();
  selectorBg.beginFill(0x000000, 0.7);
  selectorBg.drawRect(0, 0, 400, 60);
  selectorBg.endFill();
  container.addChild(selectorBg);

  // Add "Difficulty:" label
  const label = new PIXI.Text("DIFFICULTY:", {
    fontFamily: "Arial",
    fontSize: 16,
    fontWeight: "bold",
    fill: 0xffffff,
  });
  label.x = 10;
  label.y = 20;
  container.addChild(label);

  const difficulties = ["easy", "normal", "hard"];
  difficulties.forEach((diff, index) => {
    const button = createButton(
      diff.toUpperCase(),
      label.width + 20 + index * 130,
      10
    );
    button.on("pointerdown", () => {
      currentDifficulty = diff;
      updateDifficultyButtons();
    });
    container.addChild(button);
  });

  container.x = app.screen.width / 2 - 200;
  container.y = app.screen.height - 80;

  return container;
}

// Update difficulty buttons appearance
function updateDifficultyButtons() {
  difficultySelector.children.forEach((child) => {
    if (child instanceof PIXI.Container) {
      const buttonBg = child.getChildAt(0);
      const buttonText = child.getChildAt(1);
      if (buttonText.text.toLowerCase() === currentDifficulty) {
        buttonBg.tint = getDifficultyColor(currentDifficulty);
        buttonText.style.fill = 0x000000;
      } else {
        buttonBg.tint = 0xffffff;
        buttonText.style.fill = 0xffffff;
      }
    }
  });

  // Update the difficulty display in header
  updateGameState();
}

// Create score display
function createScoreDisplay() {
  const scoreContainer = new PIXI.Container();

  const scoreText = new PIXI.Text("SCORE:", {
    fontFamily: "Arial",
    fontSize: 20,
    fontWeight: "bold",
    fill: 0xffffff,
  });
  scoreText.x = app.screen.width - 200;
  scoreText.y = 15;

  const scoreValue = new PIXI.Text("0", {
    fontFamily: "Arial",
    fontSize: 24,
    fontWeight: "bold",
    fill: 0x00ff00,
  });
  scoreValue.x = app.screen.width - 100;
  scoreValue.y = 13;

  scoreContainer.addChild(scoreText);
  scoreContainer.addChild(scoreValue);

  return scoreContainer;
}

// Create timer display
function createTimerDisplay() {
  const timerContainer = new PIXI.Container();

  const timerText = new PIXI.Text("TIME:", {
    fontFamily: "Arial",
    fontSize: 20,
    fontWeight: "bold",
    fill: 0xffffff,
  });
  timerText.x = app.screen.width - 400;
  timerText.y = 15;

  const timerValue = new PIXI.Text("60", {
    fontFamily: "Arial",
    fontSize: 24,
    fontWeight: "bold",
    fill: 0xffff00,
  });
  timerValue.x = app.screen.width - 320;
  timerValue.y = 13;

  timerContainer.addChild(timerText);
  timerContainer.addChild(timerValue);

  return timerContainer;
}

// Create game control buttons
const playButton = createButton("PLAY", app.screen.width / 2 - 190, 20);
const pauseButton = createButton("PAUSE", app.screen.width / 2 - 60, 20);
const restartButton = createButton("RESTART", app.screen.width / 2 + 70, 20);
const difficultySelector = createDifficultySelector();

// Create UI elements
uiContainer = createUIContainer();
const scoreDisplay = createScoreDisplay();
const timerDisplay = createTimerDisplay();

// Add all UI elements to the container
uiContainer.addChild(scoreDisplay);
uiContainer.addChild(timerDisplay);
uiContainer.addChild(playButton);
uiContainer.addChild(pauseButton);
uiContainer.addChild(restartButton);

// Add button event listeners
playButton.on("pointerdown", () => {
  if (gameOver) return;
  isPaused = false;
  updateGameState();
});

pauseButton.on("pointerdown", () => {
  if (gameOver) return;
  isPaused = true;
  updateGameState();
});

restartButton.on("pointerdown", () => {
  resetGame();
});

// Add UI to stage
app.stage.addChild(uiContainer);
app.stage.addChild(difficultySelector);

// Update game state visuals
function updateGameState() {
  const playButtonBg = playButton.getChildAt(0);
  const pauseButtonBg = pauseButton.getChildAt(0);

  playButtonBg.tint = isPaused ? 0xffffff : 0x666666;
  pauseButtonBg.tint = isPaused ? 0x666666 : 0xffffff;

  // Update score and timer displays
  const scoreValueText = scoreDisplay.getChildAt(1);
  const timerValueText = timerDisplay.getChildAt(1);

  scoreValueText.text = score.toString();
  timerValueText.text = timeLeft.toString();

  // Update difficulty display
  const difficultyValueText = uiContainer.children[2].getChildAt(1);
  difficultyValueText.text = currentDifficulty.toUpperCase();
  difficultyValueText.style.fill = getDifficultyColor(currentDifficulty);

  // Change timer color based on time remaining
  if (timeLeft <= 10) {
    timerValueText.style.fill = 0xff0000;
  } else if (timeLeft <= 30) {
    timerValueText.style.fill = 0xffa500;
  } else {
    timerValueText.style.fill = 0xffff00;
  }
}

// Reset game function
function resetGame() {
  score = 0;
  timeLeft = 60;
  gameOver = false;
  isPaused = true;

  // Clear existing debris
  debrisArray.forEach((debris) => app.stage.removeChild(debris));
  debrisArray = [];

  // Reset score and timer display
  const existingScoreDisplay = scoreDisplay.getChildAt(1);
  const existingTimerDisplay = timerDisplay.getChildAt(1);
  existingScoreDisplay.text = "0";
  existingTimerDisplay.text = "60";

  // Remove game over text if it exists
  const existingGameOver = app.stage.children.find(
    (child) => child instanceof PIXI.Text
  );
  if (existingGameOver) {
    app.stage.removeChild(existingGameOver);
  }

  // Reset spaceship position
  if (spaceship) {
    spaceship.x = app.screen.width / 2;
    spaceship.y = app.screen.height / 2;
  }

  updateGameState();
}

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
  const speed =
    Math.random() * DIFFICULTY_SETTINGS[currentDifficulty].debrisSpeed + 1;

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
    if (gameOver || isPaused) return;

    // Move spaceship
    if (keys["ArrowLeft"]) spaceship.x -= 5;
    if (keys["ArrowRight"]) spaceship.x += 5;
    if (keys["ArrowUp"]) spaceship.y -= 5;
    if (keys["ArrowDown"]) spaceship.y += 5;

    // Keep spaceship in bounds
    spaceship.x = Math.max(20, Math.min(app.screen.width - 20, spaceship.x));
    spaceship.y = Math.max(20, Math.min(app.screen.height - 20, spaceship.y));

    // Generate new debris based on difficulty
    if (
      Math.random() < DIFFICULTY_SETTINGS[currentDifficulty].spawnRate &&
      debrisArray.length < DIFFICULTY_SETTINGS[currentDifficulty].maxDebris
    ) {
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
        score += 10 * DIFFICULTY_SETTINGS[currentDifficulty].scoreMultiplier;
        const existingScoreValue = scoreDisplay.getChildAt(1);
        existingScoreValue.text = score.toString();
      } else if (debris.x < -50) {
        // Remove debris that's gone off screen
        app.stage.removeChild(debris);
        debrisArray.splice(i, 1);
      }
    }
  });

  // Start timer
  const timerInterval = setInterval(() => {
    if (gameOver || isPaused) return;

    timeLeft--;
    const existingTimerValue = timerDisplay.getChildAt(1);
    existingTimerValue.text = timeLeft.toString();

    if (timeLeft <= 0) {
      gameOver = true;
      showGameOver();
      clearInterval(timerInterval);
    }
  }, 1000);
}

// Show game over screen
function showGameOver() {
  const gameOverContainer = new PIXI.Container();

  // Semi-transparent background
  const overlay = new PIXI.Graphics();
  overlay.beginFill(0x000000, 0.8);
  overlay.drawRect(0, 0, app.screen.width, app.screen.height);
  overlay.endFill();

  const gameOverText = new PIXI.Text("GAME OVER!", {
    fontFamily: "Arial",
    fontSize: 64,
    fontWeight: "bold",
    fill: 0xff0000,
    align: "center",
  });

  const finalScoreText = new PIXI.Text(`Final Score: ${score}`, {
    fontFamily: "Arial",
    fontSize: 48,
    fontWeight: "bold",
    fill: 0xffffff,
    align: "center",
  });

  const difficultyText = new PIXI.Text(
    `Difficulty: ${currentDifficulty.toUpperCase()}`,
    {
      fontFamily: "Arial",
      fontSize: 32,
      fontWeight: "bold",
      fill: 0x00ff00,
      align: "center",
    }
  );

  gameOverText.x = app.screen.width / 2;
  gameOverText.y = app.screen.height / 2 - 100;
  gameOverText.anchor.set(0.5);

  finalScoreText.x = app.screen.width / 2;
  finalScoreText.y = app.screen.height / 2;
  finalScoreText.anchor.set(0.5);

  difficultyText.x = app.screen.width / 2;
  difficultyText.y = app.screen.height / 2 + 80;
  difficultyText.anchor.set(0.5);

  gameOverContainer.addChild(overlay);
  gameOverContainer.addChild(gameOverText);
  gameOverContainer.addChild(finalScoreText);
  gameOverContainer.addChild(difficultyText);

  app.stage.addChild(gameOverContainer);
}

// Start the game
initGame();
updateGameState();
updateDifficultyButtons();

// Remove the HTML elements as we're now using PIXI Text
document.getElementById("score").style.display = "none";
document.getElementById("timer").style.display = "none";
