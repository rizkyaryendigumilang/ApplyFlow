import PocketBase from 'pocketbase'; import { seedApplications, seedCVs, seedInterviews } from './seed-data';
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');
export const isOfflineMode = () => !pb.authStore.isValid;
export const offline = { applications: [...seedApplications], interviews:[...seedInterviews], cvs:[...seedCVs] };

const rememberKey = 'junction_remember';
const sessionKey = 'junction_session';
if (typeof window !== 'undefined' && window.localStorage.getItem(rememberKey) !== 'true' && window.sessionStorage.getItem(sessionKey) !== 'true') pb.authStore.clear();
export const setSessionPersistence = (remember: boolean) => { if (remember) { window.localStorage.setItem(rememberKey, 'true'); window.sessionStorage.removeItem(sessionKey); } else { window.localStorage.removeItem(rememberKey); window.sessionStorage.setItem(sessionKey, 'true'); } };
export const clearSession = () => { window.localStorage.removeItem(rememberKey); window.sessionStorage.removeItem(sessionKey); pb.authStore.clear(); };
