export interface CandidateInfo {
  fullName?: string;
  currentRole?: string;
  skills?: string[];
  yearsExperience?: number;
}

export interface OutreachParams {
  company: string;
  role: string;
  persona: 'peer' | 'recruiter' | 'lead';
  degree: '1st' | '2nd';
  lang: 'id' | 'en';
  candidate?: CandidateInfo;
}

export interface ConnectionNoteParams {
  company: string;
  role: string;
  candidate?: CandidateInfo;
  lang: 'id' | 'en';
}

export interface HeadlineParams {
  role?: string;
  skills?: string[];
  yearsExperience?: number;
}

export interface AboutParams {
  fullName?: string;
  currentRole?: string;
  skills?: string[];
  yearsExperience?: number;
  lang?: 'id' | 'en';
}

/**
 * Strips em-dashes and removes robotic AI filler clichés.
 */
export function sanitizeAntiSlop(text: string): string {
  return text
    .replace(/—/g, ', ')
    .replace(/–/g, '-')
    .replace(/\bgame-changer\b/gi, 'effective')
    .replace(/\bcutting-edge\b/gi, 'modern')
    .replace(/\bdelve into\b/gi, 'explore')
    .replace(/\bdelve\b/gi, 'look into')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates natural 1st-person cold outreach or referral messages.
 */
export function generateOutreachMessage(params: OutreachParams): string {
  const company = params.company?.trim() || 'your team';
  const role = params.role?.trim() || 'the open position';
  const skills = (params.candidate?.skills || []).filter(Boolean);
  const topSkill = skills.length > 0 ? skills[0] : 'modern engineering';
  const skillList = skills.length > 1 ? `${skills[0]} and ${skills[1]}` : topSkill;
  const currentRole = params.candidate?.currentRole?.trim() || 'professional';
  const expYears = params.candidate?.yearsExperience || 3;

  if (params.lang === 'id') {
    if (params.persona === 'peer') {
      if (params.degree === '1st') {
        return sanitizeAntiSlop(
          `Halo, salam kenal! Saya melihat tim di ${company} sedang membuka lowongan untuk ${role}. Dengan latar belakang saya sebagai ${currentRole} dan pengalaman di ${skillList}, saya sangat tertarik berkontribusi di sana. Apakah ada waktu luang 5-10 menit untuk ngobrol santai mengenai kultur tim dan kemungkinan referral? Terima kasih banyak sebelumnya!`
        );
      }
      return sanitizeAntiSlop(
        `Halo, salam kenal! Saya melihat profil Anda dan kiprah tim di ${company}. Saat ini saya aktif mendalami ${skillList} dan tertarik dengan posisi ${role}. Jika berkenan, saya ingin terhubung untuk saling berbagi insight seputar industri. Salam hangat!`
      );
    }

    if (params.persona === 'recruiter') {
      return sanitizeAntiSlop(
        `Halo, salam kenal! Saya melihat posisi ${role} di ${company} dan profil saya di ${skillList} sangat selaras dengan kebutuhan tersebut. Berpengalaman selama ${expYears} tahun sebagai ${currentRole}, saya siap membawa dampak positif bagi tim. Apakah posisi ini masih aktif? Saya lampirkan profil singkat saya jika relevan untuk ditinjau. Terima kasih!`
      );
    }

    // Lead / Hiring Manager
    return sanitizeAntiSlop(
      `Halo, salam kenal! Saya mengikuti perkembangan tim engineering di ${company} dan sangat terkesan. Saya melihat ada kebutuhan untuk ${role}. Dengan fokus saya pada ${skillList}, saya ingin mendiskusikan bagaimana pengalaman saya bisa membantu memecahkan tantangan di tim Anda. Boleh izin bertanya jika ada waktu singkat minggu ini? Salam hangat!`
    );
  }

  // English templates
  if (params.persona === 'peer') {
    if (params.degree === '1st') {
      return sanitizeAntiSlop(
        `Hi there! Hope you are doing well. I noticed an opening for ${role} at ${company} and felt it aligns closely with my background in ${skillList}. Would you be open to a quick 5-minute chat about the team culture, and perhaps a referral if it feels like a good fit? Really appreciate your time!`
      );
    }
    return sanitizeAntiSlop(
      `Hi, great to connect with a fellow ${currentRole}! I have been following the work happening at ${company} and noticed the ${role} role. I'd love to connect and follow your work as I explore opportunities in this space.`
    );
  }

  if (params.persona === 'recruiter') {
    return sanitizeAntiSlop(
      `Hi! I saw the ${role} opening at ${company} and wanted to reach out directly. With ${expYears}+ years as a ${currentRole} specializing in ${skillList}, I believe my hands-on background would be a strong match for your team. Are you currently reviewing applications for this search? I would love to connect.`
    );
  }

  // Lead / Hiring Manager (EN)
  return sanitizeAntiSlop(
    `Hi! I have been following ${company}'s recent initiatives and saw you lead work around ${role}. My focus has been on ${skillList}, solving similar performance and scalability challenges. If you have a few minutes this week, I'd welcome the chance to hear about your team priorities. Thanks!`
  );
}

/**
 * Generates LinkedIn connection request note (strictly <= 300 chars, no em-dashes).
 */
export function generateConnectionNote(params: ConnectionNoteParams): string {
  const company = params.company?.trim() || 'your company';
  const role = params.role?.trim() || 'engineering';
  const skills = (params.candidate?.skills || []).filter(Boolean);
  const skill = skills[0] || 'tech';

  let raw = '';
  if (params.lang === 'id') {
    raw = `Halo, salam kenal! Saya tertarik dengan tim di ${company} untuk posisi ${role}. Dengan latar belakang ${skill}, saya ingin terhubung dan bertukar insight di LinkedIn.`;
  } else {
    raw = `Hi! I noticed the ${role} opportunity at ${company}. With my background in ${skill}, I'd love to connect and follow your team's work.`;
  }

  const cleaned = sanitizeAntiSlop(raw);
  // Ensure strict <= 300 characters limit
  if (cleaned.length > 300) {
    return cleaned.slice(0, 297) + '...';
  }
  return cleaned;
}

/**
 * Generates 3 punchy, ATS-aligned LinkedIn headlines.
 */
export function generateLinkedInHeadlines(params: HeadlineParams): string[] {
  const role = params.role?.trim() || 'Software Engineer';
  const skills = (params.skills || []).filter(Boolean);
  const s1 = skills[0] || 'Web Technologies';
  const s2 = skills[1] || 'System Architecture';
  const s3 = skills[2] || 'Scalable Systems';

  return [
    sanitizeAntiSlop(`${role} | ${s1}, ${s2} & ${s3} | High-Impact Product Delivery`),
    sanitizeAntiSlop(`${role} specializing in ${s1} & ${s2} | Building Resilient Systems`),
    sanitizeAntiSlop(`${role} | Crafting Scalable Solutions with ${s1} | Open to Opportunities`),
  ];
}

/**
 * Generates clean 1st-person LinkedIn About section.
 */
export function generateLinkedInAbout(params: AboutParams): string {
  const currentRole = params.currentRole?.trim() || 'Software Engineer';
  const skills = (params.skills || []).filter(Boolean);
  const skillSummary = skills.join(', ') || 'modern software architecture';
  const exp = params.yearsExperience || 3;

  if (params.lang === 'id') {
    return sanitizeAntiSlop(
      `Saya adalah seorang ${currentRole} dengan pengalaman ${exp}+ tahun dalam membangun produk digital yang andal dan terukur. Fokus utama saya mencakup ${skillSummary}. Saya menyukai pemecahan masalah teknis yang berdampak langsung pada performa dan kepuasan pengguna. Selalu terbuka untuk bertukar ide dan mendiskusikan peluang kolaborasi baru.`
    );
  }

  return sanitizeAntiSlop(
    `I am a ${currentRole} with ${exp}+ years of experience engineering scalable and reliable digital products. My core expertise covers ${skillSummary}. I thrive on turning complex system requirements into clean, maintainable, and high-performance solutions. Always open to connecting with peers, engineering leaders, and innovative teams.`
  );
}
