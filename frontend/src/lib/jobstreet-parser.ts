import type { ApplicationEventType } from './pb-types';

export interface ExtractedJobStreetNotification {
  company: string;
  position: string;
  eventType: ApplicationEventType;
  confidence: number;
  evidenceSnippet: string;
}

export function parseJobStreetNotification(text: string): ExtractedJobStreetNotification | null {
  // Cap max text length to 30,000 chars to prevent ReDoS and memory exhaustion attacks
  const clean = (text || '').slice(0, 30000).trim();
  if (!clean) return null;

  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  const searchLines = lines.slice(0, 10);

  // Check Patterns across searchLines
  for (const line of searchLines) {
    // Pattern 1 (Indonesian): "{Company} telah melihat lamaranmu untuk {Position}"
    const m1 = line.match(/^(?:.*?(?:subject|subjek):\s*)?(.*?)\s+telah\s+melihat\s+lamaranmu\s+untuk\s+(.*?)$/i);
    if (m1) {
      return {
        company: m1[1].trim(),
        position: m1[2].trim(),
        eventType: 'employer_viewed',
        confidence: 95,
        evidenceSnippet: line,
      };
    }

    // Pattern 2 (English): "{Company} viewed your application for {Position}"
    const m2 = line.match(/^(?:.*?(?:subject|subjek):\s*)?(.*?)\s+viewed\s+your\s+application\s+for\s+(.*?)$/i);
    if (m2) {
      return {
        company: m2[1].trim(),
        position: m2[2].trim(),
        eventType: 'employer_viewed',
        confidence: 95,
        evidenceSnippet: line,
      };
    }

    const m2b = line.match(/application\s+for\s+(.*?)\s+at\s+(.*?)\s+(?:was|has\s+been)\s+viewed/i);
    if (m2b) {
      return {
        company: m2b[2].trim(),
        position: m2b[1].trim(),
        eventType: 'employer_viewed',
        confidence: 95,
        evidenceSnippet: line,
      };
    }

    // Pattern 3: Interview Invitation
    const m3 = line.match(/undangan\s+(?:interview|wawancara).*?di\s+(.*?)\s+untuk\s+(.*?)$/i) ||
               line.match(/(?:interview\s+invitation|undangan\s+interview)\s*[-:]?\s*(.*?)\s*[-–]\s*(.*?)$/i);
    if (m3) {
      return {
        company: m3[1].trim(),
        position: m3[2].trim(),
        eventType: 'interview_invited',
        confidence: 90,
        evidenceSnippet: line,
      };
    }

    // Pattern 4: Application Submitted / Received
    const m4 = line.match(/(?:lamaranmu\s+untuk\s+(.*?)\s+di\s+(.*?)\s+berhasil\s+dikirim|application\s+received\s+for\s+(.*?)\s+at\s+(.*?))$/i);
    if (m4) {
      return {
        company: (m4[2] || m4[4]).trim(),
        position: (m4[1] || m4[3]).trim(),
        eventType: 'application_submitted',
        confidence: 90,
        evidenceSnippet: line,
      };
    }
  }

  // Pattern 5: Generic extraction by searching keywords across text
  let eventType: ApplicationEventType = 'employer_viewed';
  if (/interview|wawancara/i.test(clean)) eventType = 'interview_invited';
  else if (/tidak\s*lolos|regret\s*to\s*inform|unsuccessful/i.test(clean)) eventType = 'rejection_received';
  else if (/kontak|hubungi|contacted/i.test(clean)) eventType = 'recruiter_contacted';

  // Try to find company and position lines
  let company = '';
  let position = '';
  for (const line of lines) {
    if (!company && /^(PT\b|CV\b|Company:?)/i.test(line)) {
      company = line.replace(/^Company:?\s*/i, '').trim();
    }
    if (!position && /^(Position:?|Role:?|Jabatan:?)/i.test(line)) {
      position = line.replace(/^(Position|Role|Jabatan):?\s*/i, '').trim();
    }
  }

  if (company && position) {
    return {
      company,
      position,
      eventType,
      confidence: 80,
      evidenceSnippet: clean.slice(0, 160),
    };
  }

  // Fallback if at least company-like entity is in first line
  return {
    company: lines[0]?.slice(0, 40) || 'JobStreet Partner',
    position: 'Position to Confirm',
    eventType,
    confidence: 60,
    evidenceSnippet: clean.slice(0, 160),
  };
}
