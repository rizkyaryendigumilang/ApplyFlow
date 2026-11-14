import type { Application } from '../../lib/pb-types';
import { salary } from '../../lib/utils';

export interface JobTableProps {
  applications: Application[];
  onSelectApplication: (application: Application) => void;
}

export function JobTable({ applications, onSelectApplication }: JobTableProps) {
  if (applications.length === 0) {
    return (
      <div className="table-wrap" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#777c73' }}>
          No applications found matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Company</th>
            <th>Position</th>
            <th>Status</th>
            <th>Source</th>
            <th>Location</th>
            <th>Mode</th>
            <th>Pay</th>
            <th>Sent</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((a) => (
            <tr key={a.id} onClick={() => onSelectApplication(a)}>
              <td>
                <b style={{ color: '#202320' }}>{a.company}</b>
              </td>
              <td>{a.position}</td>
              <td>
                <span className={`status-pill ${a.status.toLowerCase()}`}>{a.status}</span>
              </td>
              <td>
                {a.jobSource ? (
                  <span className="badge-source">{a.jobSource}</span>
                ) : (
                  <span style={{ color: '#888d82' }}>Direct</span>
                )}
                {a.autoCreated && <span className="badge-auto">Auto</span>}
              </td>
              <td>{a.location}</td>
              <td>{a.mode}</td>
              <td style={{ fontVariantNumeric: 'tabular-nums' }}>{salary(a)}</td>
              <td style={{ fontVariantNumeric: 'tabular-nums' }}>{a.sentAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
