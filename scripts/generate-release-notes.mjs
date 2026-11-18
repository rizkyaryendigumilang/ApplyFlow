import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import url from 'node:url';
import { execSync } from 'node:child_process';

/**
 * Generate Release Notes, Tags, and organize release binaries for GitHub Releases.
 * Strictly zero em-dash and zero en-dash.
 */
export function generateReleaseMetadata(options = {}) {
  const cwd = options.cwd || process.cwd();
  
  // 1. Read base version from package.json
  const pkgPath = path.join(cwd, 'package.json');
  let baseVersion = '1.0.0';
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.version) baseVersion = pkg.version;
    } catch (e) {
      console.warn('Could not parse package.json, using fallback 1.0.0');
    }
  }

  const runNumber = options.runNumber || process.env.GITHUB_RUN_NUMBER || '1';
  const refType = options.refType || process.env.GITHUB_REF_TYPE || '';
  const refName = options.refName || process.env.GITHUB_REF_NAME || '';
  const manualVersion = (options.manualVersion || process.env.INPUT_RELEASE_VERSION || '').trim();
  const manualNotes = (options.manualNotes || process.env.INPUT_RELEASE_NOTES || '').trim();
  const isPrerelease = (options.isPrerelease !== undefined ? options.isPrerelease : (process.env.INPUT_IS_PRERELEASE || 'false')).toString().toLowerCase() === 'true';

  let releaseTag = '';
  let releaseTitle = '';

  if (manualVersion) {
    releaseTag = manualVersion.startsWith('v') ? manualVersion : `v${manualVersion}`;
    releaseTitle = `ApplyFlow ${releaseTag}`;
  } else if (refType === 'tag' && refName) {
    releaseTag = refName.startsWith('v') ? refName : `v${refName}`;
    releaseTitle = `ApplyFlow ${releaseTag}`;
  } else {
    releaseTag = `v${baseVersion}-b${runNumber}`;
    releaseTitle = `ApplyFlow v${baseVersion} (Build #${runNumber})`;
  }

  const displayVersion = releaseTag.replace(/^v/, '');

  // 2. Collect Git commits
  let commits = [];
  const gitDir = options.gitDir || (fs.existsSync(path.join(cwd, '.git')) ? cwd : process.cwd());
  try {
    let logRange = '-n 20';
    try {
      const prevTag = execSync('git describe --tags --abbrev=0 HEAD^', { cwd: gitDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      if (prevTag) {
        logRange = `${prevTag}..HEAD`;
      }
    } catch {
      // No previous tag found, use default logRange
    }

    const rawLog = execSync(`git log --pretty=format:"%s|%h|%an" ${logRange}`, { cwd: gitDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    if (rawLog) {
      commits = rawLog.split('\n').map(line => {
        const parts = line.split('|');
        return {
          subject: (parts[0] || '').trim(),
          hash: (parts[1] || '').trim(),
          author: (parts[2] || '').trim()
        };
      }).filter(c => c.subject);
    }
  } catch (err) {
    // Graceful fallback when git history is unavailable
  }

  // 3. Categorize commits
  const bugFixes = [];
  const features = [];
  const improvements = [];
  const otherChanges = [];

  for (const c of commits) {
    const s = c.subject;
    const lower = s.toLowerCase();

    if (lower.startsWith('fix') || lower.startsWith('bugfix:')) {
      bugFixes.push(c);
    } else if (lower.startsWith('feat')) {
      features.push(c);
    } else if (lower.startsWith('refactor') || lower.startsWith('perf') || lower.startsWith('style') || lower.startsWith('ui')) {
      improvements.push(c);
    } else if (lower.includes('fix') || lower.includes('bug') || lower.includes('perbaikan')) {
      bugFixes.push(c);
    } else {
      otherChanges.push(c);
    }
  }

  // 4. Locate and organize assets
  const assetsSourceDir = path.resolve(cwd, options.assetsSourceDir || 'release-assets');
  const releaseFilesDir = path.resolve(cwd, options.releaseFilesDir || 'release-files');

  if (!fs.existsSync(releaseFilesDir)) {
    fs.mkdirSync(releaseFilesDir, { recursive: true });
  }

  function findFilesRecursively(dir, filterFn) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(findFilesRecursively(full, filterFn));
      } else if (filterFn(item)) {
        results.push(full);
      }
    }
    return results;
  }

  const apkFiles = findFilesRecursively(assetsSourceDir, f => f.endsWith('.apk'));
  const ipaFiles = findFilesRecursively(assetsSourceDir, f => f.endsWith('.ipa'));

  const copiedFiles = [];

  if (apkFiles.length > 0) {
    const primaryApk = apkFiles.find(f => f.includes('debug')) || apkFiles[0];
    const targetVersionedApk = path.join(releaseFilesDir, `applyflow-v${displayVersion}-android.apk`);
    const targetLatestApk = path.join(releaseFilesDir, `applyflow-latest.apk`);
    fs.copyFileSync(primaryApk, targetVersionedApk);
    fs.copyFileSync(primaryApk, targetLatestApk);
    copiedFiles.push(targetVersionedApk, targetLatestApk);
  }

  if (ipaFiles.length > 0) {
    const primaryIpa = ipaFiles.find(f => f.includes('unsigned')) || ipaFiles[0];
    const targetVersionedIpa = path.join(releaseFilesDir, `applyflow-v${displayVersion}-ios.ipa`);
    const targetLatestIpa = path.join(releaseFilesDir, `applyflow-latest.ipa`);
    fs.copyFileSync(primaryIpa, targetVersionedIpa);
    fs.copyFileSync(primaryIpa, targetLatestIpa);
    copiedFiles.push(targetVersionedIpa, targetLatestIpa);
  }

  // Checksums
  const checksumLines = [];
  const checksumTableRows = [];

  for (const filePath of copiedFiles) {
    const filename = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    checksumLines.push(`${hash}  ${filename}`);
    checksumTableRows.push(`| \`${filename}\` | \`${hash.slice(0, 16)}...\` (\`${hash}\`) |`);
  }

  if (checksumLines.length > 0) {
    fs.writeFileSync(path.join(releaseFilesDir, 'checksums.txt'), checksumLines.join('\n') + '\n', 'utf8');
  }

  // 5. Build Release Body Markdown
  let body = `# 🚀 ${releaseTitle}\n\n`;
  body += `Rilis otomatis build aplikasi mobile **ApplyFlow** untuk Android (.apk) dan iOS (.ipa).\n\n`;

  if (manualNotes) {
    body += `### 📝 Catatan Rilis & Perbaikan:\n${manualNotes}\n\n`;
  }

  if (bugFixes.length > 0) {
    body += `### 🐛 Perbaikan Bug & Masalah:\n`;
    for (const c of bugFixes) {
      body += `- ${c.subject} (\`${c.hash}\`)\n`;
    }
    body += `\n`;
  } else if (!manualNotes) {
    body += `### 🐛 Perbaikan Bug & Masalah:\n- Pembaruan stabilitas berkala dan pemeliharaan performa.\n\n`;
  }

  if (features.length > 0) {
    body += `### ✨ Fitur Baru & Peningkatan:\n`;
    for (const c of features) {
      body += `- ${c.subject} (\`${c.hash}\`)\n`;
    }
    body += `\n`;
  }

  if (improvements.length > 0) {
    body += `### ⚡ Optimalisasi & Antarmuka:\n`;
    for (const c of improvements) {
      body += `- ${c.subject} (\`${c.hash}\`)\n`;
    }
    body += `\n`;
  }

  if (otherChanges.length > 0) {
    body += `### 🔧 Pemeliharaan Sistem:\n`;
    for (const c of otherChanges.slice(0, 8)) {
      body += `- ${c.subject} (\`${c.hash}\`)\n`;
    }
    body += `\n`;
  }

  body += `### 📱 Unduh & Petunjuk Pemasangan:\n\n`;
  body += `#### 🤖 Android (APK):\n`;
  body += `1. Unduh \`applyflow-v${displayVersion}-android.apk\` atau \`applyflow-latest.apk\` dari daftar **Assets** di bawah.\n`;
  body += `2. Buka berkas APK di ponsel Android Anda.\n`;
  body += `3. Jika muncul konfirmasi keamanan, aktifkan opsi **Izinkan instalasi dari sumber ini (Unknown Sources)**.\n`;
  body += `4. Buka aplikasi ApplyFlow dan login seperti biasa.\n\n`;

  body += `#### 🍏 iOS / iPhone / iPad (IPA Unsigned):\n`;
  body += `1. Unduh berkas \`applyflow-v${displayVersion}-ios.ipa\` atau \`applyflow-latest.ipa\` dari daftar **Assets** di bawah.\n`;
  body += `2. Pasang menggunakan metode sideloading pilihan Anda:\n`;
  body += `   - **AltStore** (hubungkan ponsel ke Mac/PC lalu *Install IPA* via AltServer)\n`;
  body += `   - **Sideloadly** (drag and drop berkas IPA dengan Apple ID pribadi)\n`;
  body += `   - **TrollStore** atau **Scarlet** untuk perangkat yang didukung.\n\n`;

  if (checksumTableRows.length > 0) {
    body += `### 🔒 Verifikasi Integritas Berkas (SHA-256):\n\n`;
    body += `| Nama Berkas | Hash SHA-256 |\n`;
    body += `| :--- | :--- |\n`;
    body += checksumTableRows.join('\n') + '\n\n';
  }

  body += `*Rilis dibuat secara otomatis oleh ApplyFlow GitHub Actions CI/CD Pipeline.*\n`;

  const bodyPath = path.resolve(cwd, options.bodyPath || 'release-body.md');
  fs.writeFileSync(bodyPath, body, 'utf8');

  // 6. Write GitHub Outputs
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput && fs.existsSync(path.dirname(githubOutput))) {
    const outputs = [
      `tag_name=${releaseTag}`,
      `release_title=${releaseTitle}`,
      `is_prerelease=${isPrerelease ? 'true' : 'false'}`
    ];
    fs.appendFileSync(githubOutput, outputs.join('\n') + '\n', 'utf8');
  }

  return {
    releaseTag,
    releaseTitle,
    displayVersion,
    isPrerelease,
    body,
    copiedFiles
  };
}

// Standalone execution
const isMain = process.argv[1] && url.fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  console.log('Generating release metadata and release notes...');
  const result = generateReleaseMetadata();
  console.log(`✓ Release Tag: ${result.releaseTag}`);
  console.log(`✓ Release Title: ${result.releaseTitle}`);
  console.log(`✓ Copied Files: ${result.copiedFiles.length}`);
}
