import { useState, useEffect, useCallback } from 'react';
import { pb, isOfflineMode } from '../lib/pocketbase';
import type { CandidateProfile } from '../lib/pb-types';

const STORAGE_KEY = 'career_crm_candidate_profile';

const DEFAULT_PROFILE: CandidateProfile = {
  id: 'default-profile',
  fullName: 'Rizky Aryendi Gumilang',
  headline: 'Technical Consultant Analyst | Data & System Engineer',
  phone: '+6289512888017',
  location: 'Cipete, Jakarta Selatan',
  linkedinUrl: 'https://www.linkedin.com/in/rizkyaryendigumilang',
  githubUrl: 'https://github.com/rizkyaryendigumilang',
  portfolioUrl: 'https://rizkyaryendigumilang.github.io',
  targetRoles: [
    'Technical Consultant Analyst',
    'Data Analyst',
    'Data Engineer',
    'System Engineer',
    'APM / DevOps Engineer',
    'Business Intelligence Analyst',
  ],
  skills: [
    'Python',
    'MySQL',
    'Jupyter Notebook',
    'Google Colab',
    'Anaconda',
    'Postman',
    'Microsoft Excel',
    'Tableau',
    'GitHub',
    'HTML',
    'CSS',
    'Figma',
    'AWS',
    'Dynatrace APM',
    'OneAgent',
    'Spring Boot',
    'Active Directory',
    'VMware vSphere',
    'Veeam Backup',
    'Seciron',
    'IronSky',
    'Data Analytics',
    'Data Science',
    'Machine Learning',
    'Data Visualization',
  ],
  minSalary: 12000000,
  preferredModes: ['Hybrid', 'Remote', 'On-site'],
  dealbreakers: ['Industri Judi / Slot / Casino', 'Tanpa BPJS Ketenagakerjaan'],
  experienceSummary:
    'Technical Consultant Analyst at PT Mitra Integrasi Informatika with enterprise APM & security monitoring projects at Bank Mega, Bank Jago, and BPJS Ketenagakerjaan. Previously Junior Engineer at PLN ICON PLUS with strong system administration (VMware, Active Directory, Veeam Backup) and CRM IT Enterprise operations.',
  educationSummary: 'Universitas Widyatama (2017-2021) - S1 Information System (GPA 3.48)',
  certifications: [
    'Coding Studio - Bootcamp Data Analyst (Sep 2023 - Dec 2023)',
    'Binar Academy - Bootcamp Data Science (Oct 2023 - Feb 2024)',
    'BNSP - Human Capital Staff Certified',
    'AWS Cloud Basic Essentials',
    'SAP Business One',
  ],
  languages: ['Bahasa Indonesia (Native)', 'English (Professional)'],
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
