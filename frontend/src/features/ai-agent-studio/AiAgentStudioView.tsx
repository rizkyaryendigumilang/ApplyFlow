import { useState } from 'react';
import {
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Send,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  ShieldAlert,
  HelpCircle,
  ChevronRight,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import type { Application, ApplicationDraft, CandidateProfile, CVArtifact } from '../../lib/pb-types';
import { useCandidateProfile } from '../../hooks/useCandidateProfile';
import { useCVArtifacts } from '../../hooks/useCVArtifacts';
import {
  rankJobBatch,
  runDrafterAgent,
  runReviewerAgent,
  generateStarInterviewPrep,
  type RawJobInput,
  type RankedJobLead,
  type DrafterOutput,
  type ReviewerCritique,
  type StarQuestionPrep,
} from '../../lib/ai-agent-studio';

interface AiAgentStudioViewProps {
  onPromoteApplication: (draft: ApplicationDraft) => Promise<Application | unknown>;
  onNavigateToPipeline: () => void;
}

const SAMPLE_BATCH_INPUT: RawJobInput[] = [];

export function AiAgentStudioView({ onPromoteApplication, onNavigateToPipeline }: AiAgentStudioViewProps) {
  const { profile } = useCandidateProfile();
  const { cvs } = useCVArtifacts();

  // Workflow State: Step 1 (Ingest) -> Step 2 (Rank) -> Step 3 (Drafter/Reviewer) -> Step 4 (STAR Prep)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Data States
  const [rawJobs, setRawJobs] = useState<RawJobInput[]>(SAMPLE_BATCH_INPUT);
  const [bulkTextInput, setBulkTextInput] = useState('');
  const [rankedResults, setRankedResults] = useState<RankedJobLead[]>([]);
  const [selectedJob, setSelectedJob] = useState<RankedJobLead | null>(null);

  // Drafter & Reviewer States
  const [drafterResult, setDrafterResult] = useState<DrafterOutput | null>(null);
  const [reviewerResult, setReviewerResult] = useState<ReviewerCritique | null>(null);
  const [activeLetter, setActiveLetter] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [promoteStatus, setPromoteStatus] = useState<string | null>(null);

  // Interview STAR States
  const [starQuestions, setStarQuestions] = useState<StarQuestionPrep[]>([]);
  const [expandedQuestion, setExpandedQuestion] = useState<string>('q-1');

  // Step 1: Run Batch Ranker
  const handleRunBatchRank = () => {
    let jobsToRank = [...rawJobs];
    if (bulkTextInput.trim()) {
      // Split by separator '---' if user provided multiple
      const sections = bulkTextInput.split(/---|\n{3,}/).filter(s => s.trim().length > 20);
      if (sections.length > 0) {
        jobsToRank = sections.map((sec, i) => ({
          id: `custom-${i}`,
          title: sec.split('\n')[0].replace(/^#+|\*+/g, '').trim() || `Lowongan ${i + 1}`,
          company: 'Perusahaan Terverifikasi',
          workMode: /remote/i.test(sec) ? 'Remote' : /hybrid/i.test(sec) ? 'Hybrid' : 'On-site',
          rawJd: sec.trim(),
        }));
      }
    }

    const results = rankJobBatch(jobsToRank, profile);
    setRankedResults(results);
    setSelectedJob(results[0] || null);
    setActiveStep(2);
  };

  // Step 2 -> Step 3: Trigger Two-Agent Drafter & Reviewer Loop
  const handleSelectJobForApplication = (lead: RankedJobLead) => {
    setSelectedJob(lead);
    const drafter = runDrafterAgent(lead.input, lead, profile, cvs);
    const reviewer = runReviewerAgent(lead.input, drafter, lead);

    setDrafterResult(drafter);
    setReviewerResult(reviewer);
    setActiveLetter(reviewer.refinedLetter);
    setActiveStep(3);
  };

  // Step 3 -> Step 4: Advance to STAR Interview Prep
  const handleAdvanceToInterviewPrep = () => {
    if (!selectedJob) return;
    const questions = generateStarInterviewPrep(selectedJob.input, selectedJob, profile);
    setStarQuestions(questions);
    setActiveStep(4);
  };

  // Promote to Pipeline action
  const handlePromoteToPipeline = async () => {
    if (!selectedJob) return;
    setPromoteStatus('Menyimpan ke CRM Pipeline...');
    try {
      await onPromoteApplication({
        company: selectedJob.input.company,
        position: selectedJob.input.title,
        location: 'Jakarta / Remote',
        type: 'In-house',
        mode: selectedJob.input.workMode,
        salaryMin: 0,
        salaryMax: 0,
        salaryPeriod: 'monthly',
        status: 'Applied',
        sentAt: new Date().toISOString().slice(0, 10),
        cvVersion: drafterResult?.recommendedCvLabel || 'CV-General-v1',
        jobSource: 'Other',
        applicationMethod: 'Portal / ATS',
        notes: `Dibuat melalui AI Agent Studio (Fit Score: ${selectedJob.matchScore}%).\n\nReviewer Audit ATS: ${reviewerResult?.atsKeywordScore}%.`,
      });
      setPromoteStatus('Berhasil ditambahkan ke Opportunity Pipeline (Status: Applied)!');
    } catch {
      setPromoteStatus('Gagal menyimpan ke pipeline.');
    }
  };

  return (
    <div className="ai-studio-page">
      {/* Top Banner Header */}
      <div className="settings-header">
        <div>
          <span className="eyebrow">AUTONOMOUS JOB SEARCH PIPELINE (ai-job-search)</span>
          <h1>AI Agent Studio</h1>
          <p className="lede">
            Sistem otomasi 4-tahap: Batch Ranker (/rank), Two-Agent Drafter-Reviewer Studio (/apply), dan Simulasi Wawancara STAR (/interview).
          </p>
        </div>

        <div className="settings-autosave-pill">
          <span className="pill-saved">
            <CheckCircle2 size={12} /> Master Profile Active
          </span>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="studio-stepper">
        <button
          className={`step-btn ${activeStep === 1 ? 'active' : activeStep > 1 ? 'completed' : ''}`}
          onClick={() => setActiveStep(1)}
        >
          <span className="step-num">1</span>
          <div>
            <b>Batch Ingestion</b>
            <small>Input Lowongan Massal</small>
          </div>
        </button>

        <ChevronRight size={16} className="step-sep" />

        <button
          className={`step-btn ${activeStep === 2 ? 'active' : activeStep > 2 ? 'completed' : ''}`}
          onClick={() => rankedResults.length > 0 && setActiveStep(2)}
          disabled={rankedResults.length === 0}
        >
          <span className="step-num">2</span>
          <div>
            <b>Fit Ranking (/rank)</b>
            <small>Peringkat Skor Kesesuaian</small>
          </div>
        </button>

        <ChevronRight size={16} className="step-sep" />

        <button
          className={`step-btn ${activeStep === 3 ? 'active' : activeStep > 3 ? 'completed' : ''}`}
          onClick={() => drafterResult !== null && setActiveStep(3)}
          disabled={!drafterResult}
        >
          <span className="step-num">3</span>
          <div>
            <b>Drafter & Reviewer (/apply)</b>
            <small>Two-Agent ATS Loop</small>
          </div>
        </button>

        <ChevronRight size={16} className="step-sep" />

        <button
          className={`step-btn ${activeStep === 4 ? 'active' : ''}`}
          onClick={() => starQuestions.length > 0 && setActiveStep(4)}
          disabled={starQuestions.length === 0}
        >
          <span className="step-num">4</span>
          <div>
            <b>STAR Interview Prep (/interview)</b>
            <small>Simulasi Tanya-Jawab Teknis</small>
          </div>
        </button>
      </div>

      {/* STEP 1: Batch Discovery & Ingestion */}
      {activeStep === 1 && (
        <div className="studio-content-panel">
          <div className="studio-card">
            <div className="card-top-icon">
              <Layers size={18} />
              <div>
                <h3>1. Ingestion Lowongan Kerja (Batch Input)</h3>
                <p className="setting-desc">
                  Masukkan beberapa deskripsi lowongan sekaligus (pisahkan dengan pemisah <code>---</code>) atau gunakan sampel lowongan yang sudah tersedia.
                </p>
              </div>
            </div>

            <textarea
              rows={10}
              value={bulkTextInput}
              onChange={e => setBulkTextInput(e.target.value)}
              placeholder={`# Posisi: Senior Cloud Engineer\nPerusahaan: PT Fintek Nusantara\nPersyaratan: Kubernetes, AWS, Terraform, Go, CI/CD...\n\n---\n\n# Posisi: DevOps Lead\nPerusahaan: Bank Solusi Digital\nPersyaratan: Docker, Linux, PostgreSQL, Prometheus...`}
              className="studio-textarea"
            />

            <div className="studio-action-bar">
              <button
                type="button"
                className="secondary compact-btn"
                onClick={() => setBulkTextInput(rawJobs.map(j => `# ${j.title} @ ${j.company}\n${j.rawJd}`).join('\n\n---\n\n'))}
              >
                Muat 3 Sampel Lowongan IT
              </button>

              <button
                type="button"
                className="primary compact-btn"
                onClick={handleRunBatchRank}
              >
                Jalankan Batch Fit Ranking (/rank) <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Batch Fit Ranking (/rank) */}
      {activeStep === 2 && (
        <div className="studio-content-panel">
          <div className="panel-title">
            <h2>2. Peringkat Kelayakan Lowongan (/rank)</h2>
            <p>Dievaluasi berdasarkan kecocokan tech stack, ekuivalensi keahlian, dan eliminasi dealbreaker.</p>
          </div>

          <div className="ranked-cards-grid">
            {rankedResults.map((lead, idx) => {
              const isSelected = selectedJob?.input.id === lead.input.id;
              return (
                <div
                  key={lead.input.id}
                  className={`ranked-lead-card ${lead.tier} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedJob(lead)}
                >
                  <div className="ranked-card-head">
                    <span className="rank-position-badge">#{idx + 1}</span>
                    <div>
                      <h4>{lead.input.title}</h4>
                      <p className="ranked-company">{lead.input.company} · {lead.input.workMode}</p>
                    </div>

                    <div className="fit-score-box">
                      <strong>{lead.matchScore}%</strong>
                      <small>FIT SCORE</small>
                    </div>
                  </div>

                  {lead.dealbreakers.length > 0 ? (
                    <div className="dealbreaker-warning-box">
                      <ShieldAlert size={14} />
                      <span>Dealbreaker: {lead.dealbreakers.join(', ')}</span>
                    </div>
                  ) : (
                    <div className="skills-matched-box">
                      <div className="pill-row">
                        {lead.matchedSkills.slice(0, 4).map(s => (
                          <span key={s} className="skill-pill match">✓ {s}</span>
                        ))}
                        {lead.equivalentSkills.slice(0, 2).map((eq, i) => (
                          <span key={i} className="skill-pill equiv" title={`Kandidat menguasai ${eq.candidateHas}`}>
                            ≈ {eq.requested}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="lead-summary-note">{lead.summary}</p>

                  <div className="card-actions-row">
                    <button
                      className="primary compact-btn"
                      disabled={lead.tier === 'tier_3_dealbreaker'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectJobForApplication(lead);
                      }}
                    >
                      Buka Drafter-Reviewer Studio (/apply) <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: Drafter & Reviewer Studio (/apply) */}
      {activeStep === 3 && selectedJob && drafterResult && reviewerResult && (
        <div className="studio-content-panel">
          <div className="panel-title">
            <h2>3. Two-Agent Drafter & Reviewer Studio (/apply)</h2>
            <p>
              Menghilangkan generic AI slop: Agent 1 (Drafter) menyusun draf, lalu Agent 2 (Reviewer) mengaudit kepadatan kata kunci ATS dan bukti dampak terukur.
            </p>
          </div>

          <div className="two-agent-grid">
            {/* Column 1: Agent 1 (Drafter Output) */}
            <div className="agent-column drafter-col">
              <div className="agent-badge">
                <span className="agent-indicator drafter-dot" />
                <strong>Agent 1: The Drafter</strong>
              </div>

              <div className="studio-card">
                <div className="drafter-meta-item">
                  <span>Target Peran & Perusahaan:</span>
                  <b>{selectedJob.input.title} @ {selectedJob.input.company}</b>
                </div>

                <div className="drafter-meta-item">
                  <span>Rekomendasi CV:</span>
                  <strong className="cv-tag">{drafterResult.recommendedCvLabel}</strong>
                </div>

                <label>Draf Surat Lamaran / Pitch Terarah</label>
                <textarea
                  rows={14}
                  value={activeLetter}
                  onChange={e => setActiveLetter(e.target.value)}
                  className="studio-letter-textarea"
                />
              </div>
            </div>

            {/* Column 2: Agent 2 (Reviewer Critique & ATS Audit) */}
            <div className="agent-column reviewer-col">
              <div className="agent-badge">
                <span className="agent-indicator reviewer-dot" />
                <strong>Agent 2: The Reviewer (Quality Audit)</strong>
              </div>

              {/* Reviewer Score Cards */}
              <div className="reviewer-scores-row">
                <div className="audit-gauge">
                  <span>ATS Keyword Match</span>
                  <strong>{reviewerResult.atsKeywordScore}%</strong>
                </div>
                <div className="audit-gauge">
                  <span>Impact & Metrik</span>
                  <strong>{reviewerResult.impactScore}%</strong>
                </div>
                <div className="audit-gauge">
                  <span>Anti-Slop Score</span>
                  <strong>{reviewerResult.antiSlopScore}%</strong>
                </div>
              </div>

              {/* Reviewer Audit Feedback */}
              <div className="studio-card">
                <h4>Hasil Pemeriksaan Kualitas Reviewer</h4>
                <ul className="reviewer-feedback-list">
                  {reviewerResult.reviewerFeedback.map((fb, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={13} className="text-green" />
                      <span>{fb}</span>
                    </li>
                  ))}
                </ul>

                {reviewerResult.detectedSlopPhrases.length > 0 && (
                  <div className="slop-alert-box">
                    <AlertTriangle size={14} />
                    <span>Terdeteksi klise AI: "{reviewerResult.detectedSlopPhrases.join('", "')}"</span>
                  </div>
                )}

                <div className="card-actions" style={{ marginTop: 14 }}>
                  <button
                    className="secondary compact-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(activeLetter);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                    {isCopied ? 'Tersalin' : 'Salin Draf'}
                  </button>

                  <button
                    className="primary compact-btn"
                    onClick={handlePromoteToPipeline}
                  >
                    <Send size={13} /> Promosikan ke CRM Pipeline
                  </button>
                </div>

                {promoteStatus && (
                  <p className="status-msg" style={{ marginTop: 10 }}>{promoteStatus}</p>
                )}
              </div>

              {/* Advance to Step 4 button */}
              <button
                className="advance-interview-btn"
                onClick={handleAdvanceToInterviewPrep}
              >
                <span>Siapkan Latihan Wawancara untuk Peran Ini (/interview)</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: STAR Interview Prep (/interview) */}
      {activeStep === 4 && selectedJob && (
        <div className="studio-content-panel">
          <div className="panel-title">
            <h2>4. Simulasi Wawancara STAR Blueprint (/interview)</h2>
            <p>
              Kerangka jawaban terstruktur (*Situation, Task, Action, Result*) untuk menjawab pertanyaan engineering paling krusial pada posisi{' '}
              <b>{selectedJob.input.title}</b> di <b>{selectedJob.input.company}</b>.
            </p>
          </div>

          <div className="star-questions-list">
            {starQuestions.map((q) => {
              const isExpanded = expandedQuestion === q.id;
              return (
                <div key={q.id} className="star-card">
                  <div
                    className="star-card-header"
                    onClick={() => setExpandedQuestion(isExpanded ? '' : q.id)}
                  >
                    <div className="star-card-title">
                      <span className="star-category-tag">{q.category}</span>
                      <h4>{q.question}</h4>
                    </div>
                    <ChevronRight size={16} className={`accordion-arrow ${isExpanded ? 'rotated' : ''}`} />
                  </div>

                  {isExpanded && (
                    <div className="star-blueprint-content">
                      <div className="interviewer-intent-box">
                        <HelpCircle size={14} />
                        <span><b>Yang dicari pewawancara:</b> {q.interviewerLooksFor}</span>
                      </div>

                      <div className="star-grid">
                        <div className="star-box situation">
                          <span className="star-letter">S</span>
                          <div>
                            <strong>Situation (Konteks Masalah)</strong>
                            <p>{q.star.situation}</p>
                          </div>
                        </div>

                        <div className="star-box task">
                          <span className="star-letter">T</span>
                          <div>
                            <strong>Task (Tanggung Jawab Spesifik)</strong>
                            <p>{q.star.task}</p>
                          </div>
                        </div>

                        <div className="star-box action">
                          <span className="star-letter">A</span>
                          <div>
                            <strong>Action (Solusi Arsitektur & Tindakan)</strong>
                            <p>{q.star.action}</p>
                          </div>
                        </div>

                        <div className="star-box result">
                          <span className="star-letter">R</span>
                          <div>
                            <strong>Result (Dampak Terukur & Metrik)</strong>
                            <p>{q.star.result}</p>
                          </div>
                        </div>
                      </div>

                      <div className="card-actions-row" style={{ marginTop: 12 }}>
                        <button
                          className="secondary compact-btn"
                          onClick={() => {
                            const formatted = `Q: ${q.question}\n\n[SITUATION]: ${q.star.situation}\n[TASK]: ${q.star.task}\n[ACTION]: ${q.star.action}\n[RESULT]: ${q.star.result}`;
                            navigator.clipboard.writeText(formatted);
                            alert('Kerangka jawaban STAR disalin ke clipboard!');
                          }}
                        >
                          <Copy size={13} /> Salin Blueprint STAR
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="studio-footer-cta">
            <button className="secondary" onClick={() => setActiveStep(2)}>
              Kembali ke Hasil Ranking
            </button>
            <button className="primary" onClick={onNavigateToPipeline}>
              Buka Opportunity Pipeline <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
