import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Clipboard, ExternalLink, FileText, Link2, Mail, Plus, Printer, Sparkles, WandSparkles } from 'lucide-react';
import type { ApplicationDraft, CVArtifact } from '../../lib/pb-types';
import { buildEmail, buildSubject, matchAgainstEvidence, parseJobPosting, validateDraft, type ParsedJobPosting, type ParsedPosition } from '../../lib/applyflow';
import { useApplyFlowDraft } from '../../hooks/useApplyFlowDraft';
import { AtsResumeFormatterModal } from '../resume-formatter/AtsResumeFormatterModal';

type Step = 'paste' | 'understand' | 'match' | 'compose' | 'review';
const steps: { id: Step; label: string; helper: string }[] = [
  { id: 'paste', label: 'Paste', helper: 'Bring in the source' },
  { id: 'understand', label: 'Understand', helper: 'Review extracted facts' },
  { id: 'match', label: 'Match', helper: 'Choose verified evidence' },
  { id: 'compose', label: 'Compose', helper: 'Tailor the email' },
  { id: 'review', label: 'Review & apply', helper: 'Prepare, never auto-send' },
];

const starterText = `Paste the complete job advertisement here. ApplyFlow keeps the original text and only uses facts you confirm.\n\nExample:\nPT Example Teknologi\nIT Engineer L0\nIT Engineer L1\nLocation: Jakarta\nWork arrangement: WFO / shift\nSend updated CV to recruiter@example.com\nSubject: Nama_Posisi yang dilamar`;

export function ApplyFlowView({
  cvs,
  add,
  initialData,
}: {
  cvs: CVArtifact[];
  add: (application: ApplicationDraft) => Promise<unknown>;
  initialData?: { title: string; company: string; rawJd: string; url?: string; source?: string } | null;
}) {
  const [step, setStep] = useState<Step>('paste');
  const [rawText, setRawText] = useState(initialData?.rawJd || '');
  const [job, setJob] = useState<ParsedJobPosting | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [evidence, setEvidence] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [selectedCv, setSelectedCv] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState(initialData?.source || '');
  const [sourceUrl, setSourceUrl] = useState(initialData?.url || '');
  const [message, setMessage] = useState(initialData ? `Loaded posting for ${initialData.company} - ${initialData.title}. Click Understand to parse.` : '');
  const [confirmed, setConfirmed] = useState(false);
  const [savedPositions, setSavedPositions] = useState<string[]>([]);
  const [showAtsModal, setShowAtsModal] = useState(false);
  const { saveDraft, saving: savingDraft } = useApplyFlowDraft();
  const position = job?.positions.find(item => item.id === selectedPositionId) || job?.positions[0];
  const selectedCV = cvs.find(cv => cv.id === selectedCv);
  const validation = useMemo(() => job && position ? validateDraft(job, position, subject, body, selectedCV?.label || '') : { errors: [], warnings: [] }, [job, position, subject, body, selectedCV]);
  const matches = useMemo(() => position ? matchAgainstEvidence(position, evidence) : [], [position, evidence]);

  // Synchronize initialData when promoted from Job Hunter or Inbox
  useEffect(() => {
    if (initialData) {
      setRawText(initialData.rawJd || '');
      setSourcePlatform(initialData.source || '');
      setSourceUrl(initialData.url || '');
      setMessage(`Loaded posting for ${initialData.company} - ${initialData.title}. Click Understand to parse.`);
      setStep('paste');
      setJob(null);
      setConfirmed(false);
    }
  }, [initialData]);

  const analyze = async () => {
    if (!rawText.trim()) return setMessage('Paste the job advertisement first.');
    const parsed = parseJobPosting(rawText);
    parsed.sourcePlatform = sourcePlatform;
    parsed.sourceUrl = sourceUrl;
    setJob(parsed);
    setSelectedPositionId(parsed.positions[0]?.id || '');
    setConfirmed(false);
    try {
      await saveDraft({ rawText: parsed.rawText, sourcePlatform: parsed.sourcePlatform, sourceUrl: parsed.sourceUrl, parsedData: parsed, selectedPositionId: parsed.positions[0]?.id || '', selectedCvArtifact: '', candidateName, evidence, subject: '', body: '', state: 'draft', applicationIds: [] });
      setMessage('Draft extraction ready and saved privately. Review every important field before continuing.');
    } catch (_) {
      setMessage('Draft extraction ready locally. PocketBase could not save it yet.');
    }
    setStep('understand');
  };

  const choosePosition = (id: string) => {
    const next = job?.positions.find(item => item.id === id);
    if (!next || !job) return;
    setSelectedPositionId(id);
    setSubject(buildSubject(job, next));
    setBody(buildEmail(job, next, candidateName, evidence, selectedCV?.label || ''));
  };

  const goMatch = () => {
    if (!job || !position) return;
    setSubject(buildSubject(job, position));
    setBody(buildEmail(job, position, candidateName, evidence, selectedCV?.label || ''));
    setStep('match');
  };

  const goCompose = () => {
    if (!job || !position) return;
    setSubject(buildSubject(job, position));
    setBody(buildEmail(job, position, candidateName, evidence, selectedCV?.label || ''));
    setStep('compose');
  };

  const persistDraft = async (state: 'draft'|'copied'|'compose_opened') => {
    if (!job) return;
    try {
      await saveDraft({ rawText: job.rawText, sourcePlatform: job.sourcePlatform, sourceUrl: job.sourceUrl, parsedData: job, selectedPositionId, selectedCvArtifact: selectedCv, candidateName, evidence, subject, body, state, applicationIds: [] });
    } catch (_) {
      setMessage('The action is available, but the latest draft could not sync to PocketBase.');
    }
  };

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      await persistDraft('copied');
      setMessage(`${label} copied. This is not proof that an email was sent.`);
    } catch (_) {
      setMessage('Clipboard access was blocked. Select and copy the text from the preview manually.');
    }
  };

  const openCompose = async () => {
    if (!job?.recruiterEmail) return setMessage('No confirmed recruiter email is available for compose.');
    if (!confirmed || validation.errors.length) return setMessage('Resolve the validation errors and confirm the review checklist first.');
    await persistDraft('compose_opened');
    window.location.href = `mailto:${encodeURIComponent(job.recruiterEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setMessage('Your mail client was opened. Attach files and send manually after review.');
  };

  const saveApplication = async (positionToSave: ParsedPosition) => {
    if (!job) return;
    if (job.mode === 'Unknown') throw new Error('Confirm the work arrangement in the parser review before adding this position.');
    await add({
      company: job.company || 'Company to confirm',
      position: positionToSave.title,
      link: job.sourceUrl,
      contactName: job.recruiterName,
      contact: job.recruiterEmail,
      location: job.location || 'Unknown',
      type: /vendor|outsource|agency/i.test(job.employmentType) ? 'Vendor / Outsource' : /contract|freelance/i.test(job.employmentType) ? 'Contract' : 'In-house',
      mode: job.mode,
      salaryMin: 0,
      salaryMax: 0,
      salaryPeriod: 'monthly',
      status: confirmed ? 'Applied' : 'Wishlist',
      sentAt: new Date().toISOString().slice(0, 10),
      cvVersion: selectedCV?.version || '',
      notes: `ApplyFlow source${job.sourcePlatform ? `: ${job.sourcePlatform}` : ''}. Original posting preserved in this workspace draft.`,
    });
    setSavedPositions(current => [...current, positionToSave.id]);
    await persistDraft('draft');
  };

  return <section className="applyflow-page">
    <div className="applyflow-intro">
      <div>
        <p className="eyebrow">APPLYFLOW · SMART JOB APPLICATION STUDIO</p>
        <h1>From posting to<br/><em>ready to apply.</em></h1>
        <p className="lede">One reusable profile, multiple career directions. ApplyFlow keeps the original ad, highlights what is verified, and leaves the final send in your hands.</p>
      </div>
      <div className="applyflow-promise"><Sparkles size={17}/><span>Human approval at every step<br/><small>Local parser fallback · no scraping · no auto-send</small></span></div>
    </div>

    <div className="applyflow-shell">
      <aside className="applyflow-rail" aria-label="ApplyFlow steps">
        {steps.map((item, index) => <button key={item.id} className={step === item.id ? 'active' : ''} onClick={() => index <= steps.findIndex(current => current.id === step) ? setStep(item.id) : undefined} disabled={index > steps.findIndex(current => current.id === step)}><span className="step-number">{index + 1}</span><span><b>{item.label}</b><small>{item.helper}</small></span></button>)}
        <div className="applyflow-rail-note"><b>Draft, not delivery.</b><span>Copying or opening Gmail never marks an application as sent.</span></div>
      </aside>

      <div className="applyflow-content">
        {step === 'paste' && <PasteStep rawText={rawText} setRawText={setRawText} sourcePlatform={sourcePlatform} setSourcePlatform={setSourcePlatform} sourceUrl={sourceUrl} setSourceUrl={setSourceUrl} analyze={analyze}/>} 
        {step === 'understand' && job && <UnderstandStep job={job} setJob={setJob} position={position} selectedPositionId={selectedPositionId} choosePosition={choosePosition} goMatch={goMatch} onBack={() => setStep('paste')}/>} 
        {step === 'match' && job && position && <MatchStep job={job} position={position} evidence={evidence} setEvidence={setEvidence} candidateName={candidateName} setCandidateName={setCandidateName} matches={matches} selectedCv={selectedCV} cvs={cvs} setSelectedCv={setSelectedCv} goCompose={goCompose} onBack={() => setStep('understand')}/>} 
        {step === 'compose' && job && position && <ComposeStep job={job} position={position} subject={subject} setSubject={setSubject} body={body} setBody={setBody} validation={validation} goReview={() => setStep('review')} goBack={() => setStep('match')} onOpenAtsModal={() => setShowAtsModal(true)}/>} 
        {step === 'review' && job && position && <ReviewStep job={job} position={position} subject={subject} body={body} selectedCV={selectedCV} validation={validation} copy={copy} openCompose={openCompose} saveApplication={saveApplication} savedPositions={savedPositions} allPositions={job.positions} setStep={setStep} message={message} confirmed={confirmed} setConfirmed={setConfirmed} savingDraft={savingDraft} onOpenAtsModal={() => setShowAtsModal(true)}/>} 
        {message && <p className="applyflow-message" role="status"><Check size={14}/>{message}</p>}
      </div>
    </div>
    <AtsResumeFormatterModal
      isOpen={showAtsModal}
      onClose={() => setShowAtsModal(false)}
      targetJobPosting={job && position ? { company: job.company, title: position.title, skills: position.skills, rawJd: job.rawText } : null}
      cvArtifact={selectedCV}
      initialEvidence={evidence}
    />
  </section>;
}

function StepHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="applyflow-step-header"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div>; }

function PasteStep({ rawText, setRawText, sourcePlatform, setSourcePlatform, sourceUrl, setSourceUrl, analyze }: { rawText:string; setRawText:(value:string)=>void; sourcePlatform:string; setSourcePlatform:(value:string)=>void; sourceUrl:string; setSourceUrl:(value:string)=>void; analyze:()=>void }) { return <div className="applyflow-step">
  <StepHeader eyebrow="01 · JOB POSTING INBOX" title="Start with the source." description="Paste the complete advertisement from LinkedIn, WhatsApp, Telegram, JobStreet, a company website, or anywhere else. The original text stays intact."/>
  <div className="applyflow-form-grid"><label>Source platform<select value={sourcePlatform} onChange={event => setSourcePlatform(event.target.value)}><option value="">Unknown / not specified</option><option>LinkedIn</option><option>WhatsApp</option><option>Telegram</option><option>Instagram</option><option>JobStreet</option><option>Glints</option><option>Company website</option><option>Other</option></select></label><label>Source URL <span className="optional">optional</span><div className="input-with-icon"><Link2 size={14}/><input value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} placeholder="https://..."/></div></label></div>
  <label className="textarea-label">Complete job advertisement<textarea autoFocus value={rawText} onChange={event => setRawText(event.target.value)} placeholder={starterText}/></label>
  <div className="applyflow-actions"><span className="helper-text"><FileText size={14}/> Original text is preserved as your source of truth.</span><button className="primary" onClick={analyze}><WandSparkles size={17}/> Analyze posting <ArrowRight size={15}/></button></div>
 </div>; }

function UnderstandStep({ job, setJob, position, selectedPositionId, choosePosition, goMatch, onBack }: { job:ParsedJobPosting; setJob:(job:ParsedJobPosting)=>void; position?:ParsedPosition; selectedPositionId:string; choosePosition:(id:string)=>void; goMatch:()=>void; onBack:()=>void }) { return <div className="applyflow-step">
  <StepHeader eyebrow="02 · JOB PARSER REVIEW" title="Make the facts yours." description="This is a deterministic first pass, not a verdict. Correct anything uncertain before using it in an application."/>
  <div className="applyflow-fact-grid"><label>Company<input value={job.company} onChange={event => setJob({...job, company:event.target.value})} placeholder="Unknown"/></label><label>Location<input value={job.location} onChange={event => setJob({...job, location:event.target.value})} placeholder="Unknown"/></label><label>Work arrangement<select value={job.mode} onChange={event => setJob({...job, mode:event.target.value as ParsedJobPosting['mode']})}><option>Unknown</option><option>On-site</option><option>Hybrid</option><option>Remote</option></select></label><label>Recruiter email<input value={job.recruiterEmail} onChange={event => setJob({...job, recruiterEmail:event.target.value})} placeholder="Not found"/></label><label>Subject instruction<input value={job.subjectInstruction} onChange={event => setJob({...job, subjectInstruction:event.target.value})} placeholder="No exact format found"/></label></div>
  <div className="applyflow-panel"><div className="panel-heading"><div><p className="eyebrow">POSITIONS DETECTED</p><h3>Choose a target</h3></div><span className="confidence-tag">{job.positions.length} position{job.positions.length === 1 ? '' : 's'}</span></div><div className="position-list">{job.positions.map(item => <label className={`position-option ${selectedPositionId === item.id ? 'selected' : ''}`} key={item.id}><input type="radio" name="target-position" checked={selectedPositionId === item.id} onChange={() => choosePosition(item.id)}/><span><b>{item.title}</b><small>{job.location || 'Location unknown'} · {job.mode}</small></span><Check size={16}/></label>)}</div></div>
  <div className="instruction-row"><AlertTriangle size={16}/><span>{job.requiredDocuments.length ? `Recruiter signals: ${job.requiredDocuments.join(', ')}.` : 'No attachment instruction was confidently detected.'} Review the original posting before sending.</span></div>
  <details className="source-details"><summary>View original job advertisement</summary><pre>{job.rawText}</pre></details>
  <StepActions backLabel="Back to paste" onBack={onBack} nextLabel="Continue to matching" onNext={goMatch} disabled={!position}/>
 </div>; }

function MatchStep({ job, position, evidence, setEvidence, candidateName, setCandidateName, matches, selectedCv, cvs, setSelectedCv, goCompose, onBack }: { job:ParsedJobPosting; position:ParsedPosition; evidence:string; setEvidence:(value:string)=>void; candidateName:string; setCandidateName:(value:string)=>void; matches:{requirement:string;group:string;evidence:string}[]; selectedCv?:CVArtifact; cvs:CVArtifact[]; setSelectedCv:(value:string)=>void; goCompose:()=>void; onBack:()=>void }) { return <div className="applyflow-step">
  <StepHeader eyebrow="03 · CAREER MATCHING" title="Use evidence, not guesswork." description="Add only facts you personally confirm. ApplyFlow will never turn missing profile data into a rejection or invent a capability."/>
  <div className="applyflow-fact-grid"><label>Your name<input value={candidateName} onChange={event => setCandidateName(event.target.value)} placeholder="Used in the sign-off"/></label><label>CV for this application<select value={selectedCv?.id || ''} onChange={event => setSelectedCv(event.target.value)}><option value="">Select a CV version</option>{cvs.map(cv => <option key={cv.id} value={cv.id}>{cv.label} · {cv.version}</option>)}</select></label></div>
  <label className="textarea-label">Verified profile evidence <span className="optional">one fact per line</span><textarea value={evidence} onChange={event => setEvidence(event.target.value)} placeholder="e.g. Managed Linux incident response for a 24/7 platform\nWorked with Docker and Kubernetes in production\nCoordinated vendor escalations and service reviews"/></label>
  <div className="match-grid"><div className="applyflow-panel"><div className="panel-heading"><div><p className="eyebrow">REQUIREMENT CHECK</p><h3>{position.title}</h3></div><Sparkles size={17}/></div>{matches.length ? matches.map(item => <div className="match-row" key={item.requirement}><span className={`match-dot ${item.group.toLowerCase().replace(' ','-')}`}/><div><b>{item.requirement}</b><small>{item.group} · {item.evidence}</small></div></div>) : <p className="empty-copy">No structured requirements detected yet. Your evidence will still be available to the email editor.</p>}</div><div className="applyflow-panel evidence-panel"><p className="eyebrow">SELECTED DOCUMENT</p><h3>{selectedCv?.label || 'No CV selected'}</h3><p>{selectedCv ? `${selectedCv.version} · verify the file is current before attaching it.` : 'Choose a CV from your Document Center before preparing the email.'}</p></div></div>
  <StepActions backLabel="Back to parser" onBack={onBack} nextLabel="Build professional email" onNext={goCompose}/>
 </div>; }

function ComposeStep({ job, position, subject, setSubject, body, setBody, validation, goReview, goBack, onOpenAtsModal }: { job:ParsedJobPosting; position:ParsedPosition; subject:string; setSubject:(value:string)=>void; body:string; setBody:(value:string)=>void; validation:{errors:string[];warnings:string[]}; goReview:()=>void; goBack:()=>void; onOpenAtsModal?:()=>void }) { return <div className="applyflow-step">
  <StepHeader eyebrow="04 · EMAIL STUDIO" title="Make the next move clear." description="The default is a detailed professional cover email. Edit freely; the generated version is only a starting point."/>
  <div className="compose-meta"><span><Mail size={15}/>{job.recruiterEmail || 'Recipient not confirmed'}</span><span><FileText size={15}/>{position.title}</span>{onOpenAtsModal && <button type="button" className="secondary compact-btn" onClick={onOpenAtsModal} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f4f6ed', border: '1px solid #c9d7b5', color: '#3d5223' }}><Printer size={13}/> Format Harvard ATS Resume</button>}</div>
  <label className="textarea-label">Subject<input value={subject} onChange={event => setSubject(event.target.value)}/></label>
  <label className="textarea-label">Professional cover email<textarea className="email-editor" value={body} onChange={event => setBody(event.target.value)}/></label>
  {validation.warnings.length > 0 && <div className="validation-box warning"><AlertTriangle size={16}/><div>{validation.warnings.map(warning => <p key={warning}>{warning}</p>)}</div></div>}
  <StepActions backLabel="Back to matching" onBack={goBack} nextLabel="Review & prepare" onNext={goReview}/>
 </div>; }

function ReviewStep({ job, position, subject, body, selectedCV, validation, copy, openCompose, saveApplication, savedPositions, allPositions, setStep, message, confirmed, setConfirmed, savingDraft, onOpenAtsModal }: { job:ParsedJobPosting; position:ParsedPosition; subject:string; body:string; selectedCV?:CVArtifact; validation:{errors:string[];warnings:string[]}; copy:(value:string,label:string)=>void; openCompose:()=>void; saveApplication:(position:ParsedPosition)=>Promise<void>; savedPositions:string[]; allPositions:ParsedPosition[]; setStep:(step:Step)=>void; message:string; confirmed:boolean; setConfirmed:(value:boolean)=>void; savingDraft:boolean; onOpenAtsModal?:()=>void }) { const [saving,setSaving] = useState(false); const [error,setError] = useState(''); const canPrepare = confirmed && validation.errors.length === 0; const save = async (target:ParsedPosition) => { if (!canPrepare) { setError('Confirm the review checklist and resolve validation errors first.'); return; } setSaving(true); setError(''); try { await saveApplication(target); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add application'); } finally { setSaving(false); } }; return <div className="applyflow-step">
  <StepHeader eyebrow="05 · REVIEW & APPLY" title="Ready when you are." description="Prepare the email, attach files manually in your mail client, and record the selected position in your private pipeline. Nothing is sent automatically."/>
  <div className="review-grid"><div className="applyflow-panel review-card"><div className="panel-heading"><div><p className="eyebrow">EMAIL PREVIEW</p><h3>{subject || 'Subject to confirm'}</h3></div><span className="status-pill">Draft</span></div><div className="preview-recipient">To: {job.recruiterEmail || 'No confirmed recipient'}</div><pre className="email-preview">{body || 'Write the email in the previous step.'}</pre><div className="review-actions"><button className="secondary" onClick={() => copy(subject, 'Subject')}><Clipboard size={15}/> Copy subject</button><button className="secondary" onClick={() => copy(body, 'Body')}><Clipboard size={15}/> Copy body</button><button className="primary" onClick={() => copy(`Subject: ${subject}\n\n${body}`, 'Subject + body')}><Clipboard size={15}/> Copy all</button></div></div>
    <div className="applyflow-panel checklist"><p className="eyebrow">ATTACHMENT CHECKLIST</p><h3>Before you prepare</h3><Checklist label={selectedCV ? `${selectedCV.label} selected` : 'Select a CV version'} done={Boolean(selectedCV)}/>{job.requiredDocuments.filter(document => document !== 'CV / Resume' && document !== 'Updated CV').map(document => <Checklist key={document} label={`${document} (attach manually)`} done={false}/>)}<Checklist label="Review subject and recipient" done={Boolean(subject && (job.recruiterEmail || !validation.errors.length))}/><label className="review-confirm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/><span>I reviewed the recipient, subject, body, and attachment instructions.</span></label>{onOpenAtsModal && <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #dcdbd4' }}><button type="button" className="secondary full" onClick={onOpenAtsModal} style={{ width: '100%', background: '#edf2e3', border: '1px solid #cfddbe', color: '#455928', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontWeight: 600, padding: '10px' }}><Printer size={15}/> 1-Click Printable ATS Resume (Harvard Standard)</button></div>}<div className="instruction-row compact"><AlertTriangle size={15}/><span>Opening compose is not sending. Local files cannot be attached by mailto.</span></div></div></div>
  {validation.errors.length > 0 && <div className="validation-box error"><AlertTriangle size={16}/><div>{validation.errors.map(item => <p key={item}>{item}</p>)}</div></div>}
  {error && <div className="validation-box error"><AlertTriangle size={16}/><p>{error}</p></div>}
  <div className="review-toolbar"><div><b>Save each selected position separately</b><small>One posting can create independent pipeline records.</small></div><div className="position-save-list">{allPositions.map(item => <button key={item.id} className="secondary" disabled={saving || !canPrepare || savedPositions.includes(item.id)} onClick={() => save(item)}>{savedPositions.includes(item.id) ? <Check size={15}/> : <Plus size={15}/>} {savedPositions.includes(item.id) ? 'Added' : `Add ${item.title}`}</button>)}</div></div>
  <div className="applyflow-actions"><button className="secondary" onClick={() => setStep('compose')}><ArrowLeft size={15}/> Edit email</button><div className="review-primary-actions"><button className="secondary" disabled={!job.recruiterEmail || !canPrepare} onClick={openCompose}><ExternalLink size={15}/> Open compose</button><button className="primary" onClick={() => copy(`Subject: ${subject}\n\n${body}`, 'Application')}><Clipboard size={15}/> Copy & keep as draft</button></div></div>
  {(message || savingDraft) && <p className="helper-text">{savingDraft ? 'Saving ApplyFlow draft…' : message}</p>}
 </div>; }

function Checklist({ label, done }: { label:string; done:boolean }) { return <div className="checklist-row"><span className={done ? 'done' : ''}>{done ? <Check size={13}/> : <span/>}</span><p>{label}</p></div>; }
function StepActions({ backLabel, onBack, nextLabel, onNext, disabled }: { backLabel:string; onBack:()=>void; nextLabel:string; onNext:()=>void; disabled?:boolean }) { return <div className="applyflow-actions"><button className="secondary" onClick={onBack}><ArrowLeft size={15}/>{backLabel}</button><button className="primary" disabled={disabled} onClick={onNext}>{nextLabel}<ArrowRight size={15}/></button></div>; }
