import { test } from 'node:test';
import assert from 'node:assert';
import { formatICSDate, escapeICSText, generateICS, getGoogleCalendarUrl } from '../ics-calendar.ts';

test('formatICSDate formats correctly to UTC format YYYYMMDDTHHMMSSZ', () => {
  const date = new Date('2026-11-20T10:30:00Z');
  const formatted = formatICSDate(date);
  assert.strictEqual(formatted, '20261120T103000Z');
});

test('escapeICSText properly escapes special characters', () => {
  const input = 'Tokopedia, Platform Team; Room 1\nLine 2';
  const escaped = escapeICSText(input);
  assert.strictEqual(escaped, 'Tokopedia\\, Platform Team\\; Room 1\\nLine 2');
});

test('generateICS produces valid RFC 5545 calendar with alarms', () => {
  const ics = generateICS({
    title: 'Interview: Tokopedia - Platform Engineer',
    description: 'Technical Round 1.\nSiapkan materi Kubernetes.',
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    startDate: '2026-11-25T14:00:00Z',
    durationMinutes: 45,
    alarmMinutesBefore: [30, 10],
  });

  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('VERSION:2.0'));
  assert.ok(ics.includes('SUMMARY:Interview: Tokopedia - Platform Engineer'));
  assert.ok(ics.includes('DTSTART:20261125T140000Z'));
  assert.ok(ics.includes('DTEND:20261125T144500Z'));
  assert.ok(ics.includes('URL:https://meet.google.com/abc-defg-hij'));
  assert.ok(ics.includes('TRIGGER:-PT30M'));
  assert.ok(ics.includes('TRIGGER:-PT10M'));
  assert.ok(ics.includes('END:VCALENDAR'));
});

test('getGoogleCalendarUrl formats URL with all template parameters', () => {
  const url = getGoogleCalendarUrl({
    title: 'GoTo Interview',
    description: 'User Interview',
    location: 'Google Meet',
    startDate: '2026-11-25T10:00:00Z',
    durationMinutes: 60,
  });

  assert.ok(url.startsWith('https://calendar.google.com/calendar/render?'));
  assert.ok(url.includes('action=TEMPLATE'));
  assert.ok(url.includes('text=GoTo+Interview'));
  assert.ok(url.includes('dates=20261125T100000Z%2F20261125T110000Z'));
});

test('generateICS has 0 em-dashes', () => {
  const ics = generateICS({
    title: 'Test Interview',
    startDate: '2026-11-25T10:00:00Z',
  });
  assert.strictEqual(ics.includes('—'), false);
});
