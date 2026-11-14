import { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  X,
  Copy,
  Check,
  Save,
  Scale,
  Sparkles,
  Info,
} from 'lucide-react';
import type { Application } from '../../lib/pb-types';

export interface ContractInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  application?: Application | null;
  onSaveInspection?: (inspectionData: NonNullable<Application['contractInspection']>) => Promise<void>;
}

interface ContractRule {
  id: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  regex: RegExp;
  issue: string;
  recommendation: string;
  lawReference: string;
}

const INDONESIAN_LABOR_RULES: ContractRule[] = [
  {
    id: 'tahan-ijazah',
    category: 'Penahanan Dokumen Asli',
    severity: 'high',
    regex: /(menyerahkan|menahan|menyimpan)\s+(ijazah|sertifikat|dokumen)\s+(asli)|ijazah\s+asli\s+(ditahan|disimpan)/i,
    issue: 'Klausul mewajibkan penyerahan dokumen atau ijazah asli kepada perusahaan selama masa kerja.',
    recommendation: 'Tolak penahanan ijazah asli. Tawarkan fotokopi ijazah yang dilegalisir basah atau surat verifikasi resmi dari universitas.',
    lawReference: 'Berpotensi melanggar Pasal 372 KUHP (Penggelapan) jika dipersulit saat pengembalian, dan tidak diamanatkan dalam UU 13/2003.',
  },
  {
    id: 'probation-pkwt',
    category: 'Masa Percobaan pada PKWT',
    severity: 'high',
    regex: /(pkwt|kontrak\s+kerja\s+waktu\s+tertentu|perjanjian\s+kerja\s+waktu\s+tertentu)[\s\S]{0,120}(masa\s+percobaan|probation)|(masa\s+percobaan|probation)[\s\S]{0,120}(pkwt|kontrak\s+kerja\s+waktu\s+tertentu)/i,
    issue: 'Mencantumkan masa percobaan (probation) pada Perjanjian Kerja Waktu Tertentu (PKWT/Kontrak).',
    recommendation: 'Minta klausul probation dihapus atau ubah status perjanjian menjadi PKWTT (Karyawan Tetap).',
    lawReference: 'Pasal 58 ayat (1) UU No. 13/2003: PKWT tidak dapat mensyaratkan adanya masa percobaan kerja. Jika disyaratkan, batal demi hukum.',
  },
  {
    id: 'denda-resign-penalti',
    category: 'Penalti Resign Berlebihan',
    severity: 'high',
    regex: /(penalti|denda)\s+(sebesar|senilai|sebesar\s+rp|mencapai)?\s*(rp\s*[\d.,]+|\d+\s*(juta|ribu)|[\d.,]+\s*bulan\s*gaji)|membayar\s+(ganti\s+rugi|denda)\s+apabila\s+(mengundurkan\s+diri|resign)/i,
    issue: 'Klausul penalti denda uang tunai bernilai besar jika karyawan mengundurkan diri sebelum masa kontrak habis.',
    recommendation: 'Negosiasikan batas kewajiban ganti rugi maksimal 1 bulan gaji atau pengecualian jika ada kondisi darurat/kesehatan.',
    lawReference: 'Pasal 62 UU No. 13/2003 jo. UU No. 6/2023: Ganti rugi maksimal sebesar upah pekerja hingga batas waktu kontrak berakhir, bukan denda buatan.',
  },
  {
    id: 'penghapusan-kompensasi-pkwt',
    category: 'Penghilangan Uang Kompensasi PKWT',
    severity: 'high',
    regex: /(tidak\s+berhak|melepaskan\s+hak)\s+(atas)?\s*(uang\s+kompensasi|kompensasi\s+pkwt|pesangon|ganti\s+rugi)/i,
    issue: 'Klausul yang menyatakan karyawan tidak berhak mendapatkan uang kompensasi di akhir masa kontrak PKWT.',
    recommendation: 'Hapus klausul ini karena bertentangan dengan hukum yang berlaku (norma imperatif ketenagakerjaan).',
    lawReference: 'Pasal 15 PP No. 35/2021: Pengusaha wajib memberikan uang kompensasi kepada pekerja PKWT yang telah memiliki masa kerja minimal 1 bulan berturut-turut.',
  },
  {
    id: 'lembur-tanpa-upah',
    category: 'Lembur Tanpa Kompensasi',
    severity: 'medium',
    regex: /(tanpa|tidak\s+berhak)\s+(atas)?\s*(upah\s+lembur|kompensasi\s+lembur)|lembur\s+(dianggap|sudah\s+termasuk)\s+(ke\s+dalam)?\s*(gaji\s+pokok|tunjangan)/i,
    issue: 'Karyawan diwajibkan lembur atau standby on-call tanpa perhitungan upah lembur resmi.',
    recommendation: 'Klarifikasi apakah posisi Anda masuk dalam golongan manajerial pemikir/pengendali, atau minta perhitungan lembur sesuai jam kerja nyata.',
    lawReference: 'Pasal 78 UU Cipta Kerja jo. Pasal 27 PP No. 35/2021 tentang Kewajiban Pembayaran Upah Kerja Lembur.',
  },
  {
    id: 'non-compete-luas',
    category: 'Non-Compete Tidak Proporsional',
    severity: 'medium',
    regex: /(dilarang|tidak\s+boleh)\s+(bekerja|bergabung|mendirikan)\s+(di|dengan)?\s*(perusahaan\s+kompetitor|bidang\s+sejenis|industri\s+yang\s+sama)\s+(selama|dalam\s+jangka\s+waktu)?\s*(\d+\s*(tahun|bulan))/i,
    issue: 'Klausul larangan bekerja di perusahaan kompetitor pasca berhenti tanpa disertai kompensasi finansial selama masa larangan.',
    recommendation: 'Minta pembatasan non-compete dipersempit hanya untuk penyalahgunaan rahasia dagang (Trade Secrets), bukan larangan mencari nafkah.',
    lawReference: 'Pasal 27 ayat (2) UUD 1945 & UU No. 39/1999 tentang HAM: Hak asasi setiap warga negara untuk memilih pekerjaan dan penghidupan yang layak.',
  },
  {
    id: 'potongan-sepihak',
    category: 'Potongan Gaji Arbitrer',
    severity: 'medium',
    regex: /(perusahaan\s+berhak\s+memotong|pemotongan\s+sepihak|potongan\s+denda\s+keterlambatan)/i,
    issue: 'Klausul pemotongan gaji secara sepihak tanpa batasan persentase atau mekanisme klarifikasi tertulis.',
    recommendation: 'Minta batasan bahwa pemotongan gaji hanya dapat dilakukan atas izin tertulis pekerja dan maksimal 50% dari upah.',
    lawReference: 'Pasal 65 PP No. 36/2021 tentang Pengupahan: Jumlah keseluruhan pemotongan upah paling banyak 50% dari setiap pembayaran upah.',
  },
];

const SAMPLE_CONTRACT_TEXT = `SURAT PERJANJIAN KERJA WAKTU TERTENTU (PKWT)
Nomor: 082/HR-PKWT/X/2026

Antara PT Inovasi Solusi Digital dengan Karyawan.
Pasal 3: Jangka Waktu & Masa Percobaan
Perjanjian kerja ini berlaku selama 12 (dua belas) bulan terhitung sejak tanggal masuk, dengan masa percobaan (probation) selama 3 (tiga) bulan pertama.

Pasal 6: Penahanan Ijazah
Untuk menjamin keseriusan dan kelangsungan kontrak kerja, Karyawan wajib menyerahkan Ijazah Asli pendidikan terakhir kepada Perusahaan selama masa kontrak berlaku.

Pasal 8: Pengunduran Diri & Penalti
Apabila Karyawan mengundurkan diri sebelum masa kontrak 12 bulan berakhir, Karyawan wajib membayar denda penalti sebesar Rp 35.000.000 (tiga puluh lima juta rupiah) kepada Perusahaan secara tunai. Karyawan juga melepaskan hak atas uang kompensasi PKWT di akhir masa kerja.

Pasal 10: Waktu Kerja & Lembur
Karyawan wajib siap sedia bekerja lembur apabila dibutuhkan oleh sistem, di mana upah lembur dianggap sudah termasuk ke dalam gaji pokok bulanan tanpa kompensasi tambahan.

Pasal 12: Non-Compete
Setelah berhenti bekerja, Karyawan dilarang bekerja di perusahaan kompetitor atau industri sejenis selama jangka waktu 2 tahun.`;

export function ContractInspectorModal({
  isOpen,
  onClose,
  application,
  onSaveInspection,
}: ContractInspectorModalProps) {
  if (!isOpen) return null;

  const [contractText, setContractText] = useState(
    application?.contractInspection?.notes || SAMPLE_CONTRACT_TEXT
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Inspector Analysis Engine
  const inspection = useMemo(() => {
    const findings: Array<{
      category: string;
      severity: 'high' | 'medium' | 'low';
      clauseText: string;
      issue: string;
      recommendation: string;
      lawReference: string;
    }> = [];

    INDONESIAN_LABOR_RULES.forEach((rule) => {
      const match = contractText.match(rule.regex);
      if (match) {
        // Extract surrounding sentence/context
        const matchIndex = match.index || 0;
        const start = Math.max(0, matchIndex - 40);
        const end = Math.min(contractText.length, matchIndex + match[0].length + 80);
        const snippet = '...' + contractText.substring(start, end).replace(/\s+/g, ' ').trim() + '...';

        findings.push({
          category: rule.category,
          severity: rule.severity,
          clauseText: snippet,
          issue: rule.issue,
          recommendation: rule.recommendation,
          lawReference: rule.lawReference,
        });
      }
    });

    // Score calculation: 100 - (high * 25 + medium * 12 + low * 5)
    const highCount = findings.filter((f) => f.severity === 'high').length;
    const medCount = findings.filter((f) => f.severity === 'medium').length;
    const riskDeductions = highCount * 28 + medCount * 12;
    const safetyScore = Math.max(10, Math.min(100, 100 - riskDeductions));

    let verdict: 'Safe to Sign' | 'Requires Clarification' | 'High Risk / Predatory' = 'Safe to Sign';
    if (highCount >= 1 || safetyScore < 60) {
      verdict = 'High Risk / Predatory';
    } else if (medCount >= 1 || safetyScore < 85) {
      verdict = 'Requires Clarification';
    }

    return {
      safetyScore,
      verdict,
      findings,
      highCount,
      medCount,
    };
  }, [contractText]);

  // Generate Counter-Negotiation Email
  const counterDraft = useMemo(() => {
    if (inspection.findings.length === 0) {
      return 'Kontrak bersih dari klausul predator kerja berisiko tinggi. Siap ditandatangani.';
    }

    let draft = `Kepada Yth. Tim HRD / Talent Acquisition ${application?.company || 'Perusahaan'},\n\n`;
    draft += `Terima kasih atas penawaran kerja (Offering Letter / Draf Kontrak) yang telah diberikan. Saya sangat antusias untuk berkontribusi bagi pertumbuhan perusahaan.\n\n`;
    draft += `Setelah mempelajari draf perjanjian secara seksama, terdapat beberapa penyesuaian klausul yang ingin saya diskusikan agar selaras dengan ketentuan regulasi ketenagakerjaan yang berlaku demi kenyamanan kedua belah pihak:\n\n`;

    inspection.findings.forEach((f, idx) => {
      draft += `${idx + 1}. Terkait ${f.category}:\n`;
      draft += `   - Klausul saat ini: "${f.clauseText}"\n`;
      draft += `   - Rekomendasi penyesuaian: ${f.recommendation} (Merujuk pada ${f.lawReference})\n\n`;
    });

    draft += `Saya sangat terbuka untuk berdiskusi lebih lanjut via panggilan singkat ataupun email guna memfinalisasi draf ini sebelum proses penandatanganan.\n\n`;
    draft += `Hormat saya,\n${application?.contactName || 'Kandidat'}`;
    return draft;
  }, [inspection, application]);

  const handleCopyCounterDraft = async () => {
    try {
      await navigator.clipboard.writeText(counterDraft);
      setCopyFeedback('Draf tanggapan negosiasi legal berhasil disalin ke clipboard!');
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch {
      setCopyFeedback('Gagal menyalin otomatis.');
    }
  };

  const handleSaveResult = async () => {
    setIsSaving(true);
    try {
      if (onSaveInspection) {
        await onSaveInspection({
          riskScore: 100 - inspection.safetyScore,
          verdict: inspection.verdict,
          scannedAt: new Date().toISOString(),
          notes: contractText.slice(0, 4000),
          findings: inspection.findings,
        });
      }
      setCopyFeedback('Hasil audit kontrak berhasil disimpan ke aplikasi!');
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      setCopyFeedback(`Gagal menyimpan: ${msg}`);
      setTimeout(() => setCopyFeedback(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" style={{ zIndex: 1060 }}>
      <div
        className="modal"
        style={{
          maxWidth: '960px',
          width: '95vw',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          background: '#fcfcf9',
          border: '1px solid #dedfd8',
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: '16px 24px',
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
                  background: '#fcf6e6',
                  color: '#8c6b1e',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  border: '1px solid #ebd8a8',
                }}
              >
                P0 · CONTRACT & OFFERING INSPECTOR
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color:
                    inspection.verdict === 'Safe to Sign'
                      ? '#4e622b'
                      : inspection.verdict === 'Requires Clarification'
                      ? '#8c6b1e'
                      : '#b43d3d',
                  background:
                    inspection.verdict === 'Safe to Sign'
                      ? '#edf2e3'
                      : inspection.verdict === 'Requires Clarification'
                      ? '#fcf6e6'
                      : '#faebeb',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {inspection.verdict === 'Safe to Sign' ? (
                  <ShieldCheck size={14} />
                ) : (
                  <ShieldAlert size={14} />
                )}
                {inspection.verdict} (Safety Score: {inspection.safetyScore}/100)
              </span>
            </div>
            <h2 style={{ fontSize: '18px', margin: '4px 0 0', fontWeight: 600 }}>
              Offering Letter & PKWT Risk Scanner · {application?.company || 'Target Company'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="secondary compact-btn"
              onClick={handleCopyCounterDraft}
              title="Copy diplomatic counter-proposal letter to HR"
            >
              <Copy size={13} /> Copy Counter-Draft
            </button>
            <button
              type="button"
              className="primary compact-btn"
              onClick={handleSaveResult}
              disabled={isSaving}
              style={{ background: '#202320', color: '#f5f5f0' }}
            >
              <Save size={13} /> {isSaving ? 'Menyimpan...' : 'Simpan Hasil Audit'}
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

        {/* Main Grid: Left editor & Right findings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Left Pane: Contract Text Input */}
          <div
            style={{
              padding: '20px',
              borderRight: '1px solid #dedfd8',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto',
              background: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#777c73' }}>
                Paste Offering Letter / Draf PKWT Text
              </label>
              <button
                type="button"
                onClick={() => setContractText(SAMPLE_CONTRACT_TEXT)}
                style={{
                  fontSize: '11px',
                  background: 'none',
                  border: 'none',
                  color: '#556b2f',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Muat Contoh Draf Bermasalah
              </button>
            </div>

            <textarea
              rows={20}
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              placeholder="Tempelkan isi surat penawaran kerja, pasal-pasal kontrak PKWT, atau perjanjian ikatan dinas di sini..."
              style={{
                flex: 1,
                minHeight: '380px',
                padding: '12px',
                border: '1px solid #dedfd8',
                borderRadius: '3px',
                fontSize: '12px',
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                lineHeight: 1.5,
                background: '#fafaf8',
                resize: 'none',
              }}
            />

            <div style={{ fontSize: '11px', color: '#888d82', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Info size={13} />
              <span>
                Pemeriksaan mengacu pada UU Ketenagakerjaan No. 13/2003, UU Cipta Kerja No. 6/2023, PP No. 35/2021 (PKWT/Alih Daya), dan PP No. 36/2021 (Pengupahan).
              </span>
            </div>
          </div>

          {/* Right Pane: Risk Scorecard & Findings */}
          <div
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto',
              background: '#fbfbf8',
            }}
          >
            {/* Risk Summary Card */}
            <div
              style={{
                background:
                  inspection.verdict === 'Safe to Sign'
                    ? '#edf2e3'
                    : inspection.verdict === 'Requires Clarification'
                    ? '#fcf6e6'
                    : '#faebeb',
                border:
                  inspection.verdict === 'Safe to Sign'
                    ? '1px solid #cfddbe'
                    : inspection.verdict === 'Requires Clarification'
                    ? '1px solid #ebd8a8'
                    : '1px solid #eccaca',
                padding: '16px',
                borderRadius: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600 }}>
                    Status Hukum: {inspection.verdict}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#444840' }}>
                    Ditemukan <b>{inspection.highCount} klausul risiko tinggi</b> dan{' '}
                    <b>{inspection.medCount} klausul perlu klarifikasi</b>.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#202320' }}>
                    {inspection.safetyScore}
                  </span>
                  <span style={{ fontSize: '12px', color: '#777c73' }}>/100</span>
                </div>
              </div>
            </div>

            {/* Findings List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#777c73' }}>
                Hasil Audit Klausul ({inspection.findings.length})
              </span>

              {inspection.findings.map((f, i) => (
                <div
                  key={i}
                  style={{
                    background: '#fff',
                    border: '1px solid #dedfd8',
                    borderLeft: `4px solid ${f.severity === 'high' ? '#b43d3d' : '#8c6b1e'}`,
                    padding: '12px 14px',
                    borderRadius: '3px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <b style={{ color: '#202320', fontSize: '13px' }}>{f.category}</b>
                    <span
                      style={{
                        font: "10px 'DM Mono'",
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: f.severity === 'high' ? '#faebeb' : '#fcf6e6',
                        color: f.severity === 'high' ? '#b43d3d' : '#8c6b1e',
                        fontWeight: 600,
                      }}
                    >
                      {f.severity} risk
                    </span>
                  </div>

                  <p style={{ margin: '0 0 6px', color: '#555a50', lineHeight: 1.4 }}>
                    {f.issue}
                  </p>

                  <div
                    style={{
                      background: '#f5f5f0',
                      padding: '6px 8px',
                      borderRadius: '3px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: '#444840',
                      marginBottom: '6px',
                    }}
                  >
                    "{f.clauseText}"
                  </div>

                  <div style={{ fontSize: '11px', color: '#455928', marginTop: '6px' }}>
                    <b>💡 Solusi Negosiasi:</b> {f.recommendation}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888d82', marginTop: '4px' }}>
                    <b>⚖️ Dasar Hukum:</b> {f.lawReference}
                  </div>
                </div>
              ))}

              {inspection.findings.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '36px',
                    border: '1px dashed #cfddbe',
                    background: '#edf2e3',
                    color: '#455928',
                    borderRadius: '4px',
                  }}
                >
                  <ShieldCheck size={32} style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>Tidak ditemukan klausul predator</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                    Teks kontrak yang diuji bersih dari jebakan penahanan ijazah, denda resign liar, ataupun lembur tanpa kompensasi.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
