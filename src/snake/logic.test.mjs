import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState,
  placeFood,
  setDirection,
  step,
} from './logic.mjs';

test('snake moves forward one cell each tick', () => {
  const state = createInitialState({
    gridSize: 6,
    initialSnake: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
    ],
    initialDirection: 'RIGHT',
    initialFood: { x: 5, y: 5 },
  });

  const next = step(state);

  assert.deepEqual(next.snake, [
    { x: 3, y: 2 },
    { x: 2, y: 2 },
  ]);
  assert.equal(next.score, 0);
  assert.equal(next.isGameOver, false);
});

test('snake grows and score increases when eating food', () => {
  const state = createInitialState({
    gridSize: 6,
    initialSnake: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
    ],
    initialDirection: 'RIGHT',
    initialFood: { x: 3, y: 2 },
  });

  const next = step(state, {
    nextRandomInt: () => 0,
  });

  assert.equal(next.snake.length, 3);
  assert.equal(next.score, 1);
  assert.notDeepEqual(next.food, { x: 3, y: 2 });
  assert.equal(next.isGameOver, false);
});

test('wall collision ends the game', () => {
  const state = createInitialState({
    gridSize: 5,
    initialSnake: [{ x: 4, y: 2 }],
    initialDirection: 'RIGHT',
    initialFood: { x: 0, y: 0 },
  });

  const next = step(state);

  assert.equal(next.isGameOver, true);
});

test('self collision ends the game', () => {
  const state = createInitialState({
    gridSize: 6,
    initialSnake: [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
      { x: 1, y: 2 },
    ],
    initialDirection: 'DOWN',
    initialFood: { x: 5, y: 5 },
  });

  const next = step(state);

  assert.equal(next.isGameOver, true);
});

test('opposite direction change is ignored', () => {
  const state = createInitialState({
    initialDirection: 'RIGHT',
    initialFood: { x: 0, y: 0 },
  });

  const next = setDirection(state, 'LEFT');

  assert.equal(next.pendingDirection, 'RIGHT');
});

test('food is placed on an empty cell only', () => {
  const food = placeFood(
    2,
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    () => 0,
  );

  assert.deepEqual(food, { x: 1, y: 1 });
});

test('food placement returns null when board is full', () => {
  const food = placeFood(
    2,
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    () => 0,
  );

  assert.equal(food, null);
});
