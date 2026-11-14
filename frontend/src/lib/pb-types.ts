export type Status = 'Wishlist' | 'Applied' | 'Viewed' | 'Screening' | 'Interview' | 'Offer' | 'Rejected' | 'Ghosted';

export type Application = {
  id: string;
  owner?: string;
  company: string;
  position: string;
  link?: string;
  contactName?: string;
  contact?: string;
  location: string;
  type: 'In-house' | 'Vendor / Outsource' | 'Contract';
  mode: 'On-site' | 'Hybrid' | 'Remote';
  salaryMin: number;
  salaryMax: number;
  salaryPeriod: 'monthly' | 'annual';
  status: Status;
  sentAt: string;
  nextFollowUp?: string;
  notes?: string;
  cvVersion: string;
  cvArtifact?: string;
  jobSource?: 'JobStreet' | 'LinkedIn' | 'Company Website' | 'Direct / Referral' | 'Other';
  applicationMethod?: 'JobStreet Apply' | 'Email' | 'Portal / ATS' | 'Easy Apply' | 'Manual';
  externalJobId?: string;
  autoCreated?: boolean;
  needsReview?: boolean;
  leadSource?: string;
  contractInspection?: {
    riskScore: number;
    findings: Array<{
      category: string;
      severity: 'high' | 'medium' | 'low';
      clauseText: string;
      issue: string;
      recommendation: string;
      lawReference?: string;
    }>;
    scannedAt: string;
    notes?: string;
    verdict?: 'Safe to Sign' | 'Requires Clarification' | 'High Risk / Predatory';
  };
  created?: string;
  updated?: string;
};

export type ApplicationDraft = Omit<Application, 'id'>;

export type StarStory = {
  id: string;
  question: string;
  category?: 'Behavioral' | 'Technical' | 'Conflict' | 'Leadership';
  situation: string;
  task: string;
  action: string;
  result: string;
  score?: number;
  feedback?: string[];
  metricsIncluded?: string[];
  actionVerbsIncluded?: string[];
};

export type Interview = {
  id: string;
  owner?: string;
  application: string;
  round: string;
  scheduledAt: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  questions: string[];
  interviewType?: 'HR Screening' | 'Technical Interview' | 'System Design' | 'User / Hiring Manager' | 'Cultural Fit' | 'Final / Offering';
  interviewerName?: string;
  meetingLink?: string;
  prepNotes?: string;
  feedback?: string;
  locationType?: 'Online' | 'On-site' | 'Phone';
  meetingPlatform?: 'Google Meet' | 'Zoom' | 'Microsoft Teams' | 'On-site' | 'Phone' | 'Other';
  keyQuestions?: string[];
  salaryDiscussed?: number;
  reminderSentAt?: string;
  starStories?: StarStory[];
};

export type CVArtifact = {
  id: string;
  owner?: string;
  version: string;
  label: string;
  applications: number;
  responses: number;
  offers: number;
  content?: unknown;
  targetRole?: string;
  isMaster?: boolean;
  atsScore?: number;
  lastAtsAudit?: unknown;
};

export type ApplyFlowDraft = {
  id: string;
  owner?: string;
  rawText: string;
  sourcePlatform?: string;
  sourceUrl?: string;
  parsedData?: unknown;
  selectedPositionId?: string;
  selectedCvArtifact?: string;
  candidateName?: string;
  evidence?: string;
  subject?: string;
  body?: string;
  state: 'draft' | 'copied' | 'compose_opened' | 'manually_marked_sent';
  applicationIds?: string[];
};

export type CandidateProfile = {
  id: string;
  owner?: string;
  headline?: string;
  targetRoles: string[];
  skills: string[];
  minSalary?: number;
  preferredModes: string[];
  dealbreakers: string[];
  experienceSummary?: string;
  fullName?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  educationSummary?: unknown;
  certifications?: unknown;
  languages?: unknown;
};

export type JobLeadEvaluation = {
  strengths: string[];
  missingSkills: string[];
  dealbreakers: string[];
  pros: string[];
  cons: string[];
  verdict: 'strong_match' | 'moderate_match' | 'poor_match' | 'dealbreaker_detected';
  summary?: string;
  suggestedAngle?: string;
};

export type JobLead = {
  id: string;
  owner?: string;
  title: string;
  company: string;
  url?: string;
  location?: string;
  employmentType?: string;
  workMode?: string;
  rawJd: string;
  source?: string;
  matchScore: number;
  evaluation?: JobLeadEvaluation;
  status: 'inbox' | 'triage_passed' | 'triage_rejected' | 'shortlisted' | 'promoted_to_apply' | 'archived';
  promotedApplication?: string;
  salaryRange?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  compensationType?: 'Gross' | 'Nett' | 'Undisclosed';
  redFlags?: string[];
  greenFlags?: string[];
  dealbreakerFlags?: string[];
  created?: string;
  updated?: string;
};

export type GmailConnection = {
  id: string;
  owner?: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  syncStatus: 'idle' | 'syncing' | 'failed' | 'paused';
  lastHistoryId?: string;
  lastSyncedAt?: string;
  autoCreateApplication?: boolean;
};

export type ApplicationEventType =
  | 'application_submitted'
  | 'employer_viewed'
  | 'recruiter_contacted'
  | 'screening_started'
  | 'interview_invited'
  | 'interview_rescheduled'
  | 'assessment_received'
  | 'document_requested'
  | 'rejection_received'
  | 'offer_received'
  | 'note_added';

export type ApplicationEvent = {
  id: string;
  owner?: string;
  application: string;
  eventType: ApplicationEventType;
  eventAt?: string;
  receivedAt?: string;
  sourcePlatform?: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
  rawSubject?: string;
  evidenceSnippet?: string;
  created?: string;
};

export type RecruitmentNotification = {
  id: string;
  owner?: string;
  gmailMessageId?: string;
  platform?: string;
  extractedCompany?: string;
  extractedPosition?: string;
  extractedEventType?: string;
  rawSubject?: string;
  evidenceSnippet?: string;
  matchStatus: 'matched' | 'needs_review' | 'unmatched' | 'auto_created' | 'ignored';
  matchedApplication?: string;
  confidence?: number;
  created?: string;
};

export type UserRole = 'candidate' | 'coach' | 'recruiter' | 'admin';

export type User = {
  id: string;
  email: string;
  displayName?: string;
  telegramChatId?: string;
  telegramBotToken?: string;
  notifyDailyBriefing?: boolean;
  notifyOnInterview?: boolean;
  notifyOnStatusChange?: boolean;
  notifyOnGhostingWarning?: boolean;
  notifyOnHighFitLead?: boolean;
  briefingHour?: number;
  timezone?: string;
  lastBriefingAt?: string;
  telegramDeliveryStatus?: string;
  role?: UserRole;
  created?: string;
  updated?: string;
};

export type OfferRecord = {
  id: string;
  owner?: string;
  application: string;
  company: string;
  position: string;
  placementType?: 'In-house' | 'Vendor / Outsource' | 'Contract';
  workMode?: 'Remote' | 'Hybrid' | 'On-site';
  baseSalary: number;
  fixedAllowance?: number;
  onCallAllowance?: number;
  shiftAllowance?: number;
  wfhAllowance?: number;
  thrMultiplier?: number;
  bonusMonths?: number;
  ptkpCategory?: 'TK/0' | 'TK/1' | 'K/0' | 'K/1' | 'K/2' | 'K/3';
  hasBpjs?: boolean;
  monthlyCommuteCost?: number;
  customTaxRatePercent?: number;
  status: 'Draft' | 'Received' | 'Negotiating' | 'Accepted' | 'Declined';
  notes?: string;
  created?: string;
  updated?: string;
};

export type RelationshipType =
  | 'Recruiter'
  | 'Hiring Manager'
  | 'Peer'
  | 'Mentor'
  | 'Alumni'
  | 'Former Colleague'
  | 'Other';

export type ReferralStatus =
  | 'None'
  | 'Requested'
  | 'Submitted'
  | 'Interview Secured'
  | 'Declined';

export type ProfessionalContact = {
  id: string;
  owner?: string;
  name: string;
  company?: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  relationship: RelationshipType;
  associatedApplication?: string;
  referralStatus: ReferralStatus;
  lastContactDate?: string;
  notes?: string;
  created?: string;
  updated?: string;
};
