import { useState, useEffect, useCallback } from 'react';
import { pb, isOfflineMode } from '../lib/pocketbase';
import type { JobLead } from '../lib/pb-types';

const STORAGE_KEY = 'career_crm_job_leads';

const SEED_LEADS: JobLead[] = [
  {
    id: 'seed-lead-1',
    title: 'Data Analyst (Product & Growth Analytics)',
    company: 'PT GoTo Gojek Tokopedia Tbk',
    url: 'https://careers.gojek.com/job/data-analyst-growth',
    location: 'Jakarta (Hybrid)',
    employmentType: 'Full-time',
    workMode: 'Hybrid',
    rawJd: 'We are looking for a Data Analyst to join our Growth & Commercial analytics team. You will query large datasets with SQL and Python, build executive Tableau dashboards, perform statistical experiments, and present insights to business stakeholders.',
    source: 'jobstreet',
    matchScore: 95,
    evaluation: {
      strengths: ['Python', 'MySQL', 'Tableau', 'Microsoft Excel', 'Data Visualization', 'Analytical Thinking'],
      missingSkills: ['BigQuery'],
      dealbreakers: [],
      pros: ['Sangat cocok dengan portfolio Tableau dan bootcamp Data Analytics Coding Studio Anda', 'Gaji di atas batas minimum Anda', 'Budaya kerja hybrid di Jakarta'],
      cons: ['Membutuhkan familiaritas dengan skala data BigQuery'],
      verdict: 'strong_match',
      summary: 'Kecocokan luar biasa untuk profil Rizky dalam analisis data, pemodelan visual Tableau, dan keahlian Python.',
      suggestedAngle: 'Tampilkan dashboard Tableau US Flight Delay dan Netflix customer behavior sebagai bukti portofolio interaktif.',
    },
    status: 'shortlisted',
    created: new Date().toISOString(),
  },
  {
    id: 'seed-lead-2',
    title: 'Technical Consultant Analyst (Enterprise APM & Monitoring)',
    company: 'PT Metrodata Electronics Tbk',
    url: 'https://metrodata.co.id/careers/tech-consultant-apm',
    location: 'Jakarta (Hybrid)',
    employmentType: 'Full-time',
    workMode: 'Hybrid',
    rawJd: 'Looking for a Technical Consultant Analyst with hands-on Dynatrace APM, OneAgent deployment, Spring Boot microservices monitoring, and cyber security operational hardening. Banking or enterprise project experience preferred.',
    source: 'linkedin',
    matchScore: 96,
    evaluation: {
      strengths: ['Dynatrace APM', 'OneAgent', 'Spring Boot', 'Seciron', 'IronSky', 'Technical Consultant Analyst', 'Project Management'],
      missingSkills: [],
      dealbreakers: [],
      pros: ['100% selaras dengan pengalaman aktif Anda di PT Mitra Integrasi Informatika pada Bank Mega dan Bank Jago', 'Peran konsultasi teknis tingkat enterprise'],
      cons: [],
      verdict: 'strong_match',
      summary: 'Peluang paling sempurna: semua kualifikasi teknis dan pengalaman perbankan Anda terpenuhi tanpa celah keahlian.',
      suggestedAngle: 'Soroti keberhasilan implementasi Dynatrace APM Managed dan hardening Seciron/IronSky di Bank Mega.',
    },
    status: 'shortlisted',
    created: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'seed-lead-3',
    title: 'Business Intelligence & Data Analyst',
    company: 'PT Bank Jago Tbk',
    url: 'https://jago.com/careers/bi-analyst',
    location: 'Jakarta (Hybrid)',
    employmentType: 'Full-time',
    workMode: 'Hybrid',
    rawJd: 'Join our Data & Analytics division to design automated SQL reports, customer attrition dashboards, and financial monitoring pipelines using Tableau and Python.',
    source: 'jobstreet',
    matchScore: 92,
    evaluation: {
      strengths: ['SQL', 'Python', 'Tableau', 'Data Analytics', 'Problem Solving'],
      missingSkills: [],
      dealbreakers: [],
      pros: ['Anda sudah memiliki riwayat pemeliharaan sistem di Bank Jago', 'Portofolio HR Analytics cocok untuk analisis retensi nasabah'],
      cons: [],
      verdict: 'strong_match',
      summary: 'Sangat cocok: rekam jejak Anda yang sudah mengenal ekosistem Bank Jago memberikan nilai tambah tinggi bagi tim HR.',
      suggestedAngle: 'Gunakan referensi proyek Dynatrace Bank Jago Anda serta dashboard analisis attrition untuk mempermudah wawancara.',
    },
    status: 'shortlisted',
    created: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'seed-lead-4',
    title: 'System & Infrastructure Engineer',
    company: 'PT Telkom Indonesia (Persero) Tbk',
    url: 'https://careers.telkom.co.id/job/sys-engineer',
    location: 'Jakarta (On-site)',
    employmentType: 'Full-time',
    workMode: 'On-site',
    rawJd: 'Seeking Junior/Mid System Engineer to manage Active Directory, VMware vSphere virtualization, Sophos endpoint security, Veeam Backup, and IT service desk ticketing.',
    source: 'linkedin',
    matchScore: 88,
    evaluation: {
      strengths: ['Active Directory', 'VMware vSphere', 'Veeam Backup', 'Sophos Central', 'System Administration'],
      missingSkills: ['Kubernetes'],
      dealbreakers: [],
      pros: ['Selaras 100% dengan pengalaman 2 tahun Anda di PLN ICON PLUS'],
      cons: ['Penempatan on-site kantor'],
      verdict: 'strong_match',
      summary: 'Kecocokan tinggi untuk keahlian administrasi sistem dan infrastruktur jaringan BUMN.',
      suggestedAngle: 'Paparkan rekam jejak Anda dalam mengelola backup disaster recovery dan Active Directory di PLN ICON PLUS.',
    },
    status: 'inbox',
    created: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'seed-lead-5',
    title: 'Junior Data Scientist / Machine Learning Engineer',
    company: 'PT DCI Indonesia Tbk',
    url: 'https://dci-indonesia.com/careers/data-scientist',
    location: 'Jakarta / Remote',
    employmentType: 'Full-time',
    workMode: 'Remote',
    rawJd: 'We are expanding our data team to develop data cleansing REST APIs using Python, SwaggerUI, machine learning algorithms, and AWS cloud pipelines.',
    source: 'jobstreet',
    matchScore: 89,
    evaluation: {
      strengths: ['Python', 'SwaggerUI', 'Machine Learning', 'AWS', 'Google Colab', 'Anaconda'],
      missingSkills: ['Docker'],
      dealbreakers: [],
      pros: ['Sangat cocok dengan proyek API Text Cleansing (SwaggerUI) dan bootcamp Data Science Binar Academy Anda', 'Mode kerja remote penuh'],
      cons: ['Memerlukan adaptasi pada deployment pipeline container'],
      verdict: 'strong_match',
      summary: 'Kesesuaian luar biasa untuk memperluas karier ke bidang Data Science dan Machine Learning engineering.',
      suggestedAngle: 'Demonstrasikan live endpoint API Text Cleansing Python yang Anda bangun saat bootcamp Binar Academy.',
    },
    status: 'shortlisted',
    created: new Date(Date.now() - 172800000).toISOString(),
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
