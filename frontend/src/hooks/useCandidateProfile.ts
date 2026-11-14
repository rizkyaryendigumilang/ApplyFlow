import { useState, useEffect, useCallback } from 'react';
import { pb, isOfflineMode } from '../lib/pocketbase';
import type { CandidateProfile } from '../lib/pb-types';

const STORAGE_KEY = 'career_crm_candidate_profile';

const DEFAULT_PROFILE: CandidateProfile = {
  id: 'default-profile',
  headline: 'Senior DevOps & Cloud Platform Engineer',
  targetRoles: ['DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer (SRE)', 'Backend Engineer'],
  skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Linux', 'Go', 'Python', 'PostgreSQL', 'PocketBase', 'GitLab'],
  minSalary: 15000000,
  preferredModes: ['Remote', 'Hybrid'],
  dealbreakers: ['On-site only', 'Industri Judi / Gambling', 'Night shift tanpa tunjangan'],
  experienceSummary: '5+ years experience building cloud infrastructure, automating CI/CD pipelines, and maintaining high-availability microservices.',
};

export function useCandidateProfile() {
  const [profile, setProfile] = useState<CandidateProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (isOfflineMode() || !pb.authStore.isValid) return;
    setLoading(true);
    try {
      const records = await pb.collection('candidate_profiles').getFullList<CandidateProfile>({
        sort: '-created',
        limit: 1,
      });
      if (records.length > 0) {
        setProfile(records[0]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records[0]));
      }
      setError(null);
    } catch (err: unknown) {
      console.warn('Could not load candidate profile from PocketBase:', err);
      setError('Using cached candidate profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = async (updated: Partial<CandidateProfile>) => {
    const next: CandidateProfile = { ...profile, ...updated };
    setProfile(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    if (!isOfflineMode() && pb.authStore.isValid) {
      try {
        if (profile.id && profile.id !== 'default-profile') {
          await pb.collection('candidate_profiles').update(profile.id, updated);
        } else {
          const created = await pb.collection('candidate_profiles').create<CandidateProfile>({
            ...updated,
            owner: pb.authStore.model?.id,
          });
          setProfile(created);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(created));
        }
      } catch (err: unknown) {
        console.error('Failed to sync profile to PocketBase:', err);
      }
    }
    return next;
  };

  return { profile, loading, error, saveProfile, reload: fetchProfile };
}
