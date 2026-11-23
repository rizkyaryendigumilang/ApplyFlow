import { useState, useEffect, useCallback } from 'react';
import {
  parseJobUrlHeuristics,
  parseBatchJobUrls,
  type ExtractedJobLink,
  type JobPlatform,
} from '../lib/job-scout-engine.ts';

export const SCRAPED_JOBS_STORAGE_KEY = 'applyflow_scraped_jobs_v1';

export interface ScrapedJob {
  id: string;
  url: string;
  title: string;
  company: string;
  platform: JobPlatform;
  domain: string;
  createdAt: string;
  isSavedToPipeline?: boolean;
  notes?: string;
}

export function loadStoredScrapedJobs(storage?: Storage): ScrapedJob[] {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return [];

  try {
    const raw = store.getItem(SCRAPED_JOBS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Graceful fallback on malformed JSON
  }
  return [];
}

export function saveStoredScrapedJobs(jobs: ScrapedJob[], storage?: Storage): void {
  const store = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!store) return;

  try {
    store.setItem(SCRAPED_JOBS_STORAGE_KEY, JSON.stringify(jobs));
  } catch (err) {
    console.warn('Could not persist scraped jobs to storage:', err);
  }
}

export function addScrapedJobItem(
  existingJobs: ScrapedJob[],
  url: string,
  customTitle?: string,
  customCompany?: string
): { next: ScrapedJob[]; added: ScrapedJob | null } {
  const cleanUrl = url.trim();
  if (!cleanUrl) return { next: existingJobs, added: null };

  const parsed = parseJobUrlHeuristics(cleanUrl);
  if (!parsed.isValid) return { next: existingJobs, added: null };

  // Check if URL already exists
  const normalizedKey = cleanUrl.toLowerCase().replace(/\/+$/, '');
  const isDuplicate = existingJobs.some(
    (j) => j.url.toLowerCase().replace(/\/+$/, '') === normalizedKey
  );

  if (isDuplicate) {
    return { next: existingJobs, added: null };
  }

  const platformName = parsed.platform !== 'Other' ? parsed.platform : (parsed.domain || 'Portal');
  const newJob: ScrapedJob = {
    id: `scraped_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    url: cleanUrl,
    title: customTitle?.trim() || parsed.suggestedTitle || `Lowongan di ${parsed.suggestedCompany || platformName}`,
    company: customCompany?.trim() || parsed.suggestedCompany || (parsed.platform !== 'Other' ? parsed.platform : parsed.domain),
    platform: parsed.platform,
    domain: parsed.domain || 'web',
    createdAt: new Date().toISOString(),
    isSavedToPipeline: false,
  };

  const next = [newJob, ...existingJobs];
  return { next, added: newJob };
}

export function addBatchScrapedJobItems(
  existingJobs: ScrapedJob[],
  rawText: string
): { next: ScrapedJob[]; added: ScrapedJob[] } {
  const extracted = parseBatchJobUrls(rawText);
  if (extracted.length === 0) {
    return { next: existingJobs, added: [] };
  }

  const existingKeys = new Set(
    existingJobs.map((j) => j.url.toLowerCase().replace(/\/+$/, ''))
  );

  const newJobs: ScrapedJob[] = [];
  for (const item of extracted) {
    const key = item.url.toLowerCase().replace(/\/+$/, '');
    if (!existingKeys.has(key)) {
      existingKeys.add(key);
      newJobs.push({
        ...item,
        isSavedToPipeline: false,
      });
    }
  }

  const next = [...newJobs, ...existingJobs];
  return { next, added: newJobs };
}

export function removeScrapedJobItem(existingJobs: ScrapedJob[], id: string): ScrapedJob[] {
  return existingJobs.filter((j) => j.id !== id);
}

export function markScrapedJobAsSavedItem(existingJobs: ScrapedJob[], id: string): ScrapedJob[] {
  return existingJobs.map((j) => (j.id === id ? { ...j, isSavedToPipeline: true } : j));
}

export function useScrapedJobs() {
  const [scrapedJobs, setScrapedJobs] = useState<ScrapedJob[]>(loadStoredScrapedJobs);

  const persistJobs = useCallback((nextJobs: ScrapedJob[]) => {
    setScrapedJobs(nextJobs);
    saveStoredScrapedJobs(nextJobs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('applyflow_scraped_jobs_changed'));
    }
  }, []);

  const addSingleJob = useCallback(
    (url: string, customTitle?: string, customCompany?: string) => {
      const { next, added } = addScrapedJobItem(scrapedJobs, url, customTitle, customCompany);
      if (added) {
        persistJobs(next);
      }
      return added;
    },
    [scrapedJobs, persistJobs]
  );

  const addBatchJobs = useCallback(
    (rawText: string) => {
      const { next, added } = addBatchScrapedJobItems(scrapedJobs, rawText);
      if (added.length > 0) {
        persistJobs(next);
      }
      return added;
    },
    [scrapedJobs, persistJobs]
  );

  const removeJob = useCallback(
    (id: string) => {
      const next = removeScrapedJobItem(scrapedJobs, id);
      persistJobs(next);
    },
    [scrapedJobs, persistJobs]
  );

  const markAsSaved = useCallback(
    (id: string) => {
      const next = markScrapedJobAsSavedItem(scrapedJobs, id);
      persistJobs(next);
    },
    [scrapedJobs, persistJobs]
  );

  const clearAllJobs = useCallback(() => {
    persistJobs([]);
  }, [persistJobs]);

  useEffect(() => {
    const handleStorageChange = () => {
      setScrapedJobs(loadStoredScrapedJobs());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('applyflow_scraped_jobs_changed', handleStorageChange);
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('applyflow_scraped_jobs_changed', handleStorageChange);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  return {
    scrapedJobs,
    addSingleJob,
    addBatchJobs,
    removeJob,
    markAsSaved,
    clearAllJobs,
  };
}
