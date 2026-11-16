import { useState, useEffect, useCallback } from 'react';
import { pb, isOfflineMode } from '../lib/pocketbase';
import type { ProfessionalContact } from '../lib/pb-types';

const STORAGE_KEY = 'career_crm_professional_contacts';

const SEED_CONTACTS: ProfessionalContact[] = [];

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
