import { useState } from 'react';
import {
  Target,
  SlidersHorizontal,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  FolderKanban,
  Trash2,
  FileText,
  ExternalLink,
  Sparkles,
  Printer,
  Bookmark,
} from 'lucide-react';
import { useCandidateProfile } from '../../hooks/useCandidateProfile';
import { useJobLeads } from '../../hooks/useJobLeads';
import { evaluateJobFit } from '../../lib/job-hunter';
import { CandidateProfileModal } from './CandidateProfileModal';
import { AtsResumeFormatterModal } from '../resume-formatter/AtsResumeFormatterModal';
import { WebClipperModal } from './WebClipperModal';
import type { JobLead } from '../../lib/pb-types';

interface JobHunterViewProps {
  onPromoteToApplyFlow: (lead: {
    title: string;
    company: string;
    rawJd: string;
    url?: string;
    source?: string;
  }) => void;
}

export function JobHunterView({ onPromoteToApplyFlow }: JobHunterViewProps) {
  const { profile, saveProfile } = useCandidateProfile();
  const { leads, addLead, updateLeadStatus, deleteLead } = useJobLeads();

  const [activeTab, setActiveTab] = useState<'evaluator' | 'pipeline'>('evaluator');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  const [isClipperOpen, setIsClipperOpen] = useState(false);
  const [selectedAtsLead, setSelectedAtsLead] = useState<{
    company: string;
    title: string;
    skills?: string[];
    rawJd?: string;
  } | null>(null);

  // Evaluator Form State
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [workMode, setWorkMode] = useState<'Remote' | 'Hybrid' | 'On-site'>('Remote');
  const [rawJd, setRawJd] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Evaluation Result State
  const [currentLead, setCurrentLead] = useState<Omit<JobLead, 'id'> | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !company.trim() || !rawJd.trim()) {
      setStatusMessage('Silakan isi Posisi, Perusahaan, dan Deskripsi Lowongan (JD) minimal.');
      return;
    }
    setIsEvaluating(true);
    setStatusMessage(null);

    try {
      const { matchScore, evaluation } = evaluateJobFit(rawJd, jobTitle, company, profile);
      const leadData: Omit<JobLead, 'id'> = {
        title: jobTitle.trim(),
        company: company.trim(),
        url: jobUrl.trim() || undefined,
        workMode,
        rawJd: rawJd.trim(),
        source: /jobstreet/i.test(jobUrl)
          ? 'jobstreet'
          : /linkedin/i.test(jobUrl)
          ? 'linkedin'
          : 'manual',
        matchScore,
        evaluation,
        status: matchScore >= 80 ? 'shortlisted' : 'inbox',
      };
      setCurrentLead(leadData);
      setStatusMessage(
        `Evaluasi selesai. Skor kesesuaian: ${matchScore}% (${evaluation.verdict
          .replace('_', ' ')
          .toUpperCase()}).`
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSaveToPipeline = async () => {
    if (!currentLead) return;
    await addLead(currentLead);
    setStatusMessage('Lowongan berhasil disimpan ke Lead Pipeline.');
  };

  const handlePromote = () => {
    if (!currentLead) return;
    onPromoteToApplyFlow({
      title: currentLead.title,
      company: currentLead.company,
      rawJd: currentLead.rawJd,
      url: currentLead.url,
      source: currentLead.source,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Banner: Candidate Profile Context */}
      <div
        style={{
          background: '#fbfbf8',
          border: '1px solid #dedfd8',
          padding: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: '#eef2e6',
                color: '#556b2f',
                padding: '6px',
                borderRadius: '50%',
                display: 'inline-grid',
                placeItems: 'center',
              }}
            >
              <Target size={18} />
            </span>
            <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 600 }}>Job Hunter Engine</h1>
            <span
              style={{
                font: "10px 'DM Mono'",
                textTransform: 'uppercase',
                background: '#e8eedd',
                color: '#4e622b',
                padding: '4px 8px',
                borderRadius: '3px',
                border: '1px solid #d4dec3',
              }}
            >
              Deterministic Triage
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#777c73', margin: '8px 0 0' }}>
            Target:{' '}
            <b style={{ color: '#202320' }}>
              {profile.targetRoles.slice(0, 3).join(', ') || 'Unset'}
            </b>{' '}
            · Skills:{' '}
            <span style={{ color: '#556b2f', font: "12px 'DM Mono'" }}>
              {profile.skills.slice(0, 5).join(', ')}...
            </span>{' '}
            · Min Base:{' '}
            <b style={{ color: '#202320' }}>
              Rp {(profile.minSalary || 0).toLocaleString('id-ID')}
            </b>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsClipperOpen(true)}
            className="secondary compact-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            title="Klip lowongan kerja dari LinkedIn / Jobstreet"
          >
            <Bookmark size={14} /> 1-Click Web-Clipper
          </button>
          <button
            onClick={() => {
              setSelectedAtsLead(null);
              setIsAtsModalOpen(true);
            }}
            className="primary compact-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#202320', color: '#f5f5f0' }}
          >
            <Printer size={14} /> 1-Click ATS Resume
          </button>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="secondary compact-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <SlidersHorizontal size={14} /> Edit Target Criteria
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          borderBottom: '1px solid #dedfd8',
          fontSize: '13px',
        }}
      >
        <button
          onClick={() => setActiveTab('evaluator')}
          style={{
            paddingBottom: '12px',
            fontWeight: 600,
            borderBottom: activeTab === 'evaluator' ? '2px solid #7d9850' : '2px solid transparent',
            color: activeTab === 'evaluator' ? '#202320' : '#888d82',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Search size={15} /> Evaluator & Fit Scoring
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          style={{
            paddingBottom: '12px',
            fontWeight: 600,
            borderBottom: activeTab === 'pipeline' ? '2px solid #7d9850' : '2px solid transparent',
            color: activeTab === 'pipeline' ? '#202320' : '#888d82',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FolderKanban size={15} /> Lead Pipeline
          <span
            style={{
              font: "10px 'DM Mono'",
              background: '#e8ebd8',
              color: '#495a28',
              padding: '2px 7px',
              borderRadius: '12px',
            }}
          >
            {leads.length}
          </span>
        </button>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '12px 16px',
            background: '#edf2e3',
            border: '1px solid #cfddbe',
            color: '#455928',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            style={{ color: '#455928', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab 1: Evaluator */}
      {activeTab === 'evaluator' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Form Input */}
          <div
            style={{
              background: '#fbfbf8',
              border: '1px solid #dedfd8',
              padding: '24px',
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 600,
                margin: '0 0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FileText size={16} style={{ color: '#7d9850' }} /> Input Vacancy Specification
            </h2>

            <form onSubmit={handleEvaluate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#888d82',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Job Position *
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior DevOps Engineer"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #dedfd8',
                      background: '#fff',
                      fontSize: '13px',
                    }}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#888d82',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. PT Lintas Media Danawa"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #dedfd8',
                      background: '#fff',
                      fontSize: '13px',
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#888d82',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Job URL (optional)
                  </label>
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://jobstreet.co.id/job/..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #dedfd8',
                      background: '#fff',
                      fontSize: '13px',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#888d82',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Work Arrangement
                  </label>
                  <select
                    value={workMode}
                    onChange={(e) =>
                      setWorkMode(e.target.value as 'Remote' | 'Hybrid' | 'On-site')
                    }
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #dedfd8',
                      background: '#fff',
                      fontSize: '13px',
                    }}
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#888d82',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Raw Job Description & Requirements *
                </label>
                <textarea
                  rows={9}
                  value={rawJd}
                  onChange={(e) => setRawJd(e.target.value)}
                  placeholder="Paste responsibilities, requirements, and tech stack here..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dedfd8',
                    background: '#fff',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    lineHeight: 1.5,
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isEvaluating}
                className="primary full"
                style={{ marginTop: '8px' }}
              >
                <Sparkles size={16} />
                {isEvaluating ? 'Evaluating criteria...' : 'Run Deterministic Evaluation'}
              </button>
            </form>
          </div>

          {/* Result Card */}
          <div
            style={{
              background: '#fbfbf8',
              border: '1px solid #dedfd8',
              padding: '24px',
              minHeight: '440px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {currentLead && currentLead.evaluation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 600 }}>
                      {currentLead.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#777c73', margin: 0 }}>
                      {currentLead.company} · {currentLead.workMode}
                    </p>
                  </div>

                  <div
                    style={{
                      padding: '8px 14px',
                      borderRadius: '4px',
                      textAlign: 'center',
                      background:
                        currentLead.matchScore >= 80
                          ? '#edf2e3'
                          : currentLead.matchScore >= 60
                          ? '#fcf6e6'
                          : '#faece8',
                      border: `1px solid ${
                        currentLead.matchScore >= 80
                          ? '#cfddbe'
                          : currentLead.matchScore >= 60
                          ? '#ebd8a8'
                          : '#e8c1b7'
                      }`,
                      color:
                        currentLead.matchScore >= 80
                          ? '#455928'
                          : currentLead.matchScore >= 60
                          ? '#8c6b1e'
                          : '#914030',
                    }}
                  >
                    <div style={{ font: "bold 24px 'DM Mono'", lineHeight: 1 }}>
                      {currentLead.matchScore}%
                    </div>
                    <div
                      style={{
                        font: "9px 'DM Mono'",
                        textTransform: 'uppercase',
                        marginTop: '4px',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {currentLead.evaluation.verdict.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                {/* Dealbreaker Alert */}
                {currentLead.evaluation.dealbreakers.length > 0 && (
                  <div
                    style={{
                      padding: '12px 14px',
                      background: '#faece8',
                      border: '1px solid #e8c1b7',
                      color: '#914030',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <b>Dealbreaker Detected:</b> {currentLead.evaluation.dealbreakers.join(', ')}
                    </div>
                  </div>
                )}

                {/* Matched Skills */}
                <div>
                  <h4
                    style={{
                      fontSize: '12px',
                      color: '#495f2e',
                      margin: '0 0 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={14} /> Matched Skills (
                    {currentLead.evaluation.strengths.length})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {currentLead.evaluation.strengths.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          font: "11px 'DM Mono'",
                          background: '#edf2e3',
                          border: '1px solid #cfddbe',
                          color: '#455928',
                          padding: '3px 8px',
                          borderRadius: '3px',
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                    {currentLead.evaluation.strengths.length === 0 && (
                      <span style={{ fontSize: '12px', color: '#888d82', fontStyle: 'italic' }}>
                        No direct matching skills recorded.
                      </span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div>
                  <h4
                    style={{
                      fontSize: '12px',
                      color: '#8c6b1e',
                      margin: '0 0 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AlertTriangle size={14} /> Identified Gaps (
                    {currentLead.evaluation.missingSkills.length})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {currentLead.evaluation.missingSkills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          font: "11px 'DM Mono'",
                          background: '#fcf6e6',
                          border: '1px solid #ebd8a8',
                          color: '#8c6b1e',
                          padding: '3px 8px',
                          borderRadius: '3px',
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                    {currentLead.evaluation.missingSkills.length === 0 && (
                      <span style={{ fontSize: '12px', color: '#888d82', fontStyle: 'italic' }}>
                        No missing required skills detected.
                      </span>
                    )}
                  </div>
                </div>

                {/* Strategy Angle */}
                {currentLead.evaluation.suggestedAngle && (
                  <div
                    style={{
                      padding: '14px',
                      background: '#f5f5f0',
                      border: '1px solid #dedfd8',
                      fontSize: '12px',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                        color: '#202320',
                        marginBottom: '4px',
                      }}
                    >
                      <Lightbulb size={14} style={{ color: '#7d9850' }} /> Pitching & Positioning Strategy:
                    </span>
                    <p style={{ color: '#555a50', lineHeight: 1.5, margin: 0 }}>
                      {currentLead.evaluation.suggestedAngle}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    borderTop: '1px solid #dedfd8',
                    paddingTop: '16px',
                  }}
                >
                  <button
                    onClick={handlePromote}
                    className="primary"
                    style={{ flex: 1, minWidth: '150px', justifyContent: 'center' }}
                  >
                    <ArrowUpRight size={15} /> Promote to ApplyFlow
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAtsLead({
                        company: currentLead.company,
                        title: currentLead.title,
                        skills: currentLead.evaluation?.strengths || [],
                        rawJd: currentLead.rawJd,
                      });
                      setIsAtsModalOpen(true);
                    }}
                    className="secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Printer size={14} /> Format ATS Resume
                  </button>
                  <button onClick={handleSaveToPipeline} className="secondary">
                    Save to Lead Pipeline
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: '#888d82',
                  padding: '48px 16px',
                  height: '100%',
                }}
              >
                <Target size={36} style={{ color: '#b8c59f', marginBottom: '14px' }} />
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#333730', margin: '0 0 6px' }}>
                  No active evaluation
                </p>
                <p style={{ fontSize: '12px', maxWidth: '340px', margin: 0, lineHeight: 1.5 }}>
                  Enter job details in the left form and run deterministic triage to view match scoring, dealbreaker alerts, and strategic pitching angles.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Leads Pipeline */}
      {activeTab === 'pipeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {leads.map((lead) => (
              <div
                key={lead.id}
                style={{
                  background: '#fbfbf8',
                  border: '1px solid #dedfd8',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{lead.title}</h3>
                    <span
                      style={{
                        font: "bold 11px 'DM Mono'",
                        padding: '2px 8px',
                        borderRadius: '3px',
                        background: lead.matchScore >= 80 ? '#edf2e3' : '#fcf6e6',
                        color: lead.matchScore >= 80 ? '#455928' : '#8c6b1e',
                        border: `1px solid ${lead.matchScore >= 80 ? '#cfddbe' : '#ebd8a8'}`,
                      }}
                    >
                      {lead.matchScore}%
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#777c73', margin: '4px 0 0' }}>
                    {lead.company} · {lead.workMode || 'Remote'}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px',
                      marginTop: '12px',
                    }}
                  >
                    {lead.evaluation?.strengths.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        style={{
                          font: "10px 'DM Mono'",
                          background: '#f0f2eb',
                          color: '#555e50',
                          padding: '2px 6px',
                          borderRadius: '2px',
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #ecece6',
                    paddingTop: '12px',
                  }}
                >
                  <select
                    value={lead.status}
                    onChange={(e) =>
                      updateLeadStatus(lead.id, e.target.value as JobLead['status'])
                    }
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      border: '1px solid #dedfd8',
                      background: '#fff',
                    }}
                  >
                    <option value="inbox">Inbox</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="promoted_to_apply">Promoted</option>
                    <option value="archived">Archived</option>
                  </select>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() =>
                        onPromoteToApplyFlow({
                          title: lead.title,
                          company: lead.company,
                          rawJd: lead.rawJd,
                          url: lead.url,
                          source: lead.source,
                        })
                      }
                      className="secondary compact-btn"
                      style={{ padding: '4px 10px' }}
                    >
                      Apply <ArrowUpRight size={12} />
                    </button>
                    <button
                      onClick={() => deleteLead(lead.id)}
                      className="secondary compact-btn"
                      style={{ padding: '4px 8px', color: '#b43d3d' }}
                      title="Delete lead"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {leads.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                border: '1px dashed #dedfd8',
                color: '#888d82',
                fontSize: '13px',
              }}
            >
              No leads in pipeline. Evaluate opportunities from the Evaluator tab to track them here.
            </div>
          )}
        </div>
      )}

      {/* Target Candidate Profile Modal */}
      <CandidateProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSave={saveProfile}
      />

      {/* 1-Click Printable ATS Resume Formatter Modal */}
      <AtsResumeFormatterModal
        isOpen={isAtsModalOpen}
        onClose={() => setIsAtsModalOpen(false)}
        profile={profile}
        targetJobPosting={selectedAtsLead}
      />

      {/* 1-Click Job Portal Web-Clipper Modal */}
      <WebClipperModal
        isOpen={isClipperOpen}
        onClose={() => setIsClipperOpen(false)}
        onImportLead={async (lead) => {
          await addLead(lead);
        }}
      />
    </div>
  );
}
