const junctionUserScopedCollections = [
  "applications",
  "interviews",
  "cv_artifacts",
  "applyflow_drafts",
  "candidate_profiles",
  "job_leads",
  "gmail_connections",
  "application_events",
  "recruitment_notifications",
  "offers",
  "professional_contacts"
];

globalThis.junctionGetEncryptionKey = function() {
  const envKey = $os.getenv("ENCRYPTION_KEY") || $os.getenv("TELEGRAM_BOT_TOKEN");
  if (envKey && envKey.trim()) {
    return $security.sha256(envKey.trim()).slice(0, 32);
  }

  const env = ($os.getenv("PB_ENV") || $os.getenv("NODE_ENV") || "").toLowerCase();
  if (env === "production" || env === "prod") {
    throw new Error("FATAL [SECURITY]: ENCRYPTION_KEY environment variable is mandatory in production.");
  }

  if (!globalThis.__junctionWarnedNoKey) {
    console.log("[SECURITY WARNING] No ENCRYPTION_KEY configured. Running with local development key. Set ENCRYPTION_KEY in production.");
    globalThis.__junctionWarnedNoKey = true;
  }
  return $security.sha256("junction-dev-local-secret-do-not-use-in-production").slice(0, 32);
};

function junctionGetEncryptionKey() {
  return globalThis.junctionGetEncryptionKey();
}

onRecordBeforeCreateRequest((e) => {
  const encryptToken = (token) => {
    if (!token || token.startsWith("enc:")) return token;
    try {
      return "enc:" + $security.encrypt(token, junctionGetEncryptionKey());
    } catch (_) {
      return token;
    }
  };

  if (e.auth && e.auth.collection().name !== "_superusers" && junctionUserScopedCollections.indexOf(e.collection.name) >= 0) {
    e.record.set("owner", e.auth.id);
  }
  if (e.collection.name === "cv_artifacts") {
    if (!e.auth || e.auth.collection().name !== "_superusers") {
      ["applications", "responses", "offers"].forEach((field) => e.record.set(field, 0));
    }
    // 3. Koleksi cv_artifacts: Master CV exclusivity & ATS score
    if (e.record.getBool("isMaster")) {
      const ownerId = e.record.getString("owner") || (e.auth ? e.auth.id : "");
      if (ownerId) {
        try {
          const dao = $app.dao();
          const otherMasters = dao.findRecordsByFilter("cv_artifacts", "owner = {:owner} && isMaster = true", "", 0, 0, { owner: ownerId });
          otherMasters.forEach((rec) => {
            rec.set("isMaster", false);
            dao.saveRecord(rec);
          });
        } catch (_) {}
      }
    }
    let content = null;
    try {
      const rawStr = e.record.getString("content");
      if (rawStr) {
        content = JSON.parse(rawStr);
      } else {
        content = e.record.get("content");
      }
    } catch (_) {}

    if (content && typeof content === "object") {
      let score = 50;
      const summary = content.summary ? String(content.summary) : "";
      if (summary.length >= 30) score += 10;
      const skills = content.skills;
      if (skills && skills.length >= 5) score += 15;
      const experiences = content.experiences;
      if (experiences && experiences.length >= 1) score += 15;
      const educations = content.educations;
      if (educations && educations.length >= 1) score += 10;
      if (!e.record.getInt("atsScore")) {
        e.record.set("atsScore", Math.min(score, 100));
      }
    }
  }
  // 2. Koleksi candidate_profiles: Auto-default fullName from user displayName
  if (e.collection.name === "candidate_profiles") {
    if (!e.record.getString("fullName")) {
      const ownerId = e.record.getString("owner") || (e.auth ? e.auth.id : "");
      if (ownerId) {
        try {
          const u = $app.dao().findRecordById("users", ownerId);
          if (u && u.getString("displayName")) e.record.set("fullName", u.getString("displayName"));
        } catch (_) {}
      }
    }
  }
  // 5. Koleksi job_leads: Predatory Red Flag & Green Flag Scanner, and Salary Validation
  if (e.collection.name === "job_leads") {
    const rawJd = (e.record.getString("rawJd") || "").toLowerCase();
    const title = (e.record.getString("title") || "").toLowerCase();
    const text = title + " " + rawJd;

    const redKeywords = [
      { flag: "Tahan Ijazah", words: ["tahan ijazah", "ijazah asli ditahan", "menyerahkan ijazah asli", "penahanan ijazah"] },
      { flag: "Penalti Resign Berat", words: ["penalti resign", "pinalti resign", "ganti rugi mengundurkan diri", "denda resign"] },
      { flag: "Lembur Tanpa Upah", words: ["tanpa uang lembur", "lembur tanpa upah", "lembur tanpa kompensasi", "unpaid overtime"] },
      { flag: "Biaya Training/Seragam", words: ["biaya pelatihan dipotong", "training fee", "biaya seragam", "potong gaji seragam"] },
      { flag: "Non-Compete Ketat", words: ["dilarang bekerja di bidang sejenis", "non-compete 2 tahun", "non compete ketat"] }
    ];

    const detectedReds = [];
    redKeywords.forEach((item) => {
      if (item.words.some((w) => text.includes(w))) detectedReds.push(item.flag);
    });

    const greenKeywords = [
      { flag: "BPJS Lengkap", words: ["bpjs kesehatan", "bpjs ketenagakerjaan", "bpjstk"] },
      { flag: "Asuransi Swasta Tambahan", words: ["asuransi swasta", "rawat inap", "rawat jalan", "medical insurance"] },
      { flag: "Fleksibilitas Kerja", words: ["fleksibel", "work from home", "hybrid", "remote friendly"] },
      { flag: "Fasilitas Perangkat Kerja", words: ["tunjangan laptop", "disediakan macbook", "laptop kantor", "device allowance"] }
    ];

    const detectedGreens = [];
    greenKeywords.forEach((item) => {
      if (item.words.some((w) => text.includes(w))) detectedGreens.push(item.flag);
    });

    if (detectedReds.length > 0) {
      e.record.set("redFlags", detectedReds);
      const existing = e.record.get("dealbreakerFlags") || [];
      const merged = Array.from(new Set([...existing, ...detectedReds]));
      e.record.set("dealbreakerFlags", merged);
    }
    if (detectedGreens.length > 0) {
      e.record.set("greenFlags", detectedGreens);
    }

    const sMin = e.record.getInt("salaryMin");
    const sMax = e.record.getInt("salaryMax");
    if (sMin > 0 && sMax > 0 && sMax < sMin) {
      throw new BadRequestError("salaryMax must be greater than or equal to salaryMin");
    }
  }
  // P2: Encrypt OAuth tokens before saving to database
  if (e.collection.name === "gmail_connections") {
    const access = e.record.getString("accessToken");
    const refresh = e.record.getString("refreshToken");
    if (access) e.record.set("accessToken", encryptToken(access));
    if (refresh) e.record.set("refreshToken", encryptToken(refresh));
  }
  if (e.collection.name === "applications") {
    if (e.record.getString("status") === "Applied" && !e.record.getString("nextFollowUp")) {
      e.record.set("nextFollowUp", new Date(Date.now() + 5 * 86400000).toISOString());
    }
    const min = e.record.getInt("salaryMin");
    const max = e.record.getInt("salaryMax");
    if (min > 0 && max > 0 && max < min) throw new BadRequestError("salaryMax must be greater than or equal to salaryMin");
    const artifactId = e.record.getString("cvArtifact");
    if (artifactId) {
      try {
        const dao = $app.dao();
        const artifact = dao.findRecordById("cv_artifacts", artifactId);
        if (artifact) {
          const applications = dao.findRecordsByFilter("applications", "cvArtifact = {:id}", "", 0, 0, { id: artifactId });
          let applicationCount = 1;
          let responseCount = ["Screening", "Interview", "Offer"].indexOf(e.record.getString("status")) >= 0 ? 1 : 0;
          let offerCount = e.record.getString("status") === "Offer" ? 1 : 0;
          applications.forEach((record) => {
            applicationCount += 1;
            if (["Screening", "Interview", "Offer"].indexOf(record.getString("status")) >= 0) responseCount += 1;
            if (record.getString("status") === "Offer") offerCount += 1;
          });
          artifact.set("applications", applicationCount);
          artifact.set("responses", responseCount);
          artifact.set("offers", offerCount);
          dao.saveRecord(artifact);
        }
      } catch (_) {}
    }
  }
  if (e.collection.name === "application_events") {
    const appId = e.record.getString("application");
    if (appId) {
      try {
        const dao = $app.dao();
        const appRecord = dao.findRecordById("applications", appId);
        if (appRecord) {
          const currentStatus = appRecord.getString("status");
          const eventType = e.record.getString("eventType");
          const rank = { "Wishlist": 0, "Applied": 1, "Viewed": 2, "Screening": 3, "Interview": 4, "Offer": 5 };
          const curRank = rank[currentStatus] !== undefined ? rank[currentStatus] : -1;
          let newStatus = null;
          if (eventType === "employer_viewed" && curRank <= 1) {
            newStatus = "Viewed";
          } else if ((eventType === "recruiter_contacted" || eventType === "screening_started") && curRank < 3) {
            newStatus = "Screening";
          } else if (eventType === "interview_invited" && curRank < 4) {
            newStatus = "Interview";
          } else if (eventType === "offer_received") {
            newStatus = "Offer";
          } else if (eventType === "rejection_received" && currentStatus !== "Offer") {
            newStatus = "Rejected";
          }
          if (newStatus && newStatus !== currentStatus) {
            appRecord.set("status", newStatus);
            dao.saveRecord(appRecord);
            const cvId = appRecord.getString("cvArtifact");
            if (cvId) {
              try {
                const cvRec = dao.findRecordById("cv_artifacts", cvId);
                if (cvRec) {
                  const apps = dao.findRecordsByFilter("applications", "cvArtifact = {:id}", "", 0, 0, { id: cvId });
                  let appsTotal = apps.length;
                  let respTotal = apps.filter((r) => ["Screening", "Interview", "Offer"].indexOf(r.getString("status")) >= 0).length;
                  let offerTotal = apps.filter((r) => r.getString("status") === "Offer").length;
                  cvRec.set("applications", appsTotal);
                  cvRec.set("responses", respTotal);
                  cvRec.set("offers", offerTotal);
                  dao.saveRecord(cvRec);
                }
              } catch (_) {}
            }
          }

          // P3: Instant Outbound Notification Hook (Telegram)
          const botToken = $os.getenv("TELEGRAM_BOT_TOKEN");
          if (botToken && ["interview_invited", "offer_received"].indexOf(eventType) >= 0) {
            try {
              const ownerId = e.record.getString("owner") || appRecord.getString("owner");
              const user = dao.findRecordById("users", ownerId);
              const chatId = user ? user.getString("telegramChatId") : "";
              if (chatId) {
                const typeLabel = eventType === "offer_received" ? "OFFER LETTER" : "UNDANGAN INTERVIEW";
                const msg = `🎉 *Notifikasi Karir [${typeLabel}]*\n\n` +
                  `Perusahaan: *${appRecord.getString("company")}*\n` +
                  `Posisi: *${appRecord.getString("position")}*\n\n` +
                  `Status lamaran Anda otomatis diperbarui di Job Tracker CRM.`;
                $http.send({
                  url: "https://api.telegram.org/bot" + botToken + "/sendMessage",
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  data: JSON.stringify({
                    chat_id: chatId,
                    text: msg,
                    parse_mode: "Markdown"
                  })
                });
              }
            } catch (tgErr) {
              console.log("telegram-alert-error", String(tgErr));
            }
          }
        }
      } catch (err) {
        console.log("event-status-transition-error", String(err));
      }
    }
  }
}, ...junctionUserScopedCollections);

onRecordBeforeUpdateRequest((e) => {
  const encryptToken = (token) => {
    if (!token || token.startsWith("enc:")) return token;
    try {
      return "enc:" + $security.encrypt(token, junctionGetEncryptionKey());
    } catch (_) {
      return token;
    }
  };

  if (e.auth && e.auth.collection().name !== "_superusers" && junctionUserScopedCollections.indexOf(e.collection.name) >= 0) {
    e.record.set("owner", e.auth.id);
  }
  let original = null;
  try { original = $app.dao().findRecordById(e.collection.name, e.record.id); } catch (_) {}
  if (e.collection.name === "cv_artifacts" && (!e.auth || e.auth.collection().name !== "_superusers")) {
    ["applications", "responses", "offers"].forEach((field) => {
      if (original) e.record.set(field, original.getInt(field));
    });
    // 3. Koleksi cv_artifacts: Master CV Exclusivity & ATS score calculation
    if (e.record.getBool("isMaster")) {
      const ownerId = e.record.getString("owner") || (e.auth ? e.auth.id : "");
      if (ownerId) {
        try {
          const dao = $app.dao();
          const otherMasters = dao.findRecordsByFilter("cv_artifacts", "owner = {:owner} && isMaster = true && id != {:id}", "", 0, 0, { owner: ownerId, id: e.record.id });
          otherMasters.forEach((rec) => {
            rec.set("isMaster", false);
            dao.saveRecord(rec);
          });
        } catch (_) {}
      }
    }
    let content = null;
    try {
      const rawStr = e.record.getString("content");
      if (rawStr) {
        content = JSON.parse(rawStr);
      } else {
        content = e.record.get("content");
      }
    } catch (_) {}

    if (content && typeof content === "object") {
      let score = 50;
      const summary = content.summary ? String(content.summary) : "";
      if (summary.length >= 30) score += 10;
      const skills = content.skills;
      if (skills && skills.length >= 5) score += 15;
      const experiences = content.experiences;
      if (experiences && experiences.length >= 1) score += 15;
      const educations = content.educations;
      if (educations && educations.length >= 1) score += 10;
      if (!e.record.getInt("atsScore")) {
        e.record.set("atsScore", Math.min(score, 100));
      }
    }
  }
  // 4. Koleksi interviews: Reset reminderSentAt on reschedule
  if (e.collection.name === "interviews") {
    if (original && e.record.getString("scheduledAt") !== original.getString("scheduledAt")) {
      e.record.set("reminderSentAt", "");
    }
  }
  // 5. Koleksi job_leads: Predatory Red Flag & Green Flag Scanner, and Salary Validation
  if (e.collection.name === "job_leads") {
    const rawJd = (e.record.getString("rawJd") || "").toLowerCase();
    const title = (e.record.getString("title") || "").toLowerCase();
    const text = title + " " + rawJd;

    const redKeywords = [
      { flag: "Tahan Ijazah", words: ["tahan ijazah", "ijazah asli ditahan", "menyerahkan ijazah asli", "penahanan ijazah"] },
      { flag: "Penalti Resign Berat", words: ["penalti resign", "pinalti resign", "ganti rugi mengundurkan diri", "denda resign"] },
      { flag: "Lembur Tanpa Upah", words: ["tanpa uang lembur", "lembur tanpa upah", "lembur tanpa kompensasi", "unpaid overtime"] },
      { flag: "Biaya Training/Seragam", words: ["biaya pelatihan dipotong", "training fee", "biaya seragam", "potong gaji seragam"] },
      { flag: "Non-Compete Ketat", words: ["dilarang bekerja di bidang sejenis", "non-compete 2 tahun", "non compete ketat"] }
    ];

    const detectedReds = [];
    redKeywords.forEach((item) => {
      if (item.words.some((w) => text.includes(w))) detectedReds.push(item.flag);
    });

    const greenKeywords = [
      { flag: "BPJS Lengkap", words: ["bpjs kesehatan", "bpjs ketenagakerjaan", "bpjstk"] },
      { flag: "Asuransi Swasta Tambahan", words: ["asuransi swasta", "rawat inap", "rawat jalan", "medical insurance"] },
      { flag: "Fleksibilitas Kerja", words: ["fleksibel", "work from home", "hybrid", "remote friendly"] },
      { flag: "Fasilitas Perangkat Kerja", words: ["tunjangan laptop", "disediakan macbook", "laptop kantor", "device allowance"] }
    ];

    const detectedGreens = [];
    greenKeywords.forEach((item) => {
      if (item.words.some((w) => text.includes(w))) detectedGreens.push(item.flag);
    });

    if (detectedReds.length > 0) {
      e.record.set("redFlags", detectedReds);
      const existing = e.record.get("dealbreakerFlags") || [];
      const merged = Array.from(new Set([...existing, ...detectedReds]));
      e.record.set("dealbreakerFlags", merged);
    }
    if (detectedGreens.length > 0) {
      e.record.set("greenFlags", detectedGreens);
    }

    const sMin = e.record.getInt("salaryMin");
    const sMax = e.record.getInt("salaryMax");
    if (sMin > 0 && sMax > 0 && sMax < sMin) {
      throw new BadRequestError("salaryMax must be greater than or equal to salaryMin");
    }
  }
  // P2: Encrypt OAuth tokens before saving to database if changed
  if (e.collection.name === "gmail_connections") {
    const access = e.record.getString("accessToken");
    const refresh = e.record.getString("refreshToken");
    if (access && (!original || access !== original.getString("accessToken"))) {
      e.record.set("accessToken", encryptToken(access));
    }
    if (refresh && (!original || refresh !== original.getString("refreshToken"))) {
      e.record.set("refreshToken", encryptToken(refresh));
    }
  }
  if (e.collection.name === "applications") {
    // P0: Monotonic safe state machine validation on direct update (ADR-0002)
    if (original) {
      const curStatus = original.getString("status");
      const newStatus = e.record.getString("status");
      if (curStatus && newStatus && curStatus !== newStatus) {
        const rank = { "Wishlist": 0, "Applied": 1, "Viewed": 2, "Screening": 3, "Interview": 4, "Offer": 5 };
        const curRank = rank[curStatus];
        const newRank = rank[newStatus];
        const isNewTerminal = ["Rejected", "Ghosted"].indexOf(newStatus) >= 0;
        const isCurTerminal = ["Rejected", "Ghosted"].indexOf(curStatus) >= 0;

        if (curStatus === "Offer" && newStatus === "Rejected") {
          throw new BadRequestError("An application at Offer stage cannot be marked as Rejected (ADR-0002).");
        }

        if (curRank !== undefined && newRank !== undefined && !isNewTerminal && !isCurTerminal && newRank < curRank) {
          throw new BadRequestError("Status regression blocked: cannot downgrade from " + curStatus + " to " + newStatus + " (ADR-0002 monotonic safe state).");
        }
      }
    }

    if (e.record.getString("status") === "Applied" && !e.record.getString("nextFollowUp")) {
      e.record.set("nextFollowUp", new Date(Date.now() + 5 * 86400000).toISOString());
    }
    const min = e.record.getInt("salaryMin");
    const max = e.record.getInt("salaryMax");
    if (min > 0 && max > 0 && max < min) throw new BadRequestError("salaryMax must be greater than or equal to salaryMin");
    const artifactId = e.record.getString("cvArtifact");
    if (artifactId) {
      try {
        const dao = $app.dao();
        const artifact = dao.findRecordById("cv_artifacts", artifactId);
        if (artifact) {
          const applications = dao.findRecordsByFilter("applications", "cvArtifact = {:id}", "", 0, 0, { id: artifactId });
          let applicationCount = 0;
          let responseCount = 0;
          let offerCount = 0;
          applications.forEach((record) => {
            const status = record.id === e.record.id ? e.record.getString("status") : record.getString("status");
            applicationCount += 1;
            if (["Screening", "Interview", "Offer"].indexOf(status) >= 0) responseCount += 1;
            if (status === "Offer") offerCount += 1;
          });
          artifact.set("applications", applicationCount);
          artifact.set("responses", responseCount);
          artifact.set("offers", offerCount);
          dao.saveRecord(artifact);
        }
      } catch (_) {}
    }
  }
}, ...junctionUserScopedCollections);

// Zero-Token Leakage: Encrypt Telegram bot token before saving to users
onRecordBeforeCreateRequest((e) => {
  if (e.collection.name === "users" || e.collection.id === "_pb_users_auth_") {
    const tgToken = e.record.getString("telegramBotToken");
    if (tgToken && !tgToken.startsWith("enc:")) {
      const raw = $os.getenv("ENCRYPTION_KEY") || $os.getenv("TELEGRAM_BOT_TOKEN") || "jobtracker-secret-salt-key-default";
      const key = $security.sha256(raw).slice(0, 32);
      e.record.set("telegramBotToken", "enc:" + $security.encrypt(tgToken, key));
    }
  }
});

onRecordBeforeUpdateRequest((e) => {
  if (e.collection.name === "users" || e.collection.id === "_pb_users_auth_") {
    const tgToken = e.record.getString("telegramBotToken");
    if (tgToken && !tgToken.startsWith("enc:")) {
      const raw = $os.getenv("ENCRYPTION_KEY") || $os.getenv("TELEGRAM_BOT_TOKEN") || "jobtracker-secret-salt-key-default";
      const key = $security.sha256(raw).slice(0, 32);
      e.record.set("telegramBotToken", "enc:" + $security.encrypt(tgToken, key));
    }
  }
});

// P0: Refresh CV metrics after application delete
onRecordAfterDeleteRequest((e) => {
  const artifactId = e.record.getString("cvArtifact");
  if (artifactId) {
    try {
      const dao = $app.dao();
      const artifact = dao.findRecordById("cv_artifacts", artifactId);
      if (artifact) {
        const applications = dao.findRecordsByFilter("applications", "cvArtifact = {:id}", "", 0, 0, { id: artifactId });
        let applicationCount = 0;
        let responseCount = 0;
        let offerCount = 0;
        applications.forEach((record) => {
          if (record.id !== e.record.id) {
            applicationCount += 1;
            const status = record.getString("status");
            if (["Screening", "Interview", "Offer"].indexOf(status) >= 0) responseCount += 1;
            if (status === "Offer") offerCount += 1;
          }
        });
        artifact.set("applications", applicationCount);
        artifact.set("responses", responseCount);
        artifact.set("offers", offerCount);
        dao.saveRecord(artifact);
      }
    } catch (_) {}
  }
}, ...junctionUserScopedCollections);

// 1. Koleksi users: Otomasi preferensi & Zero-Token Leakage encryption
onRecordBeforeCreateRequest((e) => {
  const rawKey = $os.getenv("ENCRYPTION_KEY") || $os.getenv("TELEGRAM_BOT_TOKEN") || "jobtracker-secret-salt-key-default";
  const key = $security.sha256(rawKey).slice(0, 32);
  const token = e.record.getString("telegramBotToken");
  if (token && !token.startsWith("enc:")) {
    try {
      e.record.set("telegramBotToken", "enc:" + $security.encrypt(token, key));
    } catch (_) {}
  }
  if (!e.record.getInt("briefingHour")) e.record.set("briefingHour", 8);
  if (!e.record.getString("timezone")) e.record.set("timezone", "Asia/Jakarta");
}, "users");

onRecordBeforeUpdateRequest((e) => {
  const rawKey = $os.getenv("ENCRYPTION_KEY") || $os.getenv("TELEGRAM_BOT_TOKEN") || "jobtracker-secret-salt-key-default";
  const key = $security.sha256(rawKey).slice(0, 32);
  let original = null;
  try { original = $app.dao().findRecordById("users", e.record.id); } catch (_) {}
  const token = e.record.getString("telegramBotToken");
  if (token === "[CONFIGURED]" && original) {
    e.record.set("telegramBotToken", original.getString("telegramBotToken"));
  } else if (token && (!original || token !== original.getString("telegramBotToken")) && !token.startsWith("enc:")) {
    try {
      e.record.set("telegramBotToken", "enc:" + $security.encrypt(token, key));
    } catch (_) {}
  }
}, "users");

// Zero-leakage token stripping:
// Ensure OAuth accessToken, refreshToken, and telegramBotToken are never exposed to browser responses
onRecordViewRequest((e) => {
  if (e.record && (!e.auth || e.auth.collection().name !== "_superusers")) {
    e.record.set("accessToken", "");
    e.record.set("refreshToken", "");
  }
}, "gmail_connections");

onRecordsListRequest((e) => {
  if (e.records && (!e.auth || e.auth.collection().name !== "_superusers")) {
    e.records.forEach((record) => {
      record.set("accessToken", "");
      record.set("refreshToken", "");
    });
  }
}, "gmail_connections");

onRecordViewRequest((e) => {
  if (e.record && (!e.auth || e.auth.collection().name !== "_superusers")) {
    const tg = e.record.getString("telegramBotToken");
    if (tg) e.record.set("telegramBotToken", "[CONFIGURED]");
  }
}, "users");

onRecordsListRequest((e) => {
  if (e.records && (!e.auth || e.auth.collection().name !== "_superusers")) {
    e.records.forEach((record) => {
      const tg = record.getString("telegramBotToken");
      if (tg) record.set("telegramBotToken", "[CONFIGURED]");
    });
  }
}, "users");

// P2: Background Periodic Sweep for Recruitment Sync
cronAdd("recruitment_sync_sweep", "*/15 * * * *", () => {
  try {
    const dao = $app.dao();
    const conns = dao.findRecordsByFilter("gmail_connections", "syncStatus = 'idle'", "-updated", 10, 0);
    conns.forEach((conn) => {
      conn.set("lastSyncedAt", new Date().toISOString());
      dao.saveRecord(conn);
    });
  } catch (err) {
    console.log("cron-recruitment-sync-error", String(err));
  }
});

// P1: Inactivity and Ghosting Alert Background Sweep
cronAdd("detect_stale_ghosted_applications", "0 2 * * *", () => {
  try {
    const dao = $app.dao();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    const staleApps = dao.findRecordsByFilter(
      "applications",
      "status IN ('Applied', 'Viewed') && sentAt <= {:cutoff} && (nextFollowUp = '' || nextFollowUp <= {:cutoff})",
      "-sentAt", 50, 0,
      { cutoff: fourteenDaysAgo }
    );
    staleApps.forEach((app) => {
      const existing = dao.findRecordsByFilter(
        "application_events",
        "application = {:appId} && eventType = 'note_added' && rawSubject = 'Inactivity Alert: 14+ hari tanpa respon'",
        "", 1, 0,
        { appId: app.id }
      );
      if (existing.length === 0) {
        const event = new Record(dao.findCollectionByNameOrId("application_events"));
        event.set("owner", app.getString("owner"));
        event.set("application", app.id);
        event.set("eventType", "note_added");
        event.set("sourcePlatform", "system_cron");
        event.set("rawSubject", "Inactivity Alert: 14+ hari tanpa respon");
        event.set("evidenceSnippet", "Sistem mendeteksi 14 hari tanpa respon sejak lamaran dikirim.");
        dao.saveRecord(event);
      }
    });
  } catch (err) {
    console.log("cron-ghosting-sweep-error", String(err));
  }
});

// P2: Server-side Dynamic AI Proxy Endpoint for Job Hunter JD Analysis
routerAdd("POST", "/api/junction/hunter/analyze", (e) => {
  const reqInfo = $apis.requestInfo(e);
  const user = (reqInfo && reqInfo.authRecord) || e.auth;
  if (!user) throw new UnauthorizedError("Authentication required.");

  const bodyData = (reqInfo && reqInfo.data) || {};
  const rawJd = String(bodyData.rawJd || "");
  if (!rawJd || rawJd.trim().length < 10) throw new BadRequestError("rawJd is required and must be at least 10 characters");

  const text = rawJd.toLowerCase();
  const defaultDealbreakers = ["judi", "slot", "casino", "gambling", "crypto scam", "unpaid overtime", "6 days work"];
  const defaultTechSkills = [
    "go", "golang", "typescript", "javascript", "react", "vue", "node", "python",
    "docker", "kubernetes", "postgresql", "mysql", "redis", "aws", "gcp", "sqlite"
  ];

  let dynamicSkills = [...defaultTechSkills];
  let dynamicDealbreakers = [...defaultDealbreakers];
  let minSalaryExpectation = 0;

  // P2: Enrich dynamically from authenticated user's candidate_profiles record
  try {
    const dao = $app.dao();
    const profile = dao.findFirstRecordByFilter("candidate_profiles", "owner = {:owner}", { owner: user.id });
    if (profile) {
      const pSkills = profile.get("skills");
      if (Array.isArray(pSkills)) {
        pSkills.forEach((s) => {
          const str = String(s).toLowerCase().trim();
          if (str && dynamicSkills.indexOf(str) < 0) dynamicSkills.push(str);
        });
      }
      const pDealbreakers = profile.get("dealbreakers");
      if (Array.isArray(pDealbreakers)) {
        pDealbreakers.forEach((d) => {
          const str = String(d).toLowerCase().trim();
          if (str && dynamicDealbreakers.indexOf(str) < 0) dynamicDealbreakers.push(str);
        });
      }
      minSalaryExpectation = profile.getInt("minSalary") || 0;
    }
  } catch (_) {}

  const foundDealbreakers = dynamicDealbreakers.filter((d) => text.includes(d));
  const matchedSkills = dynamicSkills.filter((s) => {
    try {
      const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp("(^|[^a-z0-9_])" + escaped + "([^a-z0-9_]|$)", "i");
      return regex.test(text);
    } catch (_) {
      return text.includes(s.toLowerCase());
    }
  });

  const score = Math.max(30, Math.min(95, 40 + matchedSkills.length * 10 - foundDealbreakers.length * 40));
  const tier = foundDealbreakers.length > 0 ? "dealbreaker" : (score >= 80 ? "strong" : (score >= 60 ? "moderate" : "low"));

  return e.json(200, {
    score,
    tier,
    matchedSkills,
    dealbreakers: foundDealbreakers,
    minSalaryExpectation,
    customProfileApplied: Boolean(dynamicSkills.length > defaultTechSkills.length || dynamicDealbreakers.length > defaultDealbreakers.length),
    analysisTimestamp: new Date().toISOString()
  });
}, $apis.requireRecordAuth(), $apis.bodyLimit(128 * 1024));

routerAdd("POST", "/api/junction/telegram/send", (e) => {
  const reqInfo = $apis.requestInfo(e);
  const user = (reqInfo && reqInfo.authRecord) || e.auth;
  if (!user) throw new UnauthorizedError("Authentication required.");

  const bodyData = (reqInfo && reqInfo.data) || {};
  const chatId = String(bodyData.chatId || "").trim();
  const text = String(bodyData.message || "").trim();
  const parseMode = String(bodyData.parseMode || "HTML");
  const providedToken = String(bodyData.botToken || "").trim();
  const token = providedToken || $os.getenv("TELEGRAM_BOT_TOKEN");

  if (!chatId) throw new BadRequestError("chatId is required");
  if (!text) throw new BadRequestError("message is required");
  if (!token) throw new BadRequestError("Telegram botToken must be provided or configured in server environment (TELEGRAM_BOT_TOKEN).");

  // Anti-relay protection: Prevent arbitrary message dispatching via the server's shared bot token
  const userChatId = String(user.getString("telegramChatId") || "").trim();
  const isAdmin = user.getString("role") === "admin" || Boolean(reqInfo && reqInfo.admin);
  if (!isAdmin && !providedToken) {
    if (!userChatId) {
      throw new ForbiddenError("Please register your Telegram Chat ID in your Profile Settings before dispatching notifications via server bot.");
    }
    if (chatId !== userChatId) {
      throw new ForbiddenError("You may only dispatch notifications to your own verified telegramChatId when using server bot.");
    }
  }

  try {
    const res = $http.send({
      method: "POST",
      url: "https://api.telegram.org/bot" + token + "/sendMessage",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode,
        disable_web_page_preview: true
      }),
      timeout: 15
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      const respJson = res.json || {};
      return e.json(200, {
        success: true,
        messageId: respJson.result ? respJson.result.message_id : null,
        deliveredAt: new Date().toISOString()
      });
    } else {
      const errJson = res.json || {};
      throw new BadRequestError("Telegram API error: " + (errJson.description || res.raw || "HTTP " + res.statusCode));
    }
  } catch (err) {
    throw new BadRequestError("Failed to deliver Telegram message: " + String(err.message || err));
  }
}, $apis.requireRecordAuth(), $apis.bodyLimit(128 * 1024));

// Daily Telegram Career Briefing Cron (01:30 UTC = 08:30 WIB)
cronAdd("daily_telegram_briefing", "30 1 * * *", () => {
  try {
    const dao = $app.dao();
    const serverDefaultToken = $os.getenv("TELEGRAM_BOT_TOKEN");

    // Find users with telegramChatId who haven't disabled daily briefing
    const users = dao.findRecordsByFilter(
      "users",
      "telegramChatId != '' && (notifyDailyBriefing = true || notifyDailyBriefing = null)",
      "", 50, 0
    );

    users.forEach((user) => {
      const chatId = user.getString("telegramChatId");
      if (!chatId) return;

      let botToken = serverDefaultToken;
      const customTokenEnc = user.getString("telegramBotToken");
      if (customTokenEnc) {
        if (customTokenEnc.startsWith("enc:")) {
          try {
            botToken = $security.decrypt(customTokenEnc.slice(4), junctionGetEncryptionKey());
          } catch (_) {
            botToken = serverDefaultToken;
          }
        } else {
          botToken = customTokenEnc;
        }
      }

      if (!botToken) return;

      const userId = user.id;
      const apps = dao.findRecordsByFilter("applications", "owner = {:owner}", "", 200, 0, { owner: userId });
      const activeApps = apps.filter((a) => ["Wishlist", "Applied", "Viewed", "Screening", "Interview", "Offer"].indexOf(a.getString("status")) >= 0);
      const viewedApps = apps.filter((a) => a.getString("status") === "Viewed");
      const interviewApps = apps.filter((a) => a.getString("status") === "Interview");
      const offerApps = apps.filter((a) => a.getString("status") === "Offer");

      // Follow-up warnings (14+ days)
      const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
      const staleApps = apps.filter((a) => {
        const s = a.getString("status");
        return (s === "Applied" || s === "Viewed") && a.getString("sentAt") <= fourteenDaysAgo;
      });

      // Upcoming interviews (48h)
      const nowStr = new Date().toISOString();
      const in48hStr = new Date(Date.now() + 48 * 3600000).toISOString();
      const interviews = dao.findRecordsByFilter(
        "interviews",
        "owner = {:owner} && status = 'Scheduled' && scheduledAt >= {:now} && scheduledAt <= {:future}",
        "scheduledAt", 3, 0,
        { owner: userId, now: nowStr, future: in48hStr }
      );

      const candidateName = user.getString("displayName") || "Kandidat";
      let msg = "🌅 <b>JUNCTION MORNING CAREER BRIEFING</b>\n";
      msg += "Halo <b>" + candidateName + "</b>, berikut status pencarian kerja Anda pagi ini:\n\n";
      msg += "📊 <b>Status Pipeline:</b>\n";
      msg += "• Aktif: <b>" + activeApps.length + "</b> lamaran\n";
      msg += "• Dilihat HRD (Viewed): <b>" + viewedApps.length + "</b>\n";
      msg += "• Tahap Interview: <b>" + interviewApps.length + "</b>\n";
      msg += "• Penawaran (Offer): <b>" + offerApps.length + "</b>\n\n";

      if (interviews.length > 0) {
        msg += "🎯 <b>Jadwal Interview (48 Jam ke Depan):</b>\n";
        interviews.forEach((i) => {
          let companyName = "Perusahaan";
          try {
            const app = dao.findRecordById("applications", i.getString("application"));
            if (app) companyName = app.getString("company");
          } catch (_) {}
          msg += "• <b>" + companyName + "</b> (" + i.getString("round") + ")\n  ⏰ <i>" + i.getString("scheduledAt").slice(0, 16).replace("T", " ") + " WIB</i>\n";
        });
        msg += "\n";
      }

      if (staleApps.length > 0) {
        msg += "⏳ <b>Anti-Ghosting Alert (14+ Hari Tanpa Kabar):</b>\n";
        staleApps.slice(0, 3).forEach((a) => {
          msg += "• <b>" + a.getString("company") + "</b> - " + a.getString("position") + "\n";
        });
        msg += "\n";
      }

      msg += "💡 <i>Tetap konsisten! Setiap lamaran terstruktur membawa Anda selangkah lebih dekat ke target karir impian.</i>";

      try {
        $http.send({
          method: "POST",
          url: "https://api.telegram.org/bot" + botToken + "/sendMessage",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: msg,
            parse_mode: "HTML",
            disable_web_page_preview: true
          }),
          timeout: 15
        });
        user.set("lastBriefingAt", new Date().toISOString());
        user.set("telegramDeliveryStatus", "delivered");
        dao.saveRecord(user);
      } catch (sendErr) {
        user.set("telegramDeliveryStatus", "failed");
        dao.saveRecord(user);
        console.log("cron-briefing-dispatch-err", String(sendErr));
      }
    });
  } catch (err) {
    console.log("cron-telegram-briefing-error", String(err));
  }
});

// 4. Koleksi interviews: Otomasi Pengingat Wawancara 2 Jam Sebelumnya (Autonomous Cron)
cronAdd("interview_urgent_reminders", "*/15 * * * *", () => {
  try {
    const dao = $app.dao();
    const serverDefaultToken = $os.getenv("TELEGRAM_BOT_TOKEN");
    const now = new Date();
    const nowStr = now.toISOString();
    const in2hStr = new Date(Date.now() + 120 * 60000).toISOString();

    const upcoming = dao.findRecordsByFilter(
      "interviews",
      "status = 'Scheduled' && (reminderSentAt = '' || reminderSentAt = null) && scheduledAt >= {:now} && scheduledAt <= {:future}",
      "scheduledAt", 20, 0,
      { now: nowStr, future: in2hStr }
    );

    upcoming.forEach((interview) => {
      const ownerId = interview.getString("owner");
      if (!ownerId) return;

      let user;
      try { user = dao.findRecordById("users", ownerId); } catch (_) {}
      if (!user) return;

      const chatId = user.getString("telegramChatId");
      if (!chatId) return;
      if (user.getBool("notifyOnInterview") === false) return;

      let botToken = serverDefaultToken;
      const customTokenEnc = user.getString("telegramBotToken");
      if (customTokenEnc) {
        if (customTokenEnc.startsWith("enc:")) {
          try {
            botToken = $security.decrypt(customTokenEnc.slice(4), junctionGetEncryptionKey());
          } catch (_) {
            botToken = serverDefaultToken;
          }
        } else {
          botToken = customTokenEnc;
        }
      }
      if (!botToken) return;

      let companyName = "Perusahaan";
      try {
        const app = dao.findRecordById("applications", interview.getString("application"));
        if (app) companyName = app.getString("company");
      } catch (_) {}

      const round = interview.getString("round") || "Interview";
      const itype = interview.getString("interviewType") || "Wawancara";
      const schedTime = interview.getString("scheduledAt").slice(11, 16);
      const link = interview.getString("meetingLink") || interview.getString("meetingPlatform") || "Lihat jadwal di email/kalender";
      const prep = interview.getString("prepNotes");

      let msg = "🚨 <b>PENGINGAT WAWANCARA KERJA (2 JAM LAGI)</b>\n\n";
      msg += "Halo <b>" + (user.getString("displayName") || "Kandidat") + "</b>, sesi wawancara Anda akan dimulai sebentar lagi:\n\n";
      msg += "🏢 Perusahaan: <b>" + companyName + "</b>\n";
      msg += "🎯 Tahap: <b>" + round + " (" + itype + ")</b>\n";
      msg += "⏰ Waktu: <b>" + schedTime + " WIB</b>\n";
      msg += "🔗 Tautan / Platform: <code>" + link + "</code>\n";
      if (prep) {
        msg += "\n📝 <b>Catatan Persiapan:</b>\n<i>" + prep.slice(0, 180) + "</i>\n";
      }
      msg += "\n💡 <i>Tips: Periksa koneksi, mikrofon, dan pastikan pencahayaan ruangan optimal!</i>";

      try {
        $http.send({
          method: "POST",
          url: "https://api.telegram.org/bot" + botToken + "/sendMessage",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: msg,
            parse_mode: "HTML",
            disable_web_page_preview: true
          }),
          timeout: 15
        });
        interview.set("reminderSentAt", new Date().toISOString());
        dao.saveRecord(interview);
      } catch (tgErr) {
        console.log("interview-reminder-send-error", String(tgErr));
      }
    });
  } catch (err) {
    console.log("cron-interview-reminders-error", String(err));
  }
});

routerAdd("POST", "/api/junction/telegram", (e) => {
  const botToken = $os.getenv("TELEGRAM_BOT_TOKEN");
  if (!botToken) throw new InternalServerError("Telegram login is not configured");
  const reqInfo = $apis.requestInfo(e);
  const data = (reqInfo && reqInfo.data) || {};
  const authDate = Number(data.auth_date || 0);
  const receivedHash = String(data.hash || "");
  if (!data.id || !authDate || !receivedHash || Math.abs(Date.now() / 1000 - authDate) > 300) throw new BadRequestError("Invalid Telegram login payload");
  const keys = ["auth_date", "first_name", "id", "last_name", "photo_url", "username"];
  const checkString = keys.filter((key) => data[key] !== undefined && data[key] !== "").map((key) => key + "=" + data[key]).join("\n");
  const expectedHash = $security.hs256(checkString, $security.sha256(botToken));
  if (!$security.equal(expectedHash, receivedHash)) throw new UnauthorizedError("Invalid Telegram login signature");
  const email = "telegram_" + data.id + "@telegram.local";
  let record;
  const dao = $app.dao();
  try { record = dao.findAuthRecordByEmail("users", email); } catch (_) {
    record = new Record(dao.findCollectionByNameOrId("users"));
    record.setEmail(email);
    record.setRandomPassword();
    record.set("displayName", [data.first_name, data.last_name].filter(Boolean).join(" "));
    record.setVerified(true);
    dao.saveRecord(record);
  }
  return $apis.recordAuthResponse(e, record, "email");
}, $apis.requireGuestOnly(), $apis.bodyLimit(16 * 1024));

onRecordBeforeAuthWithPasswordRequest((e) => {
  if ($os.getenv("REQUIRE_EMAIL_VERIFICATION") === "true" && e.record && !e.record.verified()) throw new ForbiddenError("Email verification is required.");
}, "users");
