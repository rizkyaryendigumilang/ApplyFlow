import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRadarAlerts,
  calculateFunnelStats,
  type RadarApp,
  type RadarInterview,
  type RadarLead,
} from '../cockpit-helpers.ts';

test('calculateRadarAlerts correctly identifies stale applications over 7 days old', () => {
  const apps: RadarApp[] = [
    { id: '1', company: 'Tokopedia', position: 'Frontend', status: 'Applied', sentAt: '2026-11-01' },
    { id: '2', company: 'Gojek', position: 'Backend', status: 'Applied', sentAt: new Date().toISOString().slice(0, 10) },
    { id: '3', company: 'Shopee', position: 'Lead', status: 'Wishlist', sentAt: '2026-10-01' },
  ];

  const alerts = calculateRadarAlerts(apps, [], []);
  assert.equal(alerts.staleApplications.length, 1);
  assert.equal(alerts.staleApplications[0].company, 'Tokopedia');
});

test('calculateRadarAlerts identifies upcoming interviews within 48 hours', () => {
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  const nextMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

  const interviews: RadarInterview[] = [
    { id: 'i1', company: 'Traveloka', scheduledAt: tomorrow, stage: 'Technical' },
    { id: 'i2', company: 'Stripe', scheduledAt: nextMonth, stage: 'Final' },
  ];

  const alerts = calculateRadarAlerts([], interviews, []);
  assert.equal(alerts.upcomingInterviews.length, 1);
  assert.equal(alerts.upcomingInterviews[0].company, 'Traveloka');
});

test('calculateRadarAlerts identifies high-match leads (>= 80%) in inbox', () => {
  const leads: RadarLead[] = [
    { id: 'l1', company: 'ByteDance', title: 'Senior Engineer', matchScore: 92, status: 'inbox' },
    { id: 'l2', company: 'Grab', title: 'Junior Engineer', matchScore: 65, status: 'inbox' },
    { id: 'l3', company: 'Agoda', title: 'Staff', matchScore: 95, status: 'archived' },
  ];

  const alerts = calculateRadarAlerts([], [], leads);
  assert.equal(alerts.highMatchLeads.length, 1);
  assert.equal(alerts.highMatchLeads[0].company, 'ByteDance');
});

test('calculateFunnelStats computes correct counts and response rate', () => {
  const apps: RadarApp[] = [
    { id: '1', company: 'A', position: 'P1', status: 'Wishlist', sentAt: '2026-11-10' },
    { id: '2', company: 'B', position: 'P2', status: 'Applied', sentAt: '2026-11-10' },
    { id: '3', company: 'C', position: 'P3', status: 'Screening', sentAt: '2026-11-10' },
    { id: '4', company: 'D', position: 'P4', status: 'Interview', sentAt: '2026-11-10' },
    { id: '5', company: 'E', position: 'P5', status: 'Offer', sentAt: '2026-11-10' },
  ];

  const stats = calculateFunnelStats(apps);
  assert.equal(stats.wishlistCount, 1);
  assert.equal(stats.appliedCount, 1);
  assert.equal(stats.interviewCount, 1);
  assert.equal(stats.offerCount, 1);
  // (Screening + Interview + Offer) / (Applied + Screening + Interview + Offer) = 3 / 4 = 75%
  assert.equal(stats.responseRatePercent, 75);
});
