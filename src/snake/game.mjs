import {
  createInitialState,
  setDirection,
  step,
  togglePause,
} from './logic.mjs';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const TICK_MS = 130;

const DIRECTION_KEYS = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP',
  W: 'UP',
  a: 'LEFT',
  A: 'LEFT',
  s: 'DOWN',
  S: 'DOWN',
  d: 'RIGHT',
  D: 'RIGHT',
};

function randomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

const canvas = document.querySelector('[data-board]');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('[data-score]');
const statusEl = document.querySelector('[data-status]');
const pauseBtn = document.querySelector('[data-pause]');
const restartBtn = document.querySelector('[data-restart]');
const controlButtons = document.querySelectorAll('[data-dir]');

canvas.width = GRID_SIZE * CELL_SIZE;
canvas.height = GRID_SIZE * CELL_SIZE;

let state = createInitialState({
  gridSize: GRID_SIZE,
  nextRandomInt: randomInt,
});

function restart() {
  state = createInitialState({
    gridSize: GRID_SIZE,
    nextRandomInt: randomInt,
  });
  render();
}

function applyDirection(direction) {
  state = setDirection(state, direction);
}

function getStatusText() {
  if (state.isGameOver) {
    return 'Game Over';
  }
  if (state.isPaused) {
    return 'Paused';
  }
  return 'Running';
}

function drawGrid() {
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    const p = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(canvas.width, p);
    ctx.stroke();
  }
}

function drawFood() {
  if (!state.food) {
    return;
  }

  ctx.fillStyle = '#d43f3a';
  ctx.fillRect(
    state.food.x * CELL_SIZE + 2,
    state.food.y * CELL_SIZE + 2,
    CELL_SIZE - 4,
    CELL_SIZE - 4,
  );
}

function drawSnake() {
  state.snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? '#1f1f1f' : '#4a4a4a';
    ctx.fillRect(
      segment.x * CELL_SIZE + 2,
      segment.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4,
    );
  });
}

function render() {
  drawGrid();
  drawFood();
  drawSnake();

  scoreEl.textContent = String(state.score);
  statusEl.textContent = getStatusText();
  pauseBtn.textContent = state.isPaused ? 'Resume' : 'Pause';
}

document.addEventListener('keydown', (event) => {
  const direction = DIRECTION_KEYS[event.key];
  if (direction) {
    event.preventDefault();
    applyDirection(direction);
    return;
  }

  if (event.key === ' ' || event.key === 'p' || event.key === 'P') {
    event.preventDefault();
    state = togglePause(state);
    render();
    return;
  }

  if (event.key === 'r' || event.key === 'R') {
    event.preventDefault();
    restart();
  }
});

pauseBtn.addEventListener('click', () => {
  state = togglePause(state);
  render();
});

restartBtn.addEventListener('click', () => {
  restart();
});

controlButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyDirection(button.dataset.dir);
  });
});

setInterval(() => {
  state = step(state, { nextRandomInt: randomInt });
  render();
}, TICK_MS);

render();
