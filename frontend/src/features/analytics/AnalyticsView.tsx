import { useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  FileText,
  Clock,
  PieChart,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import type { Application, CVArtifact } from '../../lib/pb-types';
import { idr, responseRate } from '../../lib/utils';
import { exportApplicationsToCSV, triggerDownload } from '../../lib/data-transfer';

export interface AnalyticsViewProps {
  applications: Application[];
  cvs: CVArtifact[];
}

export function AnalyticsView({ applications, cvs }: AnalyticsViewProps) {
  const [filterPeriod, setFilterPeriod] = useState<'all' | '30d' | '90d'>('all');

  // Stage conversion counts
  const stageCounts = useMemo(() => {
    return {
      Wishlist: applications.filter((a) => a.status === 'Wishlist').length,
      Applied: applications.filter((a) => a.status === 'Applied').length,
      Viewed: applications.filter((a) => a.status === 'Viewed').length,
      Screening: applications.filter((a) => a.status === 'Screening').length,
      Interview: applications.filter((a) => a.status === 'Interview').length,
      Offer: applications.filter((a) => a.status === 'Offer').length,
      Rejected: applications.filter((a) => a.status === 'Rejected').length,
      Ghosted: applications.filter((a) => a.status === 'Ghosted').length,
    };
  }, [applications]);

  const totalSubmitted =
    applications.length - stageCounts.Wishlist;

  const responseCount =
    stageCounts.Viewed +
    stageCounts.Screening +
    stageCounts.Interview +
    stageCounts.Offer;

  const interviewCount = stageCounts.Interview + stageCounts.Offer;

  const overallResponseRate =
    totalSubmitted > 0 ? Math.round((responseCount / totalSubmitted) * 100) : 0;
  const interviewConversionRate =
    totalSubmitted > 0 ? Math.round((interviewCount / totalSubmitted) * 100) : 0;
  const offerConversionRate =
    interviewCount > 0 ? Math.round((stageCounts.Offer / interviewCount) * 100) : 0;

  // Salary distribution analysis
  const salaryStats = useMemo(() => {
    const salaries = applications
      .filter((a) => a.salaryMax > 0)
      .map((a) => (a.salaryPeriod === 'annual' ? a.salaryMax / 12 : a.salaryMax));

    if (salaries.length === 0) return { min: 0, max: 0, avg: 0, median: 0 };
    const sorted = [...salaries].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = Math.round(sorted.reduce((acc, curr) => acc + curr, 0) / sorted.length);
    const median = sorted[Math.floor(sorted.length / 2)];
    return { min, max, avg, median };
  }, [applications]);

  const handleExportCSV = () => {
    const csv = exportApplicationsToCSV(applications);
    triggerDownload(csv, `junction_applications_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(applications, null, 2);
    triggerDownload(json, `junction_applications_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div
        style={{
          background: '#fbfbf8',
          border: '1px solid #dedfd8',
          padding: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: '#f4f4f5',
                color: '#18181b',
                padding: '6px',
                borderRadius: '6px',
                display: 'inline-grid',
                placeItems: 'center',
              }}
            >
              <BarChart3 size={18} />
            </span>
            <h1 style={{ fontSize: '20px', margin: 0, fontWeight: 600 }}>
              Analytics & Funnel Insights
            </h1>
            <span
              style={{
                font: "10px 'DM Mono'",
                textTransform: 'uppercase',
                background: '#e8eedd',
                color: '#4e622b',
                padding: '4px 8px',
                borderRadius: '3px',
                border: '1px solid #d4dec3',
              }}
            >
              Real-time Metrics
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#777c73', margin: '8px 0 0' }}>
            Full funnel progression, stage drop-offs, CV variant performance, and salary distribution.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            className="secondary compact-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="secondary compact-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={13} /> Export JSON
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', padding: '20px' }}>
          <span style={{ font: "10px 'DM Mono'", color: '#888d82', textTransform: 'uppercase' }}>
            Submitted Roles
          </span>
          <b style={{ display: 'block', font: "32px 'DM Mono'", margin: '6px 0 2px', color: '#202320' }}>
            {totalSubmitted}
          </b>
          <small style={{ color: '#777c73', fontSize: '11px' }}>
            Excluding {stageCounts.Wishlist} unapplied wishlists
          </small>
        </div>

        <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', padding: '20px' }}>
          <span style={{ font: "10px 'DM Mono'", color: '#888d82', textTransform: 'uppercase' }}>
            Employer Response Rate
          </span>
          <b style={{ display: 'block', font: "32px 'DM Mono'", margin: '6px 0 2px', color: '#09090b' }}>
            {overallResponseRate}%
          </b>
          <small style={{ color: '#777c73', fontSize: '11px' }}>
            {responseCount} roles viewed or contacted
          </small>
        </div>

        <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', padding: '20px' }}>
          <span style={{ font: "10px 'DM Mono'", color: '#888d82', textTransform: 'uppercase' }}>
            Interview Conversion
          </span>
          <b style={{ display: 'block', font: "32px 'DM Mono'", margin: '6px 0 2px', color: '#202320' }}>
            {interviewConversionRate}%
          </b>
          <small style={{ color: '#777c73', fontSize: '11px' }}>
            {interviewCount} moved to technical/HR rounds
          </small>
        </div>

        <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', padding: '20px' }}>
          <span style={{ font: "10px 'DM Mono'", color: '#888d82', textTransform: 'uppercase' }}>
            Offer Win Rate
          </span>
          <b style={{ display: 'block', font: "32px 'DM Mono'", margin: '6px 0 2px', color: '#09090b' }}>
            {offerConversionRate}%
          </b>
          <small style={{ color: '#777c73', fontSize: '11px' }}>
            {stageCounts.Offer} official offers received
          </small>
        </div>
      </div>

      {/* Visual Funnel Progression */}
      <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', margin: '0 0 16px', fontWeight: 600 }}>
          Recruitment Stage Conversion Funnel
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Wishlist', count: stageCounts.Wishlist, color: '#a6aa9f', max: applications.length },
            { label: 'Applied', count: stageCounts.Applied, color: '#d7b454', max: applications.length },
            { label: 'Viewed', count: stageCounts.Viewed, color: '#0ea5e9', max: applications.length },
            { label: 'Screening', count: stageCounts.Screening, color: '#98b768', max: applications.length },
            { label: 'Interview', count: stageCounts.Interview, color: '#83a8b4', max: applications.length },
            { label: 'Offer', count: stageCounts.Offer, color: '#bd8a67', max: applications.length },
          ].map((stage) => {
            const pct = applications.length > 0 ? Math.round((stage.count / applications.length) * 100) : 0;
            return (
              <div key={stage.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', alignItems: 'center', gap: '16px' }}>
                <span style={{ font: "12px 'DM Mono'", fontWeight: 500 }}>{stage.label}</span>
                <div style={{ background: '#ecece7', height: '22px', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: stage.color,
                      height: '100%',
                      width: `${Math.max(pct, 2)}%`,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <span style={{ font: "12px 'DM Mono'", textAlign: 'right', color: '#555e50' }}>
                  {stage.count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: CV Variant Experiments + Salary Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* CV Variant Performance */}
        <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', margin: 0, fontWeight: 600 }}>
              CV Story & Angle Performance
            </h3>
            <FileText size={16} style={{ color: '#18181b' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cvs.map((cv) => (
              <div
                key={cv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f5f5f0',
                  border: '1px solid #dedfd8',
                }}
              >
                <div>
                  <strong style={{ fontSize: '13px', display: 'block', color: '#202320' }}>{cv.label}</strong>
                  <span style={{ fontSize: '11px', color: '#888d82' }}>
                    {cv.version} · {cv.applications} sent
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b style={{ font: "16px 'DM Mono'", color: '#09090b', display: 'block' }}>
                    {responseRate(cv.responses, cv.applications)}%
                  </b>
                  <small style={{ fontSize: '10px', color: '#888d82' }}>response</small>
                </div>
              </div>
            ))}
            {cvs.length === 0 && (
              <p style={{ fontSize: '12px', color: '#888d82', fontStyle: 'italic' }}>
                No CV variants registered.
              </p>
            )}
          </div>
        </div>

        {/* Salary & Take-Home-Pay Insights */}
        <div style={{ background: '#fbfbf8', border: '1px solid #dedfd8', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', margin: 0, fontWeight: 600 }}>
              Compensation Distribution
            </h3>
            <TrendingUp size={16} style={{ color: '#18181b' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ecece7' }}>
              <span style={{ fontSize: '12px', color: '#777c73' }}>Median Target Compensation</span>
              <b style={{ font: "13px 'DM Mono'", color: '#202320' }}>{idr(salaryStats.median)} / mo</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ecece7' }}>
              <span style={{ fontSize: '12px', color: '#777c73' }}>Average Listed Max Salary</span>
              <b style={{ font: "13px 'DM Mono'", color: '#202320' }}>{idr(salaryStats.avg)} / mo</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ecece7' }}>
              <span style={{ fontSize: '12px', color: '#777c73' }}>Peak Opportunity Ceiling</span>
              <b style={{ font: "13px 'DM Mono'", color: '#09090b' }}>{idr(salaryStats.max)} / mo</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: '12px', color: '#777c73' }}>Total Roles with Disclosed Pay</span>
              <b style={{ font: "13px 'DM Mono'", color: '#202320' }}>
                {applications.filter((a) => a.salaryMax > 0).length} of {applications.length}
              </b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
