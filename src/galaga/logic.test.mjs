import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, step } from './logic.mjs';

test('player movement is clamped to left boundary', () => {
  const state = createInitialState({ width: 200, height: 300 });
  const next = step(state, { dtMs: 1000, left: true, right: false, shoot: false });

  assert.equal(next.player.x, 0);
});

test('shot cooldown prevents immediate second shot', () => {
  const state = createInitialState();
  const first = step(state, { dtMs: 16, shoot: true });
  const second = step(first, { dtMs: 16, shoot: true });

  const playerShots = second.shots.filter((shot) => shot.owner === 'player');
  assert.equal(playerShots.length, 1);
});

test('player shot destroys enemy and adds score', () => {
  const state = {
    ...createInitialState({ width: 200, height: 300 }),
    enemies: [
      { id: 1, x: 40, y: 80, width: 20, height: 20, alive: true },
      { id: 2, x: 120, y: 80, width: 20, height: 20, alive: true },
    ],
    shots: [
      { x: 46, y: 92, width: 4, height: 12, speed: 100, owner: 'player' },
    ],
  };

  const next = step(state, { dtMs: 16 });

  assert.equal(next.enemies[0].alive, false);
  assert.equal(next.enemies[1].alive, true);
  assert.equal(next.score, 100);
  assert.equal(next.shots.length, 0);
});

test('enemy formation bounces and moves down at boundary', () => {
  const state = {
    ...createInitialState({ width: 100, height: 300 }),
    enemies: [{ id: 1, x: 82, y: 60, width: 18, height: 18, alive: true }],
    enemySpeed: 60,
    enemyDir: 1,
  };

  const next = step(state, { dtMs: 1000 });

  assert.equal(next.enemyDir, -1);
  assert.equal(next.enemies[0].y, 60 + state.enemyStepDown);
  assert.equal(next.enemies[0].x, 82);
});

test('enemy shot hit reduces life and triggers game over at 0 lives', () => {
  const base = createInitialState({ width: 200, height: 300 });
  const state = {
    ...base,
    lives: 1,
    shots: [
      {
        x: base.player.x + 10,
        y: base.player.y + 4,
        width: 4,
        height: 12,
        speed: 0,
        owner: 'enemy',
      },
    ],
  };

  const next = step(state, { dtMs: 16 });

  assert.equal(next.lives, 0);
  assert.equal(next.isGameOver, true);
});

test('new wave starts when all enemies are defeated', () => {
  const state = {
    ...createInitialState({ width: 300, height: 400 }),
    enemies: [{ id: 1, x: 0, y: 0, width: 20, height: 20, alive: false }],
  };

  const next = step(state, { dtMs: 16 });

  assert.equal(next.level, 2);
  assert.ok(next.enemies.some((enemy) => enemy.alive));
  assert.equal(next.enemySpeed > state.enemySpeed, true);
});
