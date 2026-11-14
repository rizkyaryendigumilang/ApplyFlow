import { useState, useEffect, useCallback } from 'react';
import { pb, isOfflineMode } from '../lib/pocketbase';
import type { RecruitmentNotification, GmailConnection, Application, ApplicationDraft, ApplicationEvent } from '../lib/pb-types';
import { parseJobStreetNotification } from '../lib/jobstreet-parser';

const STORAGE_KEY_NOTIFS = 'career_crm_recruitment_notifications';
const STORAGE_KEY_GMAIL = 'career_crm_gmail_connection';

const SEED_NOTIFICATIONS: RecruitmentNotification[] = [
  {
    id: 'seed-notif-1',
    gmailMessageId: 'gmail-msg-101',
    platform: 'jobstreet',
    extractedCompany: 'PT Lintas Media Danawa',
    extractedPosition: 'DevOps Engineer',
    extractedEventType: 'employer_viewed',
    rawSubject: 'PT Lintas Media Danawa telah melihat lamaranmu untuk DevOps Engineer',
    evidenceSnippet: 'PT Lintas Media Danawa telah melihat lamaranmu untuk DevOps Engineer di JobStreet.',
    matchStatus: 'matched',
    confidence: 95,
    created: new Date().toISOString(),
  },
  {
    id: 'seed-notif-2',
    gmailMessageId: 'gmail-msg-102',
    platform: 'jobstreet',
    extractedCompany: 'Shopee International',
    extractedPosition: 'Site Reliability Engineer',
    extractedEventType: 'interview_invited',
    rawSubject: 'Undangan Interview: Site Reliability Engineer - Shopee',
    evidenceSnippet: 'Kami mengundang Anda untuk mengikuti sesi technical interview pertama...',
    matchStatus: 'needs_review',
    confidence: 88,
    created: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

const DEFAULT_GMAIL: GmailConnection = {
  id: 'gmail-conn-default',
  email: 'candidate.career@gmail.com',
  syncStatus: 'idle',
  lastSyncedAt: new Date().toISOString(),
  autoCreateApplication: true,
};

export function useRecruitmentNotifications() {
  const [notifications, setNotifications] = useState<RecruitmentNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      return saved ? JSON.parse(saved) : SEED_NOTIFICATIONS;
    } catch {
      return SEED_NOTIFICATIONS;
    }
  });

  const [gmailConnection, setGmailConnection] = useState<GmailConnection>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GMAIL);
      return saved ? JSON.parse(saved) : DEFAULT_GMAIL;
    } catch {
      return DEFAULT_GMAIL;
    }
  });

  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (isOfflineMode() || !pb.authStore.isValid) return;
    setLoading(true);
    try {
      const [notifs, conns] = await Promise.all([
        pb.collection('recruitment_notifications').getFullList<RecruitmentNotification>({ sort: '-created' }),
        pb.collection('gmail_connections').getFullList<GmailConnection>({ limit: 1 }),
      ]);
      if (notifs.length > 0) {
        setNotifications(notifs);
        localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifs));
      }
      if (conns.length > 0) {
        setGmailConnection(conns[0]);
        localStorage.setItem(STORAGE_KEY_GMAIL, JSON.stringify(conns[0]));
      }
    } catch (err) {
      console.warn('Could not load recruitment notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateGmailSetting = async (autoCreate: boolean) => {
    const updated = { ...gmailConnection, autoCreateApplication: autoCreate };
    setGmailConnection(updated);
    localStorage.setItem(STORAGE_KEY_GMAIL, JSON.stringify(updated));

    if (!isOfflineMode() && pb.authStore.isValid && !gmailConnection.id.startsWith('gmail-conn-')) {
      try {
        await pb.collection('gmail_connections').update(gmailConnection.id, {
          autoCreateApplication: autoCreate,
        });
      } catch (err) {
        console.error('Failed to update gmail connection setting:', err);
      }
    }
  };

  const processRawNotificationText = async (
    rawText: string,
    applications: Application[],
    addApplication: (draft: ApplicationDraft) => Promise<Application | unknown>,
    addEvent: (event: Omit<ApplicationEvent, 'id' | 'created'>) => Promise<unknown>
  ) => {
    const extracted = parseJobStreetNotification(rawText);
    if (!extracted) throw new Error('Could not parse any JobStreet notification format from this text.');

    const msgId = `js-msg-${Date.now()}`;
    const normCompany = extracted.company.toLowerCase().replace(/^(pt\b|cv\b)\s*/i, '').trim();
    const normPosition = extracted.position.toLowerCase().trim();

    // Application matching algorithm
    const matchedApp = applications.find(a => {
      const aComp = a.company.toLowerCase().replace(/^(pt\b|cv\b)\s*/i, '').trim();
      const aPos = a.position.toLowerCase().trim();
      const compMatch = aComp.includes(normCompany) || normCompany.includes(aComp);
      const posMatch = aPos.includes(normPosition) || normPosition.includes(aPos);
      return compMatch && posMatch;
    });

    let matchStatus: RecruitmentNotification['matchStatus'] = 'unmatched';
    let targetAppId: string | undefined = undefined;

    if (matchedApp) {
      matchStatus = 'matched';
      targetAppId = matchedApp.id;
      // Record immutable activity event
      await addEvent({
        application: matchedApp.id,
        eventType: extracted.eventType,
        eventAt: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        sourcePlatform: 'jobstreet',
        gmailMessageId: msgId,
        rawSubject: extracted.evidenceSnippet,
        evidenceSnippet: rawText.slice(0, 500),
      });
    } else if (gmailConnection.autoCreateApplication && extracted.confidence >= 80) {
      // Auto-create application from verified notification
      matchStatus = 'auto_created';
      try {
        const createdApp = (await addApplication({
          company: extracted.company,
          position: extracted.position,
          location: 'Jakarta (from JobStreet alert)',
          type: 'In-house',
          mode: 'Hybrid',
          salaryMin: 0,
          salaryMax: 0,
          salaryPeriod: 'monthly',
          status: 'Viewed',
          sentAt: new Date().toISOString().slice(0, 10),
          cvVersion: 'CV-Default',
          jobSource: 'JobStreet',
          applicationMethod: 'JobStreet Apply',
          autoCreated: true,
          needsReview: true,
          notes: `Auto-created from verified JobStreet notification: "${extracted.evidenceSnippet}"`,
        })) as Application;

        if (createdApp?.id) {
          targetAppId = createdApp.id;
          await addEvent({
            application: createdApp.id,
            eventType: extracted.eventType,
            eventAt: new Date().toISOString(),
            receivedAt: new Date().toISOString(),
            sourcePlatform: 'jobstreet',
            gmailMessageId: msgId,
            rawSubject: extracted.evidenceSnippet,
            evidenceSnippet: rawText.slice(0, 500),
          });
        }
      } catch (err) {
        console.error('Failed to auto-create application:', err);
        matchStatus = 'needs_review';
      }
    } else {
      matchStatus = 'unmatched';
    }

    const notifRecord: RecruitmentNotification = {
      id: `notif-${Date.now()}`,
      gmailMessageId: msgId,
      platform: 'jobstreet',
      extractedCompany: extracted.company,
      extractedPosition: extracted.position,
      extractedEventType: extracted.eventType,
      rawSubject: extracted.evidenceSnippet,
      evidenceSnippet: rawText.slice(0, 500),
      matchStatus,
      matchedApplication: targetAppId,
      confidence: extracted.confidence,
      created: new Date().toISOString(),
    };

    const nextList = [notifRecord, ...notifications];
    setNotifications(nextList);
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(nextList));

    if (!isOfflineMode() && pb.authStore.isValid) {
      try {
        const savedRecord = await pb.collection('recruitment_notifications').create<RecruitmentNotification>({
          ...notifRecord,
          owner: pb.authStore.model?.id,
        });
        setNotifications(prev => prev.map(n => (n.id === notifRecord.id ? savedRecord : n)));
      } catch (err) {
        console.error('Failed to save recruitment notification to PocketBase:', err);
      }
    }

    return { notifRecord, extracted, matchStatus };
  };

  const deleteNotification = async (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));

    if (!isOfflineMode() && pb.authStore.isValid && !id.startsWith('seed-') && !id.startsWith('notif-')) {
      try {
        await pb.collection('recruitment_notifications').delete(id);
      } catch (err) {
        console.error('Failed to delete notification:', err);
      }
    }
  };

  return {
    notifications,
    gmailConnection,
    loading,
    updateGmailSetting,
    processRawNotificationText,
    deleteNotification,
    reload: fetchAll,
  };
}
