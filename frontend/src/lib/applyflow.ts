export type ApplyFlowMode = 'On-site' | 'Hybrid' | 'Remote' | 'Unknown';

export type ParsedPosition = {
  id: string;
  title: string;
  division: string;
  responsibilities: string[];
  qualifications: string[];
  skills: string[];
};

export type ParsedJobPosting = {
  company: string;
  location: string;
  mode: ApplyFlowMode;
  employmentType: string;
  recruiterName: string;
  recruiterEmail: string;
  subjectInstruction: string;
  requiredDocuments: string[];
  sourcePlatform: string;
  sourceUrl: string;
  positions: ParsedPosition[];
  rawText: string;
};

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const bulletPattern = /^(?:[-*•▪◦]|\d+[.)])\s+/;
const titlePattern = /\b(engineer|developer|architect|analyst|manager|specialist|support|consultant|administrator|admin|lead|supervisor|designer|intern|operator|technician|coordinator)\b/i;
const actionPattern = /^(support|manage|develop|design|work|assist|coordinate|monitor|troubleshoot|maintain|provide|ensure|lead|deliver|handle|perform|responsible|collaborate|document|respond)\b/i;

const cleanLine = (value: string) => value.replace(/\s+/g, ' ').trim();
const unique = (values: string[]) => [...new Set(values.map(cleanLine).filter(Boolean))];

function labelledValue(lines: string[], labels: RegExp) {
  const line = lines.find(item => labels.test(item));
  if (!line) return '';
  return cleanLine(line.replace(labels, '').replace(/^[:\-–—]\s*/, ''));
}

function detectMode(text: string): ApplyFlowMode {
  if (/\b(hybrid)\b/i.test(text)) return 'Hybrid';
  if (/\b(remote|wfh|work from home|fully remote)\b/i.test(text)) return 'Remote';
  if (/\b(wfo|on[- ]site|onsite|work from office)\b/i.test(text)) return 'On-site';
  return 'Unknown';
}

function detectPositions(lines: string[]): ParsedPosition[] {
  const candidates = lines
    .filter(line => bulletPattern.test(line) || titlePattern.test(line))
    .map(line => cleanLine(line.replace(bulletPattern, '')))
    .filter(line => line.length > 3 && line.length < 80)
    .filter(line => line.split(' ').length <= 8 && !actionPattern.test(line) && !/[.!?]$/.test(line))
    .filter(line => !/^(responsibilities|qualifications|requirements|skills|benefits|about us|how to apply)\b/i.test(line));
  const titles = unique(candidates).filter(line => titlePattern.test(line));
  const selected = titles.slice(0, 8);
  return (selected.length ? selected : [lines.find(line => line.length > 3) || 'Target position']).map((title, index) => ({
    id: `position-${index + 1}`,
    title: title.replace(/^(position|posisi|role|job title|jabatan|lowongan)\s*[:\-]\s*/i, ''),
    division: '',
    responsibilities: [],
    qualifications: [],
    skills: [],
  }));
}

function extractList(lines: string[], heading: RegExp) {
  const index = lines.findIndex(line => heading.test(line));
  if (index < 0) return [];
  const values: string[] = [];
  for (const line of lines.slice(index + 1)) {
    if (/^[A-Z][A-Za-z /&-]{2,30}:?$/.test(line) && !bulletPattern.test(line)) break;
    if (bulletPattern.test(line)) values.push(cleanLine(line.replace(bulletPattern, '')));
    if (values.length >= 8) break;
  }
  return unique(values);
}

function extractSubjectInstruction(lines: string[], text: string) {
  const labelled = labelledValue(lines, /^(?:format\s+)?(?:email\s+)?(?:subjek|subject)(?:\s+email)?(?:\s+format)?\s*/i);
  if (labelled) return labelled.replace(/^format\s*/i, '').trim();
  const exact = text.match(/(?:subject|subjek)[^\n]{0,80}[:\-]\s*([^\n]+)/i);
  return exact?.[1]?.trim() || '';
}

export function parseJobPosting(rawText: string): ParsedJobPosting {
  const raw = rawText.trim();
  const lines = raw.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const emails = unique(raw.match(emailPattern) || []);
  const company = labelledValue(lines, /^(?:company|perusahaan|client)\s*/i) || lines.find(line => /^(pt|cv|inc\.?|株式会社|company\b)/i.test(line)) || '';
  const location = labelledValue(lines, /^(?:location|lokasi|based in|penempatan)\s*/i) || (/(jakarta|bandung|surabaya|batam|singapore|kuala lumpur)/i.exec(raw)?.[1] || '');
  const recruiterName = labelledValue(lines, /^(?:recruiter|contact person|pic|hiring manager)\s*/i);
  const requiredDocuments = unique([
    /\b(updated|latest|terbaru)\s+cv\b/i.test(raw) ? 'Updated CV' : '',
    /\bcv\b/i.test(raw) ? 'CV / Resume' : '',
    /\bportfolio\b/i.test(raw) ? 'Portfolio' : '',
    /\b(certificate|sertifikat)\b/i.test(raw) ? 'Certificate' : '',
  ]);
  const responsibilities = extractList(lines, /^(responsibilities|tanggung jawab|job description)\b/i);
  const qualifications = extractList(lines, /^(qualifications|requirements|kualifikasi|persyaratan)\b/i);
  const positions = detectPositions(lines).map(position => ({
    ...position,
    responsibilities,
    qualifications,
    skills: unique(raw.match(/\b(?:Linux|AWS|Azure|GCP|Docker|Kubernetes|SQL|Python|Java|ITIL|Terraform|React|TypeScript|networking|troubleshooting|incident management)\b/gi) || []),
  }));

  return {
    company,
    location,
    mode: detectMode(raw),
    employmentType: labelledValue(lines, /^(?:employment|type|tipe kerja|status)\s*/i),
    recruiterName,
    recruiterEmail: emails[0] || '',
    subjectInstruction: extractSubjectInstruction(lines, raw),
    requiredDocuments,
    sourcePlatform: '',
    sourceUrl: '',
    positions,
    rawText: raw,
  };
}

export type MatchGroup = { group: string; evidence: string };

export function matchAgainstEvidence(position: ParsedPosition, evidence: string) {
  const facts = evidence.toLowerCase();
  const requirements = unique([...position.skills, ...position.qualifications]).slice(0, 12);
  return requirements.map(requirement => {
    const requirementWords = requirement.toLowerCase().split(/[^a-z0-9+#.-]+/).filter(word => word.length > 2);
    const matchedWords = requirementWords.filter(word => facts.includes(word)).length;
    const group = matchedWords === requirementWords.length && matchedWords > 0 ? 'Supported' : matchedWords > 0 ? 'Partial' : 'Not documented';
    return {
      requirement,
      group,
      evidence: group === 'Supported' ? 'Matched to the evidence you entered.' : group === 'Partial' ? 'Some related words matched the evidence you entered; review the connection.' : 'No supporting evidence entered yet; this is not proof that you lack the skill.',
    } satisfies MatchGroup & { requirement: string };
  });
}

export type EmailLanguage = 'id' | 'en';

export function buildSubject(
  job: ParsedJobPosting,
  position: ParsedPosition,
  lang: EmailLanguage = 'id'
) {
  if (job.subjectInstruction) return job.subjectInstruction.replace(/Nama[_ ]Posisi(?: yang dilamar)?/i, position.title);
  if (lang === 'id') {
    return `Lamaran: ${position.title}${job.company ? ` | ${job.company}` : ''}`;
  }
  return `Application: ${position.title}${job.company ? ` | ${job.company}` : ''}`;
}

export function buildEmail(
  job: ParsedJobPosting,
  position: ParsedPosition,
  candidateName: string,
  evidence: string,
  cvLabel: string,
  lang: EmailLanguage = 'id'
) {
  const highlights = evidence.split(/\r?\n|[•;]/).map(cleanLine).filter(Boolean).slice(0, 4);

  if (lang === 'id') {
    const greeting = job.recruiterName
      ? `Yth. ${job.recruiterName},`
      : job.company
      ? `Yth. Tim Rekrutmen ${job.company},`
      : 'Yth. Tim Rekrutmen,';

    const opening = `Melalui surat ini, saya bermaksud mengajukan lamaran untuk posisi ${position.title}${
      job.company ? ` di ${job.company}` : ''
    }. Berdasarkan latar belakang dan pengalaman kerja yang relevan, saya siap berkontribusi secara nyata bagi tim Anda.`;

    const highlightText = highlights.length
      ? `Berikut rangkuman kualifikasi dan rekam jejak saya yang relevan:\n${highlights
          .map(item => `- ${item}`)
          .join('\n')}`
      : 'Saya menyambut baik kesempatan untuk mendiskusikan pengalaman terverifikasi serta nilai tambah yang dapat saya bawa ke posisi ini.';

    const attachment = cvLabel
      ? `Bersama surat ini, saya melampirkan berkas CV ${cvLabel} untuk bahan pertimbangan Anda.`
      : 'Bersama surat ini, saya melampirkan berkas CV terbaru untuk bahan pertimbangan Anda.';

    const portfolioText = job.requiredDocuments.includes('Portfolio')
      ? ' Saya juga menyertakan portofolio kerja sesuai persyaratan yang dicantumkan.'
      : '';

    const closing =
      'Terima kasih atas waktu dan kesempatan yang diberikan. Saya sangat terbuka untuk tahapan wawancara guna mendiskusikan kualifikasi saya lebih mendalam.';

    const signoff = `Hormat saya,\n${candidateName || 'Nama Pelamar'}`;

    return `${greeting}\n\n${opening}\n\n${highlightText}\n\n${attachment}${portfolioText}\n\n${closing}\n\n${signoff}`;
  }

  const greeting = job.recruiterName ? `Dear ${job.recruiterName},` : 'Dear Recruitment Team,';
  const opening = `I am writing to express my strong interest in the ${position.title}${
    job.company ? ` position at ${job.company}` : ''
  }. Based on my background and verified experience, I would welcome the opportunity to contribute to your team.`;
  const highlightText = highlights.length
    ? `Relevant qualifications and verified experience from my profile:\n${highlights
        .map(item => `- ${item}`)
        .join('\n')}`
    : 'I would welcome the opportunity to discuss the verified experience and strengths I can bring to this role.';
  const attachment = cvLabel
    ? `I have attached my ${cvLabel} CV for your consideration.`
    : 'I will attach the most relevant CV version before sending.';
  const portfolioText = job.requiredDocuments.includes('Portfolio')
    ? ' I will also include my portfolio as requested.'
    : '';
  const closing =
    'Thank you for your time and consideration. I would be glad to discuss how my background aligns with this opportunity in an interview.';
  const signoff = `Best regards,\n${candidateName || 'Your Name'}`;

  return `${greeting}\n\n${opening}\n\n${highlightText}\n\n${attachment}${portfolioText}\n\n${closing}\n\n${signoff}`;
}

export function validateDraft(job: ParsedJobPosting, position: ParsedPosition, subject: string, body: string, cvLabel: string) {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!job.company) warnings.push('Company is not confirmed.');
  if (!position.title) errors.push('Select or enter a target position.');
  if (!subject.trim()) errors.push('Subject is required.');
  if (!body.trim()) errors.push('Email body is required.');
  if (/\[.*?\]|\{\{.*?\}\}|undefined|null/i.test(`${subject}\n${body}`)) errors.push('Remove unresolved placeholders before preparing this email.');
  if (job.requiredDocuments.length && !cvLabel) warnings.push('Select the requested CV before preparing the email.');
  if (!job.recruiterEmail) warnings.push('No recruiter email was found. Do not invent one; use the listed application channel.');
  if (job.recruiterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(job.recruiterEmail)) errors.push('The recruiter email format looks invalid. Correct it or leave it empty.');
  return { errors, warnings };
}
