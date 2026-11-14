/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const usersCollection = dao.findCollectionByNameOrId("_pb_users_auth_");
  usersCollection.schema.addField(new SchemaField({
    name: "telegramChatId",
    type: "text",
    required: false,
    options: { min: 0, max: 100, pattern: "" }
  }));
  dao.saveCollection(usersCollection);

  // P1: Unique composite deduping indexes
  db.newQuery("CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_owner_msg ON recruitment_notifications (owner, gmailMessageId) WHERE gmailMessageId != '' AND gmailMessageId IS NOT NULL").execute();
  db.newQuery("CREATE UNIQUE INDEX IF NOT EXISTS idx_events_owner_msg ON application_events (owner, gmailMessageId) WHERE gmailMessageId != '' AND gmailMessageId IS NOT NULL").execute();
}, (db) => {
  const dao = new Dao(db);
  const usersCollection = dao.findCollectionByNameOrId("_pb_users_auth_");
  usersCollection.schema.removeField("telegramChatId");
  dao.saveCollection(usersCollection);

  db.newQuery("DROP INDEX IF EXISTS idx_notif_owner_msg").execute();
  db.newQuery("DROP INDEX IF EXISTS idx_events_owner_msg").execute();
});
