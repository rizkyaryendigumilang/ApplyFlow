import test from 'node:test';
import assert from 'node:assert/strict';
import { cn } from '../cn.ts';
import { sanitizeUrl } from '../utils.ts';

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

test('sanitizeUrl allows safe https and mailto URLs', () => {
  assert.equal(sanitizeUrl('https://example.com'), 'https://example.com');
  assert.equal(sanitizeUrl('http://example.com'), 'http://example.com');
  assert.equal(sanitizeUrl('mailto:recruiter@example.com'), 'mailto:recruiter@example.com');
  assert.equal(sanitizeUrl('linkedin.com/in/recruiter'), 'https://linkedin.com/in/recruiter');
});

test('sanitizeUrl neutralizes dangerous javascript: and data: URLs', () => {
  assert.equal(sanitizeUrl('javascript:alert(1)'), '#');
  assert.equal(sanitizeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='), '#');
  assert.equal(sanitizeUrl('//evil.com/payload'), '#');
  assert.equal(sanitizeUrl(''), '');
});
