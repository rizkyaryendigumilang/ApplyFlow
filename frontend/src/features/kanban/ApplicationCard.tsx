import { MoreHorizontal } from 'lucide-react';
import type { Application } from '../../lib/pb-types';
import { idr, daysSince } from '../../lib/utils';

export interface ApplicationCardProps {
  application: Application;
  onClick: () => void;
}

export function ApplicationCard({ application: a, onClick }: ApplicationCardProps) {
  return (
    <article className="job-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}>
      <div className="job-top">
        <span className="company-logo">{a.company[0]}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          aria-label="Application options"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
      <h4>{a.position}</h4>
      <p className="company">
        {a.company}
        {a.jobSource && <span className="badge-source">{a.jobSource}</span>}
        {a.autoCreated && <span className="badge-auto">Auto</span>}
      </p>
      <div className="tags">
        <span>{a.mode}</span>
        <span>{a.location}</span>
        {a.status === 'Viewed' && (
          <span style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
            Seen by Employer
          </span>
        )}
      </div>
      <div className="job-foot">
        <span>
          {a.salaryPeriod === 'monthly'
            ? idr(a.salaryMax)
            : `${Math.round(a.salaryMax / 12 / 1000000)}m/mo`}
        </span>
        <small>{daysSince(a.sentAt)}d ago</small>
      </div>
    </article>
  );
}
