/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);

  // 1. Add role field to users collection (RBAC foundation)
  const usersCollection = dao.findCollectionByNameOrId("_pb_users_auth_");
  usersCollection.schema.addField(new SchemaField({
    name: "role",
    type: "select",
    required: false,
    options: {
      maxSelect: 1,
      values: ["candidate", "coach", "recruiter", "admin"]
    }
  }));
  dao.saveCollection(usersCollection);

  // 2. Create offers collection for Take Home Pay & Indonesian statutory offer persistence
  const offersCollection = new Collection({
    id: "offers",
    name: "offers",
    type: "base",
    schema: [
      { id: "owner", name: "owner", type: "relation", required: true, options: { collectionId: "_pb_users_auth_", cascadeDelete: true, maxSelect: 1 } },
      { id: "application", name: "application", type: "relation", required: true, options: { collectionId: "applications", cascadeDelete: true, maxSelect: 1 } },
      { id: "company", name: "company", type: "text", required: true, options: { min: 1, max: 120, pattern: "\\S" } },
      { id: "position", name: "position", type: "text", required: true, options: { min: 1, max: 160, pattern: "\\S" } },
      { id: "placementType", name: "placementType", type: "select", required: false, options: { maxSelect: 1, values: ["In-house", "Vendor / Outsource", "Contract"] } },
      { id: "workMode", name: "workMode", type: "select", required: false, options: { maxSelect: 1, values: ["Remote", "Hybrid", "On-site"] } },
      { id: "baseSalary", name: "baseSalary", type: "number", required: true, options: { min: 0, max: 2000000000, noDecimal: true } },
      { id: "fixedAllowance", name: "fixedAllowance", type: "number", required: false, options: { min: 0, max: 1000000000, noDecimal: true } },
      { id: "onCallAllowance", name: "onCallAllowance", type: "number", required: false, options: { min: 0, max: 1000000000, noDecimal: true } },
      { id: "shiftAllowance", name: "shiftAllowance", type: "number", required: false, options: { min: 0, max: 1000000000, noDecimal: true } },
      { id: "wfhAllowance", name: "wfhAllowance", type: "number", required: false, options: { min: 0, max: 1000000000, noDecimal: true } },
      { id: "thrMultiplier", name: "thrMultiplier", type: "number", required: false, options: { min: 0, max: 10 } },
      { id: "bonusMonths", name: "bonusMonths", type: "number", required: false, options: { min: 0, max: 24 } },
      { id: "ptkpCategory", name: "ptkpCategory", type: "select", required: false, options: { maxSelect: 1, values: ["TK/0", "TK/1", "K/0", "K/1", "K/2", "K/3"] } },
      { id: "hasBpjs", name: "hasBpjs", type: "bool", required: false, options: {} },
      { id: "monthlyCommuteCost", name: "monthlyCommuteCost", type: "number", required: false, options: { min: 0, max: 50000000, noDecimal: true } },
      { id: "customTaxRatePercent", name: "customTaxRatePercent", type: "number", required: false, options: { min: 0, max: 100 } },
      { id: "status", name: "status", type: "select", required: true, options: { maxSelect: 1, values: ["Draft", "Received", "Negotiating", "Accepted", "Declined"] } },
      { id: "notes", name: "notes", type: "text", required: false, options: { min: 0, max: 5000, pattern: "" } }
    ],
    indexes: [
      "CREATE INDEX idx_offers_owner ON offers (owner)",
      "CREATE INDEX idx_offers_application ON offers (application)",
      "CREATE INDEX idx_offers_status ON offers (owner, status)"
    ],
    listRule: '@request.auth.id != "" && owner = @request.auth.id && application.owner = @request.auth.id',
    viewRule: '@request.auth.id != "" && owner = @request.auth.id && application.owner = @request.auth.id',
    createRule: '@request.auth.id != "" && owner = @request.auth.id && application.owner = @request.auth.id',
    updateRule: '@request.auth.id != "" && owner = @request.auth.id && application.owner = @request.auth.id',
    deleteRule: '@request.auth.id != "" && owner = @request.auth.id && application.owner = @request.auth.id',
  });
  dao.saveCollection(offersCollection);
}, (db) => {
  const dao = new Dao(db);
  try {
    const offers = dao.findCollectionByNameOrId("offers");
    if (offers) dao.deleteCollection(offers);
  } catch (_) {}
  try {
    const users = dao.findCollectionByNameOrId("_pb_users_auth_");
    if (users) {
      users.schema.removeField("role");
      dao.saveCollection(users);
    }
  } catch (_) {}
});
