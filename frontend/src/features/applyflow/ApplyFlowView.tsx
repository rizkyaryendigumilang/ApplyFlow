import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Clipboard, ExternalLink, FileText, Link2, Mail, Plus, Printer, Search } from 'lucide-react';
import type { ApplicationDraft, CVArtifact } from '../../lib/pb-types';
import { buildEmail, buildSubject, matchAgainstEvidence, parseJobPosting, validateDraft, type ParsedJobPosting, type ParsedPosition } from '../../lib/applyflow';
import { useApplyFlowDraft } from '../../hooks/useApplyFlowDraft';
import { AtsResumeFormatterModal } from '../resume-formatter/AtsResumeFormatterModal';

type Step = 'paste' | 'understand' | 'match' | 'compose' | 'review';
const steps: { id: Step; label: string; helper: string }[] = [
  { id: 'paste', label: '1. Sumber Lowongan', helper: 'Salin teks iklan lowongan' },
  { id: 'understand', label: '2. Tinjau Data', helper: 'Periksa hasil ekstraksi posisi' },
  { id: 'match', label: '3. Bukti Kualifikasi', helper: 'Pilih bukti dan versi CV' },
  { id: 'compose', label: '4. Draf Email', helper: 'Sesuaikan draf pesan pengantar' },
  { id: 'review', label: '5. Siapkan Lamaran', helper: 'Siapkan draf tanpa kirim otomatis' },
];

const starterText = `Tempel iklan lowongan kerja lengkap di sini. ApplyFlow mempertahankan teks asli dan hanya menggunakan fakta yang Anda konfirmasi.\n\nContoh:\nPT Teknologi Nusantara\nPosisi: IT Support Specialist\nLokasi: Jakarta\nMode kerja: Remote / Hybrid\nKirimkan CV terbaru ke: hrd@perusahaan.com\nSubjek email: Lamaran_IT Support Specialist_Nama`;

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
  const [message, setMessage] = useState(initialData ? `Memuat lowongan untuk ${initialData.company} - ${initialData.title}. Klik Analisis Isi Lowongan untuk membaca data.` : '');
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
      setMessage(`Memuat lowongan untuk ${initialData.company} - ${initialData.title}. Klik Analisis Isi Lowongan untuk membaca data.`);
      setStep('paste');
      setJob(null);
      setConfirmed(false);
    }
  }, [initialData]);

  const analyze = async () => {
    if (!rawText.trim()) return setMessage('Tempel teks iklan lowongan terlebih dahulu.');
    const parsed = parseJobPosting(rawText);
    parsed.sourcePlatform = sourcePlatform;
    parsed.sourceUrl = sourceUrl;
    setJob(parsed);
    setSelectedPositionId(parsed.positions[0]?.id || '');
    setConfirmed(false);
    try {
      await saveDraft({ rawText: parsed.rawText, sourcePlatform: parsed.sourcePlatform, sourceUrl: parsed.sourceUrl, parsedData: parsed, selectedPositionId: parsed.positions[0]?.id || '', selectedCvArtifact: '', candidateName, evidence, subject: '', body: '', state: 'draft', applicationIds: [] });
      setMessage('Ekstraksi draf selesai dan tersimpan privat. Tinjau setiap bidang penting sebelum melanjutkan.');
    } catch (_) {
      setMessage('Ekstraksi draf siap di memori lokal. Sinkronisasi database tertunda.');
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
      setMessage('Tindakan berhasil dicatat, sinkronisasi database akan berjalan otomatis.');
    }
  };

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      await persistDraft('copied');
      setMessage(`${label} berhasil disalin. Langkah ini belum menandai email terkirim.`);
    } catch (_) {
      setMessage('Akses papan klip dibatasi peramban. Silakan salin teks langsung dari tampilan pratinjau.');
    }
  };

  const openCompose = async () => {
    if (!job?.recruiterEmail) return setMessage('Alamat email perekrut belum terisi. Lengkapi email tujuan terlebih dahulu.');
    if (!confirmed || validation.errors.length) return setMessage('Selesaikan catatan validasi dan centang konfirmasi sebelum membuka email.');
    await persistDraft('compose_opened');
    window.location.href = `mailto:${encodeURIComponent(job.recruiterEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setMessage('Aplikasi email Anda telah dibuka. Lampirkan berkas CV secara manual sebelum mengirim.');
  };

  const saveApplication = async (positionToSave: ParsedPosition) => {
    if (!job) return;
    if (job.mode === 'Unknown') throw new Error('Tentukan mode kerja (Remote/Hybrid/On-site) sebelum menambahkan posisi ini.');
    await add({
      company: job.company || 'Perusahaan Ditinjau',
      position: positionToSave.title,
      link: job.sourceUrl,
      contactName: job.recruiterName,
      contact: job.recruiterEmail,
      location: job.location || 'Lokasi belum ditentukan',
      type: /vendor|outsource|agency/i.test(job.employmentType) ? 'Vendor / Outsource' : /contract|freelance/i.test(job.employmentType) ? 'Contract' : 'In-house',
      mode: job.mode,
      salaryMin: 0,
      salaryMax: 0,
      salaryPeriod: 'monthly',
      status: confirmed ? 'Applied' : 'Wishlist',
      sentAt: new Date().toISOString().slice(0, 10),
      cvVersion: selectedCV?.version || '',
      notes: `Sumber ApplyFlow${job.sourcePlatform ? `: ${job.sourcePlatform}` : ''}. Teks iklan asli tersimpan privat di draf workspace.`,
    });
    setSavedPositions(current => [...current, positionToSave.id]);
    await persistDraft('draft');
  };

  return <section className="applyflow-page">
    <div className="applyflow-intro">
      <div>
        <p className="eyebrow">APPLYFLOW · STUDIO LAMARAN KERJA</p>
        <h1>Draf Lamaran Siap Kirim</h1>
        <p className="lede">Satu profil terarah untuk berbagai peluang kerja. ApplyFlow menjaga teks iklan asli, mengecek kecocokan kualifikasi, dan menyerahkan kendali pengiriman sepenuhnya kepada Anda.</p>
      </div>
      <div className="applyflow-promise"><Check size={16}/><span>Kendali Penuh Pelamar<br/><small>Draf tersimpan privat tanpa pengiriman otomatis</small></span></div>
    </div>

    <div className="applyflow-shell">
      <aside className="applyflow-rail" aria-label="Langkah ApplyFlow">
        {steps.map((item, index) => <button key={item.id} className={step === item.id ? 'active' : ''} onClick={() => index <= steps.findIndex(current => current.id === step) ? setStep(item.id) : undefined} disabled={index > steps.findIndex(current => current.id === step)}><span className="step-number">{index + 1}</span><span><b>{item.label}</b><small>{item.helper}</small></span></button>)}
        <div className="applyflow-rail-note"><b>Draf, bukan pengiriman otomatis.</b><span>Menyalin draf atau membuka aplikasi email tidak otomatis menandai lamaran terkirim.</span></div>
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
  <StepHeader eyebrow="01 · KOTAK SUMBER LOWONGAN" title="Mulai dari Teks Iklan Asli" description="Tempel teks iklan lowongan lengkap dari LinkedIn, JobStreet, Glints, situs karier perusahaan, atau kanal lainnya. Teks asli akan tersimpan utuh."/>
  <div className="applyflow-form-grid"><label>Platform asal lowongan<select value={sourcePlatform} onChange={event => setSourcePlatform(event.target.value)}><option value="">Tidak ditentukan / Lainnya</option><option>LinkedIn</option><option>JobStreet</option><option>Glints</option><option>Situs Web Perusahaan</option><option>WhatsApp</option><option>Telegram</option><option>Lainnya</option></select></label><label>Tautan URL lowongan <span className="optional">(opsional)</span><div className="input-with-icon"><Link2 size={14}/><input value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} placeholder="https://..."/></div></label></div>
  <label className="textarea-label">Teks lengkap iklan lowongan pekerjaan<textarea autoFocus value={rawText} onChange={event => setRawText(event.target.value)} placeholder={starterText}/></label>
  <div className="applyflow-actions"><span className="helper-text"><FileText size={14}/> Teks asli tetap dijaga sebagai acuan utama Anda.</span><button className="primary" onClick={analyze}><Search size={16}/> Analisis Isi Lowongan <ArrowRight size={15}/></button></div>
 </div>; }

function UnderstandStep({ job, setJob, position, selectedPositionId, choosePosition, goMatch, onBack }: { job:ParsedJobPosting; setJob:(job:ParsedJobPosting)=>void; position?:ParsedPosition; selectedPositionId:string; choosePosition:(id:string)=>void; goMatch:()=>void; onBack:()=>void }) { return <div className="applyflow-step">
  <StepHeader eyebrow="02 · TINJAU HASIL EKSTRAKSI" title="Pastikan Rincian Sesuai Fakta" description="Periksa dan perbaiki nama perusahaan, mode kerja, atau email perekrut sebelum melanjutkan."/>
  <div className="applyflow-fact-grid"><label>Nama Perusahaan<input value={job.company} onChange={event => setJob({...job, company:event.target.value})} placeholder="Belum ditentukan"/></label><label>Lokasi Penempatan<input value={job.location} onChange={event => setJob({...job, location:event.target.value})} placeholder="Belum ditentukan"/></label><label>Mode Kerja<select value={job.mode} onChange={event => setJob({...job, mode:event.target.value as ParsedJobPosting['mode']})}><option value="Unknown">Belum ditentukan</option><option value="On-site">On-site</option><option value="Hybrid">Hybrid</option><option value="Remote">Remote</option></select></label><label>Email Perekrut / HRD<input value={job.recruiterEmail} onChange={event => setJob({...job, recruiterEmail:event.target.value})} placeholder="hrd@perusahaan.com"/></label><label>Format Subjek Email<input value={job.subjectInstruction} onChange={event => setJob({...job, subjectInstruction:event.target.value})} placeholder="Contoh: Lamaran_Posisi_Nama"/></label></div>
  <div className="applyflow-panel"><div className="panel-heading"><div><p className="eyebrow">POSISI YANG TERDETEKSI</p><h3>Pilih Posisi Target</h3></div><span className="confidence-tag">{job.positions.length} posisi</span></div><div className="position-list">{job.positions.map(item => <label className={`position-option ${selectedPositionId === item.id ? 'selected' : ''}`} key={item.id}><input type="radio" name="target-position" checked={selectedPositionId === item.id} onChange={() => choosePosition(item.id)}/><span><b>{item.title}</b><small>{job.location || 'Lokasi belum ditentukan'} · {job.mode}</small></span><Check size={16}/></label>)}</div></div>
  <div className="instruction-row"><AlertTriangle size={16}/><span>{job.requiredDocuments.length ? `Lampiran yang diminta: ${job.requiredDocuments.join(', ')}.` : 'Tidak ditemukan petunjuk khusus berkas lampiran.'} Periksa kembali iklan asli sebelum mengirim lamaran.</span></div>
  <details className="source-details"><summary>Lihat teks asli iklan lowongan</summary><pre>{job.rawText}</pre></details>
  <StepActions backLabel="Kembali ke Sumber" onBack={onBack} nextLabel="Lanjut ke Bukti Kualifikasi" onNext={goMatch} disabled={!position}/>
 </div>; }

function MatchStep({ job, position, evidence, setEvidence, candidateName, setCandidateName, matches, selectedCv, cvs, setSelectedCv, goCompose, onBack }: { job:ParsedJobPosting; position:ParsedPosition; evidence:string; setEvidence:(value:string)=>void; candidateName:string; setCandidateName:(value:string)=>void; matches:{requirement:string;group:string;evidence:string}[]; selectedCv?:CVArtifact; cvs:CVArtifact[]; setSelectedCv:(value:string)=>void; goCompose:()=>void; onBack:()=>void }) { return <div className="applyflow-step">
  <StepHeader eyebrow="03 · BUKTI KUALIFIKASI" title="Gunakan Fakta yang Terbukti" description="Cantumkan pengalaman kerja yang sesuai dengan kualifikasi posisi yang Anda lamar."/>
  <div className="applyflow-fact-grid"><label>Nama Lengkap Anda<input value={candidateName} onChange={event => setCandidateName(event.target.value)} placeholder="Nama pada tanda tangan email"/></label><label>Pilihan Versi CV<select value={selectedCv?.id || ''} onChange={event => setSelectedCv(event.target.value)}><option value="">Pilih versi CV</option>{cvs.map(cv => <option key={cv.id} value={cv.id}>{cv.label} ({cv.version})</option>)}</select></label></div>
  <label className="textarea-label">Bukti pengalaman profil terverifikasi <span className="optional">(satu fakta per baris)</span><textarea value={evidence} onChange={event => setEvidence(event.target.value)} placeholder="Contoh:\nPengalaman memelihara infrastruktur Linux dan Docker di produksi\nMembuat otomasi pipeline CI/CD GitHub Actions\nBerpengalaman dalam incident response dan troubleshooting sistem"/></label>
  <div className="match-grid"><div className="applyflow-panel"><div className="panel-heading"><div><p className="eyebrow">PEMERIKSAAN KUALIFIKASI</p><h3>{position.title}</h3></div><FileText size={16}/></div>{matches.length ? matches.map(item => <div className="match-row" key={item.requirement}><span className={`match-dot ${item.group.toLowerCase().replace(' ','-')}`}/><div><b>{item.requirement}</b><small>{item.group === 'Supported' ? 'Sesuai Bukti' : item.group === 'Partial' ? 'Sebagian Sesuai' : 'Belum Ada Bukti'} · {item.evidence}</small></div></div>) : <p className="empty-copy">Belum ada persyaratan terstruktur yang terbaca. Bukti pengalaman Anda tetap dapat dipakai di draf email.</p>}</div><div className="applyflow-panel evidence-panel"><p className="eyebrow">DOKUMEN TERPILIH</p><h3>{selectedCv?.label || 'Belum ada CV yang dipilih'}</h3><p>{selectedCv ? `${selectedCv.version} · pastikan berkas terkini sebelum dilampirkan.` : 'Pilih versi CV dari Pusat Dokumen sebelum menyusun email.'}</p></div></div>
  <StepActions backLabel="Kembali ke Tinjauan" onBack={onBack} nextLabel="Susun Draf Email" onNext={goCompose}/>
 </div>; }

function ComposeStep({ job, position, subject, setSubject, body, setBody, validation, goReview, goBack, onOpenAtsModal }: { job:ParsedJobPosting; position:ParsedPosition; subject:string; setSubject:(value:string)=>void; body:string; setBody:(value:string)=>void; validation:{errors:string[];warnings:string[]}; goReview:()=>void; goBack:()=>void; onOpenAtsModal?:()=>void }) { return <div className="applyflow-step">
  <StepHeader eyebrow="04 · DRAF EMAIL LAMARAN" title="Susun Pesan Pengantar yang Jelas" description="Draf disusun profesional dan dapat Anda sunting bebas sesuai kebutuhan."/>
  <div className="compose-meta"><span><Mail size={15}/>{job.recruiterEmail || 'Email penerima belum ditentukan'}</span><span><FileText size={15}/>{position.title}</span>{onOpenAtsModal && <button type="button" className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 active:scale-[0.975] transition-all shadow-2xs" onClick={onOpenAtsModal}><Printer size={13}/> Format Harvard ATS Resume</button>}</div>
  <label className="textarea-label">Subjek Email<input value={subject} onChange={event => setSubject(event.target.value)}/></label>
  <label className="textarea-label">Isi Surat Pengantar (Cover Email)<textarea className="email-editor" value={body} onChange={event => setBody(event.target.value)}/></label>
  {validation.warnings.length > 0 && <div className="validation-box warning"><AlertTriangle size={16}/><div>{validation.warnings.map(warning => <p key={warning}>{warning}</p>)}</div></div>}
  <StepActions backLabel="Kembali ke Kualifikasi" onBack={goBack} nextLabel="Tinjau & Siapkan" onNext={goReview}/>
 </div>; }

function ReviewStep({ job, position, subject, body, selectedCV, validation, copy, openCompose, saveApplication, savedPositions, allPositions, setStep, message, confirmed, setConfirmed, savingDraft, onOpenAtsModal }: { job:ParsedJobPosting; position:ParsedPosition; subject:string; body:string; selectedCV?:CVArtifact; validation:{errors:string[];warnings:string[]}; copy:(value:string,label:string)=>void; openCompose:()=>void; saveApplication:(position:ParsedPosition)=>Promise<void>; savedPositions:string[]; allPositions:ParsedPosition[]; setStep:(step:Step)=>void; message:string; confirmed:boolean; setConfirmed:(value:boolean)=>void; savingDraft:boolean; onOpenAtsModal?:()=>void }) { const [saving,setSaving] = useState(false); const [error,setError] = useState(''); const canPrepare = confirmed && validation.errors.length === 0; const save = async (target:ParsedPosition) => { if (!canPrepare) { setError('Centang konfirmasi pemeriksaan dan selesaikan catatan terlebih dahulu.'); return; } setSaving(true); setError(''); try { await saveApplication(target); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal menambahkan lamaran'); } finally { setSaving(false); } }; return <div className="applyflow-step">
  <StepHeader eyebrow="05 · TINJAU & SIAPKAN" title="Lamaran Siap Digunakan" description="Periksa draf email, lampirkan berkas secara manual di aplikasi email Anda, dan catat posisi terpilih ke dalam pipeline."/>
  <div className="review-grid"><div className="applyflow-panel review-card"><div className="panel-heading"><div><p className="eyebrow">PRATINJAU EMAIL</p><h3>{subject || 'Subjek belum ditentukan'}</h3></div><span className="status-pill">Draf</span></div><div className="preview-recipient">Tujuan: {job.recruiterEmail || 'Email tujuan belum diisi'}</div><pre className="email-preview">{body || 'Tulis pesan email pada langkah sebelumnya.'}</pre><div className="review-actions"><button className="secondary" onClick={() => copy(subject, 'Subjek')}><Clipboard size={15}/> Salin Subjek</button><button className="secondary" onClick={() => copy(body, 'Isi Email')}><Clipboard size={15}/> Salin Isi</button><button className="primary" onClick={() => copy(`Subjek: ${subject}\n\n${body}`, 'Subjek + Isi')}><Clipboard size={15}/> Salin Semua</button></div></div>
    <div className="applyflow-panel checklist"><p className="eyebrow">DAFTAR PERIKSA LAMPIRAN</p><h3>Sebelum Mengirim</h3><Checklist label={selectedCV ? `Versi ${selectedCV.label} terpilih` : 'Pilih versi CV'} done={Boolean(selectedCV)}/>{job.requiredDocuments.filter(document => document !== 'CV / Resume' && document !== 'Updated CV').map(document => <Checklist key={document} label={`${document} (lampirkan manual)`} done={false}/>)}<Checklist label="Periksa subjek dan penerima" done={Boolean(subject && (job.recruiterEmail || !validation.errors.length))}/><label className="review-confirm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/><span>Saya telah memeriksa penerima, subjek, isi email, dan lampiran.</span></label>{onOpenAtsModal && <div className="mt-3.5 pt-3 border-t border-zinc-200/80 dark:border-zinc-800"><button type="button" className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 font-semibold text-xs active:scale-[0.975] transition-all shadow-2xs" onClick={onOpenAtsModal}><Printer size={15}/> Format Harvard ATS Resume 1-Klik</button></div>}<div className="instruction-row compact"><AlertTriangle size={15}/><span>Membuka email bukan mengirim otomatis. Berkas lokal harus dilampirkan manual.</span></div></div></div>
  {validation.errors.length > 0 && <div className="validation-box error"><AlertTriangle size={16}/><div>{validation.errors.map(item => <p key={item}>{item}</p>)}</div></div>}
  {error && <div className="validation-box error"><AlertTriangle size={16}/><p>{error}</p></div>}
  <div className="review-toolbar"><div><b>Simpan setiap posisi terpilih secara mandiri</b><small>Satu iklan lowongan dapat menghasilkan catatan pipeline terpisah.</small></div><div className="position-save-list">{allPositions.map(item => <button key={item.id} className="secondary" disabled={saving || !canPrepare || savedPositions.includes(item.id)} onClick={() => save(item)}>{savedPositions.includes(item.id) ? <Check size={15}/> : <Plus size={15}/>} {savedPositions.includes(item.id) ? 'Tersimpan' : `Simpan ${item.title}`}</button>)}</div></div>
  <div className="applyflow-actions"><button className="secondary" onClick={() => setStep('compose')}><ArrowLeft size={15}/> Sunting Email</button><div className="review-primary-actions"><button className="secondary" disabled={!job.recruiterEmail || !canPrepare} onClick={openCompose}><ExternalLink size={15}/> Buka Klien Email</button><button className="primary" onClick={() => copy(`Subjek: ${subject}\n\n${body}`, 'Lamaran')}><Clipboard size={15}/> Salin & Simpan Draf</button></div></div>
  {(message || savingDraft) && <p className="helper-text">{savingDraft ? 'Menyimpan draf ApplyFlow...' : message}</p>}
 </div>; }

function Checklist({ label, done }: { label:string; done:boolean }) { return <div className="checklist-row"><span className={done ? 'done' : ''}>{done ? <Check size={13}/> : <span/>}</span><p>{label}</p></div>; }
function StepActions({ backLabel, onBack, nextLabel, onNext, disabled }: { backLabel:string; onBack:()=>void; nextLabel:string; onNext:()=>void; disabled?:boolean }) { return <div className="applyflow-actions"><button className="secondary" onClick={onBack}><ArrowLeft size={15}/>{backLabel}</button><button className="primary" disabled={disabled} onClick={onNext}>{nextLabel}<ArrowRight size={15}/></button></div>; }
