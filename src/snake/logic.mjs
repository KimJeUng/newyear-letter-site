export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const OPPOSITE = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

function defaultRandomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

function isSameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isOutOfBounds(cell, gridSize) {
  return (
    cell.x < 0 ||
    cell.y < 0 ||
    cell.x >= gridSize ||
    cell.y >= gridSize
  );
}

export function placeFood(gridSize, snake, nextRandomInt = defaultRandomInt) {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const available = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        available.push({ x, y });
      }
    }
  }

  if (available.length === 0) {
    return null;
  }

  const idx = nextRandomInt(available.length);
  return available[idx];
}

export function createInitialState({
  gridSize = 20,
  initialSnake,
  initialDirection = 'RIGHT',
  initialFood,
  nextRandomInt = defaultRandomInt,
} = {}) {
  const snake = initialSnake ?? [
    { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) },
  ];

  const food = initialFood ?? placeFood(gridSize, snake, nextRandomInt);

  return {
    gridSize,
    snake,
    direction: initialDirection,
    pendingDirection: initialDirection,
    food,
    score: 0,
    isGameOver: false,
    isPaused: false,
  };
}

export function setDirection(state, direction) {
  if (!DIRECTIONS[direction]) {
    return state;
  }

  if (direction === state.pendingDirection) {
    return state;
  }

  // Reverse turns are checked against the last committed direction.
  if (direction === state.direction || direction === OPPOSITE[state.direction]) {
    return state;
  }

  return {
    ...state,
    pendingDirection: direction,
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

export function step(state, { nextRandomInt = defaultRandomInt } = {}) {
  if (state.isGameOver || state.isPaused) {
    return state;
  }

  const direction = state.pendingDirection ?? state.direction;
  const delta = DIRECTIONS[direction];
  const head = state.snake[0];
  const nextHead = {
    x: head.x + delta.x,
    y: head.y + delta.y,
  };

  if (isOutOfBounds(nextHead, state.gridSize)) {
    return {
      ...state,
      direction,
      isGameOver: true,
    };
  }

  const willGrow = state.food && isSameCell(nextHead, state.food);
  const bodyToCheck = willGrow ? state.snake : state.snake.slice(0, -1);

  if (bodyToCheck.some((segment) => isSameCell(segment, nextHead))) {
    return {
      ...state,
      direction,
      isGameOver: true,
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!willGrow) {
    nextSnake.pop();
  }

  let nextFood = state.food;
  let nextScore = state.score;
  let isGameOver = false;

  if (willGrow) {
    nextScore += 1;
    nextFood = placeFood(state.gridSize, nextSnake, nextRandomInt);
    if (!nextFood) {
      isGameOver = true;
    }
  }

  return {
    ...state,
    snake: nextSnake,
    direction,
    pendingDirection: direction,
    food: nextFood,
    score: nextScore,
    isGameOver,
  };
}
