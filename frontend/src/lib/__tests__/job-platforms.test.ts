import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PLATFORM_PRESETS,
  type JobPlatformPreset,
} from '../job-scout-engine.ts';

// Storage helper functions test
export const PLATFORMS_STORAGE_KEY = 'applyflow_custom_job_platforms';

export function loadStoredPlatforms(rawJson?: string | null): JobPlatformPreset[] {
  if (!rawJson) return DEFAULT_PLATFORM_PRESETS;
  try {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_PLATFORM_PRESETS;
}

export function addCustomPlatformPreset(
  existing: JobPlatformPreset[],
  name: string,
  urlTemplate: string
): JobPlatformPreset[] {
  const cleanName = name.trim();
  const cleanUrl = urlTemplate.trim();
  if (!cleanName || !cleanUrl) return existing;

  const newPreset: JobPlatformPreset = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    urlTemplate: cleanUrl,
    isCustom: true,
  };

  return [...existing, newPreset];
}

export function removeCustomPlatformPreset(
  existing: JobPlatformPreset[],
  id: string
): JobPlatformPreset[] {
  // Built-in presets cannot be removed
  return existing.filter((p) => p.id !== id || !p.isCustom);
}

test('loadStoredPlatforms returns defaults when storage is empty', () => {
  const list = loadStoredPlatforms(null);
  assert.equal(list.length, DEFAULT_PLATFORM_PRESETS.length);
  assert.equal(list[0].id, 'jobstreet');
});

test('addCustomPlatformPreset appends a valid custom platform', () => {
  const initial = [...DEFAULT_PLATFORM_PRESETS];
  const updated = addCustomPlatformPreset(initial, 'Tech in Asia Jobs', 'https://www.techinasia.com/jobs/search?query={query}');
  assert.equal(updated.length, initial.length + 1);
  const added = updated[updated.length - 1];
  assert.equal(added.name, 'Tech in Asia Jobs');
  assert.equal(added.isCustom, true);
  assert.ok(added.id.startsWith('custom-'));
});

test('addCustomPlatformPreset ignores empty name or URL', () => {
  const initial = [...DEFAULT_PLATFORM_PRESETS];
  const unchanged1 = addCustomPlatformPreset(initial, '', 'https://example.com');
  assert.equal(unchanged1.length, initial.length);
  const unchanged2 = addCustomPlatformPreset(initial, 'Valid Name', '');
  assert.equal(unchanged2.length, initial.length);
});

test('removeCustomPlatformPreset removes only custom platforms and protects defaults', () => {
  const initial = addCustomPlatformPreset([...DEFAULT_PLATFORM_PRESETS], 'Hapus Saya', 'https://hapus.com');
  const customId = initial[initial.length - 1].id;

  // Attempt to remove default platform 'jobstreet' (must NOT be deleted)
  const afterProtected = removeCustomPlatformPreset(initial, 'jobstreet');
  assert.equal(afterProtected.some((p) => p.id === 'jobstreet'), true);

  // Remove the custom platform (must be deleted)
  const afterDelete = removeCustomPlatformPreset(afterProtected, customId);
  assert.equal(afterDelete.some((p) => p.id === customId), false);
  assert.equal(afterDelete.length, DEFAULT_PLATFORM_PRESETS.length);
});
