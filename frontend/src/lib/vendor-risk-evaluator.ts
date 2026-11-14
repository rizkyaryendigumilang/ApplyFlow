export interface ContractChecklist {
  placementType: 'In-house' | 'Vendor / Outsource' | 'Contract';
  pp35SeveranceGuaranteed: boolean; // Uang kompensasi PKWT PP 35/2021 (1 bulan upah per 12 bulan)
  benchPolicy: 'full_pay' | 'partial_pay' | 'unpaid'; // Kebijakan gaji saat tidak ada proyek klien
  overtimeClause: 'statutory_spkl' | 'fixed_allowance' | 'unpaid_professional'; // Lembur & on-call
  laptopProvision: 'company_provided' | 'byod_with_allowance' | 'byod_unpaid'; // Laptop kerja
  clientBuyoutPenalty: 'none' | 'reasonable' | 'excessive_fine'; // Denda penalti jika klien merekrut langsung
  bpjsWageReporting: 'full_salary' | 'umr_minimum'; // Integritas pelaporan gaji ke BPJS
}

export interface RiskEvaluationResult {
  riskScore: number; // 0 (sangat aman) - 100 (sangat berisiko)
  riskLevel: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  summary: string;
  redFlags: string[];
  negotiationPoints: string[];
  statutoryNotes: string[];
}

export const DEFAULT_VENDOR_CHECKLIST: ContractChecklist = {
  placementType: 'Vendor / Outsource',
  pp35SeveranceGuaranteed: true,
  benchPolicy: 'full_pay',
  overtimeClause: 'statutory_spkl',
  laptopProvision: 'company_provided',
  clientBuyoutPenalty: 'none',
  bpjsWageReporting: 'full_salary',
};

export function evaluateVendorContract(checklist: ContractChecklist): RiskEvaluationResult {
  if (checklist.placementType === 'In-house') {
    return {
      riskScore: 10,
      riskLevel: 'Low Risk',
      summary: 'Penempatan In-house memiliki proteksi hukum dan kestabilan karir tertinggi.',
      redFlags: [],
      negotiationPoints: [
        'Pastikan masa percobaan (probation) maksimal 3 bulan sesuai pasal 60 UU Ketenagakerjaan.',
        'Verifikasi skema kenaikan gaji tahunan berbasis performa (KPI).',
      ],
      statutoryNotes: [
        'Karyawan tetap (PKWTT) berhak atas uang pesangon penuh sesuai PP 35/2021 jika terjadi restrukturisasi.',
      ],
    };
  }

  let penalty = 0;
  const redFlags: string[] = [];
  const negotiationPoints: string[] = [];
  const statutoryNotes: string[] = [];

  // 1. PP 35/2021 Kompensasi PKWT
  if (!checklist.pp35SeveranceGuaranteed) {
    penalty += 25;
    redFlags.push('Klausul kompensasi akhir kontrak (PP 35/2021) tidak dicantumkan dalam draf PKWT.');
    negotiationPoints.push(
      'Minta HR vendor mencantumkan klausul eksplisit: "Pekerja berhak atas uang kompensasi PKWT sesuai PP 35/2021 sebesar 1 bulan upah untuk setiap 12 bulan masa kerja".'
    );
  } else {
    statutoryNotes.push('Sesuai PP 35/2021: Wajib menerima 1 bulan upah per 1 tahun masa kontrak saat masa PKWT berakhir.');
  }

  // 2. Bench Policy
  if (checklist.benchPolicy === 'unpaid') {
    penalty += 30;
    redFlags.push('Sistem Bench Tanpa Gaji (Unpaid): Vendor tidak membayar gaji saat proyek selesai atau klien mengakhiri penempatan.');
    negotiationPoints.push('Tolak klausul unpaid bench! Upah wajib dibayar penuh selama pekerja masih terikat kontrak PKWT aktif.');
  } else if (checklist.benchPolicy === 'partial_pay') {
    penalty += 15;
    redFlags.push('Gaji Bench Dipotong: Vendor hanya membayar sebagian gaji pokok saat masa jeda penempatan klien.');
    negotiationPoints.push('Tanyakan kepastian durasi penempatan klien berikutnya dan jaminan minimal gaji bench.');
  }

  // 3. Overtime / On-Call SPKL
  if (checklist.overtimeClause === 'unpaid_professional') {
    penalty += 20;
    redFlags.push('Lembur Tanpa Kompensasi: Pekerjaan malam atau incident on-call dianggap "tanggung jawab profesional" tanpa SPKL.');
    negotiationPoints.push(
      'Ajukan klausul On-Call Standby Allowance tetap (misal Rp 1.500.000/minggu piket) di luar gaji pokok jika SPKL tidak diberlakukan.'
    );
  } else if (checklist.overtimeClause === 'fixed_allowance') {
    penalty += 5;
    negotiationPoints.push('Pastikan nilai tunjangan lembur/on-call sebanding dengan frekuensi deployment malam.');
  }

  // 4. Laptop Provision
  if (checklist.laptopProvision === 'byod_unpaid') {
    penalty += 15;
    redFlags.push('Wajib Membawa Laptop Pribadi (BYOD) tanpa kompensasi sewa atau tunjangan pemeliharaan hardware.');
    negotiationPoints.push('Minta laptop standar engineering dari vendor/klien atau tunjangan depresiasi laptop minimal Rp 1.000.000/bulan.');
  }

  // 5. Client Buyout Penalty
  if (checklist.clientBuyoutPenalty === 'excessive_fine') {
    penalty += 25;
    redFlags.push('Denda Buyout Eksploitatif: Penalti denda puluhan hingga ratusan juta jika klien merekrut Anda secara permanen.');
    negotiationPoints.push(
      'Hapus klausul penalti kepada pekerja. Biaya transfer klien (client placement fee) adalah urusan B2B antara vendor dan klien, bukan tanggungan pekerja.'
    );
  }

  // 6. BPJS Wage Reporting
  if (checklist.bpjsWageReporting === 'umr_minimum') {
    penalty += 20;
    redFlags.push('Under-reporting BPJS: Gaji yang dilaporkan ke BPJS Ketenagakerjaan & Kesehatan dipotong ke batas UMR (bukan gaji riil).');
    negotiationPoints.push('Tuntut pelaporan upah riil ke BPJS agar akumulasi saldo Jaminan Hari Tua (JHT) dan Jaminan Pensiun (JP) maksimal.');
  }

  const riskScore = Math.min(100, Math.max(0, penalty));
  let riskLevel: 'Low Risk' | 'Moderate Risk' | 'High Risk' = 'Low Risk';

  if (riskScore >= 55) {
    riskLevel = 'High Risk';
  } else if (riskScore >= 25) {
    riskLevel = 'Moderate Risk';
  }

  const summary =
    riskLevel === 'High Risk'
      ? 'Draf penempatan ini mengandung red-flag kritis yang berisiko merugikan finansial dan kepastian hukum Anda.'
      : riskLevel === 'Moderate Risk'
      ? 'Draf memiliki beberapa klausul fleksibel yang perlu dinegosiasikan sebelum Anda menandatangani offering letter.'
      : 'Kontrak vendor tergolong adil dan mematuhi regulasi ketenagakerjaan standar industri IT.';

  return {
    riskScore,
    riskLevel,
    summary,
    redFlags,
    negotiationPoints,
    statutoryNotes,
  };
}
