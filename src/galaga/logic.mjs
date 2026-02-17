function defaultRandom() {
  return Math.random();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function createEnemyFormation({
  rows,
  cols,
  enemyWidth,
  enemyHeight,
  gapX,
  gapY,
  marginX,
  marginY,
}) {
  const enemies = [];
  let id = 1;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      enemies.push({
        id,
        x: marginX + col * (enemyWidth + gapX),
        y: marginY + row * (enemyHeight + gapY),
        width: enemyWidth,
        height: enemyHeight,
        alive: true,
      });
      id += 1;
    }
  }

  return enemies;
}

function makeWave(state, level) {
  return {
    enemies: createEnemyFormation({
      rows: state.enemyRows,
      cols: state.enemyCols,
      enemyWidth: state.enemyWidth,
      enemyHeight: state.enemyHeight,
      gapX: state.enemyGapX,
      gapY: state.enemyGapY,
      marginX: state.enemyMarginX,
      marginY: state.enemyMarginY,
    }),
    level,
    enemySpeed: state.enemyBaseSpeed + (level - 1) * state.enemySpeedStep,
    enemyShootIntervalMs: Math.max(
      state.enemyShootMinIntervalMs,
      state.enemyShootBaseIntervalMs - (level - 1) * state.enemyShootStepMs,
    ),
  };
}

export function createInitialState({
  width = 480,
  height = 640,
  enemyRows = 4,
  enemyCols = 8,
} = {}) {
  const base = {
    width,
    height,
    enemyRows,
    enemyCols,
    enemyWidth: 28,
    enemyHeight: 20,
    enemyGapX: 14,
    enemyGapY: 14,
    enemyMarginX: 38,
    enemyMarginY: 70,
    enemyBaseSpeed: 48,
    enemySpeedStep: 10,
    enemyStepDown: 20,
    enemyShootBaseIntervalMs: 900,
    enemyShootStepMs: 60,
    enemyShootMinIntervalMs: 300,
  };

  const firstWave = makeWave(base, 1);

  return {
    ...base,
    player: {
      x: width / 2 - 20,
      y: height - 54,
      width: 40,
      height: 24,
      speed: 280,
      shotCooldownMs: 0,
      shotDelayMs: 220,
    },
    shots: [],
    enemies: firstWave.enemies,
    enemyDir: 1,
    enemySpeed: firstWave.enemySpeed,
    enemyShootIntervalMs: firstWave.enemyShootIntervalMs,
    enemyShootTimerMs: firstWave.enemyShootIntervalMs,
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

export function step(state, input = {}, { nextRandom = defaultRandom } = {}) {
  if (state.isPaused || state.isGameOver) {
    return state;
  }

  const dtMs = Math.max(0, input.dtMs ?? 16);
  const dtSec = dtMs / 1000;

  const player = { ...state.player };
  const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  player.x = clamp(
    player.x + moveDir * player.speed * dtSec,
    0,
    state.width - player.width,
  );

  player.shotCooldownMs = Math.max(0, player.shotCooldownMs - dtMs);

  const shots = state.shots.map((shot) => ({ ...shot }));
  if (input.shoot && player.shotCooldownMs === 0) {
    shots.push({
      x: player.x + player.width / 2 - 2,
      y: player.y - 12,
      width: 4,
      height: 12,
      speed: 360,
      owner: 'player',
    });
    player.shotCooldownMs = player.shotDelayMs;
  }

  for (const shot of shots) {
    if (shot.owner === 'player') {
      shot.y -= shot.speed * dtSec;
    } else {
      shot.y += shot.speed * dtSec;
    }
  }

  let filteredShots = shots.filter(
    (shot) => shot.y + shot.height >= 0 && shot.y <= state.height,
  );

  const enemies = state.enemies.map((enemy) => ({ ...enemy }));
  let enemyDir = state.enemyDir;

  const aliveEnemies = enemies.filter((enemy) => enemy.alive);
  if (aliveEnemies.length > 0) {
    const shiftX = enemyDir * state.enemySpeed * dtSec;
    const left = Math.min(...aliveEnemies.map((enemy) => enemy.x));
    const right = Math.max(...aliveEnemies.map((enemy) => enemy.x + enemy.width));

    let appliedShiftX = shiftX;
    let appliedShiftY = 0;

    if (left + shiftX < 0 || right + shiftX > state.width) {
      enemyDir *= -1;
      appliedShiftX = 0;
      appliedShiftY = state.enemyStepDown;
    }

    for (const enemy of enemies) {
      enemy.x += appliedShiftX;
      enemy.y += appliedShiftY;
    }
  }

  let enemyShootTimerMs = state.enemyShootTimerMs - dtMs;
  if (aliveEnemies.length > 0) {
    while (enemyShootTimerMs <= 0) {
      const shooter = aliveEnemies[Math.floor(nextRandom() * aliveEnemies.length)];
      filteredShots.push({
        x: shooter.x + shooter.width / 2 - 2,
        y: shooter.y + shooter.height,
        width: 4,
        height: 12,
        speed: 220,
        owner: 'enemy',
      });
      enemyShootTimerMs += state.enemyShootIntervalMs;
    }
  } else {
    enemyShootTimerMs = state.enemyShootIntervalMs;
  }

  const removeShot = new Set();
  let score = state.score;

  for (let i = 0; i < filteredShots.length; i += 1) {
    const shot = filteredShots[i];
    if (shot.owner !== 'player') {
      continue;
    }

    for (let j = 0; j < enemies.length; j += 1) {
      const enemy = enemies[j];
      if (!enemy.alive) {
        continue;
      }

      if (intersects(shot, enemy)) {
        enemies[j] = { ...enemy, alive: false };
        removeShot.add(i);
        score += 100;
        break;
      }
    }
  }

  let lives = state.lives;
  let isGameOver = false;

  for (let i = 0; i < filteredShots.length; i += 1) {
    const shot = filteredShots[i];
    if (shot.owner !== 'enemy' || removeShot.has(i)) {
      continue;
    }

    if (intersects(shot, player)) {
      removeShot.add(i);
      lives -= 1;
    }
  }

  filteredShots = filteredShots.filter((_, idx) => !removeShot.has(idx));

  if (lives <= 0) {
    isGameOver = true;
  }

  if (!isGameOver) {
    for (const enemy of enemies) {
      if (!enemy.alive) {
        continue;
      }

      if (enemy.y + enemy.height >= player.y || intersects(enemy, player)) {
        isGameOver = true;
        break;
      }
    }
  }

  let level = state.level;
  let enemySpeed = state.enemySpeed;
  let enemyShootIntervalMs = state.enemyShootIntervalMs;
  let nextEnemies = enemies;

  if (!isGameOver) {
    const remaining = nextEnemies.filter((enemy) => enemy.alive).length;
    if (remaining === 0) {
      const nextLevel = state.level + 1;
      const wave = makeWave(state, nextLevel);
      level = nextLevel;
      nextEnemies = wave.enemies;
      enemySpeed = wave.enemySpeed;
      enemyShootIntervalMs = wave.enemyShootIntervalMs;
      enemyShootTimerMs = enemyShootIntervalMs;
      filteredShots = [];
    }
  }

  return {
    ...state,
    player,
    shots: filteredShots,
    enemies: nextEnemies,
    enemyDir,
    enemyShootTimerMs,
    enemyShootIntervalMs,
    enemySpeed,
    score,
    lives,
    level,
    isGameOver,
  };
}
