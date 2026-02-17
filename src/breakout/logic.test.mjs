import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, step } from './logic.mjs';

test('paddle movement is clamped to left boundary', () => {
  const base = createInitialState({ width: 220, height: 320 });
  const state = {
    ...base,
    paddle: {
      ...base.paddle,
      x: 2,
    },
  };
  const next = step(state, { dtMs: 1000, left: true, right: false });

  assert.equal(next.paddle.x, 0);
});

test('ball bounces on side wall', () => {
  const state = {
    ...createInitialState({ width: 220, height: 320 }),
    bricks: [
      { id: 1, x: 120, y: 80, width: 24, height: 16, row: 0, col: 0, alive: true },
    ],
    ball: {
      x: 9,
      y: 200,
      vx: -180,
      vy: -90,
      radius: 8,
    },
  };

  const next = step(state, { dtMs: 16 });

  assert.equal(next.ball.vx > 0, true);
});

test('ball collision removes brick and adds score', () => {
  const state = {
    ...createInitialState({ width: 260, height: 360 }),
    bricks: [
      { id: 1, x: 90, y: 120, width: 40, height: 16, row: 0, col: 0, alive: true },
      { id: 2, x: 150, y: 120, width: 40, height: 16, row: 0, col: 1, alive: true },
    ],
    ball: {
      x: 110,
      y: 138,
      vx: 0,
      vy: -220,
      radius: 8,
    },
  };

  const next = step(state, { dtMs: 16 });

  assert.equal(next.bricks[0].alive, false);
  assert.equal(next.bricks[1].alive, true);
  assert.equal(next.score, 100);
});

test('life loss triggers game over when lives reach zero', () => {
  const base = createInitialState({ width: 220, height: 320 });
  const state = {
    ...base,
    lives: 1,
    bricks: [
      { id: 1, x: 120, y: 80, width: 24, height: 16, row: 0, col: 0, alive: true },
    ],
    ball: {
      ...base.ball,
      y: base.height + base.ballRadius + 2,
      vx: 0,
      vy: 120,
    },
  };

  const next = step(state, { dtMs: 16 });

  assert.equal(next.lives, 0);
  assert.equal(next.isGameOver, true);
});

test('clearing all bricks starts next level', () => {
  const state = {
    ...createInitialState({ width: 280, height: 380 }),
    bricks: [
      { id: 1, x: 90, y: 120, width: 40, height: 16, row: 0, col: 0, alive: true },
    ],
    ball: {
      x: 110,
      y: 138,
      vx: 0,
      vy: -220,
      radius: 8,
    },
  };

  const next = step(state, { dtMs: 16 });

  assert.equal(next.level, 2);
  assert.equal(next.ballSpeed > state.ballSpeed, true);
  assert.equal(next.bricks.some((brick) => brick.alive), true);
});
