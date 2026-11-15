import { useEffect, useState } from 'react';
import type { Application, ApplicationDraft, Status } from '../lib/pb-types';
import { offline, pb } from '../lib/pocketbase';

const clean = (value:string) => value.trim().slice(0, 160);
const OFFLINE_STORAGE_KEY = 'career_crm_mock_applications';

function getInitialOfflineApplications(): Application[] {
  try {
    const saved = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return [...offline.applications];
}

export function useApplications(){
  const [applications,setApplications]=useState<Application[]>(() => {
    return pb.authStore.isValid ? [] : getInitialOfflineApplications();
  });
  const [loading,setLoading]=useState(pb.authStore.isValid);
  const [error,setError]=useState('');
  const userId=pb.authStore.model?.id;

  useEffect(()=>{
    if(!userId){
      const cached = getInitialOfflineApplications();
      setApplications(cached);
      setLoading(false);
      setError('');
      return;
    }
    let cancelled=false; setLoading(true); setError('');
    const collection = pb.collection<Application>('applications');
    const loadPages = async () => {
      const pageSize = 200;
      const first = await collection.getList(1, pageSize, {sort:'-created'});
      if (first.totalPages === 1) return first.items;
      const rest = await Promise.all(Array.from({length:first.totalPages - 1}, (_, index) => collection.getList(index + 2, pageSize, {sort:'-created'})));
      return [ ...first.items, ...rest.flatMap(page => page.items) ];
    };
    loadPages()
      .then(records=>{if(!cancelled)setApplications(records);})
      .catch(cause=>{if(!cancelled){setApplications([]);setError(cause instanceof Error?cause.message:'Could not load applications');}})
      .finally(()=>{if(!cancelled)setLoading(false);});
    return ()=>{cancelled=true;};
  },[userId]);

  const updateStatus=async(id:string,status:Status)=>{
    const previous=applications.find(application=>application.id===id)?.status;
    const nextList = applications.map(x=>x.id===id?{...x,status}:x);
    setApplications(nextList);
    if(!userId){
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(nextList));
      return;
    }
    try { const updated=await pb.collection<Application>('applications').update(id,{status}); setApplications(xs=>xs.map(x=>x.id===id?updated:x)); }
    catch(cause){ setApplications(xs=>xs.map(x=>x.id===id&&previous?{...x,status:previous}:x)); throw cause; }
  };

  const update = async (id: string, patch: Partial<Application>) => {
    const previous = applications.find((a) => a.id === id);
    const nextList = applications.map((x) => (x.id === id ? { ...x, ...patch } : x));
    setApplications(nextList);
    if (!userId) {
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(nextList));
      return (nextList.find((x) => x.id === id) || { ...patch, id }) as Application;
    }
    try {
      const updated = await pb.collection<Application>('applications').update(id, patch);
      setApplications((xs) => xs.map((x) => (x.id === id ? updated : x)));
      return updated;
    } catch (cause) {
      if (previous) {
        setApplications((xs) => xs.map((x) => (x.id === id ? previous : x)));
      }
      throw cause;
    }
  };

  const add=async(a:ApplicationDraft):Promise<Application>=>{
    const company=clean(a.company); const position=clean(a.position); if(!company||!position)throw new Error('Company and position are required');
    const draft={...a,company,position,owner:userId};
    if(!userId){
      const local:Application={...draft,id:crypto.randomUUID().replace(/-/g,'').slice(0,15)};
      const nextList = [local,...applications];
      setApplications(nextList);
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(nextList));
      return local;
    }
    const created=await pb.collection<Application>('applications').create(draft);
    setApplications(xs=>[created,...xs]);
    return created;
  };

  return {applications,loading,error,updateStatus,update,add};
}
