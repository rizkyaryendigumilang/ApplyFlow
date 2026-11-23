import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadStoredScrapedJobs,
  saveStoredScrapedJobs,
  addScrapedJobItem,
  addBatchScrapedJobItems,
  removeScrapedJobItem,
  markScrapedJobAsSavedItem,
  SCRAPED_JOBS_STORAGE_KEY,
  type ScrapedJob,
} from '../useScrapedJobs.ts';

function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] || null,
    length: store.size,
  } as unknown as Storage;
}

test('loadStoredScrapedJobs returns empty array when storage is empty or malformed', () => {
  const storage = createMockStorage();
  assert.deepEqual(loadStoredScrapedJobs(storage), []);

  storage.setItem(SCRAPED_JOBS_STORAGE_KEY, 'invalid json {{{');
  assert.deepEqual(loadStoredScrapedJobs(storage), []);
});

test('addScrapedJobItem creates a new job and prevents duplicates', () => {
  const initial: ScrapedJob[] = [];
  const { next, added } = addScrapedJobItem(
    initial,
    'https://id.jobstreet.com/job/12345678',
    'Senior Frontend Engineer',
    'Tech Corp'
  );

  assert.ok(added);
  assert.equal(next.length, 1);
  assert.equal(added.platform, 'Jobstreet');
  assert.equal(added.title, 'Senior Frontend Engineer');
  assert.equal(added.company, 'Tech Corp');
  assert.equal(added.isSavedToPipeline, false);

  // Attempt duplicate addition
  const dupResult = addScrapedJobItem(next, 'https://id.jobstreet.com/job/12345678/');
  assert.equal(dupResult.added, null);
  assert.equal(dupResult.next.length, 1);
});

test('addBatchScrapedJobItems parses text and adds only new unique jobs', () => {
  const existingJob: ScrapedJob = {
    id: 'job-1',
    url: 'https://www.linkedin.com/jobs/view/1000',
    title: 'Data Analyst',
    company: 'LinkedIn',
    platform: 'LinkedIn',
    domain: 'linkedin.com',
    createdAt: new Date().toISOString(),
    isSavedToPipeline: false,
  };

  const rawText = `
    Kumpulan link:
    - https://www.linkedin.com/jobs/view/1000 (sudah ada)
    - https://boards.greenhouse.io/fintech/jobs/2000
    - https://jobs.lever.co/startup/3000
  `;

  const { next, added } = addBatchScrapedJobItems([existingJob], rawText);
  assert.equal(added.length, 2);
  assert.equal(next.length, 3);
  assert.ok(added.some((j) => j.platform === 'Greenhouse'));
  assert.ok(added.some((j) => j.platform === 'Lever'));
});

test('removeScrapedJobItem and markScrapedJobAsSavedItem update list accurately', () => {
  const jobs: ScrapedJob[] = [
    {
      id: 'job-a',
      url: 'https://example.com/job/a',
      title: 'DevOps',
      company: 'A Corp',
      platform: 'Other',
      domain: 'example.com',
      createdAt: new Date().toISOString(),
      isSavedToPipeline: false,
    },
    {
      id: 'job-b',
      url: 'https://example.com/job/b',
      title: 'SRE',
      company: 'B Corp',
      platform: 'Other',
      domain: 'example.com',
      createdAt: new Date().toISOString(),
      isSavedToPipeline: false,
    },
  ];

  const marked = markScrapedJobAsSavedItem(jobs, 'job-a');
  assert.equal(marked.find((j) => j.id === 'job-a')?.isSavedToPipeline, true);
  assert.equal(marked.find((j) => j.id === 'job-b')?.isSavedToPipeline, false);

  const removed = removeScrapedJobItem(marked, 'job-b');
  assert.equal(removed.length, 1);
  assert.equal(removed[0].id, 'job-a');
});

test('saveStoredScrapedJobs persists items into storage', () => {
  const storage = createMockStorage();
  const sampleJobs: ScrapedJob[] = [
    {
      id: 'job-x',
      url: 'https://example.com/job/x',
      title: 'Cloud Architect',
      company: 'Cloud Corp',
      platform: 'Other',
      domain: 'example.com',
      createdAt: new Date().toISOString(),
      isSavedToPipeline: false,
    },
  ];

  saveStoredScrapedJobs(sampleJobs, storage);
  const loaded = loadStoredScrapedJobs(storage);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].title, 'Cloud Architect');
});
