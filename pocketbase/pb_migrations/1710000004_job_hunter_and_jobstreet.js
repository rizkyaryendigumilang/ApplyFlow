migrate((db) => {
  const dao = Dao(db);

  // 1. candidate_profiles collection
  const candidateProfiles = new Collection({
    id: "candidate_profiles",
    name: "candidate_profiles",
    type: "base",
    schema: [
      { id: "owner", name: "owner", type: "relation", required: true, options: { collectionId: "_pb_users_auth_", cascadeDelete: true, maxSelect: 1 } },
      { id: "headline", name: "headline", type: "text", required: false, options: { min: 0, max: 160, pattern: "" } },
      { id: "targetRoles", name: "targetRoles", type: "json", required: false, options: { maxSize: 10000 } },
      { id: "skills", name: "skills", type: "json", required: false, options: { maxSize: 20000 } },
      { id: "minSalary", name: "minSalary", type: "number", required: false, options: { min: 0, max: 1000000000, noDecimal: true } },
      { id: "preferredModes", name: "preferredModes", type: "json", required: false, options: { maxSize: 5000 } },
      { id: "dealbreakers", name: "dealbreakers", type: "json", required: false, options: { maxSize: 10000 } },
      { id: "experienceSummary", name: "experienceSummary", type: "text", required: false, options: { min: 0, max: 8000, pattern: "" } },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_profile_owner ON candidate_profiles (owner)"],
    listRule: '@request.auth.id != "" && owner = @request.auth.id',
    viewRule: '@request.auth.id != "" && owner = @request.auth.id',
    createRule: '@request.auth.id != "" && owner = @request.auth.id',
    updateRule: '@request.auth.id != "" && owner = @request.auth.id',
    deleteRule: '@request.auth.id != "" && owner = @request.auth.id',
  });
  dao.saveCollection(candidateProfiles);

  // 2. job_leads collection (Job Hunter AI)
  const jobLeads = new Collection({
    id: "job_leads",
    name: "job_leads",
    type: "base",
    schema: [
      { id: "owner", name: "owner", type: "relation", required: true, options: { collectionId: "_pb_users_auth_", cascadeDelete: true, maxSelect: 1 } },
      { id: "title", name: "title", type: "text", required: true, options: { min: 1, max: 160, pattern: "\\S" } },
      { id: "company", name: "company", type: "text", required: true, options: { min: 1, max: 120, pattern: "\\S" } },
      { id: "url", name: "url", type: "url", required: false, options: { exceptDomains: [], onlyDomains: [] } },
      { id: "location", name: "location", type: "text", required: false, options: { min: 0, max: 120, pattern: "" } },
      { id: "employmentType", name: "employmentType", type: "text", required: false, options: { min: 0, max: 60, pattern: "" } },
      { id: "workMode", name: "workMode", type: "text", required: false, options: { min: 0, max: 40, pattern: "" } },
      { id: "rawJd", name: "rawJd", type: "text", required: true, options: { min: 1, max: 100000, pattern: "\\S" } },
      { id: "source", name: "source", type: "text", required: false, options: { min: 0, max: 60, pattern: "" } },
      { id: "matchScore", name: "matchScore", type: "number", required: false, options: { min: 0, max: 100, noDecimal: true } },
      { id: "evaluation", name: "evaluation", type: "json", required: false, options: { maxSize: 30000 } },
      { id: "status", name: "status", type: "select", required: true, options: { maxSelect: 1, values: ["inbox", "triage_passed", "triage_rejected", "shortlisted", "promoted_to_apply", "archived"] } },
      { id: "promotedApplication", name: "promotedApplication", type: "relation", required: false, options: { collectionId: "applications", cascadeDelete: false, maxSelect: 1 } },
    ],
    indexes: [
      "CREATE INDEX idx_leads_owner_status ON job_leads (owner, status)",
      "CREATE INDEX idx_leads_owner_score ON job_leads (owner, matchScore)"
    ],
    listRule: '@request.auth.id != "" && owner = @request.auth.id',
    viewRule: '@request.auth.id != "" && owner = @request.auth.id',
    createRule: '@request.auth.id != "" && owner = @request.auth.id',
    updateRule: '@request.auth.id != "" && owner = @request.auth.id',
    deleteRule: '@request.auth.id != "" && owner = @request.auth.id',
  });
  dao.saveCollection(jobLeads);

  // 3. gmail_connections collection
  const gmailConnections = new Collection({
    id: "gmail_connections",
    name: "gmail_connections",
    type: "base",
    schema: [
      { id: "owner", name: "owner", type: "relation", required: true, options: { collectionId: "_pb_users_auth_", cascadeDelete: true, maxSelect: 1 } },
      { id: "email", name: "email", type: "email", required: true, options: { exceptDomains: [], onlyDomains: [] } },
      { id: "accessToken", name: "accessToken", type: "text", required: false, options: { min: 0, max: 4000, pattern: "" } },
      { id: "refreshToken", name: "refreshToken", type: "text", required: false, options: { min: 0, max: 4000, pattern: "" } },
      { id: "tokenExpiry", name: "tokenExpiry", type: "date", required: false, options: { min: "", max: "" } },
      { id: "syncStatus", name: "syncStatus", type: "select", required: true, options: { maxSelect: 1, values: ["idle", "syncing", "failed", "paused"] } },
      { id: "lastHistoryId", name: "lastHistoryId", type: "text", required: false, options: { min: 0, max: 120, pattern: "" } },
      { id: "lastSyncedAt", name: "lastSyncedAt", type: "date", required: false, options: { min: "", max: "" } },
      { id: "autoCreateApplication", name: "autoCreateApplication", type: "bool", required: false, options: {} },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_gmail_owner ON gmail_connections (owner)"],
    listRule: '@request.auth.id != "" && owner = @request.auth.id',
    viewRule: '@request.auth.id != "" && owner = @request.auth.id',
    createRule: '@request.auth.id != "" && owner = @request.auth.id',
    updateRule: '@request.auth.id != "" && owner = @request.auth.id',
    deleteRule: '@request.auth.id != "" && owner = @request.auth.id',
  });
  dao.saveCollection(gmailConnections);

  // 4. application_events collection
  const applicationEvents = new Collection({
    id: "application_events",
    name: "application_events",
    type: "base",
    schema: [
      { id: "owner", name: "owner", type: "relation", required: true, options: { collectionId: "_pb_users_auth_", cascadeDelete: true, maxSelect: 1 } },
      { id: "application", name: "application", type: "relation", required: true, options: { collectionId: "applications", cascadeDelete: true, maxSelect: 1 } },
      { id: "eventType", name: "eventType", type: "select", required: true, options: { maxSelect: 1, values: ["application_submitted", "employer_viewed", "recruiter_contacted", "screening_started", "interview_invited", "interview_rescheduled", "assessment_received", "document_requested", "rejection_received", "offer_received", "note_added"] } },
      { id: "eventAt", name: "eventAt", type: "date", required: false, options: { min: "", max: "" } },
      { id: "receivedAt", name: "receivedAt", type: "date", required: false, options: { min: "", max: "" } },
      { id: "sourcePlatform", name: "sourcePlatform", type: "text", required: false, options: { min: 0, max: 60, pattern: "" } },
      { id: "gmailMessageId", name: "gmailMessageId", type: "text", required: false, options: { min: 0, max: 160, pattern: "" } },
      { id: "gmailThreadId", name: "gmailThreadId", type: "text", required: false, options: { min: 0, max: 160, pattern: "" } },
      { id: "rawSubject", name: "rawSubject", type: "text", required: false, options: { min: 0, max: 255, pattern: "" } },
      { id: "evidenceSnippet", name: "evidenceSnippet", type: "text", required: false, options: { min: 0, max: 6000, pattern: "" } },
    ],
    indexes: [
      "CREATE INDEX idx_app_events_owner_app ON application_events (owner, application)",
      "CREATE INDEX idx_app_events_app_msg ON application_events (application, gmailMessageId)"
    ],
    listRule: '@request.auth.id != "" && owner = @request.auth.id && application.owner = @request.auth.id',
    viewRule: '@request.auth.id != "" && owner = @request.auth.id && application.owner = @request.auth.id',
    createRule: '@request.auth.id != "" && owner = @request.auth.id && application.owner = @request.auth.id',
    updateRule: '@request.auth.id != "" && owner = @request.auth.id && application.owner = @request.auth.id',
    deleteRule: '@request.auth.id != "" && owner = @request.auth.id && application.owner = @request.auth.id',
  });
  dao.saveCollection(applicationEvents);

  // 5. recruitment_notifications collection
  const recruitmentNotifications = new Collection({
    id: "recruitment_notifications",
    name: "recruitment_notifications",
    type: "base",
    schema: [
      { id: "owner", name: "owner", type: "relation", required: true, options: { collectionId: "_pb_users_auth_", cascadeDelete: true, maxSelect: 1 } },
      { id: "gmailMessageId", name: "gmailMessageId", type: "text", required: false, options: { min: 0, max: 160, pattern: "" } },
      { id: "platform", name: "platform", type: "text", required: false, options: { min: 0, max: 60, pattern: "" } },
      { id: "extractedCompany", name: "extractedCompany", type: "text", required: false, options: { min: 0, max: 120, pattern: "" } },
      { id: "extractedPosition", name: "extractedPosition", type: "text", required: false, options: { min: 0, max: 160, pattern: "" } },
      { id: "extractedEventType", name: "extractedEventType", type: "text", required: false, options: { min: 0, max: 60, pattern: "" } },
      { id: "rawSubject", name: "rawSubject", type: "text", required: false, options: { min: 0, max: 255, pattern: "" } },
      { id: "evidenceSnippet", name: "evidenceSnippet", type: "text", required: false, options: { min: 0, max: 6000, pattern: "" } },
      { id: "matchStatus", name: "matchStatus", type: "select", required: true, options: { maxSelect: 1, values: ["matched", "needs_review", "unmatched", "auto_created", "ignored"] } },
      { id: "matchedApplication", name: "matchedApplication", type: "relation", required: false, options: { collectionId: "applications", cascadeDelete: false, maxSelect: 1 } },
      { id: "confidence", name: "confidence", type: "number", required: false, options: { min: 0, max: 100, noDecimal: true } },
    ],
    indexes: ["CREATE INDEX idx_notif_owner_status ON recruitment_notifications (owner, matchStatus)"],
    listRule: '@request.auth.id != "" && owner = @request.auth.id',
    viewRule: '@request.auth.id != "" && owner = @request.auth.id',
    createRule: '@request.auth.id != "" && owner = @request.auth.id',
    updateRule: '@request.auth.id != "" && owner = @request.auth.id',
    deleteRule: '@request.auth.id != "" && owner = @request.auth.id',
  });
  dao.saveCollection(recruitmentNotifications);

  // 6. Update applications collection with Viewed status and JobStreet/Hunter metadata
  const applications = dao.findCollectionByNameOrId("applications");
  const statusField = applications.schema.getFieldByName("status");
  if (statusField) {
    statusField.options.values = ["Wishlist", "Applied", "Viewed", "Screening", "Interview", "Offer", "Rejected", "Ghosted"];
  }
  applications.schema.addField(new SchemaField({
    id: "jobSource",
    name: "jobSource",
    type: "select",
    required: false,
    options: { maxSelect: 1, values: ["JobStreet", "LinkedIn", "Company Website", "Direct / Referral", "Other"] }
  }));
  applications.schema.addField(new SchemaField({
    id: "applicationMethod",
    name: "applicationMethod",
    type: "select",
    required: false,
    options: { maxSelect: 1, values: ["JobStreet Apply", "Email", "Portal / ATS", "Easy Apply", "Manual"] }
  }));
  applications.schema.addField(new SchemaField({
    id: "externalJobId",
    name: "externalJobId",
    type: "text",
    required: false,
    options: { min: 0, max: 120, pattern: "" }
  }));
  applications.schema.addField(new SchemaField({
    id: "autoCreated",
    name: "autoCreated",
    type: "bool",
    required: false,
    options: {}
  }));
  applications.schema.addField(new SchemaField({
    id: "needsReview",
    name: "needsReview",
    type: "bool",
    required: false,
    options: {}
  }));
  applications.schema.addField(new SchemaField({
    id: "leadSource",
    name: "leadSource",
    type: "relation",
    required: false,
    options: { collectionId: "job_leads", cascadeDelete: false, maxSelect: 1 }
  }));
  dao.saveCollection(applications);

}, (db) => {
  const dao = Dao(db);
  const collections = ["recruitment_notifications", "application_events", "gmail_connections", "job_leads", "candidate_profiles"];
  collections.forEach((name) => {
    try {
      dao.deleteCollection(dao.findCollectionByNameOrId(name));
    } catch (_) {}
  });
});
