import { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Car,
  Home,
  Briefcase,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  HelpCircle,
  FileText,
  Check,
  ArrowRight,
  Scale,
  MessageSquare,
  Copy,
  X,
} from 'lucide-react';
import type { Application } from '../../lib/pb-types';
import {
  calculateTHP,
  type OfferPackage,
  type PTKPCategory,
} from '../../lib/thp-calculator';
import { idr } from '../../lib/utils';
import { VendorRiskModal } from '../application-detail/VendorRiskModal';
import { ContractInspectorModal } from './ContractInspectorModal';

interface OfferComparatorViewProps {
  applications: Application[];
}

const DEFAULT_OFFERS: OfferPackage[] = [
  {
    id: 'offer-1',
    name: 'Offer A: Unicorn Fintech',
    company: 'Fintech Maju Sejahtera',
    position: 'Senior SRE / Cloud Platform',
    placementType: 'In-house',
    workMode: 'Hybrid',
    baseSalary: 28000000,
    fixedAllowance: 1500000,
    onCallAllowance: 3000000, // 2 minggu on-call rotation
    shiftAllowance: 0,
    wfhAllowance: 1000000,
    thrMultiplier: 1.0,
    bonusMonths: 2.0,
    hasBpjs: true,
    ptkpCategory: 'TK/0',
    monthlyCommuteCost: 600000, // 2 hari WFO per minggu
  },
  {
    id: 'offer-2',
    name: 'Offer B: Enterprise Bank Outsource',
    company: 'PT Metro Vendor Integrasi (Penempatan Bank BUMN)',
    position: 'Lead DevOps Engineer',
    placementType: 'Vendor / Outsource',
    workMode: 'On-site',
    baseSalary: 34000000,
    fixedAllowance: 2000000,
    onCallAllowance: 0,
    shiftAllowance: 0,
    wfhAllowance: 0,
    thrMultiplier: 1.0,
    bonusMonths: 1.0,
    hasBpjs: true,
    ptkpCategory: 'TK/0',
    monthlyCommuteCost: 1800000, // 5 hari WFO full + bensin/toll
  },
];

export function OfferComparatorView({ applications }: OfferComparatorViewProps) {
  const [offers, setOffers] = useState<OfferPackage[]>(DEFAULT_OFFERS);
  const [selectedAuditOffer, setSelectedAuditOffer] = useState<OfferPackage | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [negotiateOffer, setNegotiateOffer] = useState<OfferPackage | null>(null);
  const [targetCounterSalary, setTargetCounterSalary] = useState<number>(32000000);
  const [negotiationTone, setNegotiationTone] = useState<'collaborative' | 'market_firm' | 'competing_offer'>('collaborative');
  const [negotiationLang, setNegotiationLang] = useState<'id' | 'en'>('id');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Offers derived calculations
  const evaluatedOffers = useMemo(() => {
    return offers.map(o => ({
      pkg: o,
      breakdown: calculateTHP(o),
    }));
  }, [offers]);

  const negotiationDraft = useMemo(() => {
    if (!negotiateOffer) return '';
    const diff = targetCounterSalary - negotiateOffer.baseSalary;
    const diffPct = Math.round((diff / Math.max(1, negotiateOffer.baseSalary)) * 100);
    const compName = negotiateOffer.company || 'Perusahaan';
    const pos = negotiateOffer.position || 'Software Engineer';

    if (negotiationLang === 'id') {
      if (negotiationTone === 'collaborative') {
        return `Kepada Yth. Tim Talent Acquisition ${compName},

Terima kasih sebesar-besarnya atas kepercayaan dan penawaran kerja untuk posisi ${pos}. Saya sangat antusias dengan visi dan tantangan teknis tim ke depan.

Setelah mempelajari penawaran secara menyeluruh, saya ingin mendiskusikan kemungkinan penyesuaian gaji pokok (base salary). Mengingat kompleksitas lingkup arsitektur dan pengalaman saya dalam scaling sistem high-availability, apakah memungkinkan jika base salary disesuaikan ke angka Rp ${targetCounterSalary.toLocaleString('id-ID')} (${diffPct >= 0 ? '+' : ''}${diffPct}% dari penawaran awal)?

Saya sangat yakin dapat memberikan dampak bisnis dan teknis yang sepadan sejak bulan-bulan awal bergabung. Saya sangat terbuka untuk berdiskusi singkat guna mencapai kesepakatan terbaik bagi kedua pihak.

Terima kasih atas pengertian dan dukungannya.`;
      }

      if (negotiationTone === 'market_firm') {
        return `Kepada Yth. Tim Rekrutmen ${compName},

Terima kasih atas surat penawaran resmi untuk peran ${pos}. Saya mengapresiasi transparansi benefit yang diberikan.

Berdasarkan benchmark kompensasi industri teknologi saat ini untuk tingkat senioritas dan keahlian spesifik platform yang dibutuhkan, rata-rata kompensasi berada pada rentang Rp ${targetCounterSalary.toLocaleString('id-ID')}. Oleh karena itu, saya ingin mengajukan counter-proposal di angka tersebut.

Dengan penyesuaian ini, saya siap berkomitmen penuh dan segera menandatangani perjanjian kerja. Terima kasih banyak.`;
      }

      return `Kepada Yth. Tim HR ${compName},

Terima kasih banyak atas penawaran kerja untuk posisi ${pos}.

Sebagai bentuk transparansi profesional, saat ini saya juga sedang berada di tahap akhir evaluasi penawaran paralel dengan kompensasi yang sedikit lebih tinggi. Namun demikian, ${compName} tetap merupakan prioritas utama saya karena keselarasan budaya kerja dan visi produk.

Jika tim dapat menyesuaikan base salary ke angka Rp ${targetCounterSalary.toLocaleString('id-ID')}, saya akan sangat senang untuk langsung menerima penawaran ini dan menutup proses di tempat lain. Terima kasih atas pengertiannya.`;
    } else {
      return `Dear ${compName} Hiring Team,

Thank you very much for offering me the ${pos} position. I am thrilled about the opportunity to contribute to your engineering initiatives.

After reviewing the package, I would like to explore whether there is flexibility regarding the base salary. Based on my technical background in distributed systems and the scope of responsibilities, I was targeting a base salary of IDR ${targetCounterSalary.toLocaleString('id-ID')} (${diffPct >= 0 ? '+' : ''}${diffPct}%).

I am confident in my ability to deliver immediate, measurable impact. If we can align on this figure, I would be delighted to sign and move forward immediately.

Thank you for your consideration, and I look forward to your thoughts.`;
    }
  }, [negotiateOffer, targetCounterSalary, negotiationTone, negotiationLang]);

  const updateOffer = (id: string, updates: Partial<OfferPackage>) => {
    setOffers(prev => prev.map(o => (o.id === id ? { ...o, ...updates } : o)));
  };

  const handleAddOffer = () => {
    if (offers.length >= 3) return;
    const newOffer: OfferPackage = {
      id: `offer-${Date.now()}`,
      name: `Offer ${String.fromCharCode(65 + offers.length)}: Custom Opportunity`,
      company: 'Tech Enterprise Baru',
      position: 'Staff Systems Engineer',
      placementType: 'In-house',
      workMode: 'Remote',
      baseSalary: 25000000,
      fixedAllowance: 1000000,
      onCallAllowance: 2000000,
      shiftAllowance: 0,
      wfhAllowance: 1500000,
      thrMultiplier: 1.0,
      bonusMonths: 1.5,
      hasBpjs: true,
      ptkpCategory: 'TK/0',
      monthlyCommuteCost: 0,
    };
    setOffers(prev => [...prev, newOffer]);
  };

  const handleRemoveOffer = (id: string) => {
    if (offers.length <= 1) return;
    setOffers(prev => prev.filter(o => o.id !== id));
  };

  return (
    <div className="offer-comparator-page">
      {/* Header */}
      <div className="settings-header">
        <div>
          <span className="eyebrow">COMPENSATION SIMULATOR & AUDITOR</span>
          <h1>Offer Comparison & Take Home Pay (THP)</h1>
          <p className="lede">
            Kalkulator kompensasi riil engineering Indonesia: Gross vs. Nett PPh 21 TER 2024, BPJS Ketenagakerjaan & Kesehatan, serta kompensasi tunjangan on-call vs. biaya komuter.
          </p>
        </div>

        <div className="header-actions-inline" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="secondary compact-btn"
            onClick={() => setIsContractModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Scan draf kontrak kerja dari jebakan penalti atau probation PKWT"
          >
            <Scale size={13} /> Audit Draf Kontrak PKWT
          </button>
          <button
            type="button"
            className="secondary compact-btn"
            onClick={() => {
              setNegotiateOffer(offers[0]);
              setTargetCounterSalary(Math.round(offers[0].baseSalary * 1.15));
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Buat draf counter-offer dan negosiasi gaji terstruktur"
          >
            <MessageSquare size={13} /> Script Negosiasi Gaji
          </button>
          {offers.length < 3 && (
            <button className="primary compact-btn" onClick={handleAddOffer}>
              <Plus size={14} /> Tambah Penawaran ({offers.length}/3)
            </button>
          )}
        </div>
      </div>

      {/* Main Comparison Grid */}
      <div className={`offers-grid cols-${evaluatedOffers.length}`}>
        {evaluatedOffers.map(({ pkg, breakdown }, index) => {
          return (
            <div className="offer-card" key={pkg.id}>
              {/* Card Title & Header */}
              <div className="offer-card-head">
                <div>
                  <span className="badge-offer-index">PENAWARAN {String.fromCharCode(65 + index)}</span>
                  <h3>{pkg.company}</h3>
                  <p className="offer-role">{pkg.position}</p>
                </div>
                {offers.length > 1 && (
                  <button
                    className="delete-offer-btn"
                    onClick={() => handleRemoveOffer(pkg.id)}
                    title="Hapus penawaran"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Badges for Placement & Mode */}
              <div className="offer-badges">
                <span className={`badge-pill ${pkg.placementType.includes('Vendor') ? 'vendor' : 'inhouse'}`}>
                  {pkg.placementType}
                </span>
                <span className="badge-pill mode">{pkg.workMode}</span>
                <button
                  className="audit-link-btn"
                  onClick={() => setSelectedAuditOffer(pkg)}
                  title="Audit klausul kontrak PKWT/Vendor"
                >
                  <FileText size={12} /> Audit Risiko
                </button>
              </div>

              {/* Highlight Box: Net Monthly THP */}
              <div className="net-thp-hero">
                <span className="thp-label">ESTIMASI TAKE HOME PAY (BULANAN)</span>
                <b className="thp-amount">{idr(breakdown.netMonthlyTHP)}</b>
                <small className="thp-sub">
                  Gross: {idr(breakdown.grossMonthly)} · Potongan Pajak & BPJS: {idr(breakdown.totalDeductions)}
                </small>
              </div>

              {/* Real THP after Commute Penalty */}
              {pkg.monthlyCommuteCost > 0 && (
                <div className="real-thp-note">
                  <div className="commute-cost-row">
                    <span className="commute-tag">
                      <Car size={12} /> Biaya Komuter WFO: -{idr(pkg.monthlyCommuteCost)}
                    </span>
                    <strong className="real-net">
                      Real THP: {idr(breakdown.realNetTakeHome)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Annualized Earnings */}
              <div className="annual-summary-box">
                <div className="annual-row">
                  <span>Total Netto Tahunan (12x THP + THR + Bonus)</span>
                  <b>{idr(breakdown.annualNetTotal)}</b>
                </div>
                <div className="annual-row subtle">
                  <span>Gross Tahunan</span>
                  <span>{idr(breakdown.annualGross)}</span>
                </div>
              </div>

              {/* Deductions Breakdown Accordion / Detail */}
              <div className="deductions-box">
                <span className="box-title">Rincian Potongan Bulanan</span>
                <div className="deduction-item">
                  <span>PPh 21 TER 2024 ({breakdown.pph21TERRate}%)</span>
                  <strong>{idr(breakdown.pph21TERMonthly)}</strong>
                </div>
                <div className="deduction-item">
                  <span>BPJS Ketenagakerjaan (JHT 2% + JP 1%)</span>
                  <strong>{idr(breakdown.bpjsKetenagakerjaan.total)}</strong>
                </div>
                <div className="deduction-item">
                  <span>BPJS Kesehatan (1% capped)</span>
                  <strong>{idr(breakdown.bpjsKesehatan)}</strong>
                </div>
              </div>

              {/* Interactive Editing Form */}
              <div className="offer-edit-form">
                <span className="box-title">Parameter Kompensasi</span>

                <div className="form-row-compact">
                  <label>
                    Gaji Pokok (Base Salary)
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      step={500000}
                      value={pkg.baseSalary}
                      onChange={e => updateOffer(pkg.id, { baseSalary: parseInt(e.target.value) || 0 })}
                    />
                  </label>
                  <label>
                    Tunjangan Tetap
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      step={250000}
                      value={pkg.fixedAllowance}
                      onChange={e => updateOffer(pkg.id, { fixedAllowance: parseInt(e.target.value) || 0 })}
                    />
                  </label>
                </div>

                <div className="form-row-compact">
                  <label>
                    On-Call Standby Piket
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      step={500000}
                      value={pkg.onCallAllowance}
                      onChange={e => updateOffer(pkg.id, { onCallAllowance: parseInt(e.target.value) || 0 })}
                    />
                  </label>
                  <label>
                    Tunjangan WFH / Internet
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      step={250000}
                      value={pkg.wfhAllowance}
                      onChange={e => updateOffer(pkg.id, { wfhAllowance: parseInt(e.target.value) || 0 })}
                    />
                  </label>
                </div>

                <div className="form-row-compact">
                  <label>
                    Estimasi Biaya WFO / Komuter (Bln)
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      step={100000}
                      value={pkg.monthlyCommuteCost}
                      onChange={e => updateOffer(pkg.id, { monthlyCommuteCost: parseInt(e.target.value) || 0 })}
                    />
                  </label>
                  <label>
                    Kategori PTKP Pajak
                    <select
                      value={pkg.ptkpCategory}
                      onChange={e => updateOffer(pkg.id, { ptkpCategory: e.target.value as PTKPCategory })}
                    >
                      <option value="TK/0">TK/0 (Lajang tanpa tanggungan)</option>
                      <option value="TK/1">TK/1 (Lajang 1 tanggungan)</option>
                      <option value="K/0">K/0 (Menikah tanpa tanggungan)</option>
                      <option value="K/1">K/1 (Menikah 1 tanggungan)</option>
                      <option value="K/2">K/2 (Menikah 2 tanggungan)</option>
                      <option value="K/3">K/3 (Menikah 3 tanggungan)</option>
                    </select>
                  </label>
                </div>

                <div className="form-row-compact">
                  <label>
                    Target Bonus (Bulan Gaji)
                    <input
                      type="number"
                      inputMode="decimal"
                      step={0.5}
                      min={0}
                      max={12}
                      value={pkg.bonusMonths}
                      onChange={e => updateOffer(pkg.id, { bonusMonths: parseFloat(e.target.value) || 0 })}
                    />
                  </label>
                  <label>
                    Skema Penempatan
                    <select
                      value={pkg.placementType}
                      onChange={e => updateOffer(pkg.id, { placementType: e.target.value as OfferPackage['placementType'] })}
                    >
                      <option value="In-house">In-house (Direct Hire)</option>
                      <option value="Vendor / Outsource">Vendor / Outsource (PKWT)</option>
                      <option value="Contract">Independent Contractor</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Winner & Trade-Off Summary */}
      {evaluatedOffers.length > 1 && (
        <div className="comparison-summary-card">
          <h3>Analisis Komparasi & Trade-off Antar Penawaran</h3>
          <div className="summary-table-wrap">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Aspek Evaluasi</th>
                  {evaluatedOffers.map(o => (
                    <th key={o.pkg.id}>{o.pkg.company}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>Take Home Pay (THP) Bersih Bulanan</b></td>
                  {evaluatedOffers.map(o => (
                    <td key={o.pkg.id}>
                      <b className="highlight-green">{idr(o.breakdown.netMonthlyTHP)}</b>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td><b>Real THP (Setelah Pengeluaran Komuter/WFO)</b></td>
                  {evaluatedOffers.map(o => (
                    <td key={o.pkg.id}>
                      <strong>{idr(o.breakdown.realNetTakeHome)}</strong>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td><b>Total Netto Tahunan (Termasuk THR & Bonus)</b></td>
                  {evaluatedOffers.map(o => (
                    <td key={o.pkg.id}>
                      <b>{idr(o.breakdown.annualNetTotal)}</b>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td><b>Kompensasi On-Call Piket Engineering</b></td>
                  {evaluatedOffers.map(o => (
                    <td key={o.pkg.id}>
                      {o.pkg.onCallAllowance > 0 ? (
                        <span className="text-green-accent">{idr(o.pkg.onCallAllowance)} / bln</span>
                      ) : (
                        <span className="text-muted">Tidak ada tunjangan</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td><b>Fleksibilitas Kerja & Skema</b></td>
                  {evaluatedOffers.map(o => (
                    <td key={o.pkg.id}>
                      {o.pkg.workMode} ({o.pkg.placementType})
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Audit Risiko */}
      {selectedAuditOffer && (
        <VendorRiskModal
          companyName={selectedAuditOffer.company}
          positionTitle={selectedAuditOffer.position}
          onClose={() => setSelectedAuditOffer(null)}
        />
      )}

      {/* Modal Audit Kontrak PKWT */}
      {isContractModalOpen && (
        <ContractInspectorModal
          isOpen={isContractModalOpen}
          onClose={() => setIsContractModalOpen(false)}
        />
      )}

      {/* Modal Script Negosiasi Gaji */}
      {negotiateOffer && (
        <div className="overlay" role="dialog" aria-modal="true" style={{ zIndex: 1050 }}>
          <div className="modal" style={{ maxWidth: '640px', width: '95vw', background: '#fff' }}>
            <div className="drawer-head">
              <span className="eyebrow" style={{ color: '#18181b' }}>
                TACTICAL SALARY COUNTER-OFFER GENERATOR
              </span>
              <button onClick={() => setNegotiateOffer(null)}>
                <X size={18} />
              </button>
            </div>

            <h2 style={{ fontSize: '18px', margin: '8px 0 4px' }}>
              Draf Negosiasi Gaji · {negotiateOffer.company}
            </h2>
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#686d63' }}>
              Base awal: <b>{idr(negotiateOffer.baseSalary)}</b>. Atur angka target dan pendekatan komunikasi:
            </p>

            {/* Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888d82' }}>
                  Target Base Salary (IDR)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  step="500000"
                  value={targetCounterSalary}
                  onChange={(e) => setTargetCounterSalary(Number(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '13px', fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888d82' }}>
                  Pendekatan Strategis (Tone)
                </label>
                <select
                  value={negotiationTone}
                  onChange={(e) => setNegotiationTone(e.target.value as typeof negotiationTone)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #dedfd8', fontSize: '12px' }}
                >
                  <option value="collaborative">Kolaboratif & Value-Add</option>
                  <option value="market_firm">Benchmark Pasar & Scope</option>
                  <option value="competing_offer">Leverage Penawaran Paralel</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              <button
                type="button"
                className="secondary compact-btn"
                onClick={() => setNegotiationLang('id')}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  background: negotiationLang === 'id' ? '#202320' : '#f5f5f0',
                  color: negotiationLang === 'id' ? '#f5f5f0' : '#444840',
                }}
              >
                Bahasa Indonesia
              </button>
              <button
                type="button"
                className="secondary compact-btn"
                onClick={() => setNegotiationLang('en')}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  background: negotiationLang === 'en' ? '#202320' : '#f5f5f0',
                  color: negotiationLang === 'en' ? '#f5f5f0' : '#444840',
                }}
              >
                English Formal
              </button>
            </div>

            <textarea
              readOnly
              rows={9}
              value={negotiationDraft}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #dedfd8',
                borderRadius: '4px',
                fontSize: '12px',
                lineHeight: 1.5,
                background: '#fcfcf9',
              }}
            />

            {copyFeedback && (
              <div style={{ marginTop: '8px', color: '#455928', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={13} /> {copyFeedback}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #dedfd8' }}>
              <button type="button" className="secondary compact-btn" onClick={() => setNegotiateOffer(null)}>
                Tutup
              </button>
              <button
                type="button"
                className="primary compact-btn"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(negotiationDraft);
                    setCopyFeedback('Draf email counter-offer berhasil disalin ke clipboard!');
                    setTimeout(() => setCopyFeedback(null), 3000);
                  } catch {
                    setCopyFeedback('Gagal menyalin.');
                  }
                }}
                style={{ background: '#202320', color: '#f5f5f0' }}
              >
                <Copy size={13} /> Salin Draf Negosiasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
