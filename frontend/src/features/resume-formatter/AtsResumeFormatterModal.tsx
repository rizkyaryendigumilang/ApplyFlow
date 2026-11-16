import { useState, useMemo } from 'react';
import {
  Printer,
  FileText,
  Copy,
  Download,
  Save,
  Check,
  AlertTriangle,
  Sparkles,
  X,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { CandidateProfile, Application, CVArtifact } from '../../lib/pb-types';
import { pb } from '../../lib/pocketbase';

export interface AtsResumeFormatterProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: CandidateProfile | null;
  targetApplication?: Application | null;
  targetJobPosting?: {
    company: string;
    title: string;
    skills?: string[];
    rawJd?: string;
  } | null;
  cvArtifact?: CVArtifact | null;
  initialEvidence?: string;
  onSaveCvArtifact?: (data: Partial<CVArtifact>) => Promise<void>;
}

interface ResumeExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  bullets: string[];
}

interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  period: string;
  location: string;
  honors?: string;
}

export function AtsResumeFormatterModal({
  isOpen,
  onClose,
  profile,
  targetApplication,
  targetJobPosting,
  cvArtifact,
  initialEvidence,
  onSaveCvArtifact,
}: AtsResumeFormatterProps) {
  if (!isOpen) return null;

  // Header Details
  const [fullName, setFullName] = useState(
    profile?.fullName || (pb.authStore.model?.displayName as string) || 'Rizky Alamsyah'
  );
  const [targetTitle, setTargetTitle] = useState(
    targetApplication?.position ||
      targetJobPosting?.title ||
      profile?.headline ||
      'Senior DevOps & Cloud Platform Engineer'
  );
  const [targetCompany] = useState(
    targetApplication?.company || targetJobPosting?.company || ''
  );
  const [email, setEmail] = useState((pb.authStore.model?.email as string) || 'rizky.alamsyah@example.com');
  const [phone, setPhone] = useState(profile?.phone || '+62 812-3456-7890');
  const [location, setLocation] = useState(profile?.location || 'Jakarta, Indonesia');
  const [linkedin, setLinkedin] = useState(profile?.linkedinUrl || 'linkedin.com/in/rizky-alamsyah');
  const [github, setGithub] = useState(profile?.githubUrl || 'github.com/rizky-cloud');
  const [portfolio, setPortfolio] = useState(profile?.portfolioUrl || 'rizkyalamsyah.dev');

  // Styling & Density Controls
  const [template, setTemplate] = useState<'harvard-classic' | 'modern-tech'>('harvard-classic');
  const [density, setDensity] = useState<'standard' | 'compact'>('standard');
  const [activeTab, setActiveTab] = useState<'preview' | 'editor' | 'auditor'>('preview');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Resume Content
  const [summary, setSummary] = useState(
    profile?.experienceSummary ||
      `Senior DevOps & Cloud Platform Engineer with 5+ years of experience designing and operating multi-tenant Kubernetes platforms and AWS infrastructure. Proven track record of reducing deployment cycle times by 65% and maintaining 99.98% platform uptime across high-throughput distributed systems.`
  );

  const [skillsLanguages, setSkillsLanguages] = useState('Go, TypeScript, Python, Bash, SQL');
  const [skillsFrameworks, setSkillsFrameworks] = useState('React, Node.js, Echo, Gin, gRPC, REST APIs');
  const [skillsCloud, setSkillsCloud] = useState('Kubernetes, Docker, AWS (EKS, RDS, S3), Terraform, CI/CD, Helm');
  const [skillsDatabases, setSkillsDatabases] = useState('PostgreSQL, Redis, SQLite, Kafka');
  const [skillsMethodologies, setSkillsMethodologies] = useState('System Design, Microservices, SRE, GitOps, TDD, Agile');

  const [experiences, setExperiences] = useState<ResumeExperience[]>([
    {
      id: 'exp-1',
      company: 'Tokopedia / GoTo Group',
      role: 'Senior DevOps & Platform Engineer',
      period: 'Jan 2022 – Present',
      location: 'Jakarta, Indonesia',
      bullets: [
        'Architected and scaled Kubernetes clusters hosting 120+ microservices, sustaining 45,000 req/sec peak traffic during flash-sale campaigns with zero downtime.',
        'Engineered GitOps delivery pipelines via GitHub Actions and ArgoCD, slashing average release lead time from 45 minutes to 7 minutes.',
        'Optimized AWS cloud infrastructure and spot instance provisioning, reducing monthly compute expenditures by $28,000 (32% savings).',
        'Implemented Prometheus and Grafana observability stack with automated PagerDuty alert routing, improving MTTR by 42%.',
      ],
    },
    {
      id: 'exp-2',
      company: 'Traveloka',
      role: 'Cloud Infrastructure & SRE Engineer',
      period: 'Jul 2019 – Dec 2021',
      location: 'Jakarta, Indonesia',
      bullets: [
        'Spearheaded migration of legacy EC2 monolithic services to containerized Docker workloads on Amazon EKS.',
        'Formulated infrastructure-as-code modules using Terraform for automated multi-region VPC and database replication.',
        'Collaborated with security teams to enforce IAM least-privilege policies and automated vulnerability scanning in CI/CD.',
      ],
    },
  ]);

  const [education, setEducation] = useState<ResumeEducation[]>([
    {
      id: 'edu-1',
      institution: 'Universitas Indonesia',
      degree: 'Bachelor of Science in Computer Science',
      period: '2015 – 2019',
      location: 'Depok, Indonesia',
      honors: 'GPA: 3.84 / 4.00 · Cum Laude',
    },
  ]);

  const [certifications, setCertifications] = useState<string[]>([
    'AWS Certified Solutions Architect – Professional',
    'Certified Kubernetes Administrator (CKA) – Linux Foundation',
    'HashiCorp Certified: Terraform Associate',
  ]);

  const updateExperienceBullet = (expIndex: number, bulletIndex: number, newText: string) => {
    const updated = [...experiences];
    const newBullets = [...updated[expIndex].bullets];
    newBullets[bulletIndex] = newText;
    updated[expIndex] = { ...updated[expIndex], bullets: newBullets };
    setExperiences(updated);
  };

  const addExperienceBullet = (expIndex: number) => {
    const updated = [...experiences];
    const newBullets = [
      ...updated[expIndex].bullets,
      'Accomplished [X goal] as measured by [Y quantitative metric] by implementing [Z technical solution].',
    ];
    updated[expIndex] = { ...updated[expIndex], bullets: newBullets };
    setExperiences(updated);
  };

  const deleteExperienceBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...experiences];
    const newBullets = updated[expIndex].bullets.filter((_, i) => i !== bulletIndex);
    updated[expIndex] = { ...updated[expIndex], bullets: newBullets };
    setExperiences(updated);
  };

  const applyXyzTemplate = (expIndex: number, bulletIndex: number) => {
    const xyzTemplates = [
      'Architected multi-region Kubernetes cluster deployment on AWS, scaling to 45,000 req/sec during peak traffic with zero downtime.',
      'Engineered automated GitOps delivery pipelines via GitHub Actions and ArgoCD, slashing release cycle time from 45 minutes to 7 minutes.',
      'Optimized cloud resource allocation and spot-instance scheduling with Karpenter, reducing monthly compute expenditures by $28,000 (32% savings).',
      'Spearheaded Prometheus & Grafana observability overhaul with automated alert escalation, improving platform MTTR by 42%.',
    ];
    const picked = xyzTemplates[(bulletIndex + expIndex) % xyzTemplates.length];
    updateExperienceBullet(expIndex, bulletIndex, picked);
  };

  // Target Keywords for ATS Matching
  const targetKeywords = useMemo(() => {
    const list: string[] = [];
    if (targetJobPosting?.skills) list.push(...targetJobPosting.skills);
    if (profile?.skills) list.push(...profile.skills);
    if (list.length === 0) {
      list.push('Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Go', 'Python', 'Monitoring', 'Linux');
    }
    return Array.from(new Set(list));
  }, [targetJobPosting, profile]);

  // ATS Auditor Engine
  const atsAudit = useMemo(() => {
    const allText = [
      summary,
      skillsLanguages,
      skillsFrameworks,
      skillsCloud,
      skillsDatabases,
      skillsMethodologies,
      ...experiences.flatMap((e) => e.bullets),
      ...certifications,
    ]
      .join(' ')
      .toLowerCase();

    // 1. Keyword Overlap
    const matchedKeywords = targetKeywords.filter((kw) =>
      allText.includes(kw.toLowerCase())
    );
    const keywordScore = Math.min(
      25,
      Math.round((matchedKeywords.length / Math.max(1, targetKeywords.length)) * 25)
    );

    // 2. Quantifiable Metrics in Bullets
    const allBullets = experiences.flatMap((e) => e.bullets);
    const quantifiedBullets = allBullets.filter((b) =>
      /(\d+%|\$\d+|\b\d+\b|\b\d+k\b|\b\d+m\b|reduced by|increased by|slashed|saving)/i.test(
        b
      )
    );
    const metricRatio = allBullets.length > 0 ? quantifiedBullets.length / allBullets.length : 0;
    const metricScore = Math.min(25, Math.round(metricRatio * 25));

    // 3. Strong Action Verbs
    const actionVerbs = [
      'architected',
      'engineered',
      'spearheaded',
      'optimized',
      'scaled',
      'designed',
      'implemented',
      'automated',
      'reduced',
      'formulated',
      'delivered',
      'developed',
    ];
    const foundVerbs = actionVerbs.filter((v) => allText.includes(v));
    const verbScore = Math.min(25, Math.round((foundVerbs.length / 5) * 25));

    // 4. Header & Formatting Compliance
    const hasContact = Boolean(fullName && email && phone && location);
    const formatScore = hasContact ? 25 : 15;

    const totalScore = keywordScore + metricScore + verbScore + formatScore;

    // Slop & Buzzword Warnings
    const buzzwords = ['hardworking', 'go-getter', 'rockstar', 'ninja', 'team player', 'synergy'];
    const detectedBuzzwords = buzzwords.filter((w) => allText.includes(w));

    return {
      totalScore,
      keywordScore,
      metricScore,
      verbScore,
      formatScore,
      matchedKeywords,
      quantifiedCount: quantifiedBullets.length,
      totalBullets: allBullets.length,
      foundVerbs,
      detectedBuzzwords,
    };
  }, [
    summary,
    skillsLanguages,
    skillsFrameworks,
    skillsCloud,
    skillsDatabases,
    skillsMethodologies,
    experiences,
    certifications,
    targetKeywords,
    fullName,
    email,
    phone,
    location,
  ]);

  // 1-Click Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Copy Plain Text ATS Format
  const handleCopyPlainText = async () => {
    let txt = `${fullName.toUpperCase()}\n`;
    txt += `${location} | ${phone} | ${email}\n`;
    txt += `LinkedIn: ${linkedin} | GitHub: ${github} | Portfolio: ${portfolio}\n\n`;

    txt += `================================================================================\n`;
    txt += `PROFESSIONAL SUMMARY\n`;
    txt += `================================================================================\n`;
    txt += `${summary}\n\n`;

    txt += `================================================================================\n`;
    txt += `TECHNICAL SKILLS & COMPETENCIES\n`;
    txt += `================================================================================\n`;
    txt += `• Programming Languages: ${skillsLanguages}\n`;
    txt += `• Frameworks & Libraries: ${skillsFrameworks}\n`;
    txt += `• Cloud & Infrastructure: ${skillsCloud}\n`;
    txt += `• Databases & Caching: ${skillsDatabases}\n`;
    txt += `• Methodologies: ${skillsMethodologies}\n\n`;

    txt += `================================================================================\n`;
    txt += `PROFESSIONAL EXPERIENCE\n`;
    txt += `================================================================================\n`;
    experiences.forEach((exp) => {
      txt += `${exp.company.toUpperCase()} - ${exp.location}\n`;
      txt += `${exp.role} | ${exp.period}\n`;
      exp.bullets.forEach((b) => {
        txt += `• ${b}\n`;
      });
      txt += `\n`;
    });

    txt += `================================================================================\n`;
    txt += `EDUCATION\n`;
    txt += `================================================================================\n`;
    education.forEach((edu) => {
      txt += `${edu.institution.toUpperCase()} - ${edu.location}\n`;
      txt += `${edu.degree} | ${edu.period}\n`;
      if (edu.honors) txt += `• ${edu.honors}\n`;
      txt += `\n`;
    });

    if (certifications.length > 0) {
      txt += `================================================================================\n`;
      txt += `CERTIFICATIONS & CREDENTIALS\n`;
      txt += `================================================================================\n`;
      certifications.forEach((c) => {
        txt += `• ${c}\n`;
      });
    }

    try {
      await navigator.clipboard.writeText(txt);
      setCopyFeedback('Plaintext ATS berhasil disalin ke clipboard!');
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch {
      setCopyFeedback('Gagal menyalin otomatis. Silakan salin teks manual.');
    }
  };

  // Download Markdown
  const handleDownloadMarkdown = () => {
    let md = `# ${fullName}\n\n`;
    md += `${location} · ${phone} · [${email}](mailto:${email}) · [LinkedIn](${linkedin}) · [GitHub](${github})\n\n`;
    md += `## PROFESSIONAL SUMMARY\n${summary}\n\n`;
    md += `## TECHNICAL SKILLS\n- **Languages:** ${skillsLanguages}\n- **Frameworks:** ${skillsFrameworks}\n- **Cloud & DevOps:** ${skillsCloud}\n- **Databases:** ${skillsDatabases}\n- **Methodologies:** ${skillsMethodologies}\n\n`;
    md += `## WORK EXPERIENCE\n`;
    experiences.forEach((e) => {
      md += `### ${e.role} - ${e.company}\n_${e.period} | ${e.location}_\n\n`;
      e.bullets.forEach((b) => {
        md += `- ${b}\n`;
      });
      md += `\n`;
    });
    md += `## EDUCATION\n`;
    education.forEach((edu) => {
      md += `### ${edu.institution}\n**${edu.degree}** | ${edu.period}\n\n`;
      if (edu.honors) md += `- ${edu.honors}\n\n`;
    });
    md += `## CERTIFICATIONS\n`;
    certifications.forEach((c) => {
      md += `- ${c}\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATS-Resume-${fullName.replace(/\s+/g, '-')}-Harvard.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveCvArtifact = async () => {
    setIsSaving(true);
    try {
      const structuredContent = {
        header: {
          fullName,
          targetTitle,
          targetCompany,
          email,
          phone,
          location,
          linkedin,
          github,
          portfolio,
        },
        summary,
        skills: {
          languages: skillsLanguages.split(',').map((s) => s.trim()).filter(Boolean),
          frameworks: skillsFrameworks.split(',').map((s) => s.trim()).filter(Boolean),
          cloud: skillsCloud.split(',').map((s) => s.trim()).filter(Boolean),
          databases: skillsDatabases.split(',').map((s) => s.trim()).filter(Boolean),
          methodologies: skillsMethodologies.split(',').map((s) => s.trim()).filter(Boolean),
        },
        experiences,
        education,
        certifications,
        atsScore: atsAudit.totalScore,
        template,
        density,
      };

      const payload: Partial<CVArtifact> = {
        label: `ATS Harvard - ${targetTitle || 'General'}`,
        targetRole: targetTitle,
        atsScore: atsAudit.totalScore,
        lastAtsAudit: new Date().toISOString(),
        content: structuredContent,
      };

      if (onSaveCvArtifact) {
        await onSaveCvArtifact(payload);
      } else if (pb.authStore.model?.id) {
        if (cvArtifact?.id) {
          await pb.collection('cv_artifacts').update(cvArtifact.id, payload);
        } else {
          await pb.collection('cv_artifacts').create({
            ...payload,
            owner: pb.authStore.model.id,
            version: 'CV-Harvard-v1',
            isMaster: false,
          });
        }
      }

      setSaveSuccess(true);
      setCopyFeedback('Resume ATS berhasil disimpan ke CV Lab!');
      setTimeout(() => {
        setSaveSuccess(false);
        setCopyFeedback(null);
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      setCopyFeedback(`Gagal menyimpan: ${msg}`);
      setTimeout(() => setCopyFeedback(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="overlay ats-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ats-modal-container">
        {/* Modal Top Chrome (Hidden in @media print) */}
        <header className="ats-modal-header no-print">
          <div className="ats-modal-header-left">
            <span className="eyebrow" style={{ color: '#18181b' }}>
              HARVARD / TECH ATS STANDARD
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2>1-Click Printable ATS Resume Formatter</h2>
              <span className="ats-score-badge">
                <ShieldCheck size={14} /> ATS Score: {atsAudit.totalScore}/100
              </span>
            </div>
            {targetCompany && (
              <p className="ats-target-indicator">
                Target Role: <strong>{targetTitle}</strong> @ <strong>{targetCompany}</strong>
              </p>
            )}
          </div>

          <div className="ats-modal-header-actions">
            {/* View switcher */}
            <div className="segmented">
              <button
                type="button"
                className={activeTab === 'preview' ? 'selected' : ''}
                onClick={() => setActiveTab('preview')}
              >
                <FileText size={13} /> Paper Preview
              </button>
              <button
                type="button"
                className={activeTab === 'editor' ? 'selected' : ''}
                onClick={() => setActiveTab('editor')}
              >
                <Sliders size={13} /> Edit Content
              </button>
              <button
                type="button"
                className={activeTab === 'auditor' ? 'selected' : ''}
                onClick={() => setActiveTab('auditor')}
              >
                <Sparkles size={13} /> ATS Audit ({atsAudit.totalScore})
              </button>
            </div>

            {/* Quick Actions */}
            <button
              type="button"
              className="secondary compact-btn"
              onClick={handleCopyPlainText}
              title="Copy clean plaintext for portal textareas"
            >
              <Copy size={13} /> Copy ATS Text
            </button>
            <button
              type="button"
              className="secondary compact-btn"
              onClick={handleDownloadMarkdown}
              title="Download as GitHub Flavored Markdown"
            >
              <Download size={13} /> Markdown
            </button>
            <button
              type="button"
              className="secondary compact-btn"
              onClick={handleSaveCvArtifact}
              disabled={isSaving}
              title="Simpan resume terstruktur ini ke repositori CV Lab"
            >
              <Save size={13} /> {isSaving ? 'Menyimpan...' : saveSuccess ? 'Tersimpan!' : 'Simpan ke CV Lab'}
            </button>
            <button
              type="button"
              className="primary compact-btn print-cta-btn"
              onClick={handlePrint}
              style={{ background: '#202320', color: '#f5f5f0' }}
            >
              <Printer size={14} /> Print / Save as PDF
            </button>
            <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </header>

        {copyFeedback && (
          <div className="ats-copy-alert no-print">
            <Check size={14} /> {copyFeedback}
          </div>
        )}

        {/* Modal Main Body */}
        <div className="ats-modal-body">
          {/* Left/Sidebar Control Toolbar (Hidden in @media print) */}
          <aside className="ats-controls-rail no-print">
            <div className="control-group">
              <label>Styling Template</label>
              <div className="template-picker">
                <button
                  type="button"
                  className={template === 'harvard-classic' ? 'active' : ''}
                  onClick={() => setTemplate('harvard-classic')}
                >
                  <b>Harvard Classic</b>
                  <small>Serif · Georgia · Formal Consulting/Ivy standard</small>
                </button>
                <button
                  type="button"
                  className={template === 'modern-tech' ? 'active' : ''}
                  onClick={() => setTemplate('modern-tech')}
                >
                  <b>Modern Tech Standard</b>
                  <small>Clean Sans · Calibri / Arial · Silicon Valley standard</small>
                </button>
              </div>
            </div>

            <div className="control-group">
              <label>Vertical Density (Page Fitting)</label>
              <div className="density-toggle">
                <button
                  type="button"
                  className={density === 'standard' ? 'active' : ''}
                  onClick={() => setDensity('standard')}
                >
                  Standard (1.35)
                </button>
                <button
                  type="button"
                  className={density === 'compact' ? 'active' : ''}
                  onClick={() => setDensity('compact')}
                >
                  Compact 1-Page Fit
                </button>
              </div>
              <small className="field-hint">
                Pilih <strong>Compact 1-Page Fit</strong> untuk merapatkan spasi agar pas tepat 1 halaman cetak.
              </small>
            </div>

            {/* Live ATS Diagnostics mini widget */}
            <div className="ats-mini-diagnostics">
              <div className="mini-score-header">
                <span>ATS Quality Index</span>
                <strong>{atsAudit.totalScore} / 100</strong>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${atsAudit.totalScore}%`,
                    background: atsAudit.totalScore >= 80 ? '#638c35' : '#d97706',
                  }}
                />
              </div>
              <ul className="mini-checks-list">
                <li>
                  <CheckCircle2 size={13} className="text-green" /> Single-Column (0 table tags, 0 columns)
                </li>
                <li>
                  <CheckCircle2 size={13} className="text-green" /> Standard Section Headings
                </li>
                <li>
                  <CheckCircle2 size={13} className="text-green" /> {atsAudit.quantifiedCount} / {atsAudit.totalBullets} Metrik terukur (% / $)
                </li>
                <li>
                  <CheckCircle2 size={13} className="text-green" /> {atsAudit.matchedKeywords.length} Kata kunci JD cocok
                </li>
              </ul>
            </div>

            <div className="print-tip-box">
              <Zap size={14} style={{ color: '#18181b' }} />
              <span>
                <strong>Tips Cetak PDF:</strong> Di dialog print browser, pastikan <em>Margins: Default</em> dan hilangkan centang <em>Headers and Footers</em> untuk hasil bersih 100%.
              </span>
            </div>
          </aside>

          {/* Center/Right Sheet: The Immaculate ATS Document Preview */}
          <main className="ats-preview-scroll-wrapper">
            {activeTab === 'editor' && (
              <div className="ats-editor-panel no-print">
                <h3>Edit Isi Resume</h3>
                <div className="form-grid-2">
                  <label>
                    Nama Lengkap
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </label>
                  <label>
                    Headline Target
                    <input value={targetTitle} onChange={(e) => setTargetTitle(e.target.value)} />
                  </label>
                  <label>
                    Email
                    <input value={email} onChange={(e) => setEmail(e.target.value)} />
                  </label>
                  <label>
                    Nomor WhatsApp / HP
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </label>
                  <label>
                    Lokasi Domisili
                    <input value={location} onChange={(e) => setLocation(e.target.value)} />
                  </label>
                  <label>
                    LinkedIn Profile URL
                    <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
                  </label>
                  <label>
                    GitHub Profile
                    <input value={github} onChange={(e) => setGithub(e.target.value)} />
                  </label>
                  <label>
                    Portfolio Website
                    <input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
                  </label>
                </div>

                <label style={{ marginTop: '12px', display: 'block' }}>
                  Professional Summary
                  <textarea
                    rows={4}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    style={{ width: '100%', padding: '10px', fontSize: '13px' }}
                  />
                </label>

                <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Keahlian Teknis (Categorized)</h4>
                <div className="form-grid-2">
                  <label>
                    Languages
                    <input value={skillsLanguages} onChange={(e) => setSkillsLanguages(e.target.value)} />
                  </label>
                  <label>
                    Frameworks
                    <input value={skillsFrameworks} onChange={(e) => setSkillsFrameworks(e.target.value)} />
                  </label>
                  <label>
                    Cloud & DevOps
                    <input value={skillsCloud} onChange={(e) => setSkillsCloud(e.target.value)} />
                  </label>
                  <label>
                    Databases
                    <input value={skillsDatabases} onChange={(e) => setSkillsDatabases(e.target.value)} />
                  </label>
                </div>

                <div style={{ marginTop: '20px', borderTop: '1px solid #dedfd8', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>Pengalaman Kerja & Google/Harvard XYZ Bullet Optimizer</h4>
                    <span style={{ fontSize: '11px', color: '#18181b', font: "10px 'DM Mono'" }}>
                      Formula: Accomplished [X] as measured by [Y], by doing [Z]
                    </span>
                  </div>

                  {experiences.map((exp, expIdx) => (
                    <div key={exp.id} style={{ background: '#fcfcf9', border: '1px solid #dedfd8', borderRadius: '4px', padding: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <b style={{ fontSize: '13px', color: '#202320' }}>{exp.role} @ {exp.company}</b>
                        <span style={{ fontSize: '11px', color: '#888d82' }}>{exp.period}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {exp.bullets.map((b, bIdx) => (
                          <div key={bIdx} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                            <span style={{ color: '#18181b', fontWeight: 600, marginTop: '6px' }}>•</span>
                            <textarea
                              rows={2}
                              value={b}
                              onChange={(e) => updateExperienceBullet(expIdx, bIdx, e.target.value)}
                              style={{ flex: 1, padding: '6px 8px', fontSize: '12px', border: '1px solid #dedfd8', borderRadius: '3px' }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <button
                                type="button"
                                className="secondary compact-btn"
                                onClick={() => applyXyzTemplate(expIdx, bIdx)}
                                style={{ fontSize: '10px', padding: '3px 6px', whiteSpace: 'nowrap' }}
                                title="Optimalkan dengan formula XYZ Google"
                              >
                                <Sparkles size={11} style={{ color: '#18181b' }} /> XYZ Polish
                              </button>
                              {exp.bullets.length > 1 && (
                                <button
                                  type="button"
                                  className="secondary compact-btn"
                                  onClick={() => deleteExperienceBullet(expIdx, bIdx)}
                                  style={{ fontSize: '10px', padding: '3px 6px', color: '#b43d3d' }}
                                  title="Hapus bullet"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => addExperienceBullet(expIdx)}
                        style={{
                          marginTop: '8px',
                          fontSize: '11px',
                          background: 'none',
                          border: 'none',
                          color: '#18181b',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        + Tambah Bullet Point Baru
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    className="primary compact-btn"
                    onClick={() => setActiveTab('preview')}
                  >
                    Selesai & Lihat Pratinjau Lembar
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'auditor' && (
              <div className="ats-auditor-panel no-print">
                <h3>Analisis & Diagnostik ATS Komprehensif</h3>
                <div className="ats-score-cards-grid">
                  <div className="score-card">
                    <span className="card-label">Overall Score</span>
                    <strong className="huge-score">{atsAudit.totalScore}</strong>
                    <small>/ 100 Standar Parsing</small>
                  </div>
                  <div className="score-card">
                    <span className="card-label">Target Keywords</span>
                    <strong>{atsAudit.keywordScore} / 25</strong>
                    <small>{atsAudit.matchedKeywords.length} kata kunci terdeteksi</small>
                  </div>
                  <div className="score-card">
                    <span className="card-label">Quantified Impact</span>
                    <strong>{atsAudit.metricScore} / 25</strong>
                    <small>{atsAudit.quantifiedCount} bullet dengan metrik</small>
                  </div>
                  <div className="score-card">
                    <span className="card-label">Action Verbs</span>
                    <strong>{atsAudit.verbScore} / 25</strong>
                    <small>{atsAudit.foundVerbs.length} kata kerja terkuat</small>
                  </div>
                </div>

                <div className="audit-detail-section">
                  <h4>Kata Kunci Lowongan yang Terdeteksi</h4>
                  <div className="tag-cloud">
                    {targetKeywords.map((kw) => {
                      const matched = atsAudit.matchedKeywords.includes(kw);
                      return (
                        <span
                          key={kw}
                          className={`tag-pill ${matched ? 'skill' : 'missing'}`}
                          style={{
                            background: matched ? '#edf2e3' : '#f5f5f0',
                            color: matched ? '#455928' : '#888d82',
                            border: `1px solid ${matched ? '#cfddbe' : '#e0e0e0'}`,
                          }}
                        >
                          {matched ? <Check size={12} /> : <X size={12} />} {kw}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {atsAudit.detectedBuzzwords.length > 0 && (
                  <div className="slop-warning-box">
                    <AlertTriangle size={16} />
                    <div>
                      <strong>Peringatan Fluff/Buzzword Terdeteksi:</strong>
                      <p>
                        Kata berikut tergolong klise generik tanpa bobot teknis:{' '}
                        <em>{atsAudit.detectedBuzzwords.join(', ')}</em>. Disarankan menggantinya dengan pencapaian spesifik.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* THE IMMACULATE HARVARD RESUME SHEET */}
            <div
              className={`ats-printable-document ${template} ${density}`}
              id="ats-print-root"
            >
              {/* SECTION: Header */}
              <div className="resume-header">
                <h1 className="resume-name">{fullName.toUpperCase()}</h1>
                <div className="resume-contact-line">
                  <span>{location}</span>
                  <span className="sep">·</span>
                  <span>{phone}</span>
                  <span className="sep">·</span>
                  <span>{email}</span>
                  <span className="sep">·</span>
                  <span>{linkedin}</span>
                  <span className="sep">·</span>
                  <span>{github}</span>
                </div>
              </div>

              {/* SECTION: Summary */}
              {summary && (
                <section className="resume-section">
                  <h2 className="resume-heading">PROFESSIONAL SUMMARY</h2>
                  <p className="resume-summary-text">{summary}</p>
                </section>
              )}

              {/* SECTION: Technical Skills */}
              <section className="resume-section">
                <h2 className="resume-heading">TECHNICAL SKILLS</h2>
                <div className="resume-skills-block">
                  <p className="skills-line">
                    <strong>Languages:</strong> {skillsLanguages}
                  </p>
                  <p className="skills-line">
                    <strong>Frameworks & Libraries:</strong> {skillsFrameworks}
                  </p>
                  <p className="skills-line">
                    <strong>Cloud & Infrastructure:</strong> {skillsCloud}
                  </p>
                  <p className="skills-line">
                    <strong>Databases & Messaging:</strong> {skillsDatabases}
                  </p>
                  <p className="skills-line">
                    <strong>Methodologies & Core Competencies:</strong> {skillsMethodologies}
                  </p>
                </div>
              </section>

              {/* SECTION: Work Experience */}
              <section className="resume-section">
                <h2 className="resume-heading">PROFESSIONAL EXPERIENCE</h2>
                {experiences.map((exp) => (
                  <div className="resume-experience-item" key={exp.id}>
                    <div className="experience-head-row">
                      <div className="experience-title-company">
                        <strong className="company-name">{exp.company}</strong>
                        <span className="role-sep">, </span>
                        <span className="job-role">{exp.role}</span>
                      </div>
                      <div className="experience-meta-row">
                        <span className="exp-location">{exp.location}</span>
                        <span className="sep">·</span>
                        <span className="exp-period">{exp.period}</span>
                      </div>
                    </div>
                    <ul className="resume-bullets">
                      {exp.bullets.map((bullet, bIdx) => (
                        <li key={bIdx}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>

              {/* SECTION: Education */}
              <section className="resume-section">
                <h2 className="resume-heading">EDUCATION</h2>
                {education.map((edu) => (
                  <div className="resume-education-item" key={edu.id}>
                    <div className="education-head-row">
                      <div className="education-title">
                        <strong className="institution-name">{edu.institution}</strong>
                        <span className="degree-name">, {edu.degree}</span>
                      </div>
                      <div className="education-meta">
                        <span>{edu.location}</span>
                        <span className="sep">·</span>
                        <span>{edu.period}</span>
                      </div>
                    </div>
                    {edu.honors && <p className="edu-honors">{edu.honors}</p>}
                  </div>
                ))}
              </section>

              {/* SECTION: Certifications */}
              {certifications.length > 0 && (
                <section className="resume-section">
                  <h2 className="resume-heading">CERTIFICATIONS & CREDENTIALS</h2>
                  <ul className="resume-bullets certifications-list">
                    {certifications.map((c, cIdx) => (
                      <li key={cIdx}>{c}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
