import { ChevronRight } from 'lucide-react';

export interface FollowUpItem {
  date: string;
  title: string;
  detail: string;
}

export interface FollowUpProps {
  item: FollowUpItem;
  onClick?: () => void;
}

export function FollowUp({ item, onClick }: FollowUpProps) {
  const date = new Date(item.date);
  return (
    <div
      className="followup"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className="date">
        {date.getDate()}
        <br />
        <small>{date.toLocaleString('en-US', { month: 'short' }).toUpperCase()}</small>
      </span>
      <div>
        <b>{item.title}</b>
        <p>{item.detail}</p>
      </div>
      <ChevronRight size={14} />
    </div>
  );
}
