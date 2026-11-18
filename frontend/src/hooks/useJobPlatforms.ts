import { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_PLATFORM_PRESETS,
  type JobPlatformPreset,
} from '../lib/job-scout-engine';

export const PLATFORMS_STORAGE_KEY = 'applyflow_custom_job_platforms';

export function loadStoredPlatforms(): JobPlatformPreset[] {
  if (typeof window === 'undefined') return DEFAULT_PLATFORM_PRESETS;
  try {
    const raw = localStorage.getItem(PLATFORMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_PLATFORM_PRESETS;
}

export function useJobPlatforms() {
  const [platforms, setPlatforms] = useState<JobPlatformPreset[]>(loadStoredPlatforms);

  const savePlatforms = useCallback((next: JobPlatformPreset[]) => {
    setPlatforms(next);
    try {
      localStorage.setItem(PLATFORMS_STORAGE_KEY, JSON.stringify(next));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('applyflow_platforms_changed'));
      }
    } catch (err) {
      console.warn('Could not persist custom job platforms to localStorage:', err);
    }
  }, []);

  const addPlatform = useCallback(
    (name: string, urlTemplate: string, description?: string) => {
      const cleanName = name.trim();
      const cleanUrl = urlTemplate.trim();
      if (!cleanName || !cleanUrl) return;

      let domain = '';
      try {
        const u = new URL(cleanUrl.includes('://') ? cleanUrl : `https://${cleanUrl}`);
        domain = u.hostname;
      } catch {
        domain = cleanName.toLowerCase().replace(/\s+/g, '') + '.com';
      }

      const newPreset: JobPlatformPreset = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        urlTemplate: cleanUrl,
        domain,
        description: description?.trim() || `Portal karier kustom untuk ${cleanName}`,
        isCustom: true,
      };

      setPlatforms((prev) => {
        const next = [...prev, newPreset];
        try {
          localStorage.setItem(PLATFORMS_STORAGE_KEY, JSON.stringify(next));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('applyflow_platforms_changed'));
          }
        } catch (err) {
          console.warn('Could not persist custom job platforms:', err);
        }
        return next;
      });
    },
    []
  );

  const removePlatform = useCallback((id: string) => {
    setPlatforms((prev) => {
      // Protect default platforms
      const next = prev.filter((p) => p.id !== id || !p.isCustom);
      try {
        localStorage.setItem(PLATFORMS_STORAGE_KEY, JSON.stringify(next));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('applyflow_platforms_changed'));
        }
      } catch (err) {
        console.warn('Could not persist platform deletion:', err);
      }
      return next;
    });
  }, []);

  const resetPlatforms = useCallback(() => {
    savePlatforms(DEFAULT_PLATFORM_PRESETS);
  }, [savePlatforms]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PLATFORMS_STORAGE_KEY) {
        setPlatforms(loadStoredPlatforms());
      }
    };

    const handleCustom = () => {
      setPlatforms(loadStoredPlatforms());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('applyflow_platforms_changed', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('applyflow_platforms_changed', handleCustom);
    };
  }, []);

  return {
    platforms,
    addPlatform,
    removePlatform,
    resetPlatforms,
  };
}
