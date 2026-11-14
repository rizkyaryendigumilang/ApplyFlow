export interface RadarApp {
  id: string;
  company: string;
  position: string;
  status: string;
  sentAt?: string;
  location?: string;
  notes?: string;
}

export interface RadarInterview {
  id: string;
  company?: string;
  scheduledAt?: string;
  stage?: string;
  prepNotes?: string;
}

export interface RadarLead {
  id: string;
  company: string;
  title: string;
  matchScore: number;
  status: string;
}

export interface RadarAlerts {
  staleApplications: RadarApp[];
  upcomingInterviews: RadarInterview[];
  highMatchLeads: RadarLead[];
}

export interface FunnelStats {
  wishlistCount: number;
  appliedCount: number;
  screeningCount: number;
  interviewCount: number;
  offerCount: number;
  rejectedCount: number;
  responseRatePercent: number;
}

/**
 * Calculates days passed since a given ISO date string.
 */
export function getDaysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / (1000 * 3600 * 24)));
}

/**
 * Evaluates high-urgency radar items that need attention within 48h.
 */
export function calculateRadarAlerts(
  applications: RadarApp[],
  interviews: RadarInterview[],
  jobLeads: RadarLead[]
): RadarAlerts {
  const staleApplications = (applications || []).filter((app) => {
    if (app.status === 'Applied') {
      return getDaysSince(app.sentAt) >= 7;
    }
    if (app.status === 'Screening') {
      return getDaysSince(app.sentAt) >= 10;
    }
    return false;
  });

  const now = Date.now();
  const next48Hours = now + 48 * 3600 * 1000;

  const upcomingInterviews = (interviews || []).filter((item) => {
    if (!item.scheduledAt) return false;
    const time = new Date(item.scheduledAt).getTime();
    if (isNaN(time)) return false;
    return time >= now - 2 * 3600 * 1000 && time <= next48Hours;
  });

  const highMatchLeads = (jobLeads || []).filter((lead) => {
    return lead.status === 'inbox' && (lead.matchScore || 0) >= 80;
  });

  return {
    staleApplications,
    upcomingInterviews,
    highMatchLeads,
  };
}

/**
 * Computes conversion funnel stats and response rate.
 */
export function calculateFunnelStats(applications: RadarApp[]): FunnelStats {
  let wishlist = 0;
  let applied = 0;
  let screening = 0;
  let interview = 0;
  let offer = 0;
  let rejected = 0;

  for (const app of applications || []) {
    switch (app.status) {
      case 'Wishlist':
        wishlist++;
        break;
      case 'Applied':
        applied++;
        break;
      case 'Viewed':
        applied++;
        break;
      case 'Screening':
        screening++;
        break;
      case 'Interview':
        interview++;
        break;
      case 'Offer':
        offer++;
        break;
      case 'Rejected':
        rejected++;
        break;
    }
  }

  const activePursuits = applied + screening + interview + offer;
  const positiveResponses = screening + interview + offer;
  const responseRatePercent =
    activePursuits > 0 ? Math.round((positiveResponses / activePursuits) * 100) : 0;

  return {
    wishlistCount: wishlist,
    appliedCount: applied,
    screeningCount: screening,
    interviewCount: interview,
    offerCount: offer,
    rejectedCount: rejected,
    responseRatePercent,
  };
}
