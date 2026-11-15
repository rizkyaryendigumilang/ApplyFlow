import { useEffect, useState, useCallback } from 'react';
import { seedInterviews } from '../lib/seed-data';
import { pb, isOfflineMode } from '../lib/pocketbase';
import type { Interview } from '../lib/pb-types';

const STORAGE_KEY = 'career_crm_interviews';

function getInitialInterviews(): Interview[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return [...seedInterviews];
}

export function useInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>(() => {
    return pb.authStore.isValid ? [] : getInitialInterviews();
  });
  const [loading, setLoading] = useState(pb.authStore.isValid);
  const [error, setError] = useState('');
  const userId = pb.authStore.model?.id;

  const fetchInterviews = useCallback(async () => {
    if (isOfflineMode() || !pb.authStore.isValid) {
      setInterviews(getInitialInterviews());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const records = await pb.collection<Interview>('interviews').getFullList({
        sort: 'scheduledAt',
      });
      setInterviews(records);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      setError('');
    } catch (cause) {
      const local = getInitialInterviews();
      setInterviews(local);
      setError(cause instanceof Error ? cause.message : 'Could not load interviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [userId, fetchInterviews]);

  const addInterview = async (data: Omit<Interview, 'id'>): Promise<Interview> => {
    const tempId = `int-${Date.now()}`;
    const newInterview: Interview = {
      ...data,
      id: tempId,
      owner: userId,
    };
    const updated = [newInterview, ...interviews];
    setInterviews(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (!isOfflineMode() && pb.authStore.isValid) {
      try {
        const created = await pb.collection<Interview>('interviews').create<Interview>({
          ...data,
          owner: userId,
        });
        const synced = updated.map((i) => (i.id === tempId ? created : i));
        setInterviews(synced);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
        return created;
      } catch (cause) {
        console.warn('Saved interview to local cache (PocketBase offline):', cause);
      }
    }
    return newInterview;
  };

  const updateInterview = async (id: string, patch: Partial<Interview>): Promise<Interview> => {
    const updated = interviews.map((i) => (i.id === id ? { ...i, ...patch } : i));
    setInterviews(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (!isOfflineMode() && pb.authStore.isValid) {
      try {
        const result = await pb.collection<Interview>('interviews').update<Interview>(id, patch);
        const synced = updated.map((i) => (i.id === id ? result : i));
        setInterviews(synced);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
        return result;
      } catch (cause) {
        console.warn('Updated interview in local cache:', cause);
      }
    }
    const found = updated.find((i) => i.id === id);
    if (!found) throw new Error('Interview not found');
    return found;
  };

  return { interviews, loading, error, addInterview, updateInterview, refresh: fetchInterviews };
}
