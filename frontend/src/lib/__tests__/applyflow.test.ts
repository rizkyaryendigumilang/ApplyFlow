import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseJobPosting,
  matchAgainstEvidence,
  buildSubject,
  buildEmail,
  validateDraft,
  type ParsedJobPosting,
  type ParsedPosition,
} from '../applyflow.ts';

const samplePosting = `
PT Teknologi Nusantara Jaya
Posisi: DevOps Engineer
Lokasi: Jakarta Selatan
Mode kerja: Hybrid (3 hari WFO, 2 hari WFH)
Tipe kerja: Penuh Waktu
Hiring Manager: Ibu Siti Rahma
Email tujuan: hrd.recruitment@teknologinusantara.co.id
Format subjek email: Lamaran_Nama_Posisi yang dilamar

Kualifikasi:
- Pengalaman minimal 3 tahun dengan Linux dan Docker
- Menguasai cloud AWS atau GCP
- Memahami konsep CI/CD dan troubleshooting sistem
- Melampirkan updated CV dan Portfolio proyek
`;

test('parseJobPosting extracts company, location, mode, and recruiter info', () => {
  const parsed = parseJobPosting(samplePosting);

  assert.strictEqual(parsed.company, 'PT Teknologi Nusantara Jaya');
  assert.strictEqual(parsed.location, 'Jakarta Selatan');
  assert.strictEqual(parsed.mode, 'Hybrid');
  assert.strictEqual(parsed.recruiterEmail, 'hrd.recruitment@teknologinusantara.co.id');
  assert.strictEqual(parsed.recruiterName, 'Ibu Siti Rahma');
  assert.strictEqual(parsed.subjectInstruction, 'Lamaran_Nama_Posisi yang dilamar');
  assert.ok(parsed.requiredDocuments.includes('Updated CV'));
  assert.ok(parsed.requiredDocuments.includes('Portfolio'));
  assert.ok(parsed.positions.length > 0);
  assert.strictEqual(parsed.positions[0].title, 'DevOps Engineer');
  assert.ok(parsed.positions[0].skills.includes('Linux'));
  assert.ok(parsed.positions[0].skills.includes('Docker'));
  assert.ok(parsed.positions[0].skills.includes('AWS'));
});

test('parseJobPosting detects Remote and On-site modes accurately', () => {
  const remotePost = parseJobPosting('Perusahaan Global Tech\nJob: Frontend Developer\nMode: 100% Remote WFH');
  assert.strictEqual(remotePost.mode, 'Remote');

  const onsitePost = parseJobPosting('PT Bank Mandiri Sejahtera\nJob: Network Administrator\nPenempatan: On-site Jakarta Pusat WFO');
  assert.strictEqual(onsitePost.mode, 'On-site');

  const unknownPost = parseJobPosting('PT Contoh Anonim\nDicari: Staff IT\nSegera kirim berkas');
  assert.strictEqual(unknownPost.mode, 'Unknown');
});

test('matchAgainstEvidence categorizes qualifications into Supported, Partial, and Not documented', () => {
  const position: ParsedPosition = {
    id: 'pos-1',
    title: 'Cloud Engineer',
    division: 'Engineering',
    responsibilities: [],
    qualifications: ['Pengalaman Linux server', 'Menguasai Kubernetes cluster', 'Sertifikasi AWS Solutions Architect'],
    skills: ['Linux', 'Docker', 'Kubernetes'],
  };

  const evidence = `
    Memelihara Linux Ubuntu server selama 3 tahun di produksi
    Menggunakan Docker untuk containerization service
  `;

  const matches = matchAgainstEvidence(position, evidence);
  assert.ok(matches.length > 0);

  const linuxMatch = matches.find(m => m.requirement.toLowerCase().includes('linux'));
  assert.ok(linuxMatch);
  assert.strictEqual(linuxMatch.group, 'Supported');

  const k8sMatch = matches.find(m => m.requirement.toLowerCase().includes('kubernetes'));
  assert.ok(k8sMatch);
  assert.strictEqual(k8sMatch.group, 'Not documented');
});

test('buildSubject formats subject according to custom instruction or default language', () => {
  const jobWithInstruction: ParsedJobPosting = {
    company: 'PT Maju Bersama',
    location: 'Jakarta',
    mode: 'Hybrid',
    employmentType: 'Full-time',
    recruiterName: 'Bapak Budi',
    recruiterEmail: 'hr@majubersama.com',
    subjectInstruction: 'Lamaran_Nama Pelamar_Nama Posisi',
    requiredDocuments: ['CV / Resume'],
    sourcePlatform: 'LinkedIn',
    sourceUrl: 'https://linkedin.com/jobs/123',
    positions: [],
    rawText: '',
  };

  const position: ParsedPosition = {
    id: 'pos-1',
    title: 'System Engineer',
    division: '',
    responsibilities: [],
    qualifications: [],
    skills: [],
  };

  // With instruction
  const subjectWithInstr = buildSubject(jobWithInstruction, position, 'id');
  assert.strictEqual(subjectWithInstr, 'Lamaran_Nama Pelamar_System Engineer');

  // Without instruction - Indonesian
  const jobWithoutInstruction = { ...jobWithInstruction, subjectInstruction: '' };
  const subjectId = buildSubject(jobWithoutInstruction, position, 'id');
  assert.strictEqual(subjectId, 'Lamaran: System Engineer | PT Maju Bersama');

  // Without instruction - English
  const subjectEn = buildSubject(jobWithoutInstruction, position, 'en');
  assert.strictEqual(subjectEn, 'Application: System Engineer | PT Maju Bersama');
});

test('buildEmail generates professional bilingual emails with zero em-dashes and strict KBBI', () => {
  const job: ParsedJobPosting = {
    company: 'PT Finansial Digital Nusantara',
    location: 'Jakarta',
    mode: 'Remote',
    employmentType: 'Full-time',
    recruiterName: 'Siti Rahma',
    recruiterEmail: 'siti@findig.id',
    subjectInstruction: '',
    requiredDocuments: ['CV / Resume', 'Portfolio'],
    sourcePlatform: 'LinkedIn',
    sourceUrl: '',
    positions: [],
    rawText: '',
  };

  const position: ParsedPosition = {
    id: 'pos-1',
    title: 'Lead DevOps Engineer',
    division: '',
    responsibilities: [],
    qualifications: [],
    skills: [],
  };

  const evidence = 'Pengalaman 4 tahun mengelola cluster Kubernetes di AWS\nOtomasi CI/CD dengan GitHub Actions';

  // Indonesian email
  const emailId = buildEmail(job, position, 'Rizky Aryendi', evidence, 'Technical Resume v2', 'id');
  assert.ok(emailId.includes('Yth. Siti Rahma,'));
  assert.ok(emailId.includes('Lead DevOps Engineer'));
  assert.ok(emailId.includes('PT Finansial Digital Nusantara'));
  assert.ok(emailId.includes('Technical Resume v2'));
  assert.ok(emailId.includes('portofolio'));
  assert.ok(emailId.includes('Hormat saya,\nRizky Aryendi'));
  assert.strictEqual(emailId.includes('\u2014'), false, 'Indonesian email must not contain em-dash');
  assert.strictEqual(emailId.includes('\u2013'), false, 'Indonesian email must not contain en-dash');

  // English email
  const emailEn = buildEmail(job, position, 'Rizky Aryendi', evidence, 'Technical Resume v2', 'en');
  assert.ok(emailEn.includes('Dear Siti Rahma,'));
  assert.ok(emailEn.includes('Lead DevOps Engineer'));
  assert.ok(emailEn.includes('PT Finansial Digital Nusantara'));
  assert.ok(emailEn.includes('Best regards,\nRizky Aryendi'));
  assert.strictEqual(emailEn.includes('\u2014'), false, 'English email must not contain em-dash');
  assert.strictEqual(emailEn.includes('\u2013'), false, 'English email must not contain en-dash');
});

test('validateDraft detects missing fields, unreplaced placeholders, and bad email addresses', () => {
  const validJob: ParsedJobPosting = {
    company: 'PT Solusi Pratama',
    location: 'Bandung',
    mode: 'Hybrid',
    employmentType: 'Full-time',
    recruiterName: '',
    recruiterEmail: 'hr@solusipratama.com',
    subjectInstruction: '',
    requiredDocuments: ['CV / Resume'],
    sourcePlatform: '',
    sourceUrl: '',
    positions: [],
    rawText: '',
  };

  const validPos: ParsedPosition = {
    id: 'p-1',
    title: 'Frontend Developer',
    division: '',
    responsibilities: [],
    qualifications: [],
    skills: [],
  };

  // Valid draft
  const validResult = validateDraft(validJob, validPos, 'Lamaran Frontend', 'Pesan pengantar yang lengkap', 'CV v1');
  assert.strictEqual(validResult.errors.length, 0);

  // Missing title & body
  const emptyPos = { ...validPos, title: '' };
  const invalidResult = validateDraft(validJob, emptyPos, '', '', 'CV v1');
  assert.ok(invalidResult.errors.includes('Select or enter a target position.'));
  assert.ok(invalidResult.errors.includes('Subject is required.'));
  assert.ok(invalidResult.errors.includes('Email body is required.'));

  // Unresolved placeholder
  const placeholderResult = validateDraft(validJob, validPos, 'Lamaran [Posisi]', 'Halo {{name}} undefined', 'CV v1');
  assert.ok(placeholderResult.errors.some(e => e.includes('Remove unresolved placeholders')));

  // Malformed email
  const badEmailJob = { ...validJob, recruiterEmail: 'not-an-email' };
  const badEmailResult = validateDraft(badEmailJob, validPos, 'Lamaran', 'Isi', 'CV v1');
  assert.ok(badEmailResult.errors.some(e => e.includes('recruiter email format looks invalid')));

  // Warning when company is empty
  const noCompanyJob = { ...validJob, company: '' };
  const noCompanyResult = validateDraft(noCompanyJob, validPos, 'Lamaran', 'Isi', 'CV v1');
  assert.ok(noCompanyResult.warnings.includes('Company is not confirmed.'));
});
