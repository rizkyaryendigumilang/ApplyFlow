import type { Application } from '../../lib/pb-types';

export const daysSince = (date: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));

export type SortOption = 'newest' | 'salary-desc' | 'company-asc' | 'urgent';

export interface FilterParams {
  query: string;
  selectedStatus: string;
  selectedMode: string;
  sortBy: SortOption;
  savedView: string | null;
}

export function filterAndSortApplications(
  applications: Application[],
  params: FilterParams
): Application[] {
  const { query, selectedStatus, selectedMode, sortBy, savedView } = params;
  const q = query.toLowerCase().trim();

  return applications
    .filter((app) => {
      // Query match
      const matchesQuery =
        !q ||
        app.company.toLowerCase().includes(q) ||
        app.position.toLowerCase().includes(q) ||
        app.location.toLowerCase().includes(q) ||
        Boolean(app.notes && app.notes.toLowerCase().includes(q));

      // Status match
      const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;

      // Mode match
      const matchesMode = selectedMode === 'all' || app.mode === selectedMode;

      // Saved view constraint
      let matchesSaved = true;
      if (savedView === 'needs-followup') {
        const isStale = ['Applied', 'Viewed'].includes(app.status) && daysSince(app.sentAt) >= 7;
        const isDue = Boolean(app.nextFollowUp && new Date(app.nextFollowUp).getTime() <= Date.now());
        matchesSaved = Boolean(isStale || isDue);
      } else if (savedView === 'interviews') {
        matchesSaved = app.status === 'Interview';
      } else if (savedView === 'remote-only') {
        matchesSaved = app.mode === 'Remote';
      }

      return matchesQuery && matchesStatus && matchesMode && matchesSaved;
    })
    .sort((a, b) => {
      if (sortBy === 'salary-desc') {
        return (b.salaryMax || 0) - (a.salaryMax || 0);
      }
      if (sortBy === 'company-asc') {
        return a.company.localeCompare(b.company);
      }
      if (sortBy === 'urgent') {
        const aUrgent = a.status === 'Interview' ? 2 : a.nextFollowUp ? 1 : 0;
        const bUrgent = b.status === 'Interview' ? 2 : b.nextFollowUp ? 1 : 0;
        return bUrgent - aUrgent;
      }
      // newest
      return new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime();
    });
}
