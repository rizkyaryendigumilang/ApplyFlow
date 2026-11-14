/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);

  // 1. Add Telegram Preferences to users collection
  const usersCollection = dao.findCollectionByNameOrId("_pb_users_auth_");
  usersCollection.schema.addField(new SchemaField({
    name: "telegramBotToken",
    type: "text",
    required: false,
    options: { min: 0, max: 255, pattern: "" }
  }));
  usersCollection.schema.addField(new SchemaField({
    name: "notifyDailyBriefing",
    type: "bool",
    required: false,
    options: {}
  }));
  usersCollection.schema.addField(new SchemaField({
    name: "notifyOnInterview",
    type: "bool",
    required: false,
    options: {}
  }));
  usersCollection.schema.addField(new SchemaField({
    name: "notifyOnStatusChange",
    type: "bool",
    required: false,
    options: {}
  }));
  usersCollection.schema.addField(new SchemaField({
    name: "notifyOnGhostingWarning",
    type: "bool",
    required: false,
    options: {}
  }));
  usersCollection.schema.addField(new SchemaField({
    name: "notifyOnHighFitLead",
    type: "bool",
    required: false,
    options: {}
  }));
  dao.saveCollection(usersCollection);

  // 2. Add Contact & Social links to candidate_profiles
  const profileCollection = dao.findCollectionByNameOrId("candidate_profiles");
  profileCollection.schema.addField(new SchemaField({
    name: "phone",
    type: "text",
    required: false,
    options: { min: 0, max: 50, pattern: "" }
  }));
  profileCollection.schema.addField(new SchemaField({
    name: "location",
    type: "text",
    required: false,
    options: { min: 0, max: 120, pattern: "" }
  }));
  profileCollection.schema.addField(new SchemaField({
    name: "linkedinUrl",
    type: "text",
    required: false,
    options: { min: 0, max: 255, pattern: "" }
  }));
  profileCollection.schema.addField(new SchemaField({
    name: "githubUrl",
    type: "text",
    required: false,
    options: { min: 0, max: 255, pattern: "" }
  }));
  profileCollection.schema.addField(new SchemaField({
    name: "portfolioUrl",
    type: "text",
    required: false,
    options: { min: 0, max: 255, pattern: "" }
  }));
  dao.saveCollection(profileCollection);

  // 3. Add Structured Resume Data to cv_artifacts
  const cvCollection = dao.findCollectionByNameOrId("cv_artifacts");
  cvCollection.schema.addField(new SchemaField({
    name: "content",
    type: "json",
    required: false,
    options: { maxSize: 2000000 }
  }));
  cvCollection.schema.addField(new SchemaField({
    name: "targetRole",
    type: "text",
    required: false,
    options: { min: 0, max: 160, pattern: "" }
  }));
  cvCollection.schema.addField(new SchemaField({
    name: "isMaster",
    type: "bool",
    required: false,
    options: {}
  }));
  dao.saveCollection(cvCollection);

  // 4. Add Preparation Metadata to interviews
  const interviewCollection = dao.findCollectionByNameOrId("interviews");
  interviewCollection.schema.addField(new SchemaField({
    name: "interviewType",
    type: "select",
    required: false,
    options: {
      maxSelect: 1,
      values: [
        "HR Screening",
        "Technical Interview",
        "System Design",
        "User / Hiring Manager",
        "Cultural Fit",
        "Final / Offering"
      ]
    }
  }));
  interviewCollection.schema.addField(new SchemaField({
    name: "interviewerName",
    type: "text",
    required: false,
    options: { min: 0, max: 120, pattern: "" }
  }));
  interviewCollection.schema.addField(new SchemaField({
    name: "meetingLink",
    type: "text",
    required: false,
    options: { min: 0, max: 500, pattern: "" }
  }));
  interviewCollection.schema.addField(new SchemaField({
    name: "prepNotes",
    type: "text",
    required: false,
    options: { min: 0, max: 5000, pattern: "" }
  }));
  interviewCollection.schema.addField(new SchemaField({
    name: "feedback",
    type: "text",
    required: false,
    options: { min: 0, max: 5000, pattern: "" }
  }));
  dao.saveCollection(interviewCollection);

  // 5. Add Salary & Flags to job_leads
  const leadsCollection = dao.findCollectionByNameOrId("job_leads");
  leadsCollection.schema.addField(new SchemaField({
    name: "salaryRange",
    type: "text",
    required: false,
    options: { min: 0, max: 120, pattern: "" }
  }));
  leadsCollection.schema.addField(new SchemaField({
    name: "dealbreakerFlags",
    type: "json",
    required: false,
    options: { maxSize: 500000 }
  }));
  dao.saveCollection(leadsCollection);

  // 6. Additional query performance indexes
  db.newQuery("CREATE INDEX IF NOT EXISTS idx_interview_owner_sched ON interviews (owner, scheduledAt)").execute();
  db.newQuery("CREATE INDEX IF NOT EXISTS idx_profile_owner ON candidate_profiles (owner)").execute();
  db.newQuery("CREATE INDEX IF NOT EXISTS idx_leads_owner_status ON job_leads (owner, status)").execute();

}, (db) => {
  const dao = new Dao(db);
  try {
    const users = dao.findCollectionByNameOrId("_pb_users_auth_");
    users.schema.removeField("telegramBotToken");
    users.schema.removeField("notifyDailyBriefing");
    users.schema.removeField("notifyOnInterview");
    users.schema.removeField("notifyOnStatusChange");
    users.schema.removeField("notifyOnGhostingWarning");
    users.schema.removeField("notifyOnHighFitLead");
    dao.saveCollection(users);
  } catch (_) {}

  try {
    const profiles = dao.findCollectionByNameOrId("candidate_profiles");
    profiles.schema.removeField("phone");
    profiles.schema.removeField("location");
    profiles.schema.removeField("linkedinUrl");
    profiles.schema.removeField("githubUrl");
    profiles.schema.removeField("portfolioUrl");
    dao.saveCollection(profiles);
  } catch (_) {}

  try {
    const cvs = dao.findCollectionByNameOrId("cv_artifacts");
    cvs.schema.removeField("content");
    cvs.schema.removeField("targetRole");
    cvs.schema.removeField("isMaster");
    dao.saveCollection(cvs);
  } catch (_) {}

  try {
    const interviews = dao.findCollectionByNameOrId("interviews");
    interviews.schema.removeField("interviewType");
    interviews.schema.removeField("interviewerName");
    interviews.schema.removeField("meetingLink");
    interviews.schema.removeField("prepNotes");
    interviews.schema.removeField("feedback");
    dao.saveCollection(interviews);
  } catch (_) {}

  try {
    const leads = dao.findCollectionByNameOrId("job_leads");
    leads.schema.removeField("salaryRange");
    leads.schema.removeField("dealbreakerFlags");
    dao.saveCollection(leads);
  } catch (_) {}

  db.newQuery("DROP INDEX IF EXISTS idx_interview_owner_sched").execute();
  db.newQuery("DROP INDEX IF EXISTS idx_profile_owner").execute();
  db.newQuery("DROP INDEX IF EXISTS idx_leads_owner_status").execute();
});
