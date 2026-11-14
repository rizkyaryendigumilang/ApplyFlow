import { useState, useEffect, useCallback } from 'react';
import { pb, isOfflineMode } from '../lib/pocketbase';
import type { JobLead } from '../lib/pb-types';

const STORAGE_KEY = 'career_crm_job_leads';

const SEED_LEADS: JobLead[] = [
  {
    id: 'seed-lead-1',
    title: 'Senior DevOps / SRE Engineer',
    company: 'Fintech Unicorn APAC',
    url: 'https://example.com/jobs/devops-lead-1',
    location: 'Jakarta / Remote',
    employmentType: 'Full-time',
    workMode: 'Remote',
    rawJd: 'We are seeking a Senior DevOps Engineer to scale our Kubernetes clusters on AWS using Terraform and ArgoCD. Must have deep experience in CI/CD automation, Prometheus monitoring, and PostgreSQL reliability.',
    source: 'jobstreet',
    matchScore: 92,
    evaluation: {
      strengths: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'PostgreSQL', 'Prometheus'],
      missingSkills: ['ArgoCD'],
      dealbreakers: [],
      pros: ['Role title perfectly aligns with your target', 'Matches 7 of your key competencies', 'Remote work arrangement supported'],
      cons: ['Missing 1 mentioned technical requirement (ArgoCD)'],
      verdict: 'strong_match',
      summary: 'Outstanding fit for your background in cloud automation and Kubernetes.',
      suggestedAngle: 'Lead with your multi-cluster Kubernetes production experience and CI/CD pipelines.',
    },
    status: 'shortlisted',
    created: new Date().toISOString(),
  },
  {
    id: 'seed-lead-2',
    title: 'Platform Infrastructure Engineer',
    company: 'Global AI Labs',
    url: 'https://example.com/jobs/infra-ai-2',
    location: 'Singapore / Hybrid',
    employmentType: 'Full-time',
    workMode: 'Hybrid',
    rawJd: 'Platform Engineer to manage distributed training clusters with Kubernetes, Go, Python, and OpenTelemetry. WFO 3 days a week in office.',
    source: 'linkedin',
    matchScore: 84,
    evaluation: {
      strengths: ['Kubernetes', 'Docker', 'Go', 'Python', 'Linux'],
      missingSkills: ['OpenTelemetry'],
      dealbreakers: [],
      pros: ['High tech stack alignment with Go and Kubernetes'],
      cons: ['Hybrid Singapore location requires travel or relocation'],
      verdict: 'strong_match',
      summary: 'Strong technical match with high compensation potential.',
      suggestedAngle: 'Focus on your Go systems programming and Linux container performance tuning.',
    },
    status: 'inbox',
    created: new Date(Date.now() - 86400000).toISOString(),
  },
];

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
