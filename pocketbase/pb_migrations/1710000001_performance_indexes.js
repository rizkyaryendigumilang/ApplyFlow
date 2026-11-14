migrate((db) => {
  db.newQuery("CREATE INDEX IF NOT EXISTS idx_app_owner_created ON applications (owner, created)").execute();
  db.newQuery("CREATE INDEX IF NOT EXISTS idx_app_owner_cv ON applications (owner, cvArtifact)").execute();
  db.newQuery("CREATE INDEX IF NOT EXISTS idx_interview_owner_application ON interviews (owner, application)").execute();
}, (db) => {
  db.newQuery("DROP INDEX IF EXISTS idx_app_owner_created").execute();
  db.newQuery("DROP INDEX IF EXISTS idx_app_owner_cv").execute();
  db.newQuery("DROP INDEX IF EXISTS idx_interview_owner_application").execute();
});
