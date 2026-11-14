import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Application } from './pb-types';
import { calculateTHP, type PTKPCategory } from './thp-calculator';

export { cn } from './cn';

export const idr = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);

export const salary = (a: Application) =>
  `${idr(a.salaryMin)} - ${idr(a.salaryMax)} / ${a.salaryPeriod === 'monthly' ? 'mo' : 'yr'}`;

export const daysSince = (date: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));

/**
 * @deprecated Use `calculateTHP` from `./thp-calculator` for compliant PPh 21 TER 2024 & BPJS statutory calculations.
 */
export const thp = (
  base: number,
  allowance: number = 0,
  taxRatePercent?: number,
  ptkp: PTKPCategory = 'TK/0'
): number => {
  const result = calculateTHP({
    id: 'util-calc',
    name: 'Quick THP',
    company: 'Company',
    position: 'Position',
    placementType: 'In-house',
    workMode: 'Hybrid',
    baseSalary: base,
    fixedAllowance: allowance,
    onCallAllowance: 0,
    shiftAllowance: 0,
    wfhAllowance: 0,
    thrMultiplier: 1.0,
    bonusMonths: 0,
    hasBpjs: true,
    ptkpCategory: ptkp,
    customTaxRatePercent: taxRatePercent,
    monthlyCommuteCost: 0,
  });
  return result.netMonthlyTHP;
};

export const responseRate = (responses: number, applications: number) =>
  applications > 0 ? Math.round((responses / applications) * 100) : 0;
