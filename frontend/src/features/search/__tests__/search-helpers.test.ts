import { test } from 'node:test';
import assert from 'node:assert';
import { filterAndSortApplications, type FilterParams } from '../search-helpers.ts';
import type { Application } from '../../../lib/pb-types.ts';

const mockApplications: Application[] = [
  {
    id: 'app-1',
    company: 'TechCorp Indonesia',
    position: 'Senior Frontend Engineer',
    location: 'Jakarta',
    type: 'In-house',
    mode: 'Remote',
    salaryMin: 25000000,
    salaryMax: 35000000,
    salaryPeriod: 'monthly',
    status: 'Interview',
    sentAt: '2026-03-01',
    cvVersion: 'CV-v1',
    owner: 'user-1',
    created: '2026-03-01',
    updated: '2026-03-01',
  },
  {
    id: 'app-2',
    company: 'Fintech Nusantara',
    position: 'Fullstack Developer',
    location: 'Bandung',
    type: 'Startup',
    mode: 'Hybrid',
    salaryMin: 18000000,
    salaryMax: 24000000,
    salaryPeriod: 'monthly',
    status: 'Applied',
    sentAt: '2026-01-10', // Stale > 7 days
    cvVersion: 'CV-v2',
    owner: 'user-1',
    created: '2026-01-10',
    updated: '2026-01-10',
  },
  {
    id: 'app-3',
    company: 'Alpha Global Labs',
    position: 'React Specialist',
    location: 'Singapore / Remote',
    type: 'Consulting',
    mode: 'Remote',
    salaryMin: 40000000,
    salaryMax: 60000000,
    salaryPeriod: 'monthly',
    status: 'Offer',
    sentAt: '2026-03-10',
    cvVersion: 'CV-v3',
    owner: 'user-1',
    created: '2026-03-10',
    updated: '2026-03-10',
  },
];

const defaultParams: FilterParams = {
  query: '',
  selectedStatus: 'all',
  selectedMode: 'all',
  sortBy: 'newest',
  savedView: null,
};

test('filterAndSortApplications matches text query across company and position', () => {
  const result = filterAndSortApplications(mockApplications, {
    ...defaultParams,
    query: 'Fintech',
  });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].company, 'Fintech Nusantara');

  const roleResult = filterAndSortApplications(mockApplications, {
    ...defaultParams,
    query: 'frontend',
  });
  assert.strictEqual(roleResult.length, 1);
  assert.strictEqual(roleResult[0].id, 'app-1');
});

test('filterAndSortApplications filters by status correctly', () => {
  const result = filterAndSortApplications(mockApplications, {
    ...defaultParams,
    selectedStatus: 'Interview',
  });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].status, 'Interview');
});

test('filterAndSortApplications filters by work mode (Remote/Hybrid)', () => {
  const remoteResult = filterAndSortApplications(mockApplications, {
    ...defaultParams,
    selectedMode: 'Remote',
  });
  assert.strictEqual(remoteResult.length, 2);

  const hybridResult = filterAndSortApplications(mockApplications, {
    ...defaultParams,
    selectedMode: 'Hybrid',
  });
  assert.strictEqual(hybridResult.length, 1);
  assert.strictEqual(hybridResult[0].company, 'Fintech Nusantara');
});

test('filterAndSortApplications sorts by highest salary descending', () => {
  const result = filterAndSortApplications(mockApplications, {
    ...defaultParams,
    sortBy: 'salary-desc',
  });
  assert.strictEqual(result[0].company, 'Alpha Global Labs'); // 60jt
  assert.strictEqual(result[1].company, 'TechCorp Indonesia'); // 35jt
  assert.strictEqual(result[2].company, 'Fintech Nusantara'); // 24jt
});

test('filterAndSortApplications handles saved view needs-followup correctly', () => {
  const result = filterAndSortApplications(mockApplications, {
    ...defaultParams,
    savedView: 'needs-followup',
  });
  // app-2 is Applied > 7 days ago
  assert.ok(result.some((a) => a.id === 'app-2'));
});
