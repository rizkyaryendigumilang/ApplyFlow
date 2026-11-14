import { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Info,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import {
  evaluateVendorContract,
  DEFAULT_VENDOR_CHECKLIST,
  type ContractChecklist,
} from '../../lib/vendor-risk-evaluator';

interface VendorRiskModalProps {
  companyName: string;
  positionTitle: string;
  onClose: () => void;
}

export function VendorRiskModal({ companyName, positionTitle, onClose }: VendorRiskModalProps) {
  const [checklist, setChecklist] = useState<ContractChecklist>(DEFAULT_VENDOR_CHECKLIST);

  const evaluation = evaluateVendorContract(checklist);

  const update = <K extends keyof ContractChecklist>(field: K, val: ContractChecklist[K]) => {
    setChecklist(prev => ({ ...prev, [field]: val }));
  };

  return (
    <div className="overlay">
      <div className="modal vendor-risk-modal">
        <div className="drawer-head">
          <div className="modal-title-with-badge">
            <span className="eyebrow">CONTRACT & CLAUSE AUDITOR</span>
            <h2>Vendor vs. In-house Risk Checker</h2>
          </div>
          <button onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <p className="muted" style={{ marginBottom: 16 }}>
          Audit keamanan klausul kontrak PKWT dan penempatan outsource IT untuk <b>{positionTitle}</b> di{' '}
          <b>{companyName}</b>.
        </p>

        {/* Severity Banner */}
        <div className={`risk-score-hero ${evaluation.riskLevel.toLowerCase().replace(' ', '-')}`}>
          <div className="risk-score-number">
            <span>Risk Index</span>
            <strong>{evaluation.riskScore} / 100</strong>
          </div>
          <div className="risk-score-meta">
            <div className="risk-level-badge">
              {evaluation.riskLevel === 'Low Risk' ? (
                <ShieldCheck size={16} />
              ) : (
                <ShieldAlert size={16} />
              )}
              <span>{evaluation.riskLevel}</span>
            </div>
            <p>{evaluation.summary}</p>
          </div>
        </div>

        {/* Audit Form Grid */}
        <div className="contract-form-grid">
          <div className="contract-form-col">
            <h4>Checklist Klausul Kontrak (PKWT)</h4>

            <div className="checklist-field">
              <label>Kompensasi Akhir Kontrak (PP 35/2021)</label>
              <div className="check-option-group">
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={checklist.pp35SeveranceGuaranteed}
                    onChange={e => update('pp35SeveranceGuaranteed', e.target.checked)}
                  />
                  <span>Tercantum eksplisit hak uang kompensasi (1 bln upah / 12 bln kerja)</span>
                </label>
              </div>
            </div>

            <div className="checklist-field">
              <label>Kebijakan Gaji Saat Jeda Proyek (Bench Policy)</label>
              <select
                value={checklist.benchPolicy}
                onChange={e => update('benchPolicy', e.target.value as ContractChecklist['benchPolicy'])}
              >
                <option value="full_pay">Gaji Pokok Dibayar Penuh (100% Full Pay)</option>
                <option value="partial_pay">Gaji Dipotong Parsial (50% - 70%)</option>
                <option value="unpaid">Tanpa Gaji (Unpaid Bench - Tolak!)</option>
              </select>
            </div>

            <div className="checklist-field">
              <label>Klausul Lembur & On-Call Deployment</label>
              <select
                value={checklist.overtimeClause}
                onChange={e => update('overtimeClause', e.target.value as ContractChecklist['overtimeClause'])}
              >
                <option value="statutory_spkl">Dibayar Sesuai Tarif Resmi Lembur SPKL UU</option>
                <option value="fixed_allowance">Tunjangan On-Call / Piket Mingguan Tetap</option>
                <option value="unpaid_professional">Tidak Dibayar ("Tanggung Jawab Profesional")</option>
              </select>
            </div>

            <div className="checklist-field">
              <label>Penyediaan Laptop & Hardware Kerja</label>
              <select
                value={checklist.laptopProvision}
                onChange={e => update('laptopProvision', e.target.value as ContractChecklist['laptopProvision'])}
              >
                <option value="company_provided">Laptop Kerja Disediakan Vendor / Klien</option>
                <option value="byod_with_allowance">Laptop Pribadi dengan Tunjangan Depresiasi</option>
                <option value="byod_unpaid">Wajib Bawa Laptop Sendiri Tanpa Tunjangan (BYOD)</option>
              </select>
            </div>

            <div className="checklist-field">
              <label>Denda Penalti Transfer Rekrut Langsung ke Klien (Buyout)</label>
              <select
                value={checklist.clientBuyoutPenalty}
                onChange={e => update('clientBuyoutPenalty', e.target.value as ContractChecklist['clientBuyoutPenalty'])}
              >
                <option value="none">Tanpa Denda (Urusan B2B Vendor & Klien)</option>
                <option value="reasonable">Standar (Pemberitahuan 1-2 Bulan)</option>
                <option value="excessive_fine">Denda Finansial Fantastis (6-12 bln gaji)</option>
              </select>
            </div>

            <div className="checklist-field">
              <label>Integritas Pelaporan Upah ke BPJS TK & Kes</label>
              <select
                value={checklist.bpjsWageReporting}
                onChange={e => update('bpjsWageReporting', e.target.value as ContractChecklist['bpjsWageReporting'])}
              >
                <option value="full_salary">Dilaporkan Sesuai Gaji Riil Penuh</option>
                <option value="umr_minimum">Dipangkas ke Batas UMR Daerah (Ilegal)</option>
              </select>
            </div>
          </div>

          <div className="contract-insights-col">
            {/* Red flags */}
            {evaluation.redFlags.length > 0 && (
              <div className="insights-card red-flag-card">
                <div className="card-header-with-icon">
                  <AlertTriangle size={15} />
                  <h5>Red Flags yang Terdeteksi ({evaluation.redFlags.length})</h5>
                </div>
                <ul>
                  {evaluation.redFlags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Negotiation talking points */}
            <div className="insights-card negotiation-card">
              <div className="card-header-with-icon">
                <FileCheck size={15} />
                <h5>Poin Negosiasi Sebelum Tanda Tangan</h5>
              </div>
              <ul>
                {evaluation.negotiationPoints.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>

            {/* Legal / Statutory bases */}
            <div className="insights-card legal-card">
              <div className="card-header-with-icon">
                <Info size={15} />
                <h5>Dasar Hukum Ketenagakerjaan RI</h5>
              </div>
              <ul>
                {evaluation.statutoryNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <button className="primary full" onClick={onClose} style={{ marginTop: 18 }}>
          Selesai Meninjau
        </button>
      </div>
    </div>
  );
}
