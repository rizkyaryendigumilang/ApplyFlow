import { useEffect, useState, type ReactNode } from 'react';
import { clearSession, pb } from '../lib/pocketbase';
import { AuthScreen } from './AuthScreen';

export function AuthGate({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(pb.authStore.isValid);
  const [preview, setPreview] = useState(false);

  useEffect(() => pb.authStore.onChange(() => setAuthenticated(pb.authStore.isValid), true), []);
  if (!authenticated && !preview) return <AuthScreen onPreview={() => setPreview(true)} />;
  return <div className="authenticated-shell">{authenticated && <button className="signout" onClick={clearSession}>Sign out</button>}{children}</div>;
}
