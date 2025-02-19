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

// UI Colors and Style Constants
const UI_COLORS = {
  headerBg: 0x000000,
  panelBg: 0x111111,
  buttonBg: 0x222222,
  buttonHover: 0x333333,
  buttonActive: 0x444444,
  accent1: 0x00ffff, // Cyan
  accent2: 0xff00ff, // Magenta
  textPrimary: 0xffffff,
  textSecondary: 0x888888,
  scoreGreen: 0x00ff88,
  timerYellow: 0xffff00,
  timerOrange: 0xffa500,
  timerRed: 0xff0000,
  overlay: 0x000000,
  difficultyEasy: 0x00ff88,
  difficultyNormal: 0xffff00,
  difficultyHard: 0xff4444,
  glowColor: 0x00ffff,
};

// Helper function to get difficulty color
function getDifficultyColor(difficulty) {
  switch (difficulty) {
    case "easy":
      return UI_COLORS.difficultyEasy;
    case "normal":
      return UI_COLORS.difficultyNormal;
    case "hard":
      return UI_COLORS.difficultyHard;
    default:
      return UI_COLORS.textPrimary;
  }
}

const BUTTON_STYLES = {
  default: {
    fill: UI_COLORS.textPrimary,
    fontSize: 18,
    fontFamily: "Arial",
    fontWeight: "bold",
    dropShadow: true,
    dropShadowColor: UI_COLORS.glowColor,
    dropShadowDistance: 2,
    dropShadowAlpha: 0.5,
  },
  header: {
    fontSize: 42,
    letterSpacing: 4,
    fill: UI_COLORS.accent1,
    dropShadowColor: UI_COLORS.accent1,
    dropShadowDistance: 4,
    dropShadowAlpha: 0.8,
  },
  stats: {
    fontSize: 20,
    fill: UI_COLORS.textSecondary,
  },
  value: {
    fontSize: 36,
    dropShadowDistance: 4,
    dropShadowAlpha: 0.8,
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

  // Create header panel with sci-fi design
  const headerPanel = new PIXI.Graphics();
  headerPanel.beginFill(UI_COLORS.headerBg, 0.9);
  headerPanel.drawRect(0, 0, app.screen.width, 80);

  // Add accent lines
  headerPanel.lineStyle(2, UI_COLORS.accent1);
  headerPanel.moveTo(0, 80);
  headerPanel.lineTo(app.screen.width, 80);

  // Add diagonal accent lines
  headerPanel.lineStyle(1, UI_COLORS.accent1, 0.5);
  for (let x = 0; x < app.screen.width; x += 50) {
    headerPanel.moveTo(x, 0);
    headerPanel.lineTo(x + 30, 80);
  }

  headerPanel.endFill();

  // Add glow filter to header
  const headerGlow = new PIXI.BlurFilter();
  headerGlow.blur = 2;
  headerPanel.filters = [headerGlow];

  container.addChild(headerPanel);

  // Create game title with enhanced sci-fi style
  const titleText = new PIXI.Text("COSMIC DEBRIS", {
    ...BUTTON_STYLES.default,
    ...BUTTON_STYLES.header,
    fontSize: 32,
  });
  titleText.x = 30;
  titleText.y = 25;
  container.addChild(titleText);

  // Create info panel with modern layout
  const infoPanel = createInfoPanel();
  container.addChild(infoPanel);

  return container;
}

// Create info panel with game stats
function createInfoPanel() {
  const panel = new PIXI.Container();

  // Create stats background panels with proper spacing
  const createStatPanel = (x, width = 140, height = 60) => {
    const bg = new PIXI.Graphics();
    bg.beginFill(UI_COLORS.panelBg, 0.6);
    bg.lineStyle(1, UI_COLORS.accent1, 0.5);
    bg.drawRect(0, 0, width, height);
    bg.endFill();
    bg.x = x;
    bg.y = 10;
    return bg;
  };

  // Calculate positions for stats panels
  const rightMargin = 20;
  const panelSpacing = 20;
  let currentX = app.screen.width - rightMargin;

  // Score panel
  currentX -= 140;
  const scorePanel = createStatPanel(currentX);
  panel.addChild(scorePanel);
  const scoreDisplay = createStatsDisplay("SCORE", "0", UI_COLORS.scoreGreen);
  scoreDisplay.x = currentX + 70;
  panel.addChild(scoreDisplay);

  // Timer panel
  currentX -= 140 + panelSpacing;
  const timerPanel = createStatPanel(currentX);
  panel.addChild(timerPanel);
  const timerDisplay = createStatsDisplay("TIME", "60", UI_COLORS.timerYellow);
  timerDisplay.x = currentX + 70;
  panel.addChild(timerDisplay);

  // Difficulty panel
  currentX -= 140 + panelSpacing;
  const diffPanel = createStatPanel(currentX, 160);
  panel.addChild(diffPanel);
  const diffDisplay = createStatsDisplay(
    "DIFFICULTY",
    currentDifficulty.toUpperCase(),
    getDifficultyColor(currentDifficulty)
  );
  diffDisplay.x = currentX + 80;
  panel.addChild(diffDisplay);

  return panel;
}

// Create stats display with modern style
function createStatsDisplay(label, value, valueColor) {
  const container = new PIXI.Container();

  const labelText = new PIXI.Text(label, {
    ...BUTTON_STYLES.default,
    fontSize: 14,
    fill: UI_COLORS.textSecondary,
  });
  labelText.y = 12;

  const valueText = new PIXI.Text(value, {
    ...BUTTON_STYLES.default,
    fontSize: 24,
    fill: valueColor,
  });
  valueText.y = 30;

  // Center both texts
  labelText.x = -labelText.width / 2;
  valueText.x = -valueText.width / 2;

  container.addChild(labelText);
  container.addChild(valueText);

  return container;
}

// Enhanced button creation with sci-fi style
function createButton(text, x, y, width = 130) {
  const button = new PIXI.Container();

  // Create button background with sci-fi design
  const buttonBg = new PIXI.Graphics();
  buttonBg.lineStyle(2, UI_COLORS.accent1);
  buttonBg.beginFill(UI_COLORS.buttonBg, 0.9);

  // Draw hexagonal button shape
  const height = 40;
  const indent = 10;
  buttonBg.moveTo(indent, 0);
  buttonBg.lineTo(width - indent, 0);
  buttonBg.lineTo(width, height / 2);
  buttonBg.lineTo(width - indent, height);
  buttonBg.lineTo(indent, height);
  buttonBg.lineTo(0, height / 2);
  buttonBg.lineTo(indent, 0);

  buttonBg.endFill();

  // Add accent line
  buttonBg.lineStyle(1, UI_COLORS.accent2, 0.5);
  buttonBg.moveTo(indent, height / 2);
  buttonBg.lineTo(width - indent, height / 2);

  // Add glow filter
  const glowFilter = new PIXI.BlurFilter();
  glowFilter.blur = 0;
  buttonBg.filters = [glowFilter];

  const buttonText = new PIXI.Text(text, {
    ...BUTTON_STYLES.default,
    fontSize: 16,
  });
  buttonText.x = width / 2 - buttonText.width / 2;
  buttonText.y = height / 2 - buttonText.height / 2;

  button.addChild(buttonBg);
  button.addChild(buttonText);
  button.x = x;
  button.y = y;

  button.eventMode = "static";
  button.cursor = "pointer";

  // Enhanced hover effects
  button.on("pointerover", () => {
    buttonBg.tint = UI_COLORS.buttonHover;
    glowFilter.blur = 4;
    buttonText.style.fill = UI_COLORS.accent1;
  });

  button.on("pointerout", () => {
    buttonBg.tint = 0xffffff;
    glowFilter.blur = 0;
    buttonText.style.fill = UI_COLORS.textPrimary;
  });

  button.on("pointerdown", () => {
    buttonBg.tint = UI_COLORS.buttonActive;
    buttonText.y += 1;
  });

  button.on("pointerup", () => {
    buttonBg.tint = UI_COLORS.buttonHover;
    buttonText.y -= 1;
  });

  return button;
}

// Create game control buttons with adjusted positions
const buttonY = 20;
const buttonSpacing = 20;
let currentX = app.screen.width / 2 - 200;

const playButton = createButton("PLAY", currentX, buttonY);
currentX += 130 + buttonSpacing;
const pauseButton = createButton("PAUSE", currentX, buttonY);
currentX += 130 + buttonSpacing;
const restartButton = createButton("RESTART", currentX, buttonY);

// Create UI elements
uiContainer = createUIContainer();

// Add control buttons to the container
uiContainer.addChild(playButton);
uiContainer.addChild(pauseButton);
uiContainer.addChild(restartButton);

// Add UI to stage
app.stage.addChild(uiContainer);
app.stage.addChild(createDifficultySelector());

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

// Update game state visuals with enhanced animations and safety checks
function updateGameState() {
  if (!uiContainer) return; // Safety check for uiContainer

  const playButtonBg = playButton?.getChildAt(0);
  const pauseButtonBg = pauseButton?.getChildAt(0);

  if (playButtonBg && pauseButtonBg) {
    playButtonBg.tint = isPaused ? 0xffffff : UI_COLORS.buttonActive;
    pauseButtonBg.tint = isPaused ? UI_COLORS.buttonActive : 0xffffff;
  }

  // Get the info panel with safety check
  const infoPanel = uiContainer.children.find(
    (child) => child instanceof PIXI.Container && child.children.length > 0
  );
  if (!infoPanel) return;

  // Get the display elements with safety checks
  const scoreContainer = infoPanel.children.find(
    (child) =>
      child instanceof PIXI.Container &&
      child.children[0]?.text?.includes("SCORE")
  );
  const timerContainer = infoPanel.children.find(
    (child) =>
      child instanceof PIXI.Container &&
      child.children[0]?.text?.includes("TIME")
  );
  const difficultyContainer = infoPanel.children.find(
    (child) =>
      child instanceof PIXI.Container &&
      child.children[0]?.text?.includes("DIFFICULTY")
  );

  if (!scoreContainer || !timerContainer || !difficultyContainer) return;

  const scoreValueText = scoreContainer.getChildAt(1);
  const timerValueText = timerContainer.getChildAt(1);
  const difficultyValueText = difficultyContainer.getChildAt(1);

  if (!scoreValueText || !timerValueText || !difficultyValueText) return;

  // Update score with animation
  const currentScore = parseInt(scoreValueText.text);
  if (currentScore !== score) {
    const scoreStep = (score - currentScore) / 10;
    const animateScore = setInterval(() => {
      const newScore = parseInt(scoreValueText.text) + Math.ceil(scoreStep);
      if (newScore >= score) {
        scoreValueText.text = score.toString();
        clearInterval(animateScore);
      } else {
        scoreValueText.text = newScore.toString();
      }
    }, 50);
  }

  // Update timer and difficulty
  timerValueText.text = timeLeft.toString();
  difficultyValueText.text = currentDifficulty.toUpperCase();
  difficultyValueText.style.fill = getDifficultyColor(currentDifficulty);

  // Update timer color
  if (timeLeft <= 10) {
    timerValueText.style.fill = UI_COLORS.timerRed;
  } else if (timeLeft <= 30) {
    timerValueText.style.fill = UI_COLORS.timerOrange;
  } else {
    timerValueText.style.fill = UI_COLORS.timerYellow;
  }
}

// Helper function to safely get UI elements
function getUIElements() {
  if (!uiContainer) return null;

  const infoPanel = uiContainer.children.find(
    (child) => child instanceof PIXI.Container && child.children.length > 0
  );
  if (!infoPanel) return null;

  const scoreContainer = infoPanel.children.find(
    (child) =>
      child instanceof PIXI.Container &&
      child.children[0]?.text?.includes("SCORE")
  );
  const timerContainer = infoPanel.children.find(
    (child) =>
      child instanceof PIXI.Container &&
      child.children[0]?.text?.includes("TIME")
  );
  const difficultyContainer = infoPanel.children.find(
    (child) =>
      child instanceof PIXI.Container &&
      child.children[0]?.text?.includes("DIFFICULTY")
  );

  return {
    scoreValue: scoreContainer?.getChildAt(1),
    timerValue: timerContainer?.getChildAt(1),
    difficultyValue: difficultyContainer?.getChildAt(1),
  };
}

// Update the resetGame function to use the helper
function resetGame() {
  score = 0;
  timeLeft = 60;
  gameOver = false;
  isPaused = true;

  // Clear existing debris
  debrisArray.forEach((debris) => app.stage.removeChild(debris));
  debrisArray = [];

  // Reset score and timer display
  const elements = getUIElements();
  if (elements) {
    elements.scoreValue.text = "0";
    elements.timerValue.text = "60";
  }

  // Remove game over text if it exists
  const existingGameOver = app.stage.children.find(
    (child) =>
      child instanceof PIXI.Container &&
      child.children[0] instanceof PIXI.Graphics
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

        const elements = getUIElements();
        if (elements) {
          elements.scoreValue.text = score.toString();
        }
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
    const elements = getUIElements();
    if (elements) {
      elements.timerValue.text = timeLeft.toString();
    }

    if (timeLeft <= 0) {
      gameOver = true;
      showGameOver();
      clearInterval(timerInterval);
    }
  }, 1000);
}

// Enhanced game over screen
function showGameOver() {
  const gameOverContainer = new PIXI.Container();

  // Create animated overlay
  const overlay = new PIXI.Graphics();
  overlay.beginFill(UI_COLORS.overlay, 0);
  overlay.drawRect(0, 0, app.screen.width, app.screen.height);
  overlay.endFill();

  // Animate overlay opacity
  let alpha = 0;
  const fadeIn = setInterval(() => {
    alpha += 0.05;
    if (alpha >= 0.8) {
      clearInterval(fadeIn);
    }
    overlay.clear();
    overlay.beginFill(UI_COLORS.overlay, alpha);
    overlay.drawRect(0, 0, app.screen.width, app.screen.height);
    overlay.endFill();
  }, 50);

  const gameOverText = new PIXI.Text("GAME OVER!", {
    ...BUTTON_STYLES.default,
    fontSize: 72,
    fill: 0xff0000,
    dropShadowDistance: 4,
  });

  const finalScoreText = new PIXI.Text(`Final Score: ${score}`, {
    ...BUTTON_STYLES.default,
    fontSize: 54,
  });

  const difficultyText = new PIXI.Text(
    `Difficulty: ${currentDifficulty.toUpperCase()}`,
    {
      ...BUTTON_STYLES.default,
      fontSize: 36,
      fill: getDifficultyColor(currentDifficulty),
    }
  );

  // Center all text elements
  [gameOverText, finalScoreText, difficultyText].forEach((text, index) => {
    text.anchor.set(0.5);
    text.x = app.screen.width / 2;
    text.y = app.screen.height / 2 - 100 + index * 80;

    // Add scaling animation
    text.scale.set(0);
    setTimeout(() => {
      const scaleUp = setInterval(() => {
        text.scale.x += 0.1;
        text.scale.y += 0.1;
        if (text.scale.x >= 1) {
          clearInterval(scaleUp);
        }
      }, 50);
    }, index * 400);
  });

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

// Enhanced difficulty selector with sci-fi theme
function createDifficultySelector() {
  const container = new PIXI.Container();

  // Create background with sci-fi design
  const selectorBg = new PIXI.Graphics();
  selectorBg.beginFill(UI_COLORS.headerBg, 0.9);
  selectorBg.lineStyle(2, UI_COLORS.accent1);

  // Draw panel with angled edges
  const width = 500;
  const height = 60;
  const indent = 20;
  selectorBg.moveTo(indent, 0);
  selectorBg.lineTo(width - indent, 0);
  selectorBg.lineTo(width, height);
  selectorBg.lineTo(0, height);
  selectorBg.lineTo(indent, 0);

  // Add accent lines
  selectorBg.lineStyle(1, UI_COLORS.accent2, 0.5);
  for (let x = indent; x < width; x += 30) {
    selectorBg.moveTo(x, 0);
    selectorBg.lineTo(x + 20, height);
  }

  selectorBg.endFill();

  // Add glow effect
  const glowFilter = new PIXI.BlurFilter();
  glowFilter.blur = 2;
  selectorBg.filters = [glowFilter];

  container.addChild(selectorBg);

  // Add "SELECT DIFFICULTY:" label with enhanced style
  const label = new PIXI.Text("SELECT DIFFICULTY:", {
    ...BUTTON_STYLES.default,
    fontSize: 18,
    fill: UI_COLORS.accent1,
  });
  label.x = 30;
  label.y = 20;
  container.addChild(label);

  // Create difficulty buttons with improved spacing
  const difficulties = ["easy", "normal", "hard"];
  const buttonSpacing = 20;
  let buttonX = label.width + 50;

  difficulties.forEach((diff, index) => {
    const button = createButton(diff.toUpperCase(), buttonX, 10, 110);
    buttonX += 110 + buttonSpacing;
    button.on("pointerdown", () => {
      currentDifficulty = diff;
      updateDifficultyButtons();
    });
    container.addChild(button);
  });

  // Position at bottom of screen
  container.x = app.screen.width / 2 - 250;
  container.y = app.screen.height - 80;

  return container;
}
