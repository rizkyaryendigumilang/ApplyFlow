import assert from 'node:assert/strict';

const baseUrl = process.env.PB_TEST_URL;
if (!baseUrl) {
  console.log('backend contract skipped: set PB_TEST_URL, PB_TEST_EMAIL_A/PASSWORD_A, and PB_TEST_EMAIL_B/PASSWORD_B');
  process.exit(0);
}

const required = ['PB_TEST_EMAIL_A', 'PB_TEST_PASSWORD_A', 'PB_TEST_EMAIL_B', 'PB_TEST_PASSWORD_B'];
for (const name of required) assert.ok(process.env[name], `${name} is required`);

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    headers: {'Content-Type': 'application/json', ...(options.token ? {Authorization: options.token} : {})},
    ...options,
    body: options.body && JSON.stringify(options.body),
  });
  const body = await response.json().catch(() => ({}));
  return {response, body};
}

async function auth(email, password) {
  const result = await request('/api/collections/users/auth-with-password', {method:'POST', body:{identity:email, password}});
  assert.equal(result.response.status, 200, `could not authenticate ${email}: ${JSON.stringify(result.body)}`);
  return result.body;
}

const userA = await auth(process.env.PB_TEST_EMAIL_A, process.env.PB_TEST_PASSWORD_A);
const userB = await auth(process.env.PB_TEST_EMAIL_B, process.env.PB_TEST_PASSWORD_B);
if (process.env.PB_TEST_AUTH_ONLY === 'true') {
  console.log('backend auth contract ok');
  process.exit(0);
}
const suffix = Date.now().toString(36);

const cv = await request('/api/collections/cv_artifacts/records', {
  method:'POST', token:userA.token,
  body:{owner:userA.record.id, version:`contract-${suffix}`, label:'Contract test', applications:99, responses:99, offers:99},
});
assert.equal(cv.response.status, 200, 'CV artifact create failed');
assert.equal(cv.body.applications, 0, 'CV applications counter is client writable');
assert.equal(cv.body.responses, 0, 'CV responses counter is client writable');
assert.equal(cv.body.offers, 0, 'CV offers counter is client writable');

const application = await request('/api/collections/applications/records', {
  method:'POST', token:userA.token,
  body:{owner:userA.record.id, company:'Contract test', position:'Backend engineer', status:'Wishlist', cvArtifact:cv.body.id},
});
assert.equal(application.response.status, 200, 'application create failed');

const crossUserView = await request(`/api/collections/applications/records/${application.body.id}`, {token:userB.token});
assert.ok([400, 403, 404].includes(crossUserView.response.status), 'user B can view user A application');

const applied = await request(`/api/collections/applications/records/${application.body.id}`, {
  method:'PATCH', token:userA.token, body:{status:'Applied'},
});
assert.equal(applied.response.status, 200, 'status update failed');
assert.ok(applied.body.nextFollowUp, 'status transition did not create follow-up');

const offer = await request(`/api/collections/applications/records/${application.body.id}`, {
  method:'PATCH', token:userA.token, body:{status:'Offer'},
});
assert.equal(offer.response.status, 200, 'offer update failed');
const cvAfterOffer = await request(`/api/collections/cv_artifacts/records/${cv.body.id}`, {token:userA.token});
assert.equal(cvAfterOffer.body.applications, 1, 'CV application counter was not derived server-side');
assert.equal(cvAfterOffer.body.responses, 1, 'CV response counter was not derived server-side');
assert.equal(cvAfterOffer.body.offers, 1, 'CV offer counter was not derived server-side');

// P0 Check: Monotonic safe state regression guard on direct API update (ADR-0002)
const regressedToWishlist = await request(`/api/collections/applications/records/${application.body.id}`, {
  method:'PATCH', token:userA.token, body:{status:'Wishlist'},
});
assert.equal(regressedToWishlist.response.status, 400, 'direct downgrade to Wishlist from Offer must be rejected');

const regressedToRejected = await request(`/api/collections/applications/records/${application.body.id}`, {
  method:'PATCH', token:userA.token, body:{status:'Rejected'},
});
assert.equal(regressedToRejected.response.status, 400, 'downgrade from Offer to Rejected must be rejected');

// P0 Check: onRecordAfterDeleteRequest refreshes CV counters
await request(`/api/collections/applications/records/${application.body.id}`, {method:'DELETE', token:userA.token});
const cvAfterDelete = await request(`/api/collections/cv_artifacts/records/${cv.body.id}`, {token:userA.token});
assert.equal(cvAfterDelete.body.applications, 0, 'CV applications counter was not refreshed on application delete');
assert.equal(cvAfterDelete.body.responses, 0, 'CV responses counter was not refreshed on application delete');
assert.equal(cvAfterDelete.body.offers, 0, 'CV offers counter was not refreshed on application delete');

await request(`/api/collections/cv_artifacts/records/${cv.body.id}`, {method:'DELETE', token:userA.token});

// Test 1: candidate_profiles isolation
const profile = await request('/api/collections/candidate_profiles/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    headline: 'Senior Backend & Distributed Systems Specialist',
    targetRoles: ['Backend Engineer', 'Staff Engineer'],
    skills: ['Go', 'TypeScript', 'Docker', 'PostgreSQL'],
    minSalary: 25000000,
    preferredModes: ['Remote', 'Hybrid'],
    dealbreakers: ['Gambling / Casino / Judi Online', 'Unpaid overtime'],
    experienceSummary: '8+ years designing scalable microservices.'
  }
});
assert.equal(profile.response.status, 200, 'candidate profile create failed');
const crossProfile = await request(`/api/collections/candidate_profiles/records/${profile.body.id}`, {token: userB.token});
assert.ok([400, 403, 404].includes(crossProfile.response.status), 'user B should not access user A profile');

// Test 2: job_leads creation and isolation
const lead = await request('/api/collections/job_leads/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    title: 'Senior Platform Engineer',
    company: 'FinTech Global',
    rawJd: 'Seeking a Senior Platform Engineer experienced in Go, Kubernetes, and high-throughput systems.',
    status: 'inbox',
    matchScore: 88,
    workMode: 'Remote'
  }
});
assert.equal(lead.response.status, 200, 'job lead create failed');
const crossLead = await request(`/api/collections/job_leads/records/${lead.body.id}`, {token: userB.token});
assert.ok([400, 403, 404].includes(crossLead.response.status), 'user B should not access user A lead');

// Test 3: gmail_connections zero-leakage token stripping
const gmailConn = await request('/api/collections/gmail_connections/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    email: 'testuser@gmail.com',
    syncStatus: 'idle',
    accessToken: 'ya29.super_secret_oauth_token',
    refreshToken: '1//0g_super_secret_refresh_token',
    autoCreateApplication: true
  }
});
assert.equal(gmailConn.response.status, 200, 'gmail connection create failed');
// When fetched, accessToken and refreshToken must be completely stripped (empty string)
const fetchedConn = await request(`/api/collections/gmail_connections/records/${gmailConn.body.id}`, {token: userA.token});
assert.equal(fetchedConn.response.status, 200, 'failed to fetch connection');
assert.equal(fetchedConn.body.accessToken, '', 'accessToken must be sanitized/stripped from client response');
assert.equal(fetchedConn.body.refreshToken, '', 'refreshToken must be sanitized/stripped from client response');
// User B must not access User A connection
const crossConn = await request(`/api/collections/gmail_connections/records/${gmailConn.body.id}`, {token: userB.token});
assert.ok([400, 403, 404].includes(crossConn.response.status), 'user B should not access user A gmail connection');

// Test 4: recruitment_notifications isolation & P1 deduping
const notifMsgId = `msg-${suffix}`;
const notif = await request('/api/collections/recruitment_notifications/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    gmailMessageId: notifMsgId,
    platform: 'JobStreet',
    extractedEventType: 'employer_viewed',
    extractedCompany: 'FinTech Global',
    extractedPosition: 'Senior Platform Engineer',
    matchStatus: 'matched'
  }
});
assert.equal(notif.response.status, 200, 'recruitment notification create failed');
const crossNotif = await request(`/api/collections/recruitment_notifications/records/${notif.body.id}`, {token: userB.token});
assert.ok([400, 403, 404].includes(crossNotif.response.status), 'user B should not access user A notification');

// 4b: Deduping test - duplicate gmailMessageId for userA must be rejected
const dupNotif = await request('/api/collections/recruitment_notifications/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    gmailMessageId: notifMsgId,
    platform: 'JobStreet',
    extractedEventType: 'employer_viewed',
    matchStatus: 'matched'
  }
});
assert.equal(dupNotif.response.status, 400, 'duplicate gmailMessageId should be rejected by unique index');

// Test 5: application_events & safe state machine (No downgrade)
const appForEvent = await request('/api/collections/applications/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    company: 'Event State Machine Test',
    position: 'Cloud Architect',
    status: 'Applied'
  }
});
assert.equal(appForEvent.response.status, 200, 'appForEvent create failed');

// 5a. employer_viewed event upgrades Applied -> Viewed
const viewEvent = await request('/api/collections/application_events/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    application: appForEvent.body.id,
    eventType: 'employer_viewed',
    sourcePlatform: 'JobStreet',
    evidenceSnippet: 'Employer viewed your application on JobStreet'
  }
});
assert.equal(viewEvent.response.status, 200, 'viewEvent create failed');
const appAfterView = await request(`/api/collections/applications/records/${appForEvent.body.id}`, {token: userA.token});
assert.equal(appAfterView.body.status, 'Viewed', 'employer_viewed did not promote status to Viewed');

// 5b. Progress to Interview
await request(`/api/collections/applications/records/${appForEvent.body.id}`, {
  method: 'PATCH', token: userA.token, body: { status: 'Interview' }
});

// 5c. Late employer_viewed event MUST NOT downgrade Interview -> Viewed
const lateViewEvent = await request('/api/collections/application_events/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    application: appForEvent.body.id,
    eventType: 'employer_viewed',
    sourcePlatform: 'JobStreet',
    evidenceSnippet: 'Late duplicate view notification'
  }
});
assert.equal(lateViewEvent.response.status, 200, 'lateViewEvent create failed');
const appAfterLateView = await request(`/api/collections/applications/records/${appForEvent.body.id}`, {token: userA.token});
assert.equal(appAfterLateView.body.status, 'Interview', 'late notification degraded application status from Interview');

// 5d. offer_received event upgrades to Offer
const offerEvent = await request('/api/collections/application_events/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    application: appForEvent.body.id,
    eventType: 'offer_received',
    sourcePlatform: 'Recruiter Email',
    evidenceSnippet: 'Official offer letter received'
  }
});
assert.equal(offerEvent.response.status, 200, 'offerEvent create failed');
const appAfterOfferEvent = await request(`/api/collections/applications/records/${appForEvent.body.id}`, {token: userA.token});
assert.equal(appAfterOfferEvent.body.status, 'Offer', 'offer_received did not promote application status to Offer');

// Test 6: P2 Server-side Dynamic AI Proxy for Job Hunter with Candidate Profile
const hunterAnalysis = await request('/api/junction/hunter/analyze', {
  method: 'POST', token: userA.token,
  body: {
    rawJd: 'We are hiring a Lead Go and TypeScript Backend Engineer. Must know Docker, Kubernetes, and PostgreSQL. Strict zero judi online.'
  }
});
assert.equal(hunterAnalysis.response.status, 200, 'hunter analyze proxy endpoint failed');
assert.ok(hunterAnalysis.body.score >= 0, 'hunter analyze score missing');
assert.ok(Array.isArray(hunterAnalysis.body.matchedSkills), 'hunter matchedSkills missing');
assert.ok(hunterAnalysis.body.matchedSkills.includes('go'), 'hunter failed to match Go skill');
assert.ok(hunterAnalysis.body.matchedSkills.includes('docker'), 'hunter failed to match Docker skill');
assert.equal(hunterAnalysis.body.customProfileApplied, true, 'candidate profile was not dynamically applied');
assert.equal(hunterAnalysis.body.minSalaryExpectation, 25000000, 'profile minSalary was not reflected in analysis');

// Test 7: P1 Offers Collection Creation & Isolation
const offerRecord = await request('/api/collections/offers/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    application: appForEvent.body.id,
    company: 'Event State Machine Test',
    position: 'Cloud Architect',
    placementType: 'In-house',
    workMode: 'Remote',
    baseSalary: 30000000,
    fixedAllowance: 2500000,
    wfhAllowance: 1000000,
    bonusMonths: 2.0,
    ptkpCategory: 'K/1',
    hasBpjs: true,
    monthlyCommuteCost: 0,
    status: 'Received',
    notes: 'Official PKWTT contract offer'
  }
});
assert.equal(offerRecord.response.status, 200, 'offers collection create failed');
assert.equal(offerRecord.body.baseSalary, 30000000);

const crossOffer = await request(`/api/collections/offers/records/${offerRecord.body.id}`, {token: userB.token});
assert.ok([400, 403, 404].includes(crossOffer.response.status), 'user B should not access user A offer record');

// Test 8: Schema Completeness - Enhanced Candidate Profile, CV Artifact Content, Interview Prep, & User Telegram
const updatedUserA = await request(`/api/collections/users/records/${userA.record.id}`, {
  method: 'PATCH', token: userA.token,
  body: {
    telegramChatId: '987654321',
    telegramBotToken: '123456789:TestTokenXYZ',
    notifyDailyBriefing: true,
    notifyOnInterview: true
  }
});
assert.equal(updatedUserA.response.status, 200, 'updating user telegram preferences failed');
assert.equal(updatedUserA.body.telegramChatId, '987654321');
assert.ok(updatedUserA.body.telegramBotToken.startsWith('enc:'), 'telegramBotToken must be encrypted at rest');

const enhancedCv = await request('/api/collections/cv_artifacts/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    version: `harvard-${suffix}`,
    label: 'Harvard ATS Master',
    targetRole: 'Staff DevOps Engineer',
    isMaster: true,
    content: {
      template: 'harvard-classic',
      summary: 'Senior Infrastructure specialist with 8+ years experience',
      skills: ['Go', 'Kubernetes', 'Terraform']
    }
  }
});
assert.equal(enhancedCv.response.status, 200, 'enhanced cv_artifacts create failed');
assert.equal(enhancedCv.body.targetRole, 'Staff DevOps Engineer');
assert.equal(enhancedCv.body.isMaster, true);

const enhancedInterview = await request('/api/collections/interviews/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    application: appForEvent.body.id,
    round: 'Technical Deep Dive',
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    status: 'Scheduled',
    interviewType: 'System Design',
    interviewerName: 'Chief Architect',
    meetingLink: 'https://meet.google.com/xyz-test',
    questions: ['How do you scale Kubernetes ingress for 50k RPS?']
  }
});
assert.equal(enhancedInterview.response.status, 200, 'enhanced interview create failed');
assert.equal(enhancedInterview.body.interviewType, 'System Design');
assert.equal(enhancedInterview.body.meetingLink, 'https://meet.google.com/xyz-test');

// Clean up Test 8
await request(`/api/collections/interviews/records/${enhancedInterview.body.id}`, {method: 'DELETE', token: userA.token});
await request(`/api/collections/cv_artifacts/records/${enhancedCv.body.id}`, {method: 'DELETE', token: userA.token});

// Test 9: Advanced Backend Improvements & Security Hardening Verification
// 1. Candidate Profile: fullName auto-population on fresh userB profile
const profileTest = await request('/api/collections/candidate_profiles/records', {
  method: 'POST', token: userB.token,
  body: {
    owner: userB.record.id,
    targetRoles: ['Staff Engineer'],
    skills: ['Rust', 'Distributed Systems'],
    preferredModes: ['Remote'],
    dealbreakers: ['Unpaid overtime']
  }
});
assert.equal(profileTest.response.status, 200, 'profile auto-fill test create failed');
assert.equal(profileTest.body.fullName, 'Contract b', 'fullName should be auto-populated from user displayName');

// 2. CV Artifacts: Master CV Exclusivity & Automated ATS Score
const masterCv1 = await request('/api/collections/cv_artifacts/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    version: `master-1-${suffix}`,
    label: 'Master CV 1',
    isMaster: true,
    content: {
      summary: 'Senior Engineering Leader with 10+ years architecting high-scale distributed systems.',
      skills: ['Go', 'Kubernetes', 'PostgreSQL', 'Redis', 'Kafka'],
      experiences: [{ company: 'Unicorn Corp', role: 'Staff Engineer' }],
      educations: [{ institution: 'Top University', degree: 'BS Computer Science' }]
    }
  }
});
assert.equal(masterCv1.response.status, 200, 'masterCv1 create failed');
assert.equal(masterCv1.body.isMaster, true, 'masterCv1 should be master');
assert.ok(masterCv1.body.atsScore >= 70, `atsScore should be calculated (got ${masterCv1.body.atsScore})`);

const masterCv2 = await request('/api/collections/cv_artifacts/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    version: `master-2-${suffix}`,
    label: 'Master CV 2',
    isMaster: true
  }
});
assert.equal(masterCv2.response.status, 200, 'masterCv2 create failed');
assert.equal(masterCv2.body.isMaster, true, 'masterCv2 should be master');

// Verify masterCv1 was automatically demoted (exclusivity guard)
const masterCv1Refreshed = await request(`/api/collections/cv_artifacts/records/${masterCv1.body.id}`, {token: userA.token});
assert.equal(masterCv1Refreshed.body.isMaster, false, 'masterCv1 should be demoted when masterCv2 is designated as master');

// 3. Job Leads: Predatory Red Flag Scanner & Salary Validation
const predatoryLead = await request('/api/collections/job_leads/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    title: 'Senior Software Engineer',
    company: 'Predatory Corp',
    rawJd: 'Kandidat wajib bersedia tahan ijazah asli selama masa ikatan dinas 2 tahun dan dikenakan penalti resign sebesar 50 juta rupiah bila keluar sebelum masa kontrak selesai.',
    matchScore: 65,
    status: 'inbox'
  }
});
assert.equal(predatoryLead.response.status, 200, 'predatory lead create failed');
assert.ok(Array.isArray(predatoryLead.body.redFlags), 'redFlags must be an array');
assert.ok(predatoryLead.body.redFlags.includes('Tahan Ijazah'), 'should detect Tahan Ijazah red flag');
assert.ok(predatoryLead.body.redFlags.includes('Penalti Resign Berat'), 'should detect Penalti Resign Berat red flag');

// Salary validation rejection
const invalidSalaryLead = await request('/api/collections/job_leads/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    title: 'Invalid Salary Lead',
    company: 'Salary Corp',
    rawJd: 'Standard engineer JD',
    matchScore: 70,
    status: 'inbox',
    salaryMin: 50000000,
    salaryMax: 20000000
  }
});
assert.equal(invalidSalaryLead.response.status, 400, 'lead with salaryMax < salaryMin must be rejected with 400');

// 4. Zero-Token Leakage on Users collection: telegramBotToken sanitization
await request(`/api/collections/users/records/${userA.record.id}`, {
  method: 'PATCH', token: userA.token,
  body: {
    telegramChatId: '123456789',
    telegramBotToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
    notifyDailyBriefing: true
  }
});
const userView = await request(`/api/collections/users/records/${userA.record.id}`, {token: userA.token});
assert.notEqual(userView.body.telegramBotToken, '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11', 'raw telegramBotToken must never be leaked in HTTP response');
assert.equal(userView.body.telegramBotToken, '[CONFIGURED]', 'telegramBotToken should be sanitized to [CONFIGURED]');

// 5. Interviews: Advanced Logistics & Questions
const interviewWithLogistics = await request('/api/collections/interviews/records', {
  method: 'POST', token: userA.token,
  body: {
    owner: userA.record.id,
    application: appForEvent.body.id,
    round: 'Final Offer Negotiation',
    scheduledAt: new Date(Date.now() + 172800000).toISOString(),
    status: 'Scheduled',
    interviewType: 'Final / Offering',
    locationType: 'Online',
    meetingPlatform: 'Google Meet',
    meetingLink: 'https://meet.google.com/junction-vip',
    salaryDiscussed: 35000000,
    questions: ['What is your target Take-Home Pay?']
  }
});
assert.equal(interviewWithLogistics.response.status, 200, 'interview with logistics create failed');
assert.equal(interviewWithLogistics.body.locationType, 'Online');
assert.equal(interviewWithLogistics.body.meetingPlatform, 'Google Meet');
assert.equal(interviewWithLogistics.body.salaryDiscussed, 35000000);

// Test 10: P0 to P2 features - professional_contacts, starStories on interviews, contractInspection on applications
// 10.1 Create contact for userA
const contactA = await request('/api/collections/professional_contacts/records', {
  method: 'POST',
  token: userA.token,
  body: {
    owner: userA.record.id,
    name: 'Sarah Executive Recruiter',
    company: 'GoTo Tech',
    role: 'Principal Recruiter',
    relationship: 'Recruiter',
    referralStatus: 'Submitted',
    notes: 'Submitted for Staff Platform role',
  },
});
assert.equal(contactA.response.status, 200, 'contact create failed');
assert.equal(contactA.body.name, 'Sarah Executive Recruiter');
assert.equal(contactA.body.owner, userA.record.id, 'contact owner must match userA');

// 10.2 UserB cannot view or list UserA's contact (multi-tenant isolation)
const contactListB = await request('/api/collections/professional_contacts/records', {
  method: 'GET',
  token: userB.token,
});
assert.equal(contactListB.response.status, 200);
const leakedContact = contactListB.body.items.find((c) => c.id === contactA.body.id);
assert.equal(leakedContact, undefined, 'userB must not see userA contacts');

const contactViewB = await request(`/api/collections/professional_contacts/records/${contactA.body.id}`, {
  method: 'GET',
  token: userB.token,
});
assert.equal(contactViewB.response.status, 404, 'userB view of userA contact must return 404');

// 10.3 Update interview with starStories (P0 STAR Answer Coach)
const starStoryData = [
  {
    id: 'star-test-1',
    question: 'How did you handle production outage?',
    situation: 'Black friday flash sale traffic surged 500%',
    task: 'Restore checkout availability in 15 mins',
    action: 'Triggered circuit breaker and provisioned replicas',
    result: 'Latency restored to 180ms in 9 minutes',
    score: 95,
  },
];
const interviewWithStar = await request(`/api/collections/interviews/records/${interviewWithLogistics.body.id}`, {
  method: 'PATCH',
  token: userA.token,
  body: {
    starStories: starStoryData,
  },
});
assert.equal(interviewWithStar.response.status, 200, 'interview patch with starStories failed');
assert.equal(Boolean(interviewWithStar.body.starStories && interviewWithStar.body.starStories.length === 1), true, 'starStories should have 1 item');
assert.equal(interviewWithStar.body.starStories[0].score, 95);

// 10.4 Update application with contractInspection (P0 Offering Inspector)
const contractAuditData = {
  riskScore: 25,
  verdict: 'Requires Clarification',
  scannedAt: new Date().toISOString(),
  findings: [
    {
      category: 'Masa Percobaan pada PKWT',
      severity: 'high',
      clauseText: 'masa percobaan 3 bulan',
      issue: 'Masa percobaan dilarang pada PKWT',
      recommendation: 'Hapus klausul probation',
    },
  ],
};
const appWithContractAudit = await request(`/api/collections/applications/records/${appForEvent.body.id}`, {
  method: 'PATCH',
  token: userA.token,
  body: {
    contractInspection: contractAuditData,
  },
});
assert.equal(appWithContractAudit.response.status, 200, 'app patch with contractInspection failed');
assert.equal(appWithContractAudit.body.contractInspection.verdict, 'Requires Clarification');

// Clean up contactA
await request(`/api/collections/professional_contacts/records/${contactA.body.id}`, {
  method: 'DELETE',
  token: userA.token,
});

// Clean up Test 9
await request(`/api/collections/interviews/records/${interviewWithLogistics.body.id}`, {method: 'DELETE', token: userA.token});
await request(`/api/collections/job_leads/records/${predatoryLead.body.id}`, {method: 'DELETE', token: userA.token});
await request(`/api/collections/cv_artifacts/records/${masterCv1.body.id}`, {method: 'DELETE', token: userA.token});
await request(`/api/collections/cv_artifacts/records/${masterCv2.body.id}`, {method: 'DELETE', token: userA.token});
await request(`/api/collections/candidate_profiles/records/${profileTest.body.id}`, {method: 'DELETE', token: userB.token});

// Clean up
await request(`/api/collections/offers/records/${offerRecord.body.id}`, {method: 'DELETE', token: userA.token});
await request(`/api/collections/application_events/records/${viewEvent.body.id}`, {method: 'DELETE', token: userA.token});
await request(`/api/collections/application_events/records/${lateViewEvent.body.id}`, {method: 'DELETE', token: userA.token});
await request(`/api/collections/application_events/records/${offerEvent.body.id}`, {method: 'DELETE', token: userA.token});
await request(`/api/collections/applications/records/${appForEvent.body.id}`, {method: 'DELETE', token: userA.token});
await request(`/api/collections/recruitment_notifications/records/${notif.body.id}`, {method: 'DELETE', token: userA.token});
await request(`/api/collections/gmail_connections/records/${gmailConn.body.id}`, {method: 'DELETE', token: userA.token});
await request(`/api/collections/job_leads/records/${lead.body.id}`, {method: 'DELETE', token: userA.token});
await request(`/api/collections/candidate_profiles/records/${profile.body.id}`, {method: 'DELETE', token: userA.token});

console.log('backend contract ok: ownership, derived CV metrics, token sanitization, and safe state machine');
