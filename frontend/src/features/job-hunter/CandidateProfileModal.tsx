import { useState } from 'react';
import { X, Target, Save } from 'lucide-react';
import type { CandidateProfile } from '../../lib/pb-types';
import { idr } from '../../lib/utils';

interface CandidateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CandidateProfile;
  onSave: (updated: Partial<CandidateProfile>) => Promise<unknown>;
}

export function CandidateProfileModal({
  isOpen,
  onClose,
  profile,
  onSave,
}: CandidateProfileModalProps) {
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [headline, setHeadline] = useState(profile.headline || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [location, setLocation] = useState(profile.location || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl || '');
  const [githubUrl, setGithubUrl] = useState(profile.githubUrl || '');
  const [targetRoles, setTargetRoles] = useState(profile.targetRoles.join(', '));
  const [skills, setSkills] = useState(profile.skills.join(', '));
  const [certifications, setCertifications] = useState(
    Array.isArray(profile.certifications)
      ? profile.certifications.join(', ')
      : typeof profile.certifications === 'string'
      ? profile.certifications
      : ''
  );
  const [languages, setLanguages] = useState(
    Array.isArray(profile.languages)
      ? profile.languages.join(', ')
      : typeof profile.languages === 'string'
      ? profile.languages
      : ''
  );
  const [minSalary, setMinSalary] = useState<number>(
    profile.minSalary || 15000000
  );
  const [preferredModes, setPreferredModes] = useState<string[]>(profile.preferredModes);
  const [dealbreakers, setDealbreakers] = useState(profile.dealbreakers.join('\n'));
  const [experienceSummary, setExperienceSummary] = useState(profile.experienceSummary || '');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleToggleMode = (mode: string) => {
    if (preferredModes.includes(mode)) {
      setPreferredModes(preferredModes.filter((m) => m !== mode));
    } else {
      setPreferredModes([...preferredModes, mode]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        fullName,
        headline,
        phone,
        location,
        linkedinUrl,
        githubUrl,
        targetRoles: targetRoles
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        skills: skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        certifications: certifications
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        languages: languages
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        minSalary: Number(minSalary) || 0,
        preferredModes,
        dealbreakers: dealbreakers
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        experienceSummary,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Target Candidate Profile">
      <div className="modal" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="drawer-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} style={{ color: '#18181b' }} />
            <span className="eyebrow" style={{ margin: 0 }}>CANDIDATE TARGET PROFILE</span>
          </div>
          <button onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <h2 style={{ fontSize: '22px', margin: '14px 0 4px' }}>Target criteria & dealbreakers</h2>
        <p className="muted" style={{ margin: '0 0 20px', lineHeight: 1.5 }}>
          Job Hunter AI uses this profile for deterministic two-tier triage: hard dealbreaker elimination followed by weighted skill gap matching.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
                Full Name (Header ATS Resume)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rizky Alamsyah"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
                Phone Number (WhatsApp)
              </label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 812-3456-7890"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '13px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
              Headline / Professional Focus
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Senior DevOps / Platform Engineer (Kubernetes, AWS)"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
                Target Roles (comma-separated)
              </label>
              <input
                type="text"
                value={targetRoles}
                onChange={(e) => setTargetRoles(e.target.value)}
                placeholder="DevOps Engineer, SRE, Platform"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '13px' }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
                Gaji Pokok Minimum Bulanan (IDR)
              </label>
              <div style={{ position: 'relative', marginTop: '4px' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: '#71717a', fontFamily: 'monospace', pointerEvents: 'none' }}>
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9.]*"
                  value={minSalary > 0 ? minSalary.toLocaleString('id-ID') : ''}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                    setMinSalary(digits === '' ? 0 : parseInt(digits, 10));
                  }}
                  placeholder="15.000.000"
                  style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '13px', fontFamily: 'monospace', borderRadius: '6px' }}
                />
              </div>
              <small style={{ fontSize: '11px', color: '#71717a', marginTop: '4px', display: 'block', fontFamily: 'monospace' }}>
                Format: {idr(minSalary)} / bulan
              </small>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
              Core Technical Skills (comma-separated)
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Kubernetes, Docker, Terraform, AWS, Go, CI/CD"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '13px' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
                Certifications (comma-separated)
              </label>
              <input
                type="text"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                placeholder="AWS Certified Solutions Architect, CKA, Terraform"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
                Languages (comma-separated)
              </label>
              <input
                type="text"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="Indonesian (Native), English (Professional)"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
                Location / City
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Jakarta, Indonesia"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
                GitHub Profile URL
              </label>
              <input
                type="url"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '13px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
              Work Mode Preferences
            </label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
              {['Remote', 'Hybrid', 'On-site'].map((mode) => (
                <label key={mode} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', textTransform: 'none' }}>
                  <input
                    type="checkbox"
                    checked={preferredModes.includes(mode)}
                    onChange={() => handleToggleMode(mode)}
                    style={{ accentColor: '#18181b' }}
                  />
                  <span>{mode}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
              Strict Dealbreakers (one per line)
            </label>
            <textarea
              rows={3}
              value={dealbreakers}
              onChange={(e) => setDealbreakers(e.target.value)}
              placeholder="Full on-site outside Jabodetabek&#10;Unpaid overtime / standby tanpa lembur&#10;Penalti kontrak & ijazah ditahan"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a' }}>
              Brief Experience Summary
            </label>
            <textarea
              rows={3}
              value={experienceSummary}
              onChange={(e) => setExperienceSummary(e.target.value)}
              placeholder="Ringkasan pengalaman teknis, migrasi cloud, atau sistem high-availability..."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4e4e7', background: '#fff', fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #dedfd8' }}>
            <button type="button" className="secondary compact-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary compact-btn" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
