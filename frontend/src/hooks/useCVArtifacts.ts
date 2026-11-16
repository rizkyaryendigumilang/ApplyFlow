import { useEffect, useState } from 'react';
import { seedCVs } from '../lib/seed-data';
import { pb } from '../lib/pocketbase';
import type { CVArtifact } from '../lib/pb-types';

export function useCVArtifacts(){
  const [cvs,setCvs]=useState<CVArtifact[]>(pb.authStore.isValid?[]:seedCVs); const [error,setError]=useState('');
  const userId=pb.authStore.model?.id;
  useEffect(()=>{
    if(!userId){
      setCvs(seedCVs);
      setError('');
      return;
    }
    pb.collection<CVArtifact>('cv_artifacts').getFullList({sort:'version'})
      .then(records=>{
        setCvs(records);
        setError('');
      })
      .catch(cause=>{
        setCvs([]);
        setError(cause instanceof Error?cause.message:'Could not load CVs');
      });
  },[userId]);
  return {cvs,error};
}
