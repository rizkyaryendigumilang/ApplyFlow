migrate((db) => {
  const dao = new Dao(db);
  const applications = dao.findCollectionByNameOrId("applications");

  // 1. Add pay field (for flexible compensation representation like "135/hr", "125/hr")
  applications.schema.addField(new SchemaField({
    name: "pay",
    type: "text",
    required: false,
    options: { min: 0, max: 120, pattern: "" }
  }));

  // 2. Add sent field (for sent deliverables like "Email, resume", "CV, short vid intro")
  applications.schema.addField(new SchemaField({
    name: "sent",
    type: "text",
    required: false,
    options: { min: 0, max: 250, pattern: "" }
  }));

  // 3. Update type select values
  const typeField = applications.schema.getFieldByName("type");
  if (typeField) {
    typeField.options = {
      maxSelect: 1,
      values: ["Full-time", "Part-time", "Contract", "In-house", "Vendor / Outsource"]
    };
  }

  // 4. Update mode select values
  const modeField = applications.schema.getFieldByName("mode");
  if (modeField) {
    modeField.options = {
      maxSelect: 1,
      values: ["Remote", "In-person", "Hybrid", "On-site"]
    };
  }

  // 5. Update salaryPeriod select values
  const salaryPeriodField = applications.schema.getFieldByName("salaryPeriod");
  if (salaryPeriodField) {
    salaryPeriodField.options = {
      maxSelect: 1,
      values: ["monthly", "annual", "hourly"]
    };
  }

  dao.saveCollection(applications);
}, (db) => {
  const dao = new Dao(db);
  try {
    const applications = dao.findCollectionByNameOrId("applications");
    applications.schema.removeField("pay");
    applications.schema.removeField("sent");
    dao.saveCollection(applications);
  } catch (_) {}
});
