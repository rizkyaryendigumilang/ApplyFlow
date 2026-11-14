/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);

  // 1. Koleksi users (Otomasi Cron Server Tanpa Ketergantungan Browser)
  const usersCollection = dao.findCollectionByNameOrId("_pb_users_auth_");
  usersCollection.schema.addField(new SchemaField({
    name: "briefingHour",
    type: "number",
    required: false,
    options: { min: 0, max: 23 }
  }));
  usersCollection.schema.addField(new SchemaField({
    name: "timezone",
    type: "text",
    required: false,
    options: { min: 0, max: 64, pattern: "" }
  }));
  usersCollection.schema.addField(new SchemaField({
    name: "lastBriefingAt",
    type: "date",
    required: false,
    options: {}
  }));
  usersCollection.schema.addField(new SchemaField({
    name: "telegramDeliveryStatus",
    type: "text",
    required: false,
    options: { min: 0, max: 50, pattern: "" }
  }));
  dao.saveCollection(usersCollection);

  // 2. Koleksi candidate_profiles (Kelengkapan Header ATS Resume)
  const profileCollection = dao.findCollectionByNameOrId("candidate_profiles");
  profileCollection.schema.addField(new SchemaField({
    name: "fullName",
    type: "text",
    required: false,
    options: { min: 0, max: 120, pattern: "" }
  }));
  profileCollection.schema.addField(new SchemaField({
    name: "educationSummary",
    type: "json",
    required: false,
    options: { maxSize: 500000 }
  }));
  profileCollection.schema.addField(new SchemaField({
    name: "certifications",
    type: "json",
    required: false,
    options: { maxSize: 500000 }
  }));
  profileCollection.schema.addField(new SchemaField({
    name: "languages",
    type: "json",
    required: false,
    options: { maxSize: 500000 }
  }));
  dao.saveCollection(profileCollection);

  // 3. Koleksi cv_artifacts (Persistensi Resume Harvard ATS & Audit Score)
  const cvCollection = dao.findCollectionByNameOrId("cv_artifacts");
  cvCollection.schema.addField(new SchemaField({
    name: "atsScore",
    type: "number",
    required: false,
    options: { min: 0, max: 100 }
  }));
  cvCollection.schema.addField(new SchemaField({
    name: "lastAtsAudit",
    type: "json",
    required: false,
    options: { maxSize: 500000 }
  }));
  dao.saveCollection(cvCollection);

  // 4. Koleksi interviews (Logistik & Persiapan Wawancara Nyata)
  const interviewCollection = dao.findCollectionByNameOrId("interviews");
  interviewCollection.schema.addField(new SchemaField({
    name: "locationType",
    type: "select",
    required: false,
    options: {
      maxSelect: 1,
      values: ["Online", "On-site", "Phone"]
    }
  }));
  interviewCollection.schema.addField(new SchemaField({
    name: "meetingPlatform",
    type: "select",
    required: false,
    options: {
      maxSelect: 1,
      values: ["Google Meet", "Zoom", "Microsoft Teams", "On-site", "Phone", "Other"]
    }
  }));
  interviewCollection.schema.addField(new SchemaField({
    name: "keyQuestions",
    type: "json",
    required: false,
    options: { maxSize: 500000 }
  }));
  interviewCollection.schema.addField(new SchemaField({
    name: "salaryDiscussed",
    type: "number",
    required: false,
    options: { min: 0 }
  }));
  interviewCollection.schema.addField(new SchemaField({
    name: "reminderSentAt",
    type: "date",
    required: false,
    options: {}
  }));
  dao.saveCollection(interviewCollection);

  // 5. Koleksi job_leads (Penyaringan Kompensasi & Red Flag)
  const leadsCollection = dao.findCollectionByNameOrId("job_leads");
  leadsCollection.schema.addField(new SchemaField({
    name: "salaryMin",
    type: "number",
    required: false,
    options: { min: 0 }
  }));
  leadsCollection.schema.addField(new SchemaField({
    name: "salaryMax",
    type: "number",
    required: false,
    options: { min: 0 }
  }));
  leadsCollection.schema.addField(new SchemaField({
    name: "salaryCurrency",
    type: "text",
    required: false,
    options: { min: 0, max: 10, pattern: "" }
  }));
  leadsCollection.schema.addField(new SchemaField({
    name: "compensationType",
    type: "select",
    required: false,
    options: {
      maxSelect: 1,
      values: ["Gross", "Nett", "Undisclosed"]
    }
  }));
  leadsCollection.schema.addField(new SchemaField({
    name: "redFlags",
    type: "json",
    required: false,
    options: { maxSize: 500000 }
  }));
  leadsCollection.schema.addField(new SchemaField({
    name: "greenFlags",
    type: "json",
    required: false,
    options: { maxSize: 500000 }
  }));
  dao.saveCollection(leadsCollection);

  // 6. Penguatan Keamanan & Indeks Kinerja
  db.newQuery("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)").execute();
  db.newQuery("CREATE INDEX IF NOT EXISTS idx_users_telegram_chat ON users (telegramChatId)").execute();
  db.newQuery("CREATE INDEX IF NOT EXISTS idx_interviews_reminder ON interviews (status, scheduledAt, reminderSentAt)").execute();
  db.newQuery("CREATE INDEX IF NOT EXISTS idx_job_leads_salary ON job_leads (owner, status, salaryMax)").execute();
  db.newQuery("CREATE INDEX IF NOT EXISTS idx_cv_artifacts_master ON cv_artifacts (owner, isMaster)").execute();
  db.newQuery("CREATE INDEX IF NOT EXISTS idx_candidate_profiles_owner ON candidate_profiles (owner)").execute();

}, (db) => {
  const dao = new Dao(db);
  try {
    const users = dao.findCollectionByNameOrId("_pb_users_auth_");
    users.schema.removeField("briefingHour");
    users.schema.removeField("timezone");
    users.schema.removeField("lastBriefingAt");
    users.schema.removeField("telegramDeliveryStatus");
    dao.saveCollection(users);
  } catch (_) {}

  try {
    const profiles = dao.findCollectionByNameOrId("candidate_profiles");
    profiles.schema.removeField("fullName");
    profiles.schema.removeField("educationSummary");
    profiles.schema.removeField("certifications");
    profiles.schema.removeField("languages");
    dao.saveCollection(profiles);
  } catch (_) {}

  try {
    const cvs = dao.findCollectionByNameOrId("cv_artifacts");
    cvs.schema.removeField("atsScore");
    cvs.schema.removeField("lastAtsAudit");
    dao.saveCollection(cvs);
  } catch (_) {}

  try {
    const interviews = dao.findCollectionByNameOrId("interviews");
    interviews.schema.removeField("locationType");
    interviews.schema.removeField("meetingPlatform");
    interviews.schema.removeField("keyQuestions");
    interviews.schema.removeField("salaryDiscussed");
    interviews.schema.removeField("reminderSentAt");
    dao.saveCollection(interviews);
  } catch (_) {}

  try {
    const leads = dao.findCollectionByNameOrId("job_leads");
    leads.schema.removeField("salaryMin");
    leads.schema.removeField("salaryMax");
    leads.schema.removeField("salaryCurrency");
    leads.schema.removeField("compensationType");
    leads.schema.removeField("redFlags");
    leads.schema.removeField("greenFlags");
    dao.saveCollection(leads);
  } catch (_) {}

  db.newQuery("DROP INDEX IF EXISTS idx_users_email").execute();
  db.newQuery("DROP INDEX IF EXISTS idx_users_telegram_chat").execute();
  db.newQuery("DROP INDEX IF EXISTS idx_interviews_reminder").execute();
  db.newQuery("DROP INDEX IF EXISTS idx_job_leads_salary").execute();
  db.newQuery("DROP INDEX IF EXISTS idx_cv_artifacts_master").execute();
  db.newQuery("DROP INDEX IF EXISTS idx_candidate_profiles_owner").execute();
});
