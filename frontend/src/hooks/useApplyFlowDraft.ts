import { useState } from 'react';
import { pb } from '../lib/pocketbase';
import type { ApplyFlowDraft } from '../lib/pb-types';

export type ApplyFlowDraftInput = Omit<ApplyFlowDraft, 'id'|'owner'>;

export function useApplyFlowDraft() {
  const [draftId, setDraftId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const userId = pb.authStore.model?.id;

  const saveDraft = async (draft: ApplyFlowDraftInput) => {
    if (!userId) return;
    setSaving(true);
    setError('');
    try {
      const payload = { ...draft, owner: userId };
      const saved = draftId
        ? await pb.collection<ApplyFlowDraft>('applyflow_drafts').update(draftId, payload)
        : await pb.collection<ApplyFlowDraft>('applyflow_drafts').create(payload);
      setDraftId(saved.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save ApplyFlow draft');
      throw cause;
    } finally {
      setSaving(false);
    }
  };

  return { saveDraft, saving, error };
}
