/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);

  // 1. professional_contacts collection (Networking & Headhunter CRM - P1)
  const contacts = new Collection({
    id: "professional_contacts",
    name: "professional_contacts",
    type: "base",
    schema: [
      { id: "owner", name: "owner", type: "relation", required: true, options: { collectionId: "_pb_users_auth_", cascadeDelete: true, maxSelect: 1 } },
      { id: "name", name: "name", type: "text", required: true, options: { min: 1, max: 120, pattern: "\\S" } },
      { id: "company", name: "company", type: "text", required: false, options: { min: 0, max: 120, pattern: "" } },
      { id: "role", name: "role", type: "text", required: false, options: { min: 0, max: 120, pattern: "" } },
      { id: "email", name: "email", type: "email", required: false, options: { exceptDomains: [], onlyDomains: [] } },
      { id: "phone", name: "phone", type: "text", required: false, options: { min: 0, max: 50, pattern: "" } },
      { id: "linkedinUrl", name: "linkedinUrl", type: "url", required: false, options: { exceptDomains: [], onlyDomains: [] } },
      { id: "relationship", name: "relationship", type: "select", required: true, options: { maxSelect: 1, values: ["Recruiter", "Hiring Manager", "Peer", "Mentor", "Alumni", "Former Colleague", "Other"] } },
      { id: "associatedApplication", name: "associatedApplication", type: "relation", required: false, options: { collectionId: "applications", cascadeDelete: false, maxSelect: 1 } },
      { id: "referralStatus", name: "referralStatus", type: "select", required: true, options: { maxSelect: 1, values: ["None", "Requested", "Submitted", "Interview Secured", "Declined"] } },
      { id: "lastContactDate", name: "lastContactDate", type: "date", required: false, options: {} },
      { id: "notes", name: "notes", type: "text", required: false, options: { min: 0, max: 10000, pattern: "" } },
    ],
    indexes: [
      "CREATE INDEX idx_contacts_owner ON professional_contacts (owner)",
      "CREATE INDEX idx_contacts_owner_company ON professional_contacts (owner, company)"
    ],
    listRule: '@request.auth.id != "" && owner = @request.auth.id',
    viewRule: '@request.auth.id != "" && owner = @request.auth.id',
    createRule: '@request.auth.id != "" && owner = @request.auth.id',
    updateRule: '@request.auth.id != "" && owner = @request.auth.id',
    deleteRule: '@request.auth.id != "" && owner = @request.auth.id',
  });
  dao.saveCollection(contacts);

  // 2. interviews collection: Add starStories (STAR Method Answer Coach - P0)
  const interviewsCollection = dao.findCollectionByNameOrId("interviews");
  interviewsCollection.schema.addField(new SchemaField({
    name: "starStories",
    type: "json",
    required: false,
    options: { maxSize: 1000000 }
  }));
  dao.saveCollection(interviewsCollection);

  // 3. applications collection: Add contractInspection (Offering Letter & Contract Risk Inspector - P0)
  const applicationsCollection = dao.findCollectionByNameOrId("applications");
  applicationsCollection.schema.addField(new SchemaField({
    name: "contractInspection",
    type: "json",
    required: false,
    options: { maxSize: 1000000 }
  }));
  dao.saveCollection(applicationsCollection);

}, (db) => {
  const dao = new Dao(db);
  try {
    const contacts = dao.findCollectionByNameOrId("professional_contacts");
    dao.deleteCollection(contacts);
  } catch (_) {}

  try {
    const interviews = dao.findCollectionByNameOrId("interviews");
    interviews.schema.removeField("starStories");
    dao.saveCollection(interviews);
  } catch (_) {}

  try {
    const applications = dao.findCollectionByNameOrId("applications");
    applications.schema.removeField("contractInspection");
    dao.saveCollection(applications);
  } catch (_) {}
});
