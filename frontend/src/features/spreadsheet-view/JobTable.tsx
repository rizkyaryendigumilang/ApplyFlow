import type { Application } from '../../lib/pb-types';
import { salary } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchX } from 'lucide-react';

export interface JobTableProps {
  applications: Application[];
  onSelectApplication: (application: Application) => void;
  onResetFilters?: () => void;
}

export function JobTable({ applications, onSelectApplication, onResetFilters }: JobTableProps) {
  if (applications.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Tidak Ada Lamaran Ditemukan"
        description="Tidak ada peluang karier yang cocok dengan filter atau kata kunci saat ini. Coba sesuaikan kata kunci atau bersihkan filter."
        actionLabel={onResetFilters ? "Reset Filter" : undefined}
        onAction={onResetFilters}
      />
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
