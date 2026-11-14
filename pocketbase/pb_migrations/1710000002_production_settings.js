migrate((db) => {
  const dao = new Dao(db);
  const settings = dao.findSettings();
  settings.backups.cron = "0 2 * * *";
  settings.backups.cronMaxKeep = 7;
  dao.saveSettings(settings);
}, (db) => {
  const dao = new Dao(db);
  const settings = dao.findSettings();
  settings.backups.cron = "";
  settings.backups.cronMaxKeep = 3;
  dao.saveSettings(settings);
});
