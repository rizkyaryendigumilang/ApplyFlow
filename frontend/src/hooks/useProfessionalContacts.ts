import { useState, useEffect, useCallback } from 'react';
import { pb, isOfflineMode } from '../lib/pocketbase';
import type { ProfessionalContact } from '../lib/pb-types';

const STORAGE_KEY = 'career_crm_professional_contacts';

const SEED_CONTACTS: ProfessionalContact[] = [
  {
    id: 'seed-con-1',
    name: 'Sarah Praditya',
    company: 'GoTo / Tokopedia',
    role: 'Principal Platform Engineer',
    email: 'sarah.praditya@example.com',
    phone: '+62 811-9876-5432',
    linkedinUrl: 'https://linkedin.com/in/sarah-praditya',
    relationship: 'Former Colleague',
    referralStatus: 'Submitted',
    lastContactDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    notes: 'Bantu submit internal referral untuk role Staff Cloud Platform Architect. Follow-up lagi setelah screening.',
    created: new Date().toISOString(),
  },
  {
    id: 'seed-con-2',
    name: 'Alexandre Meyer',
    company: 'Michael Page Executive Search',
    role: 'Managing Consultant - Tech & Cloud',
    email: 'alex.meyer@michaelpage.co.id',
    phone: '+62 812-4433-2211',
    linkedinUrl: 'https://linkedin.com/in/alexandremeyer-recruit',
    relationship: 'Recruiter',
    referralStatus: 'Interview Secured',
    lastContactDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    notes: 'Headhunter yang merekomendasikan posisi VP of Engineering di Regional Logistics scale-up.',
    created: new Date().toISOString(),
  },
  {
    id: 'seed-con-3',
    name: 'Dimas Wicaksono',
    company: 'Traveloka',
    role: 'Engineering Manager - SRE',
    email: 'dimas.w@example.com',
    phone: '+62 813-7766-5544',
    linkedinUrl: 'https://linkedin.com/in/dimas-sre-lead',
    relationship: 'Alumni',
    referralStatus: 'Requested',
    lastContactDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    notes: 'Alumni kampus UI angkatan 2014. Sudah kirim pesan LinkedIn meminta info tim platform.',
    created: new Date().toISOString(),
  },
];

export function useProfessionalContacts() {
  const [contacts, setContacts] = useState<ProfessionalContact[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : SEED_CONTACTS;
    } catch {
      return SEED_CONTACTS;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    if (isOfflineMode() || !pb.authStore.isValid) return;
    setLoading(true);
    try {
      const records = await pb.collection('professional_contacts').getFullList<ProfessionalContact>({
        sort: '-lastContactDate',
      });
      setContacts(records);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      setError(null);
    } catch (err: unknown) {
      console.warn('Could not load professional contacts from PocketBase:', err);
      setError('Showing locally cached contacts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = async (data: Omit<ProfessionalContact, 'id' | 'created'>) => {
    const tempId = `con-${Date.now()}`;
    const newContact: ProfessionalContact = {
      ...data,
      id: tempId,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
    const updated = [newContact, ...contacts];
    setContacts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (!isOfflineMode() && pb.authStore.isValid) {
      try {
        const record = await pb.collection('professional_contacts').create<ProfessionalContact>({
          ...data,
          owner: pb.authStore.model?.id,
        });
        const synced = updated.map((c) => (c.id === tempId ? record : c));
        setContacts(synced);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
        return record;
      } catch (err) {
        console.error('Failed to create professional contact in PocketBase:', err);
      }
    }
    return newContact;
  };

  const updateContact = async (id: string, patch: Partial<ProfessionalContact>) => {
    const updated = contacts.map((c) =>
      c.id === id ? { ...c, ...patch, updated: new Date().toISOString() } : c
    );
    setContacts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (!isOfflineMode() && pb.authStore.isValid) {
      try {
        await pb.collection('professional_contacts').update(id, patch);
      } catch (err) {
        console.error('Failed to update professional contact in PocketBase:', err);
      }
    }
  };

  const deleteContact = async (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (!isOfflineMode() && pb.authStore.isValid) {
      try {
        await pb.collection('professional_contacts').delete(id);
      } catch (err) {
        console.error('Failed to delete professional contact from PocketBase:', err);
      }
    }
  };

  return {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    refreshContacts: fetchContacts,
  };
}
