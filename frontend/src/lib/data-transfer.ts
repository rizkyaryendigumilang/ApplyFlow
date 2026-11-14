import type {
  Application,
  CVArtifact,
  Interview,
  CandidateProfile,
  OfferRecord,
  JobLead,
  ApplicationEvent,
} from './pb-types';
import { sanitizeUrl } from './utils';

export interface BackupDataPayload {
  applications: Application[];
  cvs: CVArtifact[];
  interviews: Interview[];
  offers?: OfferRecord[];
  leads?: JobLead[];
  events?: ApplicationEvent[];
  profile?: CandidateProfile | null;
  preferences?: unknown;
}

export function exportApplicationsToCSV(apps: Application[]): string {
  const headers = [
    'Company',
    'Position',
    'Link',
    'Name of Contact',
    'Email/Phone',
    'Location',
    'Type',
    'Mode',
    'Pay',
    'Sent',
    'Status',
    'CV Version',
    'Source',
    'Method',
    'Next Follow-Up',
    'Notes',
  ];

  const escapeCSV = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    let str = String(val).replace(/"/g, '""');
    // Prevent spreadsheet formula injection (=, +, -, @, \t, \r)
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str}"`;
  };

  const rows = apps.map(a => {
    const payFormatted = a.salaryMax > 0 
      ? `${a.salaryMin}-${a.salaryMax} (${a.salaryPeriod})`
      : 'Unspecified';

    return [
      escapeCSV(a.company),
      escapeCSV(a.position),
      escapeCSV(a.link || ''),
      escapeCSV(a.contactName || ''),
      escapeCSV(a.contact || ''),
      escapeCSV(a.location),
      escapeCSV(a.type),
      escapeCSV(a.mode),
      escapeCSV(payFormatted),
      escapeCSV(a.sentAt),
      escapeCSV(a.status),
      escapeCSV(a.cvVersion),
      escapeCSV(a.jobSource || 'Direct'),
      escapeCSV(a.applicationMethod || 'Manual'),
      escapeCSV(a.nextFollowUp || ''),
      escapeCSV(a.notes || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

export function parseCSVToApplications(csvText: string): Partial<Application>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  // Parse header
  const parseRow = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.trim().toLowerCase());
  const companyIdx = headers.findIndex(h => h.includes('company'));
  const positionIdx = headers.findIndex(h => h.includes('position') || h.includes('role'));
  const linkIdx = headers.findIndex(h => h.includes('link') || h.includes('url'));
  const contactNameIdx = headers.findIndex(h => h.includes('name of contact') || h.includes('recruiter'));
  const contactIdx = headers.findIndex(h => h.includes('email') || h.includes('phone') || h.includes('contact'));
  const locationIdx = headers.findIndex(h => h.includes('location'));
  const typeIdx = headers.findIndex(h => h.includes('type'));
  const modeIdx = headers.findIndex(h => h.includes('mode'));
  const sentIdx = headers.findIndex(h => h.includes('sent') || h.includes('date'));
  const statusIdx = headers.findIndex(h => h.includes('status'));

  const parsed: Partial<Application>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    const company = (cols[companyIdx] || '').trim();
    const position = (cols[positionIdx] || '').trim();

    if (!company && !position) continue;

    parsed.push({
      company: company || 'Unknown Company',
      position: position || 'Engineer',
      link: linkIdx >= 0 ? sanitizeUrl(cols[linkIdx]?.trim()) : undefined,
      contactName: contactNameIdx >= 0 ? cols[contactNameIdx]?.trim() : undefined,
      contact: contactIdx >= 0 ? cols[contactIdx]?.trim() : undefined,
      location: (locationIdx >= 0 && cols[locationIdx]?.trim()) || 'Jakarta',
      type: (typeIdx >= 0 && cols[typeIdx]?.includes('Vendor')) ? 'Vendor / Outsource' : 'In-house',
      mode: (modeIdx >= 0 && cols[modeIdx]?.includes('Remote')) ? 'Remote' : (modeIdx >= 0 && cols[modeIdx]?.includes('On-site')) ? 'On-site' : 'Hybrid',
      salaryMin: 0,
      salaryMax: 0,
      salaryPeriod: 'monthly',
      status: (statusIdx >= 0 && ['Applied', 'Viewed', 'Screening', 'Interview', 'Offer', 'Rejected', 'Ghosted'].includes(cols[statusIdx]?.trim())) 
        ? cols[statusIdx].trim() as any 
        : 'Wishlist',
      sentAt: (sentIdx >= 0 && cols[sentIdx]?.trim()) || new Date().toISOString().slice(0, 10),
      cvVersion: 'CV-General-v1',
    });
  }

  return parsed;
}

export function exportFullBackupJSON(data: BackupDataPayload): string {
  const payload = {
    $schema: 'https://junction.local/schemas/career-crm-backup-v1.json',
    app: 'Junction Career CRM',
    version: '1.4.0',
    exportedAt: new Date().toISOString(),
    generator: 'Junction Data Transfer Engine (Client-Side & PocketBase Synced)',
    metadata: {
      totalApplications: data.applications?.length || 0,
      totalInterviews: data.interviews?.length || 0,
      totalOffers: data.offers?.length || 0,
      totalCvs: data.cvs?.length || 0,
      totalLeads: data.leads?.length || 0,
      totalEvents: data.events?.length || 0,
    },
    ...data,
  };
  return JSON.stringify(payload, null, 2);
}

export function exportInterviewsToICS(interviews: Interview[], applications: Application[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Junction Career CRM//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Junction Interviews',
  ];

  const appMap = new Map<string, Application>();
  applications.forEach(a => appMap.set(a.id, a));

  const formatICSDate = (d: Date): string => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  interviews.forEach(interview => {
    if (!interview.scheduledAt) return;
    const start = new Date(interview.scheduledAt);
    if (isNaN(start.getTime())) return;
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default

    const app = appMap.get(interview.application);
    const summary = `${interview.round} Interview - ${app?.company || 'Opportunity'}`;
    const desc = `Role: ${app?.position || 'N/A'}\\nCompany: ${app?.company || 'N/A'}\\nStatus: ${interview.status}\\nQuestions:\\n${(interview.questions || []).join('\\n')}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:junction-interview-${interview.id}@junction.local`);
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    lines.push(`DTSTART:${formatICSDate(start)}`);
    lines.push(`DTEND:${formatICSDate(end)}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${desc}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Layer 1 (Personal CSV) & Real-time Auto-Sync Backup Engine
// ============================================================================

export const AUTO_BACKUP_STORAGE_KEY = 'junction_auto_backup_latest';
export const AUTO_BACKUP_CONFIG_KEY = 'junction_auto_backup_config';

export interface AutoBackupConfig {
  enabled: boolean;
  frequency: 'realtime' | 'daily' | 'weekly';
  defaultFormat: 'csv' | 'json';
  lastSyncedAt?: string;
}

export interface AutoBackupSnapshot {
  timestamp: string;
  applicationCount: number;
  payload: BackupDataPayload;
}

export function getAutoBackupConfig(): AutoBackupConfig {
  try {
    const raw = localStorage.getItem(AUTO_BACKUP_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {
    enabled: true,
    frequency: 'realtime',
    defaultFormat: 'csv',
  };
}

export function saveAutoBackupConfig(cfg: Partial<AutoBackupConfig>): AutoBackupConfig {
  const current = getAutoBackupConfig();
  const updated = { ...current, ...cfg };
  try {
    localStorage.setItem(AUTO_BACKUP_CONFIG_KEY, JSON.stringify(updated));
  } catch (_) {}
  return updated;
}

export function saveAutoBackupSnapshot(data: BackupDataPayload): AutoBackupSnapshot | null {
  const config = getAutoBackupConfig();
  if (!config.enabled) return null;

  try {
    const snapshot: AutoBackupSnapshot = {
      timestamp: new Date().toISOString(),
      applicationCount: data.applications?.length || 0,
      payload: data,
    };
    localStorage.setItem(AUTO_BACKUP_STORAGE_KEY, JSON.stringify(snapshot));
    saveAutoBackupConfig({ lastSyncedAt: snapshot.timestamp });
    return snapshot;
  } catch (err) {
    console.warn('Auto-backup snapshot storage failed', err);
    return null;
  }
}

export function getLatestAutoBackupSnapshot(): AutoBackupSnapshot | null {
  try {
    const raw = localStorage.getItem(AUTO_BACKUP_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

export function downloadLatestAutoBackup(preferredFormat?: 'csv' | 'json') {
  const snapshot = getLatestAutoBackupSnapshot();
  const format = preferredFormat || getAutoBackupConfig().defaultFormat;
  const dateStr = (snapshot?.timestamp ? new Date(snapshot.timestamp) : new Date())
    .toISOString()
    .slice(0, 10);

  if (format === 'csv') {
    const apps = snapshot?.payload?.applications || [];
    const csv = exportApplicationsToCSV(apps);
    triggerDownload(csv, `junction-personal-autobackup-${dateStr}.csv`, 'text/csv');
  } else {
    if (snapshot?.payload) {
      const json = exportFullBackupJSON(snapshot.payload);
      triggerDownload(json, `junction-system-autobackup-${dateStr}.json`, 'application/json');
    }
  }
}

