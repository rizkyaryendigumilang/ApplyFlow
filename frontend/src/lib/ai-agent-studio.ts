import type { CandidateProfile, Application, CVArtifact } from './pb-types';
import { extractSkillsFromText, extractStatedSalary } from './job-hunter';

// Tech Equivalence Graph for Partial / Transferable Matching
export const TECH_EQUIVALENCE_MAP: { [key: string]: string[] } = {
  kubernetes: ['k8s', 'helm', 'docker', 'openshift', 'containerization'],
  k8s: ['kubernetes', 'helm', 'docker'],
  golang: ['go'],
  go: ['golang'],
  postgresql: ['postgres', 'mysql', 'sql', 'rdbms'],
  postgres: ['postgresql', 'mysql', 'sql'],
  aws: ['gcp', 'azure', 'cloud infrastructure', 'cloud'],
  gcp: ['aws', 'azure', 'cloud infrastructure', 'cloud'],
  azure: ['aws', 'gcp', 'cloud infrastructure', 'cloud'],
  'github actions': ['gitlab ci', 'gitlab', 'jenkins', 'ci/cd', 'argo cd'],
  'gitlab ci': ['github actions', 'jenkins', 'ci/cd', 'argo cd'],
  gitlab: ['github actions', 'jenkins', 'ci/cd'],
  jenkins: ['gitlab ci', 'github actions', 'ci/cd'],
  terraform: ['opentofu', 'ansible', 'pulumi', 'iac', 'cloudformation'],
  prometheus: ['grafana', 'opentelemetry', 'datadog', 'elk', 'observability'],
  grafana: ['prometheus', 'opentelemetry', 'datadog', 'observability'],
  react: ['next.js', 'typescript', 'frontend'],
  'next.js': ['react', 'typescript', 'frontend'],
  python: ['bash', 'scripting', 'automation'],
};

export interface RawJobInput {
  id: string;
  title: string;
  company: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  rawJd: string;
  sourceUrl?: string;
}

export interface RankedJobLead {
  input: RawJobInput;
  matchScore: number;
  tier: 'tier_1_high' | 'tier_2_moderate' | 'tier_3_dealbreaker';
  matchedSkills: string[];
  equivalentSkills: { requested: string; candidateHas: string }[];
  missingSkills: string[];
  dealbreakers: string[];
  roleAlignment: number;
  salaryVerdict?: string;
  summary: string;
}

export interface DrafterOutput {
  tailoredSubject: string;
  draftCoverLetter: string;
  recommendedCvLabel: string;
  highlightedBullets: string[];
}

export interface ReviewerCritique {
  atsKeywordScore: number; // 0 - 100%
  atsMatchedKeywords: string[];
  atsMissingKeywords: string[];
  impactScore: number; // 0 - 100% (presence of metrics/KPIs)
  antiSlopScore: number; // 0 - 100% (absence of AI cliches)
  detectedSlopPhrases: string[];
  reviewerFeedback: string[];
  refinedLetter: string;
}

export interface StarQuestionPrep {
  id: string;
  category: 'System Architecture' | 'Production Incident' | 'Conflict & Priority' | 'Motivation & Fit';
  question: string;
  star: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  interviewerLooksFor: string;
}

// 1. Batch Fit Ranking Engine (/rank)
export function rankJobBatch(
  jobs: RawJobInput[],
  profile: CandidateProfile
): RankedJobLead[] {
  const candidateSkillsLower = (profile.skills || []).map(s => s.toLowerCase().trim());
  const targetRolesLower = (profile.targetRoles || []).map(r => r.toLowerCase().trim());

  const ranked: RankedJobLead[] = jobs.map(job => {
    const jdLower = job.rawJd.toLowerCase();
    const titleLower = job.title.toLowerCase();

    // Dealbreaker check
    const dealbreakers: string[] = [];
    for (const db of profile.dealbreakers || []) {
      const dbLower = db.toLowerCase().trim();
      if (dbLower && jdLower.includes(dbLower)) {
        dealbreakers.push(db);
      }
    }
    if (/\b(judi|slot|casino|gambling|taruhan)\b/i.test(jdLower)) {
      dealbreakers.push('Industri Judi / Gambling terdeteksi');
    }
    if (profile.preferredModes.includes('Remote') && !profile.preferredModes.includes('On-site')) {
      if (/\b(100%\s*on-?site|strictly\s*wfo|must\s*work\s*from\s*office)\b/i.test(jdLower)) {
        dealbreakers.push('Wajib 100% WFO / On-site');
      }
    }

    // Salary check
    const statedSalary = extractStatedSalary(job.rawJd);
    let salaryVerdict: string | undefined;
    if (statedSalary && statedSalary.max && profile.minSalary) {
      if (statedSalary.max < profile.minSalary) {
        dealbreakers.push(`Gaji maksimal (Rp ${(statedSalary.max / 1000000).toFixed(1)}M) di bawah batas minimum (Rp ${(profile.minSalary / 1000000).toFixed(1)}M)`);
      } else {
        salaryVerdict = `Rp ${(statedSalary.min || 0) / 1000000}M - ${(statedSalary.max || 0) / 1000000}M (Memenuhi syarat)`;
      }
    }

    // Skill extraction & matching with Equivalence
    const jdSkills = extractSkillsFromText(job.rawJd, profile.skills);
    const matchedSkills: string[] = [];
    const equivalentSkills: { requested: string; candidateHas: string }[] = [];
    const missingSkills: string[] = [];

    for (const jdSkill of jdSkills) {
      const jdSkillLower = jdSkill.toLowerCase();
      if (candidateSkillsLower.includes(jdSkillLower)) {
        matchedSkills.push(jdSkill);
      } else {
        // Check equivalence map
        const equivalents = TECH_EQUIVALENCE_MAP[jdSkillLower] || [];
        const foundEquiv = equivalents.find(eq => candidateSkillsLower.includes(eq));
        if (foundEquiv) {
          equivalentSkills.push({ requested: jdSkill, candidateHas: foundEquiv });
        } else {
          missingSkills.push(jdSkill);
        }
      }
    }

    // Title / Seniority alignment
    let roleAlignment = 50;
    for (const tr of targetRolesLower) {
      if (titleLower.includes(tr) || tr.includes(titleLower)) {
        roleAlignment = 100;
        break;
      }
      const words = tr.split(/\s+/);
      const matched = words.filter(w => titleLower.includes(w));
      if (matched.length > 0) {
        roleAlignment = Math.max(roleAlignment, Math.round((matched.length / words.length) * 85));
      }
    }

    // Score calculation
    const totalJdSkills = jdSkills.length || 1;
    const effectiveSkillScore = Math.round(
      ((matchedSkills.length * 1.0 + equivalentSkills.length * 0.75) / totalJdSkills) * 100
    );

    let matchScore = Math.round(effectiveSkillScore * 0.55 + roleAlignment * 0.35 + 10);
    matchScore = Math.min(100, Math.max(10, matchScore));

    if (dealbreakers.length > 0) {
      matchScore = Math.min(35, matchScore);
    }

    let tier: RankedJobLead['tier'] = 'tier_2_moderate';
    if (dealbreakers.length > 0 || matchScore < 55) {
      tier = 'tier_3_dealbreaker';
    } else if (matchScore >= 80) {
      tier = 'tier_1_high';
    }

    const summary = `${matchedSkills.length} skill cocok langsung, ${equivalentSkills.length} transferable, ${missingSkills.length} belum tercover.`;

    return {
      input: job,
      matchScore,
      tier,
      matchedSkills,
      equivalentSkills,
      missingSkills,
      dealbreakers,
      roleAlignment,
      salaryVerdict,
      summary,
    };
  });

  // Sort descending by score
  return ranked.sort((a, b) => b.matchScore - a.matchScore);
}

// 2. Drafter Agent (/apply Step A)
export function runDrafterAgent(
  job: RawJobInput,
  ranked: RankedJobLead,
  profile: CandidateProfile,
  cvs: CVArtifact[]
): DrafterOutput {
  const company = job.company;
  const role = job.title;
  const topSkills = ranked.matchedSkills.slice(0, 4);

  // Pick best CV
  const bestCv = cvs.length > 0 ? cvs[0].label : 'CV-Engineering-v3 (Infrastructure)';

  const bullets = [
    `Dirancang & mengelola sistem produksi dengan performa tinggi berbasis ${topSkills.join(', ') || 'modern cloud architecture'}.`,
    `Mengotomatisasi deployment pipeline CI/CD yang memangkas waktu rilis dari harian menjadi hitungan menit.`,
    `Berpengalaman menjaga reliability dan observability sistem dengan standar SLA 99.95%+ uptime.`,
  ];

  const draftCoverLetter = `Yth. Tim Rekruter & Engineering Manager ${company},

Saya menulis surat ini untuk menyampaikan ketertarikan profesional saya pada posisi ${role} di ${company}.

Berdasarkan deskripsi tantangan teknis yang Anda butuhkan, pengalaman saya dalam membangun dan mengoptimalkan infrastruktur berbasis ${topSkills.join(', ')} sangat selaras dengan kebutuhan tim Anda saat ini. Pada penempatan sebelumnya, saya memimpin transformasi kehandalan sistem yang berhasil meningkatkan efisiensi deployment dan stabilitas layanan di lingkungan produksi.

Berikut beberapa pencapaian terukur yang relevan:
• ${bullets[0]}
• ${bullets[1]}
• ${bullets[2]}

Saya sangat antusias untuk berdiskusi lebih mendalam mengenai bagaimana saya dapat berkontribusi langsung pada pencapaian roadmap engineering di ${company}.

Terima kasih atas waktu dan perhatian Bapak/Ibu.

Hormat saya,
${profile.headline?.split(' ')[0] || 'Kandidat'}`;

  return {
    tailoredSubject: `Aplikasi Peran: ${role} – ${profile.headline || 'Senior Engineer'}`,
    draftCoverLetter,
    recommendedCvLabel: bestCv,
    highlightedBullets: bullets,
  };
}

// 3. Reviewer Agent (/apply Step B - Quality & Anti-Slop Audit)
const AI_SLOP_PHRASES = [
  'tapestry',
  'testament to',
  'delve into',
  'thrilled to apply',
  'deeply passionate',
  'dynamic team',
  'synergy',
  'in today’s fast-paced world',
  'holistic approach',
  'spearheaded a vast array',
];

export function runReviewerAgent(
  job: RawJobInput,
  drafterOutput: DrafterOutput,
  ranked: RankedJobLead
): ReviewerCritique {
  const draftLower = drafterOutput.draftCoverLetter.toLowerCase();

  // 1. ATS Keyword Density
  const jdSkills = extractSkillsFromText(job.rawJd);
  const matchedAts: string[] = [];
  const missingAts: string[] = [];

  for (const s of jdSkills) {
    if (draftLower.includes(s.toLowerCase())) {
      matchedAts.push(s);
    } else {
      missingAts.push(s);
    }
  }

  const atsScore = jdSkills.length > 0 ? Math.round((matchedAts.length / jdSkills.length) * 100) : 85;

  // 2. Impact Evidence (presence of numbers, percentages, SLAs)
  const hasNumbers = /\b\d+(?:%|\.\d+x|\+|ms|m|k)\b/i.test(drafterOutput.draftCoverLetter);
  const impactScore = hasNumbers ? 90 : 50;

  // 3. Anti-Slop Audit
  const detectedSlop: string[] = [];
  for (const slop of AI_SLOP_PHRASES) {
    if (draftLower.includes(slop)) {
      detectedSlop.push(slop);
    }
  }
  const antiSlopScore = Math.max(30, 100 - detectedSlop.length * 25);

  const feedback: string[] = [];
  if (missingAts.length > 0) {
    feedback.push(`Tambahkan kata kunci ATS esensial: ${missingAts.slice(0, 3).join(', ')}.`);
  }
  if (!hasNumbers) {
    feedback.push('Perkuat klaim teknis dengan metrik kuantitatif (misal % efisiensi atau SLA uptime).');
  }
  if (detectedSlop.length > 0) {
    feedback.push(`Hapus frasa klise AI yang terdeteksi: "${detectedSlop.join('", "')}".`);
  }
  if (feedback.length === 0) {
    feedback.push('Draf sangat bersih, profesional, berorientasi dampak, dan siap dikirim.');
  }

  // Generate refined letter addressing gaps
  let refined = drafterOutput.draftCoverLetter;
  if (missingAts.length > 0) {
    refined = refined.replace(
      'kebutuhan tim Anda saat ini.',
      `kebutuhan tim Anda saat ini, termasuk implementasi ${missingAts.slice(0, 2).join(' dan ')}.`
    );
  }

  return {
    atsKeywordScore: atsScore,
    atsMatchedKeywords: matchedAts,
    atsMissingKeywords: missingAts,
    impactScore,
    antiSlopScore,
    detectedSlopPhrases: detectedSlop,
    reviewerFeedback: feedback,
    refinedLetter: refined,
  };
}

// 4. STAR Interview Simulator (/interview)
export function generateStarInterviewPrep(
  job: RawJobInput,
  ranked: RankedJobLead,
  profile: CandidateProfile
): StarQuestionPrep[] {
  const topSkill = ranked.matchedSkills[0] || 'Cloud Infrastructure';
  const secondSkill = ranked.matchedSkills[1] || 'Microservices Architecture';
  const role = job.title;

  return [
    {
      id: 'q-1',
      category: 'System Architecture',
      question: `Bagaimana Anda merancang arsitektur sistem ${topSkill} yang mampu menangani lonjakan trafik tinggi dengan toleransi kegagalan (high availability)?`,
      interviewerLooksFor: 'Pemahaman trade-off skalabilitas, redundancy, decoupled architecture, dan cost-efficiency.',
      star: {
        situation: `Saat mengelola infrastruktur produksi yang melayani jutaan request dengan bottleneck pada proses deployment dan database connection pool.`,
        task: `Bertanggung jawab merekayasa ulang arsitektur sistem berbasis ${topSkill} agar tahan failover tanpa downtime tak terencana.`,
        action: `Mengimplementasikan clustering multi-zone, auto-scaling policy berbasis metrik real-time, circuit breaker, serta caching layer menggunakan Redis.`,
        result: `Mencapai SLA uptime 99.98% dan memangkas latency p99 sebesar 35% saat peak event.`,
      },
    },
    {
      id: 'q-2',
      category: 'Production Incident',
      question: `Ceritakan pengalaman Anda menangani insiden kritis (P1/Sev-1) saat sistem down di produksi. Bagaimana proses RCA (Root Cause Analysis)-nya?`,
      interviewerLooksFor: 'Ketenangan saat krisis, ketegasan isolasi masalah, komunikasi dengan stakeholder, dan budaya blameless post-mortem.',
      star: {
        situation: `Terjadi alert lonjakan error rate 5xx hingga 12% setelah jadwal rilis malam hari pada service utama.`,
        task: `Memimpin incident command untuk mengidentifikasi penyebab, mitigasi secepat mungkin, dan menyusun laporan insiden.`,
        action: `Segera melakukan traffic rerouting dan rollback otomatis via canary deployment, menganalisis log terpusat, dan menemukan deadlock koneksi.`,
        result: `Layanan pulih dalam 8 menit; menyusun automated healthcheck dan regression test baru untuk mencegah pengulangan.`,
      },
    },
    {
      id: 'q-3',
      category: 'Conflict & Priority',
      question: `Pernahkah Anda berbeda pandangan dengan Product Manager atau tim developer mengenai timeline rilis vs. technical debt? Bagaimana solusinya?`,
      interviewerLooksFor: 'Keseimbangan antara kecepatan bisnis (time-to-market) dengan stabilitas dan keamanan jangka panjang.',
      star: {
        situation: `Product team ingin segera merilis fitur baru dalam 2 minggu, sementara fondasi ${secondSkill} masih memiliki celah keamanan dan utang teknis kritis.`,
        task: `Menemukan titik temu agar rilis bisnis tidak tertunda tanpa mengorbankan keamanan sistem produksi.`,
        action: `Mempresentasikan matriks risiko secara transparan, lalu memecah rilis menjadi 2 fase: MVP dengan guardrail ketat, diikuti sprint hardening teknis.`,
        result: `Fitur meluncur tepat waktu dan utang teknis selesai dalam sprint berikutnya dengan zero regression bug.`,
      },
    },
    {
      id: 'q-4',
      category: 'Motivation & Fit',
      question: `Mengapa Anda tertarik bergabung dengan ${job.company} sebagai ${role}, dan apa ekspektasi kontribusi Anda dalam 90 hari pertama?`,
      interviewerLooksFor: 'Riset tentang produk perusahaan, motivasi intrinsik, dan rencana kerja 30-60-90 hari yang terstruktur.',
      star: {
        situation: `Mengamati pertumbuhan produk ${job.company} dan tantangan skalabilitas engineering yang sedang dihadapi.`,
        task: `Menjadi akselerator bagi kapabilitas tim engineering untuk mengeksekusi roadmap teknologi secara konsisten.`,
        action: `Dalam 30 hari pertama: memetakan arsitektur dan pain point; 60 hari: optimasi pipeline CI/CD dan reliabilitas; 90 hari: rilis perbaikan arsitektur pertama.`,
        result: `Memberikan dampak nyata pada developer velocity dan kehandalan platform sejak kuartal pertama.`,
      },
    },
  ];
}
