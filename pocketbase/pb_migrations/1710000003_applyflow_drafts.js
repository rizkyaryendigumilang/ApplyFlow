migrate((db) => {
  const collection = new Collection({
    id: "applyflow_drafts",
    name: "applyflow_drafts",
    type: "base",
    schema: [
      { id: "owner", name: "owner", type: "relation", required: true, options: { collectionId: "_pb_users_auth_", cascadeDelete: true, maxSelect: 1 } },
      { id: "rawText", name: "rawText", type: "text", required: true, options: { min: 1, max: 100000, pattern: "\\S" } },
      { id: "sourcePlatform", name: "sourcePlatform", type: "text", required: false, options: { min: 0, max: 40, pattern: "" } },
      { id: "sourceUrl", name: "sourceUrl", type: "url", required: false, options: { exceptDomains: [], onlyDomains: [] } },
      { id: "parsedData", name: "parsedData", type: "json", required: false, options: { maxSize: 120000 } },
      { id: "selectedPositionId", name: "selectedPositionId", type: "text", required: false, options: { min: 0, max: 80, pattern: "" } },
      { id: "selectedCvArtifact", name: "selectedCvArtifact", type: "relation", required: false, options: { collectionId: "cv_artifacts", cascadeDelete: false, maxSelect: 1 } },
      { id: "candidateName", name: "candidateName", type: "text", required: false, options: { min: 0, max: 120, pattern: "" } },
      { id: "evidence", name: "evidence", type: "text", required: false, options: { min: 0, max: 12000, pattern: "" } },
      { id: "subject", name: "subject", type: "text", required: false, options: { min: 0, max: 255, pattern: "" } },
      { id: "body", name: "body", type: "text", required: false, options: { min: 0, max: 30000, pattern: "" } },
      { id: "state", name: "state", type: "select", required: true, options: { maxSelect: 1, values: ["draft", "copied", "compose_opened", "manually_marked_sent"] } },
      { id: "applicationIds", name: "applicationIds", type: "json", required: false, options: { maxSize: 20000 } },
    ],
    indexes: ["CREATE INDEX idx_applyflow_owner_updated ON applyflow_drafts (owner, updated)"],
    listRule: '@request.auth.id != "" && owner = @request.auth.id && (selectedCvArtifact = "" || selectedCvArtifact.owner = @request.auth.id)',
    viewRule: '@request.auth.id != "" && owner = @request.auth.id && (selectedCvArtifact = "" || selectedCvArtifact.owner = @request.auth.id)',
    createRule: '@request.auth.id != "" && owner = @request.auth.id && (selectedCvArtifact = "" || selectedCvArtifact.owner = @request.auth.id)',
    updateRule: '@request.auth.id != "" && owner = @request.auth.id && (selectedCvArtifact = "" || selectedCvArtifact.owner = @request.auth.id)',
    deleteRule: '@request.auth.id != "" && owner = @request.auth.id && (selectedCvArtifact = "" || selectedCvArtifact.owner = @request.auth.id)',
  });
  Dao(db).saveCollection(collection);
}, (db) => {
  const dao = Dao(db);
  dao.deleteCollection(dao.findCollectionByNameOrId("applyflow_drafts"));
});
