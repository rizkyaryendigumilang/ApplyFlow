/**
 * Indonesian Take Home Pay (THP) Calculation Engine
 * Complies with:
 * - PPh 21 TER 2024 (PMK 168/2023)
 * - BPJS Ketenagakerjaan (JHT 2%, JP 1% capped at Rp 10.042.300)
 * - BPJS Kesehatan (1% capped at Rp 12.000.000)
 * - Statutory THR (1x Base Salary) & Target Performance Bonuses
 */

export type PTKPCategory = 'TK/0' | 'TK/1' | 'K/0' | 'K/1' | 'K/2' | 'K/3';

export interface OfferPackage {
  id: string;
  name: string;
  company: string;
  position: string;
  placementType: 'Full-time' | 'Part-time' | 'Contract' | 'In-house' | 'Vendor / Outsource';
  workMode: 'Remote' | 'In-person' | 'Hybrid' | 'On-site';
  baseSalary: number; // Monthly IDR
  fixedAllowance: number; // Transport, makan
  onCallAllowance: number; // Standby / incident allowance
  shiftAllowance: number; // Night shift / rotation allowance
  wfhAllowance: number; // Internet, listrik, hardware
  thrMultiplier: number; // Default 1.0 (1x base salary)
  bonusMonths: number; // Annual target bonus in months of base (e.g. 2.0)
  hasBpjs: boolean;
  ptkpCategory: PTKPCategory;
  customTaxRatePercent?: number; // Optional override for foreign contractor / nett agreement
  monthlyCommuteCost: number; // Bensin, toll, kereta, kos jika WFO
}

export interface THPBreakdown {
  grossMonthly: number;
  bpjsKetenagakerjaan: {
    jht: number;
    jp: number;
    total: number;
  };
  bpjsKesehatan: number;
  pph21TERMonthly: number;
  pph21TERRate: number; // e.g. 7 for 7%
  totalDeductions: number;
  netMonthlyTHP: number;
  realNetTakeHome: number; // netMonthlyTHP - monthlyCommuteCost
  annualGross: number; // (grossMonthly * 12) + THR + Bonus
  annualNetTotal: number;
}

// 2024 Statutory Max Wage Limits
export const BPJS_JP_MAX_WAGE = 10042300; // Rp 10.042.300 (Max deduction = Rp 100.423)
export const BPJS_KES_MAX_WAGE = 12000000; // Rp 12.000.000 (Max deduction = Rp 120.000)

// PPh 21 TER Table A (TK/0, TK/1, K/0) per PMK 168/2023
const TER_A_BRACKETS: [number, number][] = [
  [5400000, 0],
  [5650000, 0.25],
  [5950000, 0.5],
  [6300000, 0.75],
  [6750000, 1.0],
  [7500000, 1.25],
  [8550000, 1.5],
  [9650000, 1.75],
  [10050000, 2.0],
  [10350000, 2.25],
  [10700000, 2.5],
  [11050000, 3.0],
  [11600000, 3.5],
  [12500000, 4.0],
  [13750000, 5.0],
  [15100000, 6.0],
  [16950000, 7.0],
  [19750000, 8.0],
  [24150000, 9.0],
  [26450000, 10.0],
  [28000000, 11.0],
  [30050000, 12.0],
  [32400000, 13.0],
  [35400000, 14.0],
  [39100000, 15.0],
  [43850000, 16.0],
  [47800000, 17.0],
  [51400000, 18.0],
  [56300000, 19.0],
  [62200000, 20.0],
  [68600000, 21.0],
  [77500000, 22.0],
  [89000000, 23.0],
  [101900000, 24.0],
  [118000000, 25.0],
  [138000000, 26.0],
  [164000000, 27.0],
  [212000000, 28.0],
  [305000000, 29.0],
  [440000000, 30.0],
  [670000000, 31.0],
  [1000000000, 32.0],
  [1400000000, 33.0],
];

// PPh 21 TER Table B (TK/2, TK/3, K/1, K/2)
const TER_B_BRACKETS: [number, number][] = [
  [6200000, 0],
  [6500000, 0.25],
  [6850000, 0.5],
  [7300000, 0.75],
  [9200000, 1.0],
  [10750000, 1.5],
  [12550000, 2.0],
  [13050000, 3.0],
  [15000000, 4.0],
  [16900000, 5.0],
  [19750000, 6.0],
  [24100000, 7.0],
  [26450000, 8.0],
  [28000000, 9.0],
  [30050000, 10.0],
  [32400000, 11.0],
  [35400000, 12.0],
  [39100000, 13.0],
  [43850000, 14.0],
  [47800000, 15.0],
  [51400000, 16.0],
  [56300000, 17.0],
  [62200000, 18.0],
  [68600000, 19.0],
  [77500000, 20.0],
  [89000000, 21.0],
  [101900000, 22.0],
  [118000000, 23.0],
  [138000000, 24.0],
  [164000000, 25.0],
  [212000000, 26.0],
  [305000000, 27.0],
  [440000000, 28.0],
  [670000000, 29.0],
  [1000000000, 30.0],
  [1400000000, 31.0],
];

export function getTERRate(monthlyGross: number, ptkp: PTKPCategory): number {
  const isB = ['K/1', 'K/2'].includes(ptkp);
  const brackets = isB ? TER_B_BRACKETS : TER_A_BRACKETS;

  for (const [limit, rate] of brackets) {
    if (monthlyGross <= limit) {
      return rate;
    }
  }
  return isB ? 34.0 : 34.0;
}

export function calculateTHP(pkg: OfferPackage): THPBreakdown {
  const grossMonthly =
    pkg.baseSalary +
    pkg.fixedAllowance +
    pkg.onCallAllowance +
    pkg.shiftAllowance +
    pkg.wfhAllowance;

  let jht = 0;
  let jp = 0;
  let bpjsKes = 0;

  if (pkg.hasBpjs) {
    // JHT: 2% of base
    jht = Math.round(pkg.baseSalary * 0.02);
    // JP: 1% of base capped at BPJS_JP_MAX_WAGE
    const jpWage = Math.min(pkg.baseSalary, BPJS_JP_MAX_WAGE);
    jp = Math.round(jpWage * 0.01);
    // BPJS Kes: 1% of base capped at BPJS_KES_MAX_WAGE
    const kesWage = Math.min(pkg.baseSalary, BPJS_KES_MAX_WAGE);
    bpjsKes = Math.round(kesWage * 0.01);
  }

  const bpjsKetenagakerjaan = {
    jht,
    jp,
    total: jht + jp,
  };

  // PPh 21 TER
  let pph21TERRate = 0;
  let pph21TERMonthly = 0;

  if (pkg.customTaxRatePercent !== undefined && pkg.customTaxRatePercent >= 0) {
    pph21TERRate = pkg.customTaxRatePercent;
    pph21TERMonthly = Math.round(grossMonthly * (pph21TERRate / 100));
  } else {
    pph21TERRate = getTERRate(grossMonthly, pkg.ptkpCategory);
    pph21TERMonthly = Math.round(grossMonthly * (pph21TERRate / 100));
  }

  const totalDeductions = bpjsKetenagakerjaan.total + bpjsKes + pph21TERMonthly;
  const netMonthlyTHP = Math.max(0, grossMonthly - totalDeductions);
  const realNetTakeHome = Math.max(0, netMonthlyTHP - pkg.monthlyCommuteCost);

  // Annual computations
  const annualBaseSalary = pkg.baseSalary * 12;
  const annualAllowances =
    (pkg.fixedAllowance +
      pkg.onCallAllowance +
      pkg.shiftAllowance +
      pkg.wfhAllowance) *
    12;
  const thr = pkg.baseSalary * pkg.thrMultiplier;
  const bonus = pkg.baseSalary * pkg.bonusMonths;
  const annualGross = annualBaseSalary + annualAllowances + thr + bonus;

  // Annual Net estimate: 12 months net THP + net THR + net Bonus
  const bonusNet = Math.round(bonus * (1 - pph21TERRate / 100));
  const thrNet = Math.round(thr * (1 - pph21TERRate / 100));
  const annualNetTotal = netMonthlyTHP * 12 + thrNet + bonusNet;

  return {
    grossMonthly,
    bpjsKetenagakerjaan,
    bpjsKesehatan: bpjsKes,
    pph21TERMonthly,
    pph21TERRate,
    totalDeductions,
    netMonthlyTHP,
    realNetTakeHome,
    annualGross,
    annualNetTotal,
  };
}
