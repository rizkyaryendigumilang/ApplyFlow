import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const collections = JSON.parse(await readFile(new URL('../pocketbase/pb_schema.json', import.meta.url)));
const migrationFiles = (await readdir(new URL('../pocketbase/pb_migrations/', import.meta.url))).filter(name => name.endsWith('.js')).sort();
const migration = (await Promise.all(migrationFiles.map(name => readFile(new URL(`../pocketbase/pb_migrations/${name}`, import.meta.url), 'utf8')))).join('\n');
const byName = new Map(collections.map((collection) => [collection.name, collection]));

assert.equal(byName.get('users')?.type, 'auth');
for (const name of ['applications', 'interviews', 'cv_artifacts', 'applyflow_drafts', 'candidate_profiles', 'job_leads', 'gmail_connections', 'application_events', 'recruitment_notifications']) {
  const collection = byName.get(name);
  assert.ok(collection, `${name} collection is missing`);
  assert.match(collection.listRule, /@request\.auth\.id/);
  assert.ok(collection.schema.some((field) => field.name === 'owner'), `${name}.owner is missing`);
}
assert.equal(byName.get('applications').schema.find((field) => field.name === 'cvArtifact').options.collectionId, 'cv_artifacts');
assert.match(byName.get('applications').createRule, /cvArtifact\.owner = @request\.auth\.id/);
assert.ok(byName.get('applications').indexes.some((index) => index.includes('(owner, created)')));
assert.ok(byName.get('applications').indexes.some((index) => index.includes('(owner, cvArtifact)')));
assert.ok(byName.get('interviews').indexes.some((index) => index.includes('(owner, application)')));
assert.equal(byName.get('applyflow_drafts').schema.find((field) => field.name === 'selectedCvArtifact').options.collectionId, 'cv_artifacts');
assert.match(byName.get('applyflow_drafts').createRule, /selectedCvArtifact\.owner = @request\.auth\.id/);
for (const collection of collections) {
  assert.match(migration, new RegExp(`(?:"name"|name)\\s*:\\s*"${collection.name}"`), `${collection.name} missing from initial migration`);
  for (const field of collection.schema) {
    assert.match(migration, new RegExp(`(?:"name"|name)\\s*:\\s*"${field.name}"`), `${collection.name}.${field.name} missing from initial migration`);
  }
}
console.log(`schema ok: ${collections.length} collections, owner rules present`);
