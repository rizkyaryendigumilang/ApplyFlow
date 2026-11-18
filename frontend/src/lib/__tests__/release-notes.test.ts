import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { generateReleaseMetadata } from '../../../../scripts/generate-release-notes.mjs';

test('generateReleaseMetadata creates valid version tag, changelog, and organizes assets', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-meta-test-'));

  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // Setup mock package.json
  fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'applyflow', version: '1.4.2' }));

  // Setup mock release-assets
  const assetsDir = path.join(tmpDir, 'release-assets');
  fs.mkdirSync(path.join(assetsDir, 'android'), { recursive: true });
  fs.mkdirSync(path.join(assetsDir, 'ios'), { recursive: true });

  const mockApk = path.join(assetsDir, 'android', 'applyflow-android-debug.apk');
  fs.writeFileSync(mockApk, 'MOCK_ANDROID_APK_BINARY_DATA');

  const mockIpa = path.join(assetsDir, 'ios', 'applyflow-ios-unsigned.ipa');
  fs.writeFileSync(mockIpa, 'MOCK_IOS_IPA_BINARY_DATA');

  const result = generateReleaseMetadata({
    cwd: tmpDir,
    runNumber: '42',
    manualNotes: 'Pembaruan UI dan stabilitas integrasi job platforms.',
    assetsSourceDir: 'release-assets',
    releaseFilesDir: 'release-files',
    bodyPath: 'release-body.md'
  });

  // Verify tag and title
  assert.equal(result.releaseTag, 'v1.4.2-b42');
  assert.equal(result.releaseTitle, 'ApplyFlow v1.4.2 (Build #42)');
  assert.equal(result.displayVersion, '1.4.2-b42');

  // Verify copied files in release-files
  const releaseFiles = fs.readdirSync(path.join(tmpDir, 'release-files'));
  assert.ok(releaseFiles.includes('applyflow-v1.4.2-b42-android.apk'));
  assert.ok(releaseFiles.includes('applyflow-latest.apk'));
  assert.ok(releaseFiles.includes('applyflow-v1.4.2-b42-ios.ipa'));
  assert.ok(releaseFiles.includes('applyflow-latest.ipa'));
  assert.ok(releaseFiles.includes('checksums.txt'));

  // Verify checksum file content
  const checksumContent = fs.readFileSync(path.join(tmpDir, 'release-files', 'checksums.txt'), 'utf8');
  assert.ok(checksumContent.includes('applyflow-v1.4.2-b42-android.apk'));
  assert.ok(checksumContent.includes('applyflow-v1.4.2-b42-ios.ipa'));

  // Verify markdown release body
  const bodyContent = fs.readFileSync(path.join(tmpDir, 'release-body.md'), 'utf8');
  assert.ok(bodyContent.includes('# 🚀 ApplyFlow v1.4.2 (Build #42)'));
  assert.ok(bodyContent.includes('Pembaruan UI dan stabilitas integrasi job platforms.'));
  assert.ok(bodyContent.includes('Verifikasi Integritas Berkas (SHA-256)'));
  assert.ok(bodyContent.includes('Android (APK)'));
  assert.ok(bodyContent.includes('iOS / iPhone / iPad (IPA Unsigned)'));

  // Strictly zero em-dash and zero en-dash check
  assert.ok(!bodyContent.includes('\u2014'), 'Body must not contain em-dash');
  assert.ok(!bodyContent.includes('\u2013'), 'Body must not contain en-dash');
});

test('generateReleaseMetadata respects git tag ref when available', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-meta-tag-test-'));
  try {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'applyflow', version: '2.0.0' }));
    const result = generateReleaseMetadata({
      cwd: tmpDir,
      refType: 'tag',
      refName: 'v2.0.0',
      assetsSourceDir: 'release-assets',
      releaseFilesDir: 'release-files'
    });
    assert.equal(result.releaseTag, 'v2.0.0');
    assert.equal(result.releaseTitle, 'ApplyFlow v2.0.0');
    assert.equal(result.displayVersion, '2.0.0');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
