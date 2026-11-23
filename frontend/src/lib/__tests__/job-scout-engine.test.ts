import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildJobstreetSearchUrl,
  buildLinkedInSearchUrl,
  buildGlintsSearchUrl,
  buildCustomPlatformSearchUrl,
  parseJobUrlHeuristics,
  parseBatchJobUrls,
  calculateScoutFitScore,
  CURATED_TECH_VACANCIES,
  DEFAULT_PLATFORM_PRESETS,
  type JobPlatformPreset,
} from '../job-scout-engine.ts';
import type { CandidateProfile } from '../pb-types.ts';

const mockProfile: CandidateProfile = {
  id: 'test-cand',
  owner: 'user-1',
  fullName: 'Rizky Aryendi Gumilang',
  headline: 'Technical Consultant Analyst | Data & System Engineer',
  targetRoles: ['Technical Consultant Analyst', 'Data Analyst', 'Data Engineer', 'DevOps'],
  skills: ['Python', 'MySQL', 'APM', 'Linux', 'Docker', 'Kubernetes'],
  certifications: ['AWS Cloud Practitioner'],
  languages: ['Indonesian', 'English'],
  minSalary: 12000000,
  preferredModes: ['Remote', 'Hybrid'],
  dealbreakers: ['Gaji di bawah minimum'],
  experienceSummary: 'Experienced consultant and system engineer',
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
};

test('buildJobstreetSearchUrl formats query, location, and remote filter properly', () => {
  const url = buildJobstreetSearchUrl('DevOps Engineer', 'Jakarta', 'Remote');
  assert.ok(url.includes('id.jobstreet.com'));
  assert.ok(url.includes('devops-engineer-jobs'));
  assert.ok(url.includes('in-jakarta') || url.includes('where=Jakarta'));
});

test('buildLinkedInSearchUrl formats keywords, location, and remote parameter', () => {
  const url = buildLinkedInSearchUrl('Data Engineer', 'Indonesia', 'Remote');
  assert.ok(url.includes('linkedin.com/jobs/search'));
  assert.ok(url.includes('keywords=Data%20Engineer') || url.includes('keywords=Data+Engineer'));
  assert.ok(url.includes('f_WT=2'));
});

test('buildGlintsSearchUrl formats keyword search for Indonesian market', () => {
  const url = buildGlintsSearchUrl('Technical Consultant', 'Indonesia');
  assert.ok(url.includes('glints.com/id/opportunities/jobs/explore'));
  assert.ok(url.includes('Technical'));
  assert.ok(url.includes('country=ID'));
});

test('parseJobUrlHeuristics safely extracts platform and metadata from job URL', () => {
  const jsUrl = 'https://id.jobstreet.com/job/78912345?type=standout';
  const parsedJs = parseJobUrlHeuristics(jsUrl);
  assert.equal(parsedJs.platform, 'Jobstreet');
  assert.equal(parsedJs.isValid, true);

  const liUrl = 'https://www.linkedin.com/jobs/view/123456789/';
  const parsedLi = parseJobUrlHeuristics(liUrl);
  assert.equal(parsedLi.platform, 'LinkedIn');
  assert.equal(parsedLi.isValid, true);

  const ghUrl = 'https://boards.greenhouse.io/traveloka/jobs/4567890';
  const parsedGh = parseJobUrlHeuristics(ghUrl);
  assert.equal(parsedGh.platform, 'Greenhouse');
  assert.equal(parsedGh.suggestedCompany, 'Traveloka');
  assert.equal(parsedGh.isValid, true);

  const leverUrl = 'https://jobs.lever.co/tokopedia/1234-abcd-5678';
  const parsedLever = parseJobUrlHeuristics(leverUrl);
  assert.equal(parsedLever.platform, 'Lever');
  assert.equal(parsedLever.suggestedCompany, 'Tokopedia');
  assert.equal(parsedLever.isValid, true);

  const invalid = parseJobUrlHeuristics('not-a-valid-url');
  assert.equal(invalid.isValid, false);
});

test('parseBatchJobUrls extracts, sanitizes, and deduplicates multiple job links', () => {
  const mixedText = `
    Halo, ini kumpulan lowongan minggu ini:
    1. https://id.jobstreet.com/job/11111111?source=share.
    2. https://www.linkedin.com/jobs/view/22222222/
    3. Cek juga di https://boards.greenhouse.io/acme-corp/jobs/33333333;
    4. Duplikat: https://id.jobstreet.com/job/11111111
    Dan teks biasa tanpa link.
  `;

  const extracted = parseBatchJobUrls(mixedText);
  assert.equal(extracted.length, 3, 'Should extract exactly 3 unique valid URLs');
  assert.equal(extracted[0].platform, 'Jobstreet');
  assert.equal(extracted[0].url, 'https://id.jobstreet.com/job/11111111?source=share');
  assert.equal(extracted[1].platform, 'LinkedIn');
  assert.equal(extracted[2].platform, 'Greenhouse');
  assert.equal(extracted[2].company, 'Acme Corp');
});

test('parseBatchJobUrls handles empty or invalid text safely', () => {
  assert.deepEqual(parseBatchJobUrls(''), []);
  assert.deepEqual(parseBatchJobUrls('hanya teks biasa tanpa link http atau https'), []);
});

test('calculateScoutFitScore returns high match for aligned tech roles and skills', () => {
  const alignedVacancy = {
    title: 'Senior DevOps & System Engineer',
    company: 'Fintech Enterprise',
    skills: ['Linux', 'Docker', 'Kubernetes', 'Python'],
    salaryMin: 15000000,
    salaryMax: 22000000,
    workMode: 'Hybrid' as const,
  };

  const fit = calculateScoutFitScore(alignedVacancy, mockProfile);
  assert.ok(fit.score >= 80, `Expected fit score >= 80, got ${fit.score}`);
  assert.equal(fit.isHighMatch, true);
  assert.ok(fit.matchedSkills.length >= 2);
});

test('DEFAULT_PLATFORM_PRESETS contains standard Indonesian job boards', () => {
  const ids = DEFAULT_PLATFORM_PRESETS.map((p) => p.id);
  assert.ok(ids.includes('jobstreet'));
  assert.ok(ids.includes('linkedin'));
  assert.ok(ids.includes('glints'));
  assert.ok(ids.includes('indeed'));
  assert.ok(ids.includes('kalibrr'));
  assert.ok(ids.includes('dealls'));
});

test('buildCustomPlatformSearchUrl interpolates query and location tokens correctly', () => {
  const customPreset: JobPlatformPreset = {
    id: 'test-portal',
    name: 'Portal Test',
    urlTemplate: 'https://karir.example.com/search?posisi={query}&kota={location}',
    isCustom: true,
  };

  const url = buildCustomPlatformSearchUrl(customPreset, 'Software Engineer', 'Jakarta');
  assert.ok(url.includes('karir.example.com/search'));
  assert.ok(url.includes('posisi=Software%20Engineer') || url.includes('posisi=Software+Engineer'));
  assert.ok(url.includes('kota=Jakarta'));
});

test('buildCustomPlatformSearchUrl handles URLs without placeholder tokens gracefully', () => {
  const simplePreset: JobPlatformPreset = {
    id: 'bca-career',
    name: 'BCA Career',
    urlTemplate: 'https://karir.bca.co.id/peluang-kerja',
    isCustom: true,
  };

  const url = buildCustomPlatformSearchUrl(simplePreset, 'Data Analyst', 'Jakarta');
  assert.ok(url.startsWith('https://karir.bca.co.id/peluang-kerja'));
  assert.ok(url.includes('q=Data%20Analyst') || url.includes('q=Data+Analyst'));
});

test('CURATED_TECH_VACANCIES contains zero em-dashes and valid IDR numbers', () => {
  assert.ok(CURATED_TECH_VACANCIES.length >= 4);
  for (const v of CURATED_TECH_VACANCIES) {
    assert.ok(v.title.length > 0);
    assert.ok(v.company.length > 0);
    assert.ok(v.salaryMin >= 8000000);
    assert.ok(v.url.startsWith('https://'));
    assert.equal(v.title.includes('\u2014'), false);
    assert.equal(v.description.includes('\u2014'), false);
  }
});
