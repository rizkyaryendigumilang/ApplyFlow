import { useState, useMemo } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Award,
  Zap,
  Save,
  BookOpen,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import type { Interview, StarStory } from '../../lib/pb-types';

export interface StarCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview?: Interview | null;
  roleTitle?: string;
  companyName?: string;
  onSaveStories?: (stories: StarStory[]) => Promise<void>;
}

const COMMON_QUESTION_BANK = [
  {
    category: 'Behavioral' as const,
    question: 'Tell me about a time you handled a critical production incident or system outage under high pressure.',
    defaultSituation: 'During our Black Friday flash sale at Tokopedia, the payment checkout microservice experienced a sudden 500% spike in traffic, exhausting database connection pools and driving latency to 8.5 seconds.',
    defaultTask: 'As the on-call DevOps lead, I was tasked with restoring checkout availability within our 15-minute P1 SLA without corrupting inflight transactions.',
    defaultAction: 'I immediately triggered an automated circuit-breaker via Envoy to shed non-critical telemetry traffic, increased the Redis read-replica pool, and provisioned 3 additional read replicas using Terraform.',
    defaultResult: 'System latency dropped back to 180ms within 9 minutes, restoring 100% transaction processing and preventing an estimated $140,000 in abandoned checkout revenue.',
  },
  {
    category: 'Conflict' as const,
    question: 'Describe a situation where you had a strong disagreement with a Tech Lead or Product Manager on architectural decisions.',
    defaultSituation: 'Our team was pressured to deploy a monolithic release to meet an urgent Q3 product deadline without automated rollback capabilities.',
    defaultTask: 'I needed to balance the urgent business deadline with platform reliability and disaster recovery compliance.',
    defaultAction: 'Instead of outright refusing, I formulated a canary deployment compromise using feature flags, allowing 10% gradual user traffic rollout while validating telemetry.',
    defaultResult: 'The feature launched on the target date with zero customer downtime, and the canary caught two critical edge-case bugs before 100% rollout.',
  },
  {
    category: 'Technical' as const,
    question: 'Walk me through a project where you significantly optimized cloud infrastructure costs or performance.',
    defaultSituation: 'Our AWS monthly cloud expenditure had surged past $90,000/month due to unoptimized EC2 on-demand instances and idle dev environments.',
    defaultTask: 'I took ownership of a cloud FinOps initiative aiming to reduce monthly compute cost by at least 25% without impacting developer velocity.',
    defaultAction: 'I implemented Karpenter for dynamic spot-instance autoscaling on EKS, scheduled automated shutdown of non-prod clusters on nights/weekends, and converted static EBS volumes to gp3.',
    defaultResult: 'Slashed AWS spend by $28,000/month (31% cost reduction) and reinvested savings into enhanced multi-region disaster recovery.',
  },
  {
    category: 'Leadership' as const,
    question: 'Tell me about a time you mentored a junior engineer or drove technical adoption across the organization.',
    defaultSituation: 'Several squads struggled with inconsistent Docker builds and slow manual deployment handoffs.',
    defaultTask: 'I aimed to elevate team engineering standards and establish standardized CI/CD pipelines across 6 squad teams.',
    defaultAction: 'I hosted weekly pair-programming workshops, open-sourced a reusable GitHub Actions workflow template with automated security scanning, and documented architectural decision records (ADRs).',
    defaultResult: 'Deployment cycle time was reduced from 45 minutes to 7 minutes, and 12 junior engineers independently managed their squad release pipelines.',
  },
];

const ACTION_VERBS = [
  'architected', 'spearheaded', 'engineered', 'optimized', 'slashed',
  'automated', 'orchestrated', 'streamlined', 'pioneered', 'implemented',
  'resolved', 'mitigated', 'scaled', 'delivered', 'established'
];

export function StarCoachModal({
  isOpen,
  onClose,
  interview,
  roleTitle = 'Software Engineer',
  companyName = 'Company',
  onSaveStories,
}: StarCoachModalProps) {
  if (!isOpen) return null;

  const [stories, setStories] = useState<StarStory[]>(() => {
    if (interview?.starStories && interview.starStories.length > 0) {
      return interview.starStories;
    }
    return [
      {
        id: 'star-1',
        category: 'Behavioral',
        question: COMMON_QUESTION_BANK[0].question,
        situation: COMMON_QUESTION_BANK[0].defaultSituation,
        task: COMMON_QUESTION_BANK[0].defaultTask,
        action: COMMON_QUESTION_BANK[0].defaultAction,
        result: COMMON_QUESTION_BANK[0].defaultResult,
      },
    ];
  });

  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentStory = stories[activeStoryIndex] || stories[0];

  const updateCurrentStory = (patch: Partial<StarStory>) => {
    const updated = stories.map((s, idx) =>
      idx === activeStoryIndex ? { ...s, ...patch } : s
    );
    setStories(updated);
  };

  // Evaluation & Scoring Engine for STAR Story
  const audit = useMemo(() => {
    if (!currentStory) {
      return {
        score: 0,
        uniqueMetrics: [],
        verbsFound: [],
        tips: ['Belum ada cerita STAR yang dipilih.'],
      };
    }
    const textCombined = `${currentStory.situation || ''} ${currentStory.task || ''} ${currentStory.action || ''} ${currentStory.result || ''}`.toLowerCase();
    
    // Check numbers/metrics
    const numberRegex = /(\d+[\d,.]*|\d+%\s*|\$\d+|\b\d+\s*(req\/sec|ms|s|minutes|hours|days|x|bulan|juta|persen|%)\b)/gi;
    const metricsFound = textCombined.match(numberRegex) || [];
    const uniqueMetrics = Array.from(new Set(metricsFound.map(m => m.trim())));

    // Check action verbs
    const verbsFound = ACTION_VERBS.filter(verb => textCombined.includes(verb));

    // Length and depth
    const hasSituation = currentStory.situation.trim().length >= 40;
    const hasTask = currentStory.task.trim().length >= 30;
    const hasAction = currentStory.action.trim().length >= 50;
    const hasResult = currentStory.result.trim().length >= 40;

    let score = 30; // base score for completing basic fields
    if (hasSituation) score += 15;
    if (hasTask) score += 15;
    if (hasAction) score += 15;
    if (hasResult) score += 15;

    // Bonus for quantifiable metrics
    if (uniqueMetrics.length >= 2) score += 5;
    if (uniqueMetrics.length >= 4) score += 5;

    // Bonus for strong action verbs
    if (verbsFound.length >= 2) score += 5;
    if (verbsFound.length >= 4) score += 5;

    score = Math.min(100, score);

    const tips: string[] = [];
    if (!hasResult || currentStory.result.length < 50) {
      tips.push('Perkuat bagian Result: Sebutkan dampak bisnis nyata (uang yang dihemat, waktu yang dipangkas, % uptime).');
    }
    if (uniqueMetrics.length < 2) {
      tips.push('Tambahkan metrik kuantitatif (angka, %, durasi SLA, atau penghematan biaya) agar jawaban terdengar kredibel.');
    }
    if (verbsFound.length < 2) {
      tips.push('Gunakan action verbs berbobot tinggi seperti "Architected", "Spearheaded", "Optimized", atau "Automated".');
    }
    if (currentStory.action.length < 70) {
      tips.push('Fokus pada "Action" pribadi Anda: Apa langkah teknis spesifik yang Anda putuskan dan eksekusi sendiri?');
    }

    return {
      score,
      uniqueMetrics,
      verbsFound,
      tips,
    };
  }, [currentStory]);

  const handleAddNewStory = (preset?: typeof COMMON_QUESTION_BANK[0]) => {
    const newStory: StarStory = {
      id: `star-${Date.now()}`,
      category: preset?.category || 'Behavioral',
      question: preset?.question || 'Describe a challenging engineering task and how you overcame it.',
      situation: preset?.defaultSituation || '',
      task: preset?.defaultTask || '',
      action: preset?.defaultAction || '',
      result: preset?.defaultResult || '',
    };
    setStories([...stories, newStory]);
    setActiveStoryIndex(stories.length);
  };

  const handleDeleteStory = (indexToDelete: number) => {
    if (stories.length <= 1) return;
    const filtered = stories.filter((_, idx) => idx !== indexToDelete);
    setStories(filtered);
    setActiveStoryIndex(Math.max(0, indexToDelete - 1));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSaveStories) {
        await onSaveStories(stories);
      }
      setCopyFeedback('STAR Stories berhasil disimpan ke logistik interview!');
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      setCopyFeedback(`Gagal menyimpan: ${msg}`);
      setTimeout(() => setCopyFeedback(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyFormatted = async () => {
    const formatted = `[INTERVIEW STAR CHEAT-SHEET]
Position: ${roleTitle} @ ${companyName}
Question: ${currentStory.question}

[SITUATION]
${currentStory.situation}

[TASK]
${currentStory.task}

[ACTION]
${currentStory.action}

[RESULT]
${currentStory.result}

Score: ${audit.score}/100 | Key Metrics: ${audit.uniqueMetrics.join(', ') || 'None'}`;

    try {
      await navigator.clipboard.writeText(formatted);
      setCopyFeedback('STAR Cheat-Sheet berhasil disalin ke clipboard!');
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch {
      setCopyFeedback('Gagal menyalin otomatis.');
    }
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" style={{ zIndex: 1050 }}>
      <div
        className="modal"
        style={{
          maxWidth: '920px',
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          background: '#fcfcf9',
          border: '1px solid #dedfd8',
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #dedfd8',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  font: "10px 'DM Mono'",
                  textTransform: 'uppercase',
                  background: '#eef2e6',
                  color: '#4e622b',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  border: '1px solid #d4dec3',
                }}
              >
                P0 · INTERVIEW PREP LAB
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: audit.score >= 80 ? '#4e622b' : audit.score >= 60 ? '#8c6b1e' : '#b43d3d',
                  background: audit.score >= 80 ? '#edf2e3' : audit.score >= 60 ? '#fcf6e6' : '#faebeb',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Award size={13} /> STAR Score: {audit.score}/100
              </span>
            </div>
            <h2 style={{ fontSize: '18px', margin: '4px 0 0', fontWeight: 600 }}>
              STAR Method Answer Coach · {roleTitle} @ {companyName}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="secondary compact-btn"
              onClick={handleCopyFormatted}
              title="Copy formatted answer for quick rehearsal"
            >
              <Copy size={13} /> Copy Rehearsal Text
            </button>
            <button
              type="button"
              className="primary compact-btn"
              onClick={handleSave}
              disabled={isSaving}
              style={{ background: '#202320', color: '#f5f5f0' }}
            >
              <Save size={13} /> {isSaving ? 'Menyimpan...' : 'Simpan STAR Stories'}
            </button>
            <button
              type="button"
              className="close-btn"
              onClick={onClose}
              aria-label="Close modal"
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px' }}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {copyFeedback && (
          <div
            style={{
              background: '#eef2e6',
              color: '#36481b',
              padding: '8px 24px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: '1px solid #d4dec3',
            }}
          >
            <Check size={14} /> {copyFeedback}
          </div>
        )}

        {/* Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Left: Questions & Presets Navigation */}
          <aside
            style={{
              borderRight: '1px solid #dedfd8',
              background: '#f9f9f5',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#777c73' }}>
                Your Answer Stories ({stories.length})
              </span>
              <button
                type="button"
                onClick={() => handleAddNewStory()}
                style={{
                  fontSize: '11px',
                  background: '#eef2e6',
                  color: '#4e622b',
                  border: '1px solid #d4dec3',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                + New
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {stories.map((st, idx) => (
                <div
                  key={st.id}
                  onClick={() => setActiveStoryIndex(idx)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '4px',
                    border: idx === activeStoryIndex ? '1px solid #18181b' : '1px solid #dedfd8',
                    background: idx === activeStoryIndex ? '#fff' : '#f5f5f0',
                    cursor: 'pointer',
                    fontSize: '12px',
                    boxShadow: idx === activeStoryIndex ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        color: '#18181b',
                      }}
                    >
                      {st.category || 'Story'} #{idx + 1}
                    </span>
                    {stories.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStory(idx);
                        }}
                        style={{ border: 'none', background: 'none', color: '#a0a59b', cursor: 'pointer', fontSize: '13px' }}
                        title="Delete this story"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div style={{ fontWeight: 500, color: '#202320', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {st.question}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #dedfd8', paddingTop: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#777c73', display: 'block', marginBottom: '8px' }}>
                <BookOpen size={12} style={{ display: 'inline', marginRight: '4px' }} /> Question Bank Presets
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {COMMON_QUESTION_BANK.map((preset) => (
                  <button
                    key={preset.question}
                    type="button"
                    onClick={() => handleAddNewStory(preset)}
                    style={{
                      textAlign: 'left',
                      fontSize: '11px',
                      padding: '8px',
                      background: '#fff',
                      border: '1px solid #e2e4dc',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      color: '#444840',
                      lineHeight: 1.3,
                    }}
                  >
                    <b style={{ color: '#18181b', display: 'block' }}>[{preset.category}]</b>
                    {preset.question.slice(0, 65)}...
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right: Interactive STAR Builder & Live Coach */}
          <main style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Target Question */}
            <div>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#777c73', display: 'block', marginBottom: '4px' }}>
                Target Interview Question
              </label>
              <input
                type="text"
                value={currentStory.question}
                onChange={(e) => updateCurrentStory({ question: e.target.value })}
                placeholder="e.g. Tell me about a time you handled a difficult production bug under pressure"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #dedfd8',
                  background: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '3px',
                }}
              />
            </div>

            {/* STAR Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              {/* Situation */}
              <div style={{ background: '#fff', border: '1px solid #dedfd8', padding: '12px 14px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#202320', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ background: '#eef2e6', color: '#4e622b', padding: '1px 6px', borderRadius: '3px', font: "11px 'DM Mono'" }}>S</span>
                    SITUATION (Konteks & Masalah Nyata)
                  </label>
                  <small style={{ color: '#888d82' }}>Di mana & tantangan apa yang dihadapi?</small>
                </div>
                <textarea
                  rows={2}
                  value={currentStory.situation}
                  onChange={(e) => updateCurrentStory({ situation: e.target.value })}
                  placeholder="Konteks perusahaan, skala sistem, dan masalah kritis yang terjadi..."
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px', lineHeight: 1.4 }}
                />
              </div>

              {/* Task */}
              <div style={{ background: '#fff', border: '1px solid #dedfd8', padding: '12px 14px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#202320', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ background: '#eef2e6', color: '#4e622b', padding: '1px 6px', borderRadius: '3px', font: "11px 'DM Mono'" }}>T</span>
                    TASK (Tanggung Jawab & Target Eksplisit)
                  </label>
                  <small style={{ color: '#888d82' }}>Apa tujuan atau SLA yang harus Anda penuhi?</small>
                </div>
                <textarea
                  rows={2}
                  value={currentStory.task}
                  onChange={(e) => updateCurrentStory({ task: e.target.value })}
                  placeholder="Tanggung jawab spesifik Anda dalam menyelesaikan krisis/proyek tersebut..."
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px', lineHeight: 1.4 }}
                />
              </div>

              {/* Action */}
              <div style={{ background: '#fff', border: '1px solid #dedfd8', padding: '12px 14px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#202320', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ background: '#eef2e6', color: '#4e622b', padding: '1px 6px', borderRadius: '3px', font: "11px 'DM Mono'" }}>A</span>
                    ACTION (Langkah Kepemimpinan & Eksekusi Teknis)
                  </label>
                  <small style={{ color: '#888d82' }}>Fokus pada aksi ANDA (bukan tim secara umum)</small>
                </div>
                <textarea
                  rows={3}
                  value={currentStory.action}
                  onChange={(e) => updateCurrentStory({ action: e.target.value })}
                  placeholder="Langkah taktis yang Anda lakukan: tooling, koordinasi, mitigasi, debugging..."
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px', lineHeight: 1.4 }}
                />
              </div>

              {/* Result */}
              <div style={{ background: '#fff', border: '1px solid #dedfd8', padding: '12px 14px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#202320', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ background: '#eef2e6', color: '#4e622b', padding: '1px 6px', borderRadius: '3px', font: "11px 'DM Mono'" }}>R</span>
                    RESULT (Dampak Bisnis & Metrik Angka/%)
                  </label>
                  <small style={{ color: '#888d82' }}>Sertakan angka: latency, cost savings, MTTR, revenue</small>
                </div>
                <textarea
                  rows={2}
                  value={currentStory.result}
                  onChange={(e) => updateCurrentStory({ result: e.target.value })}
                  placeholder="Hasil nyata: 'Latency turun 40%', 'Menghemat $25k/bulan', 'Zero downtime'..."
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px', lineHeight: 1.4 }}
                />
              </div>
            </div>

            {/* Live Coach Feedback Box */}
            <div
              style={{
                background: '#f5f5f0',
                border: '1px solid #dedfd8',
                borderRadius: '4px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: '#202320' }}>
                  <Sparkles size={14} style={{ color: '#18181b' }} /> STAR Quality Auditor & Metrics Inspector
                </span>
                <span style={{ fontSize: '11px', color: '#777c73' }}>
                  Detected Numbers: <b>{audit.uniqueMetrics.length}</b> · Power Verbs: <b>{audit.verbsFound.length}</b>
                </span>
              </div>

              {/* Detected pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {audit.uniqueMetrics.map((m) => (
                  <span
                    key={m}
                    style={{
                      font: "10px 'DM Mono'",
                      background: '#edf2e3',
                      border: '1px solid #cfddbe',
                      color: '#455928',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    ✓ Metric: {m}
                  </span>
                ))}
                {audit.verbsFound.map((v) => (
                  <span
                    key={v}
                    style={{
                      font: "10px 'DM Mono'",
                      background: '#eef0fa',
                      border: '1px solid #cbd2f0',
                      color: '#2b3f78',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    ★ Action Verb: {v}
                  </span>
                ))}
              </div>

              {audit.tips.length > 0 && (
                <div style={{ marginTop: '4px', borderTop: '1px solid #e0e1d8', paddingTop: '8px' }}>
                  {audit.tips.map((tip, i) => (
                    <p key={i} style={{ fontSize: '11px', color: '#686d63', margin: '2px 0', lineHeight: 1.4 }}>
                      • {tip}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
