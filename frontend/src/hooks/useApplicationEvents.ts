import { useState, useEffect, useCallback } from 'react';
import { pb, isOfflineMode } from '../lib/pocketbase';
import type { ApplicationEvent } from '../lib/pb-types';

export function useApplicationEvents(applicationId?: string) {
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (isOfflineMode() || !pb.authStore.isValid || !applicationId) return;
    setLoading(true);
    try {
      const records = await pb.collection('application_events').getFullList<ApplicationEvent>({
        filter: `application = "${applicationId}"`,
        sort: '-created',
      });
      setEvents(records);
    } catch (err) {
      console.warn('Could not load application events:', err);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = async (eventData: Omit<ApplicationEvent, 'id' | 'created'>) => {
    const tempId = `event-${Date.now()}`;
    const newEvent: ApplicationEvent = { ...eventData, id: tempId, created: new Date().toISOString() };
    setEvents(prev => [newEvent, ...prev]);

    if (!isOfflineMode() && pb.authStore.isValid) {
      try {
        const record = await pb.collection('application_events').create<ApplicationEvent>({
          ...eventData,
          owner: pb.authStore.model?.id,
        });
        setEvents(prev => prev.map(e => (e.id === tempId ? record : e)));
        return record;
      } catch (err) {
        console.error('Failed to create application event in PocketBase:', err);
      }
    }
    return newEvent;
  };

  return { events, loading, addEvent, reload: fetchEvents };
}
