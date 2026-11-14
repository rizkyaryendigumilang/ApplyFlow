import { useState, useEffect, useCallback } from 'react';

export interface CRMPreferences {
  locale: 'id' | 'en';
  defaultLandingModule: 'pipeline' | 'jobhunter' | 'applyflow' | 'inbox';
  currency: 'IDR' | 'USD' | 'SGD' | 'EUR';
  salaryPeriod: 'monthly' | 'annual';
  ghostingThresholdDays: number;
  tableDensity: 'comfortable' | 'compact';
  autoSyncInbox: boolean;
  inboxSyncIntervalMinutes: number;
  telegramEnabled: boolean;
  telegramChatId: string;
  telegramBotToken?: string;
  notifyDailyMorningBriefing: boolean;
  notifyOnInterview: boolean;
  notifyOnStatusChange: boolean;
  notifyOnGhostingWarning: boolean;
  notifyOnHighFitLead: boolean;
  autoExtractSkills: boolean;
  autoPromoteThreshold: number;
}

const STORAGE_KEY = 'junction_crm_preferences';

export const DEFAULT_PREFERENCES: CRMPreferences = {
  locale: 'id',
  defaultLandingModule: 'pipeline',
  currency: 'IDR',
  salaryPeriod: 'monthly',
  ghostingThresholdDays: 7,
  tableDensity: 'comfortable',
  autoSyncInbox: true,
  inboxSyncIntervalMinutes: 15,
  telegramEnabled: false,
  telegramChatId: '',
  telegramBotToken: '',
  notifyDailyMorningBriefing: true,
  notifyOnInterview: true,
  notifyOnStatusChange: true,
  notifyOnGhostingWarning: true,
  notifyOnHighFitLead: true,
  autoExtractSkills: true,
  autoPromoteThreshold: 80,
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<CRMPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_PREFERENCES;
  });

  const [savedStatus, setSavedStatus] = useState<'saved' | 'saving'>('saved');

  const updatePreferences = useCallback((updates: Partial<CRMPreferences>) => {
    setSavedStatus('saving');
    if (updates.locale && typeof window !== 'undefined') {
      localStorage.setItem('junction_crm_locale', updates.locale);
      window.dispatchEvent(new CustomEvent('junction_locale_changed', { detail: updates.locale }));
    }
    setPreferences(prev => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('Could not write preferences to localStorage:', err);
      }
      return next;
    });
    setTimeout(() => {
      setSavedStatus('saved');
    }, 400);
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
  }, []);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    savedStatus,
  };
}
