import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTHP,
  BPJS_JP_MAX_WAGE,
  BPJS_KES_MAX_WAGE,
  type OfferPackage,
} from '../thp-calculator.ts';

test('calculateTHP applies BPJS wage ceiling accurately', () => {
  const pkg: OfferPackage = {
    id: 'test-1',
    name: 'High Salary Offer',
    company: 'Big Tech',
    position: 'Staff Engineer',
    placementType: 'In-house',
    workMode: 'Remote',
    baseSalary: 30000000, // Rp 30 Juta (above BPJS ceilings)
    fixedAllowance: 0,
    onCallAllowance: 0,
    shiftAllowance: 0,
    wfhAllowance: 0,
    thrMultiplier: 1.0,
    bonusMonths: 2.0,
    hasBpjs: true,
    ptkpCategory: 'TK/0',
    monthlyCommuteCost: 0,
  };

  const result = calculateTHP(pkg);

  // JP 1% of capped Rp 10.042.300 = ~Rp 100.423
  assert.equal(result.bpjsKetenagakerjaan.jp, Math.round(BPJS_JP_MAX_WAGE * 0.01));

  // Kes 1% of capped Rp 12.000.000 = Rp 120.000
  assert.equal(result.bpjsKesehatan, Math.round(BPJS_KES_MAX_WAGE * 0.01));

  // JHT 2% of Rp 30.000.000 (uncapped) = Rp 600.000
  assert.equal(result.bpjsKetenagakerjaan.jht, 600000);

  // Real Net Take Home equals Net THP when commute cost is 0
  assert.equal(result.realNetTakeHome, result.netMonthlyTHP);
  assert.ok(result.netMonthlyTHP < result.grossMonthly);
});

test('calculateTHP handles zero deductions when hasBpjs is false', () => {
  const pkg: OfferPackage = {
    id: 'test-2',
    name: 'Contractor Offer',
    company: 'Overseas Startup',
    position: 'Contractor',
    placementType: 'Contract',
    workMode: 'Remote',
    baseSalary: 15000000,
    fixedAllowance: 0,
    onCallAllowance: 0,
    shiftAllowance: 0,
    wfhAllowance: 0,
    thrMultiplier: 0,
    bonusMonths: 0,
    hasBpjs: false,
    ptkpCategory: 'TK/0',
    customTaxRatePercent: 0,
    monthlyCommuteCost: 0,
  };

  const result = calculateTHP(pkg);
  assert.equal(result.bpjsKetenagakerjaan.total, 0);
  assert.equal(result.bpjsKesehatan, 0);
  assert.equal(result.netMonthlyTHP, 15000000);
});

test('calculateTHP deducts commute cost from real net take home', () => {
  const pkg: OfferPackage = {
    id: 'test-3',
    name: 'Onsite Offer',
    company: 'Traditional Bank',
    position: 'Architect',
    placementType: 'In-house',
    workMode: 'On-site',
    baseSalary: 20000000,
    fixedAllowance: 2000000,
    onCallAllowance: 0,
    shiftAllowance: 0,
    wfhAllowance: 0,
    thrMultiplier: 1.0,
    bonusMonths: 1.0,
    hasBpjs: true,
    ptkpCategory: 'TK/0',
    monthlyCommuteCost: 1500000, // Rp 1.5 Juta transport/bensin
  };

  const result = calculateTHP(pkg);
  assert.equal(result.realNetTakeHome, result.netMonthlyTHP - 1500000);
});
