import { createInitialState, step, togglePause } from './logic.mjs';

const WIDTH = 480;
const HEIGHT = 640;
const BRICK_COLORS = ['#f94144', '#f3722c', '#f9c74f', '#90be6d', '#43aa8b'];

const canvas = document.querySelector('[data-breakout-board]');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('[data-score]');
const livesEl = document.querySelector('[data-lives]');
const levelEl = document.querySelector('[data-level]');
const statusEl = document.querySelector('[data-status]');
const pauseBtn = document.querySelector('[data-pause]');
const restartBtn = document.querySelector('[data-restart]');

const input = {
  left: false,
  right: false,
};

canvas.width = WIDTH;
canvas.height = HEIGHT;

let state = createInitialState({ width: WIDTH, height: HEIGHT });

function restartGame() {
  state = createInitialState({ width: WIDTH, height: HEIGHT });
}

function drawBackground() {
  ctx.fillStyle = '#0c1222';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.strokeStyle = '#202a44';
  ctx.lineWidth = 1;
  for (let y = 0; y < HEIGHT; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawBricks() {
  for (const brick of state.bricks) {
    if (!brick.alive) {
      continue;
    }

    ctx.fillStyle = BRICK_COLORS[brick.row % BRICK_COLORS.length];
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
  }
}

function drawPaddle() {
  const paddle = state.paddle;
  ctx.fillStyle = '#8ecae6';
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
  const ball = state.ball;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function renderHud() {
  scoreEl.textContent = String(state.score);
  livesEl.textContent = String(state.lives);
  levelEl.textContent = String(state.level);

  if (state.isGameOver) {
    statusEl.textContent = 'Game Over';
  } else if (state.isPaused) {
    statusEl.textContent = 'Paused';
  } else {
    statusEl.textContent = 'Running';
  }

  pauseBtn.textContent = state.isPaused ? 'Resume' : 'Pause';
}

function render() {
  drawBackground();
  drawBricks();
  drawPaddle();
  drawBall();
  renderHud();
}

function setInputFromKey(key, pressed) {
  if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
    input.left = pressed;
    return true;
  }

  if (key === 'ArrowRight' || key === 'd' || key === 'D') {
    input.right = pressed;
    return true;
  }

  return false;
}

document.addEventListener('keydown', (event) => {
  if (setInputFromKey(event.key, true)) {
    event.preventDefault();
    return;
  }

  if ((event.key === 'p' || event.key === 'P') && !event.repeat) {
    event.preventDefault();
    state = togglePause(state);
    render();
    return;
  }

  if ((event.key === 'r' || event.key === 'R') && !event.repeat) {
    event.preventDefault();
    restartGame();
  }
});

document.addEventListener('keyup', (event) => {
  if (setInputFromKey(event.key, false)) {
    event.preventDefault();
  }
});

window.addEventListener('blur', () => {
  input.left = false;
  input.right = false;
});

pauseBtn.addEventListener('click', () => {
  state = togglePause(state);
  render();
});

restartBtn.addEventListener('click', () => {
  restartGame();
});

function bindHoldButton(selector, key) {
  const el = document.querySelector(selector);

  const activate = (event) => {
    event.preventDefault();
    input[key] = true;
    el.setPointerCapture?.(event.pointerId);
  };

  const deactivate = (event) => {
    event.preventDefault();
    input[key] = false;
  };

  el.addEventListener('pointerdown', activate);
  el.addEventListener('pointerup', deactivate);
  el.addEventListener('pointercancel', deactivate);
  el.addEventListener('pointerleave', deactivate);
}

bindHoldButton('[data-control="left"]', 'left');
bindHoldButton('[data-control="right"]', 'right');

let previous = performance.now();

function frame(now) {
  const dtMs = Math.min(34, now - previous);
  previous = now;

  state = step(state, {
    dtMs,
    left: input.left,
    right: input.right,
  });

  render();
  requestAnimationFrame(frame);
}

render();
requestAnimationFrame(frame);
