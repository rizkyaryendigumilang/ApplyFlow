/**
 * RFC 5545 Compliant iCalendar (.ics) Generator & Calendar Integration
 * Clean, lightweight, 100% client-side compatible with Apple Calendar, Google Calendar, Outlook, and Android.
 */

export interface ICSEventInput {
  title: string;
  description?: string;
  location?: string;
  meetingUrl?: string;
  startDate: string | Date;
  durationMinutes?: number;
  alarmMinutesBefore?: number[];
}

/**
 * Format Date to UTC timestamp in iCalendar format: YYYYMMDDTHHMMSSZ
 */
export function formatICSDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape text for iCalendar standards according to RFC 5545
 */
export function escapeICSText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n');
}

/**
 * Generate full RFC 5545 .ics file content
 */
export function generateICS(event: ICSEventInput): string {
  const startDate = typeof event.startDate === 'string' ? new Date(event.startDate) : event.startDate;
  const duration = event.durationMinutes || 60;
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const dtStamp = formatICSDate(new Date());
  const dtStart = formatICSDate(startDate);
  const dtEnd = formatICSDate(endDate);

  const uid = `applyflow-interview-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@applyflow.app`;
  const summary = escapeICSText(event.title);
  const description = escapeICSText(event.description || '');
  const location = escapeICSText(event.location || event.meetingUrl || '');
  const alarms = event.alarmMinutesBefore || [30, 10];

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ApplyFlow//Career CRM & Interview Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${description}`);
  }
  if (location) {
    lines.push(`LOCATION:${location}`);
  }
  if (event.meetingUrl) {
    lines.push(`URL:${event.meetingUrl}`);
  }
  lines.push('STATUS:CONFIRMED');

  // Add notification reminders (VALARM)
  for (const alarm of alarms) {
    lines.push(
      'BEGIN:VALARM',
      `TRIGGER:-PT${alarm}M`,
      'ACTION:DISPLAY',
      `DESCRIPTION:Pengingat: ${summary} (${alarm} menit lagi)`,
      'END:VALARM'
    );
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Trigger download of .ics file directly in browser
 */
export function downloadICSFile(filename: string, icsContent: string): void {
  const cleanFilename = filename.toLowerCase().endsWith('.ics') ? filename : `${filename}.ics`;
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL for 1-click addition without file download
 */
export function getGoogleCalendarUrl(event: ICSEventInput): string {
  const startDate = typeof event.startDate === 'string' ? new Date(event.startDate) : event.startDate;
  const duration = event.durationMinutes || 60;
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const startUtc = formatICSDate(startDate);
  const endUtc = formatICSDate(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startUtc}/${endUtc}`,
  });

  if (event.description) {
    params.set('details', event.description);
  }
  if (event.location || event.meetingUrl) {
    params.set('location', event.location || event.meetingUrl || '');
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
