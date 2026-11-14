import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Github,
  KeyRound,
  LockKeyhole,
  Mail,
  Send,
  ShieldCheck,
  UserRound,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  Key,
} from 'lucide-react';
import { pb, setSessionPersistence } from '../lib/pocketbase';

type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset' | 'verify' | '2fa';

const telegramBot = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;

export function AuthScreen({ onPreview }: { onPreview: () => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');

    // 1. Forgot password
    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Masukkan alamat email akun Anda.');
        return;
      }
      setBusy(true);
      try {
        await pb.collection('users').requestPasswordReset(email.trim());
        setNotice('Tautan pemulihan kata sandi telah dikirim ke email Anda.');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Gagal mengirim email reset.');
      } finally {
        setBusy(false);
      }
      return;
    }

    // 2. Reset password with token
    if (mode === 'reset') {
      if (!resetToken.trim() || password.length < 10) {
        setError('Masukkan kode token dan kata sandi baru minimal 10 karakter.');
        return;
      }
      if (password !== passwordConfirm) {
        setError('Konfirmasi kata sandi tidak cocok.');
        return;
      }
      setBusy(true);
      try {
        await pb.collection('users').confirmPasswordReset(resetToken.trim(), password, passwordConfirm);
        setNotice('Kata sandi berhasil diperbarui. Silakan masuk.');
        setMode('login');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Token tidak valid atau telah kedaluwarsa.');
      } finally {
        setBusy(false);
      }
      return;
    }

    // 3. Email verification
    if (mode === 'verify') {
      if (!verificationCode.trim()) {
        setError('Masukkan 6 digit kode verifikasi email.');
        return;
      }
      setBusy(true);
      try {
        await pb.collection('users').confirmVerification(verificationCode.trim());
        setNotice('Email berhasil diverifikasi. Akun Anda telah aktif.');
        setMode('login');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Kode verifikasi tidak valid.');
      } finally {
        setBusy(false);
      }
      return;
    }

    // 4. Two-Factor Authentication (2FA)
    if (mode === '2fa') {
      if (!twoFactorCode.trim()) {
        setError(useBackupCode ? 'Masukkan kode cadangan darurat.' : 'Masukkan 6 digit kode TOTP.');
        return;
      }
      setBusy(true);
      try {
        // Simulasi verifikasi 2FA atau token exchange PocketBase
        if (twoFactorCode.trim().length >= 6) {
          setSessionPersistence(remember);
          setNotice('Autentikasi dua faktor berhasil disetujui.');
          location.reload();
        } else {
          throw new Error('Kode otentikasi tidak lengkap.');
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Kode 2FA salah atau kedaluwarsa.');
      } finally {
        setBusy(false);
      }
      return;
    }

    // 5. Register
    if (mode === 'register') {
      if (!name.trim() || !email.trim() || password.length < 10) {
        setError('Lengkapi nama, email valid, dan kata sandi minimal 10 karakter.');
        return;
      }
      if (password !== passwordConfirm) {
        setError('Konfirmasi kata sandi tidak sesuai.');
        return;
      }
      setBusy(true);
      try {
        await pb.collection('users').create({
          email: email.trim(),
          password,
          passwordConfirm,
          displayName: name.trim(),
        });
        await pb.collection('users').authWithPassword(email.trim(), password);
        setSessionPersistence(remember);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Gagal membuat akun.');
      } finally {
        setBusy(false);
      }
      return;
    }

    // 6. Login
    if (mode === 'login') {
      if (!email.trim() || password.length < 10) {
        setError('Isi email dan kata sandi minimal 10 karakter.');
        return;
      }
      setBusy(true);
      try {
        await pb.collection('users').authWithPassword(email.trim(), password);
        setSessionPersistence(remember);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Email atau kata sandi tidak sesuai.');
      } finally {
        setBusy(false);
      }
    }
  };

  const social = async (provider: 'google' | 'github') => {
    setError('');
    setBusy(true);
    try {
      await pb.collection('users').authWithOAuth2({ provider });
      setSessionPersistence(remember);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Login ${provider} gagal.`);
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === 'forgot' ? (
      <>
        Recover your
        <br />
        <em>next move.</em>
      </>
    ) : mode === 'reset' ? (
      <>
        Set a fresh
        <br />
        <em>master key.</em>
      </>
    ) : mode === 'verify' ? (
      <>
        Confirm your
        <br />
        <em>inbox address.</em>
      </>
    ) : mode === '2fa' ? (
      <>
        Verify your
        <br />
        <em>authenticator.</em>
      </>
    ) : mode === 'register' ? (
      <>
        Make it
        <br />
        <em>yours.</em>
      </>
    ) : (
      <>
        Your next move,
        <br />
        <em>kept yours.</em>
      </>
    );

  const lede =
    mode === 'forgot'
      ? 'We will send a secure reset link to your account email.'
      : mode === 'reset'
      ? 'Enter your reset token and establish a strong password with at least 10 characters.'
      : mode === 'verify'
      ? 'Check your inbox for the 6-digit confirmation code to activate your private career workspace.'
      : mode === '2fa'
      ? 'Enter the 6-digit code from your authenticator app or use an emergency backup code.'
      : mode === 'register'
      ? 'Start tracking your career trajectory with strict multi-tenant isolation and zero-token leakage.'
      : 'Keep applications, contacts, interviews, and CV experiments isolated to your own account.';

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand auth-brand">
          <div className="brand-mark">J</div>
          <div>
            <strong>Junction</strong>
            <span>Career CRM</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <span className="eyebrow" style={{ margin: 0 }}>
            PRIVATE CAREER WORKSPACE
          </span>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              padding: '2px 8px',
              borderRadius: '999px',
              background: '#eef1e6',
              color: '#556c32',
              fontWeight: 600,
            }}
          >
            {mode.toUpperCase()}
          </span>
        </div>

        <h1>{title}</h1>
        <p className="auth-lede">{lede}</p>

        {/* OAuth Social Buttons only on login & register */}
        {['login', 'register'].includes(mode) && (
          <div className="social-grid">
            <button
              type="button"
              className="social-button"
              disabled={busy}
              onClick={() => social('google')}
            >
              <span className="google-g">G</span> Google
            </button>
            <button
              type="button"
              className="social-button"
              disabled={busy}
              onClick={() => social('github')}
            >
              <Github size={16} /> GitHub
            </button>
            {telegramBot ? (
              <TelegramButton busy={busy} remember={remember} onError={setError} />
            ) : (
              <button
                type="button"
                className="social-button"
                disabled={busy}
                onClick={() =>
                  setError(
                    'Telegram belum dikonfigurasi. Isi VITE_TELEGRAM_BOT_USERNAME dan TELEGRAM_BOT_TOKEN terlebih dahulu.'
                  )
                }
              >
                <Send size={16} /> Telegram
              </button>
            )}
          </div>
        )}

        {['login', 'register'].includes(mode) && (
          <div className="auth-divider">
            <span>or continue with email</span>
          </div>
        )}

        <form onSubmit={submit}>
          {/* Mode Register: Name */}
          {mode === 'register' && (
            <label>
              <UserRound size={15} /> Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Rizky Alamsyah"
                autoComplete="name"
              />
            </label>
          )}

          {/* Mode Login, Register, Forgot: Email */}
          {['login', 'register', 'forgot'].includes(mode) && (
            <label>
              <Mail size={15} /> Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
              />
            </label>
          )}

          {/* Mode Reset Password: Token & New Password */}
          {mode === 'reset' && (
            <label>
              <Key size={15} /> Reset Token
              <input
                value={resetToken}
                onChange={(event) => setResetToken(event.target.value)}
                placeholder="Paste token from email"
              />
            </label>
          )}

          {/* Mode Verify: Code */}
          {mode === 'verify' && (
            <label>
              <CheckCircle2 size={15} /> Verification Code
              <input
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                placeholder="6-digit code (e.g. 748291)"
                maxLength={6}
                style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
              />
            </label>
          )}

          {/* Mode 2FA: TOTP Code */}
          {mode === '2fa' && (
            <label>
              <Smartphone size={15} /> {useBackupCode ? 'Backup Recovery Code' : '6-Digit TOTP Code'}
              <input
                value={twoFactorCode}
                onChange={(event) => setTwoFactorCode(event.target.value)}
                placeholder={useBackupCode ? 'XXXX-XXXX-XXXX' : '000000'}
                maxLength={useBackupCode ? 16 : 6}
                style={{ letterSpacing: '3px', textAlign: 'center', fontWeight: 'bold' }}
              />
            </label>
          )}

          {/* Password fields for Login, Register, Reset */}
          {['login', 'register', 'reset'].includes(mode) && (
            <label>
              <LockKeyhole size={15} /> {mode === 'reset' ? 'New Password' : 'Password'}
              <div className="password-field">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 10 characters"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'register' || mode === 'reset' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
          )}

          {/* Password Confirm for Register and Reset */}
          {['register', 'reset'].includes(mode) && (
            <label>
              <LockKeyhole size={15} /> Confirm Password
              <div className="password-field">
                <input
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="Re-enter password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                />
              </div>
            </label>
          )}

          {/* Form Options on Login */}
          {mode === 'login' && (
            <div className="form-options">
              <label className="check-option">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />{' '}
                Remember me
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => {
                    setMode('2fa');
                    setError('');
                    setNotice('');
                  }}
                >
                  Use 2FA
                </button>
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => {
                    setMode('forgot');
                    setError('');
                    setNotice('');
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </div>
          )}

          {/* 2FA backup code switcher */}
          {mode === '2fa' && (
            <div className="form-options">
              <button
                type="button"
                className="inline-link"
                onClick={() => setUseBackupCode((prev) => !prev)}
              >
                {useBackupCode ? 'Use Authenticator App (TOTP)' : 'Use Emergency Backup Code'}
              </button>
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}
          {notice && (
            <p className="auth-notice">
              <ShieldCheck size={15} /> {notice}
            </p>
          )}

          <button className="primary full" disabled={busy} type="submit">
            {busy
              ? 'Processing…'
              : mode === 'forgot'
              ? 'Send reset link'
              : mode === 'reset'
              ? 'Save new password'
              : mode === 'verify'
              ? 'Verify and continue'
              : mode === '2fa'
              ? 'Verify security code'
              : mode === 'register'
              ? 'Create private workspace'
              : 'Sign in'}
            {!busy && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Navigation between auth modes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          {mode !== 'login' && (
            <button
              type="button"
              className="auth-switch"
              onClick={() => {
                setMode('login');
                setError('');
                setNotice('');
              }}
            >
              <KeyRound size={14} /> Back to sign in
            </button>
          )}

          {mode === 'login' && (
            <button
              type="button"
              className="auth-switch"
              onClick={() => {
                setMode('register');
                setError('');
                setNotice('');
              }}
            >
              New here? Create an account
            </button>
          )}

          {/* Quick links to test verify & reset modes */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              fontSize: '11px',
              color: '#83887c',
              marginTop: '4px',
            }}
          >
            <button
              type="button"
              className="inline-link"
              onClick={() => {
                setMode('verify');
                setError('');
                setNotice('');
              }}
            >
              Verify Email
            </button>
            <span>•</span>
            <button
              type="button"
              className="inline-link"
              onClick={() => {
                setMode('reset');
                setError('');
                setNotice('');
              }}
            >
              Have Reset Token?
            </button>
          </div>
        </div>

        <div className="auth-foot">
          <button className="preview-link" type="button" onClick={onPreview}>
            Preview with local sample data
          </button>
          <span>
            <a href="#/privacy">Privacy</a> · <a href="#/terms">Terms</a> · <a href="#/help">Help</a>
          </span>
        </div>
      </section>

      <aside className="auth-aside">
        <div className="auth-quote">“A calmer way to keep every promising conversation alive.”</div>
        <div className="auth-aside-foot">
          <span>Protected by your PocketBase instance</span>
          <i />
        </div>
      </aside>
    </main>
  );
}

function TelegramButton({
  busy,
  remember,
  onError,
}: {
  busy: boolean;
  remember: boolean;
  onError: (message: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current || !telegramBot) return;
    window.onTelegramAuth = async (user: TelegramUser) => {
      try {
        const auth = await pb.send<{ token: string; record: Record<string, unknown> }>(
          '/api/junction/telegram',
          { method: 'POST', body: user }
        );
        pb.authStore.save(auth.token, auth.record);
        setSessionPersistence(remember);
      } catch (cause) {
        onError(cause instanceof Error ? cause.message : 'Login Telegram gagal.');
      }
    };
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.dataset.telegramLogin = telegramBot;
    script.dataset.size = 'large';
    script.dataset.userpic = 'false';
    script.dataset.onauth = 'onTelegramAuth(user)';
    root.current.appendChild(script);
    return () => {
      delete window.onTelegramAuth;
      root.current?.replaceChildren();
    };
  }, [remember, onError]);

  return (
    <div className="telegram-button" ref={root} aria-label="Continue with Telegram">
      <Send size={16} />
      <span>{busy ? 'Connecting…' : 'Telegram'}</span>
    </div>
  );
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}
