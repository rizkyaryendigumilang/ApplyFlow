import test from 'node:test';
import assert from 'node:assert/strict';
import { cn } from '../cn.ts';

test('cn merges standard class strings', () => {
  const result = cn('px-4 py-2', 'bg-blue-600');
  assert.equal(result, 'px-4 py-2 bg-blue-600');
});

test('cn handles conditional falsy values cleanly', () => {
  const isHidden = false;
  const isPrimary = true;
  const result = cn('btn', isHidden && 'hidden', isPrimary && 'btn-primary', null, undefined);
  assert.equal(result, 'btn btn-primary');
});

test('cn resolves Tailwind conflicts correctly via tailwind-merge', () => {
  // tailwind-merge should resolve p-4 vs p-2 so that the latter wins
  const result = cn('p-4 text-sm', 'p-2');
  assert.equal(result, 'text-sm p-2');
});
