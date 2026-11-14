import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQuotaStatus,
  getMondayOfWeek,
  parseOrInitializeQuota,
  STORAGE_KEY,
} from '../useLinkedInQuota.ts';

test('calculateQuotaStatus returns safe, caution, and danger based on count', () => {
  assert.equal(calculateQuotaStatus(5, 25), 'safe');
  assert.equal(calculateQuotaStatus(19, 25), 'safe');
  assert.equal(calculateQuotaStatus(20, 25), 'caution');
  assert.equal(calculateQuotaStatus(24, 25), 'caution');
  assert.equal(calculateQuotaStatus(25, 25), 'danger');
  assert.equal(calculateQuotaStatus(30, 25), 'danger');
});

test('getMondayOfWeek returns consistent YYYY-MM-DD Monday string', () => {
  // 2026-11-14 is Saturday -> Monday was 2026-11-09
  const date = new Date('2026-11-14T12:00:00Z');
  const monday = getMondayOfWeek(date);
  assert.equal(monday, '2026-11-09');
});

test('parseOrInitializeQuota initializes fresh state if storage is empty', () => {
  const state = parseOrInitializeQuota(null);
  assert.equal(state.count, 0);
  assert.equal(state.safeLimit, 25);
  assert.ok(typeof state.weekOf === 'string');
});

test('parseOrInitializeQuota resets count if week has rolled over', () => {
  const oldState = JSON.stringify({
    count: 22,
    safeLimit: 25,
    weekOf: '2026-10-01', // old past week
  });

  const state = parseOrInitializeQuota(oldState);
  assert.equal(state.count, 0);
  assert.notEqual(state.weekOf, '2026-10-01');
});

test('parseOrInitializeQuota preserves count if within the same week', () => {
  const currentMonday = getMondayOfWeek(new Date());
  const validState = JSON.stringify({
    count: 14,
    safeLimit: 25,
    weekOf: currentMonday,
  });

  const state = parseOrInitializeQuota(validState);
  assert.equal(state.count, 14);
  assert.equal(state.weekOf, currentMonday);
});

test('parseOrInitializeQuota recovers gracefully from malformed JSON', () => {
  const corrupted = '{malformed...';
  const state = parseOrInitializeQuota(corrupted);
  assert.equal(state.count, 0);
  assert.equal(state.safeLimit, 25);
});
