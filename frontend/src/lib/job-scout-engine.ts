import type { CandidateProfile } from './pb-types';

export type JobPlatform =
  | 'Jobstreet'
  | 'LinkedIn'
  | 'Glints'
  | 'Kalibrr'
  | 'Indeed'
  | 'Dealls'
  | 'Greenhouse'
  | 'Lever'
  | 'Workday'
  | 'Other';

export interface ExtractedJobLink {
  id: string;
  url: string;
  title: string;
  company: string;
  platform: JobPlatform;
  domain: string;
  createdAt: string;
  notes?: string;
}

export interface JobPlatformPreset {
  id: string;
  name: string;
  urlTemplate: string;
  isCustom?: boolean;
  domain?: string;
  description?: string;
}

export const DEFAULT_PLATFORM_PRESETS: JobPlatformPreset[] = [
  {
    id: 'jobstreet',
    name: 'Jobstreet Indonesia',
    urlTemplate: 'https://id.jobstreet.com/id/job-search/{query}-jobs/in-{location}',
    domain: 'id.jobstreet.com',
    description: 'Portal lowongan kerja terdepan dengan ribuan posisi enterprise dan korporat',
    isCustom: false,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Jobs',
    urlTemplate: 'https://www.linkedin.com/jobs/search/?keywords={query}&location={location}',
    domain: 'linkedin.com',
    description: 'Jejaring profesional global dengan lowongan tech, remote, dan multinational company',
    isCustom: false,
  },
  {
    id: 'glints',
    name: 'Glints Indonesia',
    urlTemplate: 'https://glints.com/id/opportunities/jobs/explore?keyword={query}&country=ID&locationName={location}',
    domain: 'glints.com',
    description: 'Platform karir teknologi terkemuka untuk startup dan perusahaan berkembang di Asia Tenggara',
    isCustom: false,
  },
  {
    id: 'indeed',
    name: 'Indeed Indonesia',
    urlTemplate: 'https://id.indeed.com/jobs?q={query}&l={location}',
    domain: 'id.indeed.com',
    description: 'Mesin pencari lowongan kerja global dengan ribuan lowongan teknis dan operasional',
    isCustom: false,
  },
  {
    id: 'kalibrr',
    name: 'Kalibrr',
    urlTemplate: 'https://www.kalibrr.com/job-board/te/{query}/in/{location}',
    domain: 'kalibrr.com',
    description: 'Pusat rekrutmen perbankan, FMCG, BUMN, dan perusahaan multinasional di Indonesia',
    isCustom: false,
  },
  {
    id: 'dealls',
    name: 'Dealls',
    urlTemplate: 'https://dealls.com/jobs?search={query}',
    domain: 'dealls.com',
    description: 'Platform job portal dan mentoring karir terkurasi untuk talenta teknologi terdepan',
    isCustom: false,
  },
];

export interface ScoutVacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  salaryMin: number;
  salaryMax: number;
  platform: JobPlatform;
  url: string;
  skills: string[];
  description: string;
  postedDate: string;
  sourceType: 'auto_feed' | 'user_clipped';
}

/**
 * Builds optimized Jobstreet Indonesia search query URL
 */
export function buildJobstreetSearchUrl(
  query: string,
  location = 'Jakarta',
  workMode?: string
): string {
  const cleanQuery = encodeURIComponent(
    query.trim().toLowerCase().replace(/\s+/g, '-')
  );
  const cleanLoc = encodeURIComponent(
    location.trim().toLowerCase().replace(/\s+/g, '-')
  );

  let url = `https://id.jobstreet.com/id/job-search/${cleanQuery}-jobs/in-${cleanLoc}`;
  const params = new URLSearchParams();

  if (workMode && workMode.toLowerCase() === 'remote') {
    params.set('workType', 'remote');
  }

  const queryStr = params.toString();
  return queryStr ? `${url}?${queryStr}` : url;
}

/**
 * Builds optimized LinkedIn search query URL with remote filters
 */
export function buildLinkedInSearchUrl(
  query: string,
  location = 'Indonesia',
  workMode?: string
): string {
  const params = new URLSearchParams();
  params.set('keywords', query.trim());
  params.set('location', location.trim());

  if (workMode && workMode.toLowerCase() === 'remote') {
    params.set('f_WT', '2'); // 2 = Remote on LinkedIn
  } else if (workMode && workMode.toLowerCase() === 'hybrid') {
    params.set('f_WT', '3'); // 3 = Hybrid on LinkedIn
  }

  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

/**
 * Builds optimized Glints Indonesia search query URL
 */
export function buildGlintsSearchUrl(
  query: string,
  location = 'Indonesia'
): string {
  const params = new URLSearchParams();
  params.set('keyword', query.trim());
  params.set('country', 'ID');
  if (location && location.toLowerCase() !== 'indonesia') {
    params.set('locationName', location.trim());
  }

  return `https://glints.com/id/opportunities/jobs/explore?${params.toString()}`;
}

/**
 * Builds search query URL for any preset or custom user platform
 */
export function buildCustomPlatformSearchUrl(
  preset: JobPlatformPreset,
  query: string,
  location = 'Jakarta',
  workMode?: string
): string {
  if (preset.id === 'jobstreet') {
    return buildJobstreetSearchUrl(query, location, workMode);
  }
  if (preset.id === 'linkedin') {
    return buildLinkedInSearchUrl(query, location, workMode);
  }
  if (preset.id === 'glints') {
    return buildGlintsSearchUrl(query, location);
  }

  const encodedQuery = encodeURIComponent(query.trim());
  const encodedLocation = encodeURIComponent(location.trim());
  let url = preset.urlTemplate.trim();

  if (url.includes('{query}') || url.includes('{location}')) {
    url = url.replace(/\{query\}/g, encodedQuery);
    url = url.replace(/\{location\}/g, encodedLocation);
    return url;
  }

  try {
    const parsed = new URL(url);
    if (query.trim()) {
      parsed.searchParams.set('q', query.trim());
    }
    if (location && location.trim() !== 'Indonesia') {
      parsed.searchParams.set('location', location.trim());
    }
    return parsed.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}q=${encodedQuery}&location=${encodedLocation}`;
  }
}

/**
 * Safely parses any job URL to extract platform and metadata heuristics
 */
export function parseJobUrlHeuristics(url: string): {
  isValid: boolean;
  platform: JobPlatform;
  domain: string;
  cleanUrl: string;
  suggestedTitle?: string;
  suggestedCompany?: string;
} {
  const trimmed = url.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
    return { isValid: false, platform: 'Other', domain: '', cleanUrl: trimmed };
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const domain = host.replace(/^www\./, '');
    const cleanUrl = trimmed;

    if (host.includes('jobstreet')) {
      return {
        isValid: true,
        platform: 'Jobstreet',
        domain,
        cleanUrl,
        suggestedTitle: extractSlugHeuristic(parsed.pathname),
      };
    }

    if (host.includes('linkedin')) {
      return {
        isValid: true,
        platform: 'LinkedIn',
        domain,
        cleanUrl,
      };
    }

    if (host.includes('glints')) {
      return {
        isValid: true,
        platform: 'Glints',
        domain,
        cleanUrl,
        suggestedTitle: extractSlugHeuristic(parsed.pathname),
      };
    }

    if (host.includes('kalibrr')) {
      return {
        isValid: true,
        platform: 'Kalibrr',
        domain,
        cleanUrl,
        suggestedTitle: extractSlugHeuristic(parsed.pathname),
      };
    }

    if (host.includes('indeed')) {
      return {
        isValid: true,
        platform: 'Indeed',
        domain,
        cleanUrl,
      };
    }

    if (host.includes('dealls')) {
      return {
        isValid: true,
        platform: 'Dealls',
        domain,
        cleanUrl,
        suggestedTitle: extractSlugHeuristic(parsed.pathname),
      };
    }

    if (host.includes('greenhouse.io')) {
      const segments = parsed.pathname.split('/').filter(Boolean);
      const companySlug = segments[0] || '';
      return {
        isValid: true,
        platform: 'Greenhouse',
        domain,
        cleanUrl,
        suggestedCompany: formatCompanySlug(companySlug),
        suggestedTitle: extractSlugHeuristic(parsed.pathname),
      };
    }

    if (host.includes('lever.co')) {
      const segments = parsed.pathname.split('/').filter(Boolean);
      const companySlug = segments[0] || '';
      return {
        isValid: true,
        platform: 'Lever',
        domain,
        cleanUrl,
        suggestedCompany: formatCompanySlug(companySlug),
        suggestedTitle: extractSlugHeuristic(parsed.pathname),
      };
    }

    if (host.includes('myworkdayjobs.com') || host.includes('workday.com')) {
      const sub = host.split('.')[0] || '';
      return {
        isValid: true,
        platform: 'Workday',
        domain,
        cleanUrl,
        suggestedCompany: formatCompanySlug(sub),
        suggestedTitle: extractSlugHeuristic(parsed.pathname),
      };
    }

    return {
      isValid: true,
      platform: 'Other',
      domain,
      cleanUrl,
      suggestedTitle: extractSlugHeuristic(parsed.pathname),
    };
  } catch {
    return { isValid: false, platform: 'Other', domain: '', cleanUrl: trimmed };
  }
}

function formatCompanySlug(slug: string): string | undefined {
  if (!slug) return undefined;
  const clean = slug.replace(/[-_]/g, ' ').trim();
  if (clean.length < 2 || clean.length > 40) return undefined;
  return clean
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Extracts and parses all job URLs found in a text block (single URL, multiple lines, or mixed text)
 */
export function parseBatchJobUrls(rawText: string): ExtractedJobLink[] {
  if (!rawText || !rawText.trim()) return [];

  const urlRegex = /(https?:\/\/[^\s<>"'`{}|\\^~[\]]+)/gi;
  const matches = rawText.match(urlRegex) || [];

  const seen = new Set<string>();
  const results: ExtractedJobLink[] = [];

  for (let i = 0; i < matches.length; i++) {
    const cleaned = matches[i].replace(/[.,;:!?)]+$/, '').trim();
    if (!cleaned) continue;

    let normalizedKey = cleaned.toLowerCase().replace(/\/+$/, '');
    try {
      const u = new URL(cleaned);
      normalizedKey = `${u.origin.toLowerCase()}${u.pathname.toLowerCase().replace(/\/+$/, '')}`;
    } catch {
      // fallback to cleaned string
    }

    if (seen.has(normalizedKey)) continue;
    seen.add(normalizedKey);

    const parsed = parseJobUrlHeuristics(cleaned);
    if (!parsed.isValid) continue;

    const id = `scraped_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`;
    const platformName = parsed.platform !== 'Other' ? parsed.platform : (parsed.domain || 'Portal');

    results.push({
      id,
      url: cleaned,
      title: parsed.suggestedTitle || `Lowongan di ${parsed.suggestedCompany || platformName}`,
      company: parsed.suggestedCompany || (parsed.platform !== 'Other' ? parsed.platform : parsed.domain),
      platform: parsed.platform,
      domain: parsed.domain || 'web',
      createdAt: new Date().toISOString(),
    });
  }

  return results;
}

function extractSlugHeuristic(pathname: string): string | undefined {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return undefined;

  const clean = last
    .replace(/\.html?$/i, '')
    .replace(/[0-9]+/g, ' ')
    .replace(/[-_]/g, ' ')
    .trim();

  if (clean.length > 3 && clean.length < 50) {
    return clean
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return undefined;
}

/**
 * Calculates fit score between a vacancy and the candidate profile
 */
export function calculateScoutFitScore(
  vacancy: {
    title: string;
    skills?: string[];
    salaryMin?: number;
    salaryMax?: number;
    workMode?: string;
  },
  profile: CandidateProfile
): {
  score: number;
  isHighMatch: boolean;
  matchedSkills: string[];
  missingSkills: string[];
} {
  let score = 50; // Base score
  const candidateSkills = (profile.skills || []).map((s) => s.toLowerCase());
  const vacancySkills = (vacancy.skills || []).map((s) => s.toLowerCase());
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  // 1. Role match
  const titleLower = vacancy.title.toLowerCase();
  const targetRoles = (profile.targetRoles || []).map((r) => r.toLowerCase());
  const matchesTargetRole = targetRoles.some(
    (role) => titleLower.includes(role) || role.includes(titleLower)
  );

  if (matchesTargetRole) {
    score += 25;
  }

  // 2. Skills match
  vacancySkills.forEach((vSkill) => {
    const isMatched = candidateSkills.some(
      (cSkill) => cSkill.includes(vSkill) || vSkill.includes(cSkill)
    );
    if (isMatched) {
      matchedSkills.push(vSkill);
      score += 6;
    } else {
      missingSkills.push(vSkill);
    }
  });

  // 3. Compensation threshold check
  if (vacancy.salaryMax && profile.minSalary && profile.minSalary > 0) {
    if (vacancy.salaryMax >= profile.minSalary) {
      score += 10;
    } else {
      score -= 20;
    }
  }

  // 4. Work arrangement check
  if (vacancy.workMode && profile.preferredModes && profile.preferredModes.length > 0) {
    if (profile.preferredModes.includes(vacancy.workMode as 'Remote' | 'Hybrid' | 'On-site')) {
      score += 5;
    }
  }

  const finalScore = Math.max(10, Math.min(99, score));
  return {
    score: finalScore,
    isHighMatch: finalScore >= 80,
    matchedSkills,
    missingSkills,
  };
}

/**
 * Curated vacancies matching candidate target roles and Indonesian market
 */
export const CURATED_TECH_VACANCIES: ScoutVacancy[] = [
  {
    id: 'scout-vac-1',
    title: 'Technical Consultant Analyst',
    company: 'PT Mitra Solusi Telematika',
    location: 'Jakarta Selatan',
    workMode: 'Hybrid',
    salaryMin: 14000000,
    salaryMax: 19000000,
    platform: 'Jobstreet',
    url: 'https://id.jobstreet.com/id/job-search/technical-consultant-analyst-jobs/in-jakarta',
    skills: ['APM', 'Linux', 'SQL', 'Dynatrace', 'System Integration'],
    description: 'Implementasi dan monitoring performa aplikasi perbankan (APM), integrasi log enterprise, dan konsultasi teknis infrastruktur cloud.',
    postedDate: 'Hari ini',
    sourceType: 'auto_feed',
  },
  {
    id: 'scout-vac-2',
    title: 'Senior DevOps & Platform Engineer',
    company: 'Fintech Nusantara Global',
    location: 'Jakarta / Remote',
    workMode: 'Remote',
    salaryMin: 22000000,
    salaryMax: 30000000,
    platform: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs/search/?keywords=DevOps%20Engineer&location=Indonesia&f_WT=2',
    skills: ['Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'AWS', 'Linux'],
    description: 'Mengelola klaster Kubernetes produksi, otomatisasi pipeline GitLab CI/CD, dan orkestrasi infrastruktur berbasis Terraform.',
    postedDate: '1 hari lalu',
    sourceType: 'auto_feed',
  },
  {
    id: 'scout-vac-3',
    title: 'Data & System Support Engineer',
    company: 'PT Bank Digital Indonesia',
    location: 'Jakarta Pusat',
    workMode: 'Hybrid',
    salaryMin: 16000000,
    salaryMax: 24000000,
    platform: 'Jobstreet',
    url: 'https://id.jobstreet.com/id/job-search/data-engineer-jobs/in-jakarta',
    skills: ['MySQL', 'Python', 'ETL', 'Data Pipeline', 'System Administration'],
    description: 'Membangun pipeline data ETL perbankan, automasi sinkronisasi basis data MySQL, dan pemeliharaan server Linux berkinerja tinggi.',
    postedDate: '2 hari lalu',
    sourceType: 'auto_feed',
  },
  {
    id: 'scout-vac-4',
    title: 'IT Infrastructure & APM Specialist',
    company: 'PT Solusi Teknologi Terpadu',
    location: 'Jakarta Barat',
    workMode: 'On-site',
    salaryMin: 13000000,
    salaryMax: 18000000,
    platform: 'Glints',
    url: 'https://glints.com/id/opportunities/jobs/explore?keyword=Infrastructure%20Engineer&country=ID',
    skills: ['VMware', 'Active Directory', 'Veeam', 'APM', 'Linux'],
    description: 'Operasional virtualisasi VMware vSphere, backup recovery Veeam, serta pemantauan sistem APM untuk klien sektor publik dan keuangan.',
    postedDate: '3 hari lalu',
    sourceType: 'auto_feed',
  },
  {
    id: 'scout-vac-5',
    title: 'Data Analyst & Reporting Consultant',
    company: 'PT Insurtech Dinamika Sejahtera',
    location: 'Jakarta Selatan / Remote',
    workMode: 'Remote',
    salaryMin: 15000000,
    salaryMax: 21000000,
    platform: 'Jobstreet',
    url: 'https://id.jobstreet.com/id/job-search/data-analyst-jobs/in-jakarta',
    skills: ['Python', 'SQL', 'Tableau', 'Business Intelligence', 'Data Modeling'],
    description: 'Eksplorasi data operasional klaim asuransi, pemodelan analitik prediktif, dan penyusunan dashboard visualisasi eksekutif.',
    postedDate: '3 hari lalu',
    sourceType: 'auto_feed',
  },
];
