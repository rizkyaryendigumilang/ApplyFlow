import type { CandidateProfile, JobLeadEvaluation } from './pb-types';

const COMMON_TECH_SKILLS = [
  'Kubernetes', 'Docker', 'AWS', 'GCP', 'Azure', 'Terraform', 'Ansible', 'Linux',
  'CI/CD', 'GitLab', 'GitHub Actions', 'Jenkins', 'Go', 'Golang', 'Python',
  'TypeScript', 'JavaScript', 'Node.js', 'React', 'Next.js', 'Vue', 'Svelte', 'Tailwind',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Kafka', 'RabbitMQ', 'Prometheus', 'Grafana',
  'Elasticsearch', 'OpenTelemetry', 'Helm', 'ArgoCD', 'Bash', 'REST API', 'GraphQL',
  'Microservices', 'System Design', 'Security', 'DevSecOps', 'Java', 'Spring Boot',
  'C#', '.NET', 'Rust', 'Flutter', 'Swift', 'Kotlin', 'Snowflake', 'Airflow'
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractSkillsFromText(text: string, customSkills: string[] = []): string[] {
  const lower = text.toLowerCase();
  const searchSkills = Array.from(new Set([...COMMON_TECH_SKILLS, ...customSkills.filter(Boolean)]));
  const found: string[] = [];

  for (const skill of searchSkills) {
    const escaped = escapeRegex(skill.toLowerCase());
    // Support punctuation-heavy languages like C++, C#, .NET, Node.js
    const pattern = new RegExp(`(?:^|[\\s,;()/\\[\\]{}])${escaped}(?=[\\s,;()/\\[\\]{}]|$)`, 'i');
    if (pattern.test(lower)) {
      found.push(skill);
    }
  }
  return Array.from(new Set(found));
}

export function extractStatedSalary(text: string): { min?: number; max?: number } | null {
  // Matches e.g. "Rp 15.000.000 - 25.000.000", "15jt - 20jt", "15 - 25 juta", "$120k - $150k"
  const jtRegex = /(?:rp\.?\s*)?(\d+)(?:\.000\.000)?\s*(?:-|to|sampai)\s*(\d+)\s*(?:jt|juta)/i;
  const jtMatch = text.match(jtRegex);
  if (jtMatch) {
    const min = parseInt(jtMatch[1], 10) * 1000000;
    const max = parseInt(jtMatch[2], 10) * 1000000;
    return { min, max };
  }

  const fullIdrRegex = /rp\.?\s*([\d\.]+)\s*(?:-|to|sampai)\s*(?:rp\.?\s*)?([\d\.]+)/i;
  const idrMatch = text.match(fullIdrRegex);
  if (idrMatch) {
    const min = parseInt(idrMatch[1].replace(/\./g, ''), 10);
    const max = parseInt(idrMatch[2].replace(/\./g, ''), 10);
    if (!isNaN(min) && !isNaN(max) && min > 1000000) {
      return { min, max };
    }
  }

  return null;
}

export function evaluateJobFit(
  rawJd: string,
  title: string,
  company: string,
  profile: CandidateProfile
): { matchScore: number; evaluation: JobLeadEvaluation } {
  const lowerJd = rawJd.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // 1. Tier 1: Dealbreaker Check
  const detectedDealbreakers: string[] = [];
  for (const db of profile.dealbreakers) {
    const cleanDb = db.toLowerCase().trim();
    if (cleanDb && lowerJd.includes(cleanDb)) {
      detectedDealbreakers.push(db);
    }
  }

  // Common dealbreaker heuristics
  if (profile.preferredModes.includes('Remote') && !profile.preferredModes.includes('On-site')) {
    if (/\b(100%\s*on-?site|strictly\s*wfo|full\s*wfo|must\s*work\s*from\s*office)\b/i.test(lowerJd)) {
      detectedDealbreakers.push('Strictly 100% On-site / WFO required');
    }
  }
  if (/\b(judi|slot|casino|gambling|taruhan)\b/i.test(lowerJd)) {
    detectedDealbreakers.push('Gambling / Betting Industry keyword detected');
  }

  // Stated Salary Check against Candidate Min Salary
  const statedSalary = extractStatedSalary(rawJd);
  if (statedSalary && statedSalary.max && profile.minSalary && profile.minSalary > 0) {
    if (statedSalary.max < profile.minSalary) {
      detectedDealbreakers.push(`Stated max compensation (Rp ${(statedSalary.max / 1000000).toFixed(1)}M) below your minimum (Rp ${(profile.minSalary / 1000000).toFixed(1)}M)`);
    }
  }

  // 2. Dynamic Skill Extraction & Matching
  const jdSkills = extractSkillsFromText(rawJd, profile.skills);
  const candidateSkills = profile.skills.map(s => s.trim()).filter(Boolean);

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const jdSkill of jdSkills) {
    const isMatched = candidateSkills.some(cs => cs.toLowerCase() === jdSkill.toLowerCase());
    if (isMatched) {
      matchedSkills.push(jdSkill);
    } else {
      missingSkills.push(jdSkill);
    }
  }

  // 3. Title & Role Alignment
  let roleMatchScore = 50;
  for (const targetRole of profile.targetRoles) {
    const cleanTarget = targetRole.toLowerCase();
    if (lowerTitle.includes(cleanTarget) || cleanTarget.includes(lowerTitle)) {
      roleMatchScore = 100;
      break;
    }
    const words = cleanTarget.split(/\s+/);
    const matchedWords = words.filter(w => lowerTitle.includes(w));
    if (matchedWords.length > 0) {
      roleMatchScore = Math.max(roleMatchScore, Math.round((matchedWords.length / words.length) * 85));
    }
  }

  // 4. Calculate Final Match Score (0 - 100)
  const skillRatio = jdSkills.length > 0 ? matchedSkills.length / jdSkills.length : 0.7;
  const skillScore = Math.round(skillRatio * 100);

  let matchScore = Math.round((skillScore * 0.55) + (roleMatchScore * 0.35) + 10);
  matchScore = Math.min(100, Math.max(10, matchScore));

  // If dealbreaker detected, penalize heavily
  if (detectedDealbreakers.length > 0) {
    matchScore = Math.min(35, matchScore);
  }

  // 5. Determine Verdict
  let verdict: JobLeadEvaluation['verdict'] = 'moderate_match';
  if (detectedDealbreakers.length > 0) {
    verdict = 'dealbreaker_detected';
  } else if (matchScore >= 80) {
    verdict = 'strong_match';
  } else if (matchScore < 55) {
    verdict = 'poor_match';
  }

  // 6. Pros & Cons Synthesis
  const pros: string[] = [];
  const cons: string[] = [];

  if (roleMatchScore >= 80) pros.push(`Role title perfectly aligns with your target: "${title}"`);
  if (matchedSkills.length > 0) pros.push(`Matches ${matchedSkills.length} of your key competencies (${matchedSkills.slice(0, 4).join(', ')})`);
  if (/\b(remote|wfh|work from anywhere)\b/i.test(lowerJd)) pros.push('Remote work arrangement supported');
  if (statedSalary && statedSalary.min && profile.minSalary && statedSalary.min >= profile.minSalary) {
    pros.push(`Stated compensation starts at or above your minimum threshold (Rp ${(statedSalary.min / 1000000).toFixed(1)}M)`);
  }

  if (missingSkills.length > 0) cons.push(`Missing ${missingSkills.length} mentioned technical requirements (${missingSkills.slice(0, 3).join(', ')})`);
  if (detectedDealbreakers.length > 0) cons.push(`Dealbreaker: ${detectedDealbreakers.join(', ')}`);
  if (matchScore < 60) cons.push('Low overall alignment with candidate target profile');

  // 7. Strategic Cover Angle (for ApplyFlow handoff)
  let suggestedAngle = `Highlight your proven experience in ${matchedSkills.slice(0, 3).join(', ')} and emphasize direct value delivery for ${company}.`;
  if (missingSkills.length > 0) {
    suggestedAngle += ` Proactively address ${missingSkills[0]} by framing your fast learning agility and transferable architectural experience.`;
  }

  return {
    matchScore,
    evaluation: {
      strengths: matchedSkills,
      missingSkills,
      dealbreakers: detectedDealbreakers,
      pros,
      cons,
      verdict,
      summary: `Evaluated ${matchedSkills.length} matches and ${missingSkills.length} gaps. Match rating: ${matchScore}%.`,
      suggestedAngle,
    },
  };
}
