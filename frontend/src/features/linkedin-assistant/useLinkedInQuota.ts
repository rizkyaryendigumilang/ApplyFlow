import { useEffect, useState } from 'react';

export const STORAGE_KEY = 'career_crm_linkedin_quota_v1';
export const DEFAULT_SAFE_LIMIT = 25;

export interface QuotaState {
  count: number;
  safeLimit: number;
  weekOf: string; // YYYY-MM-DD of Monday
}

/**
 * Returns the YYYY-MM-DD string for Monday of the given date's week.
 */
export function getMondayOfWeek(d: Date): string {
  const date = new Date(d);
  const day = date.getUTCDay(); // 0 is Sunday, 1 is Monday
  const diff = (day === 0 ? -6 : 1) - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().split('T')[0];
}

/**
 * Computes safety status:
 * - safe: < 20
 * - caution: 20..24
 * - danger: >= 25
 */
export function calculateQuotaStatus(count: number, safeLimit: number): 'safe' | 'caution' | 'danger' {
  if (count >= safeLimit) return 'danger';
  if (count >= safeLimit - 5) return 'caution';
  return 'safe';
}

/**
 * Parses raw JSON string or returns new initialized state.
 * Resets count if the saved week differs from the current Monday.
 */
export function parseOrInitializeQuota(raw: string | null): QuotaState {
  const currentMonday = getMondayOfWeek(new Date());

  if (!raw) {
    return {
      count: 0,
      safeLimit: DEFAULT_SAFE_LIMIT,
      weekOf: currentMonday,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.count === 'number' && parsed?.weekOf === currentMonday) {
      return {
        count: Math.max(0, parsed.count),
        safeLimit: parsed.safeLimit || DEFAULT_SAFE_LIMIT,
        weekOf: currentMonday,
      };
    }
    // Week rolled over or invalid payload: reset count to 0 for current week
    return {
      count: 0,
      safeLimit: parsed?.safeLimit || DEFAULT_SAFE_LIMIT,
      weekOf: currentMonday,
    };
  } catch {
    return {
      count: 0,
      safeLimit: DEFAULT_SAFE_LIMIT,
      weekOf: currentMonday,
    };
  }
}

/**
 * React hook for safe LinkedIn weekly connection quota tracking.
 */
export function useLinkedInQuota() {
  const [state, setState] = useState<QuotaState>(() => {
    if (typeof window === 'undefined') {
      return { count: 0, safeLimit: DEFAULT_SAFE_LIMIT, weekOf: getMondayOfWeek(new Date()) };
    }
    return parseOrInitializeQuota(localStorage.getItem(STORAGE_KEY));
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const increment = () => {
    setState((prev) => {
      const currentMonday = getMondayOfWeek(new Date());
      const baseCount = prev.weekOf === currentMonday ? prev.count : 0;
      return {
        ...prev,
        weekOf: currentMonday,
        count: baseCount + 1,
      };
    });
  };

  const reset = () => {
    setState({
      count: 0,
      safeLimit: DEFAULT_SAFE_LIMIT,
      weekOf: getMondayOfWeek(new Date()),
    });
  };

  const status = calculateQuotaStatus(state.count, state.safeLimit);

  return {
    count: state.count,
    safeLimit: state.safeLimit,
    status,
    weekOf: state.weekOf,
    increment,
    reset,
  };
}
