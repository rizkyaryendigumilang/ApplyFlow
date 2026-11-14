import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateOutreachMessage,
  generateConnectionNote,
  generateLinkedInHeadlines,
  generateLinkedInAbout,
  sanitizeAntiSlop,
} from '../linkedin-templates.ts';

test('sanitizeAntiSlop removes em-dashes and robotic phrases', () => {
  const dirty = 'I am passionate — a game-changer in cutting-edge tech — ready to delve in.';
  const clean = sanitizeAntiSlop(dirty);
  assert.equal(clean.includes('—'), false);
  assert.equal(clean.includes('game-changer'), false);
  assert.equal(clean.includes('delve'), false);
});

test('generateOutreachMessage produces 1st-person, anti-slop text for peer referral', () => {
  const msg = generateOutreachMessage({
    company: 'Gojek',
    role: 'Senior Frontend Engineer',
    persona: 'peer',
    degree: '1st',
    lang: 'id',
    candidate: {
      fullName: 'Rizky',
      currentRole: 'Frontend Engineer',
      skills: ['React', 'TypeScript', 'Tailwind'],
      yearsExperience: 4,
    },
  });

  assert.equal(msg.includes('—'), false);
  assert.match(msg, /Gojek/);
  assert.match(msg, /Senior Frontend Engineer/);
  assert.match(msg, /referral/i);
  assert.match(msg, /React/);
});

test('generateOutreachMessage supports English recruiter outreach', () => {
  const msg = generateOutreachMessage({
    company: 'Stripe',
    role: 'Staff Engineer',
    persona: 'recruiter',
    degree: '2nd',
    lang: 'en',
    candidate: {
      fullName: 'Alex',
      currentRole: 'Senior Engineer',
      skills: ['Distributed Systems', 'Go'],
      yearsExperience: 6,
    },
  });

  assert.equal(msg.includes('—'), false);
  assert.match(msg, /Stripe/);
  assert.match(msg, /Staff Engineer/);
  assert.match(msg, /recruiter|talent|role|team/i);
});

test('generateConnectionNote strictly stays <= 300 characters without em-dash', () => {
  const note = generateConnectionNote({
    company: 'Traveloka',
    role: 'Product Lead',
    candidate: {
      fullName: 'Rizky Pratama',
      currentRole: 'Senior Product Designer',
      skills: ['UX', 'System Design', 'User Research'],
      yearsExperience: 5,
    },
    lang: 'id',
  });

  assert.equal(note.includes('—'), false);
  assert.ok(note.length <= 300, `Note length ${note.length} exceeded 300 characters limit`);
  assert.ok(note.length > 20, 'Note should not be empty');
});

test('generateOutreachMessage handles empty/missing profile fields gracefully', () => {
  const msg = generateOutreachMessage({
    company: '',
    role: '',
    persona: 'lead',
    degree: '2nd',
    lang: 'en',
    candidate: {
      fullName: '',
      currentRole: '',
      skills: [],
      yearsExperience: 0,
    },
  });

  assert.equal(msg.includes('undefined'), false);
  assert.equal(msg.includes('—'), false);
  assert.ok(msg.length > 30);
});

test('generateLinkedInHeadlines returns 3 punchy options without slop', () => {
  const headlines = generateLinkedInHeadlines({
    role: 'Full Stack Developer',
    skills: ['Node.js', 'React', 'PostgreSQL'],
    yearsExperience: 5,
  });

  assert.equal(headlines.length, 3);
  for (const h of headlines) {
    assert.equal(h.includes('—'), false);
    assert.ok(h.length > 10);
  }
});

test('generateLinkedInAbout generates a clean first-person summary', () => {
  const about = generateLinkedInAbout({
    fullName: 'Rizky',
    currentRole: 'Software Engineer',
    skills: ['TypeScript', 'Go', 'Cloud'],
    yearsExperience: 4,
    lang: 'id',
  });

  assert.equal(about.includes('—'), false);
  assert.match(about, /TypeScript/);
});
