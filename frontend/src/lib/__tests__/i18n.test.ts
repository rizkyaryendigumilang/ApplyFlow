import test from 'node:test';
import assert from 'node:assert/strict';
import { translateKey, DICTIONARY } from '../i18n.ts';

test('translateKey returns correct Indonesian translation without em-dash', () => {
  const text = translateKey('id', 'cockpit.attentionTitle');
  assert.equal(text.includes('—'), false);
  assert.match(text, /Radar Tindakan|Perlu Perhatian/i);
});

test('translateKey returns correct English translation without em-dash', () => {
  const text = translateKey('en', 'cockpit.attentionTitle');
  assert.equal(text.includes('—'), false);
  assert.match(text, /Attention Required|Daily Action/i);
});

test('translateKey interpolates dynamic parameters cleanly', () => {
  const text = translateKey('id', 'cockpit.staleAlert', { count: 3 });
  assert.match(text, /3/);
  assert.equal(text.includes('{count}'), false);
});

test('translateKey falls back gracefully when key is missing', () => {
  const text = translateKey('id', 'non.existent.key');
  assert.equal(text, 'non.existent.key');
});

test('translateKey supports settings language keys in both English and Indonesian', () => {
  const titleId = translateKey('id', 'settings.languageTitle');
  const titleEn = translateKey('en', 'settings.languageTitle');
  assert.equal(titleId.includes('—'), false);
  assert.equal(titleEn.includes('—'), false);
  assert.match(titleId, /Bahasa/i);
  assert.match(titleEn, /Language/i);
});

test('DICTIONARY contains no em-dashes across all keys in both languages', () => {
  for (const lang of ['id', 'en'] as const) {
    const dict = DICTIONARY[lang];
    for (const [key, value] of Object.entries(dict)) {
      assert.equal(
        value.includes('—'),
        false,
        `Dictionary entry "${key}" in "${lang}" contains forbidden em-dash: "${value}"`
      );
    }
  }
});
