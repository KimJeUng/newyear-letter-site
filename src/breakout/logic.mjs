function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function circleIntersectsRect(ball, rect) {
  const nearestX = clamp(ball.x, rect.x, rect.x + rect.width);
  const nearestY = clamp(ball.y, rect.y, rect.y + rect.height);
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;
  return dx * dx + dy * dy <= ball.radius * ball.radius;
}

function createBall({ x, y, speed, radius, horizontalDir = 1 }) {
  const vx = speed * 0.72 * horizontalDir;
  const vy = -Math.sqrt(speed * speed - vx * vx);

  return {
    x,
    y,
    vx,
    vy,
    radius,
  };
}

function createBricks({
  rows,
  cols,
  marginX,
  marginY,
  gapX,
  gapY,
  width,
  brickHeight,
}) {
  const bricks = [];
  const totalGap = gapX * (cols - 1);
  const brickWidth = (width - marginX * 2 - totalGap) / cols;
  let id = 1;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      bricks.push({
        id,
        x: marginX + col * (brickWidth + gapX),
        y: marginY + row * (brickHeight + gapY),
        width: brickWidth,
        height: brickHeight,
        row,
        col,
        alive: true,
      });
      id += 1;
    }
  }

  return bricks;
}

function makeLevel(base, level) {
  const ballSpeed = base.ballBaseSpeed + (level - 1) * base.ballSpeedStep;
  const bricks = createBricks({
    rows: base.brickRows,
    cols: base.brickCols,
    marginX: base.brickMarginX,
    marginY: base.brickMarginY,
    gapX: base.brickGapX,
    gapY: base.brickGapY,
    width: base.width,
    brickHeight: base.brickHeight,
  });

  return {
    bricks,
    ballSpeed,
  };
}

export function createInitialState({
  width = 480,
  height = 640,
  brickRows = 5,
  brickCols = 8,
} = {}) {
  const base = {
    width,
    height,
    brickRows,
    brickCols,
    brickMarginX: 24,
    brickMarginY: 84,
    brickGapX: 8,
    brickGapY: 8,
    brickHeight: 18,
    paddleWidth: 88,
    paddleHeight: 14,
    paddleSpeed: 360,
    paddleBottomGap: 30,
    ballRadius: 8,
    ballBaseSpeed: 260,
    ballSpeedStep: 20,
  };

  const paddleX = width / 2 - base.paddleWidth / 2;
  const paddleY = height - base.paddleBottomGap - base.paddleHeight;
  const levelData = makeLevel(base, 1);

  return {
    ...base,
    paddle: {
      x: paddleX,
      y: paddleY,
      width: base.paddleWidth,
      height: base.paddleHeight,
      speed: base.paddleSpeed,
    },
    ball: createBall({
      x: paddleX + base.paddleWidth / 2,
      y: paddleY - base.ballRadius - 2,
      speed: levelData.ballSpeed,
      radius: base.ballRadius,
      horizontalDir: 1,
    }),
    bricks: levelData.bricks,
    ballSpeed: levelData.ballSpeed,
    score: 0,
    lives: 3,
    level: 1,
    isPaused: false,
    isGameOver: false,
  };
}

export function togglePause(state) {
  if (state.isGameOver) {
    return state;
  }

  return {
    ...state,
    isPaused: !state.isPaused,
  };
}

export function step(state, input = {}) {
  if (state.isPaused || state.isGameOver) {
    return state;
  }

  const dtMs = Math.max(0, Math.min(40, input.dtMs ?? 16));
  const dtSec = dtMs / 1000;

  const paddle = { ...state.paddle };
  const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  paddle.x = clamp(
    paddle.x + moveDir * paddle.speed * dtSec,
    0,
    state.width - paddle.width,
  );

  let ball = { ...state.ball };
  const prevX = ball.x;
  const prevY = ball.y;

  ball.x += ball.vx * dtSec;
  ball.y += ball.vy * dtSec;

  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + ball.radius > state.width) {
    ball.x = state.width - ball.radius;
    ball.vx = -Math.abs(ball.vx);
  }

  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.vy = Math.abs(ball.vy);
  }

  let bricks = state.bricks.map((brick) => ({ ...brick }));
  let score = state.score;

  for (let i = 0; i < bricks.length; i += 1) {
    const brick = bricks[i];
    if (!brick.alive) {
      continue;
    }

    if (!circleIntersectsRect(ball, brick)) {
      continue;
    }

    bricks[i] = { ...brick, alive: false };
    score += 100;

    const fromLeft = prevX + ball.radius <= brick.x;
    const fromRight = prevX - ball.radius >= brick.x + brick.width;
    const fromTop = prevY + ball.radius <= brick.y;
    const fromBottom = prevY - ball.radius >= brick.y + brick.height;

    if (fromLeft) {
      ball.vx = -Math.abs(ball.vx);
    } else if (fromRight) {
      ball.vx = Math.abs(ball.vx);
    } else if (fromTop) {
      ball.vy = -Math.abs(ball.vy);
    } else if (fromBottom) {
      ball.vy = Math.abs(ball.vy);
    } else {
      ball.vy *= -1;
    }
    break;
  }

  if (ball.vy > 0 && circleIntersectsRect(ball, paddle)) {
    ball.y = paddle.y - ball.radius;

    const speed = Math.hypot(ball.vx, ball.vy);
    const offset = clamp(
      (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2),
      -1,
      1,
    );
    const angle = offset * (Math.PI / 3);

    ball.vx = speed * Math.sin(angle);
    ball.vy = -Math.abs(speed * Math.cos(angle));

    if (Math.abs(ball.vx) < 45) {
      ball.vx = offset >= 0 ? 45 : -45;
    }
  }

  let lives = state.lives;
  let level = state.level;
  let ballSpeed = state.ballSpeed;
  let isGameOver = false;

  if (ball.y - ball.radius > state.height) {
    lives -= 1;
    if (lives <= 0) {
      isGameOver = true;
    } else {
      const horizontalDir = lives % 2 === 0 ? -1 : 1;
      ball = createBall({
        x: paddle.x + paddle.width / 2,
        y: paddle.y - state.ballRadius - 2,
        speed: ballSpeed,
        radius: state.ballRadius,
        horizontalDir,
      });
    }
  }

  if (!isGameOver) {
    const remaining = bricks.filter((brick) => brick.alive).length;
    if (remaining === 0) {
      const nextLevel = state.level + 1;
      const levelData = makeLevel(state, nextLevel);
      level = nextLevel;
      ballSpeed = levelData.ballSpeed;
      bricks = levelData.bricks;
      ball = createBall({
        x: paddle.x + paddle.width / 2,
        y: paddle.y - state.ballRadius - 2,
        speed: ballSpeed,
        radius: state.ballRadius,
        horizontalDir: nextLevel % 2 === 0 ? -1 : 1,
      });
    }
  }

  return {
    ...state,
    paddle,
    ball,
    bricks,
    ballSpeed,
    score,
    lives,
    level,
    isGameOver,
  };
}
