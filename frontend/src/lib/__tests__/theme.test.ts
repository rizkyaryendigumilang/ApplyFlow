import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveEffectiveTheme, THEME_STORAGE_KEY } from '../theme.ts';

test('theme: resolves light and dark themes directly', () => {
  assert.equal(resolveEffectiveTheme('light'), 'light');
  assert.equal(resolveEffectiveTheme('dark'), 'dark');
});

test('theme: storage key is defined correctly', () => {
  assert.equal(THEME_STORAGE_KEY, 'applyflow_theme');
});
