import { useEffect, useState } from 'react';
import { seedInterviews } from '../lib/seed-data';
import { pb } from '../lib/pocketbase';
import type { Interview } from '../lib/pb-types';

export function useInterviews(){
  const [interviews,setInterviews]=useState<Interview[]>(pb.authStore.isValid?[]:seedInterviews); const [error,setError]=useState('');
  const userId=pb.authStore.model?.id;
  useEffect(()=>{if(!userId)return;pb.collection<Interview>('interviews').getFullList({sort:'scheduledAt'}).then(setInterviews).catch(cause=>{setInterviews([]);setError(cause instanceof Error?cause.message:'Could not load interviews');});},[userId]);
  return {interviews,error};
}
