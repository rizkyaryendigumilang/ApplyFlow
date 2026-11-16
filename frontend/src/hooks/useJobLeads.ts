import { useState, useEffect, useCallback } from 'react';
import { pb, isOfflineMode } from '../lib/pocketbase';
import type { JobLead } from '../lib/pb-types';

const STORAGE_KEY = 'career_crm_job_leads';

const SEED_LEADS: JobLead[] = [];

export function useJobLeads() {
  const [leads, setLeads] = useState<JobLead[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : SEED_LEADS;
    } catch {
      return SEED_LEADS;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    if (isOfflineMode() || !pb.authStore.isValid) return;
    setLoading(true);
    try {
      const records = await pb.collection('job_leads').getFullList<JobLead>({
        sort: '-created',
      });
      setLeads(records);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      setError(null);
    } catch (err: unknown) {
      console.warn('Could not load job leads from PocketBase:', err);
      setError('Showing locally cached job leads.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const addLead = async (leadData: Omit<JobLead, 'id'>) => {
    const tempId = `lead-${Date.now()}`;
    const newLead: JobLead = { ...leadData, id: tempId, created: new Date().toISOString() };
    const updated = [newLead, ...leads];
    setLeads(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (!isOfflineMode() && pb.authStore.isValid) {
      try {
        const record = await pb.collection('job_leads').create<JobLead>({
          ...leadData,
          owner: pb.authStore.model?.id,
        });
        const synced = updated.map(l => (l.id === tempId ? record : l));
        setLeads(synced);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
        return record;
      } catch (err: unknown) {
        console.error('Failed to save job lead to PocketBase:', err);
      }
    }
    return newLead;
  };

  const updateLeadStatus = async (id: string, status: JobLead['status']) => {
    const updated = leads.map(l => (l.id === id ? { ...l, status, updated: new Date().toISOString() } : l));
    setLeads(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (!isOfflineMode() && pb.authStore.isValid && !id.startsWith('seed-') && !id.startsWith('lead-')) {
      try {
        await pb.collection('job_leads').update(id, { status });
      } catch (err: unknown) {
        console.error('Failed to update lead status in PocketBase:', err);
      }
    }
  };

  const deleteLead = async (id: string) => {
    const updated = leads.filter(l => l.id !== id);
    setLeads(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (!isOfflineMode() && pb.authStore.isValid && !id.startsWith('seed-') && !id.startsWith('lead-')) {
      try {
        await pb.collection('job_leads').delete(id);
      } catch (err: unknown) {
        console.error('Failed to delete lead from PocketBase:', err);
      }
    }
  };

  return {
    leads,
    loading,
    error,
    addLead,
    updateLeadStatus,
    deleteLead,
    reload: fetchLeads,
  };
}
