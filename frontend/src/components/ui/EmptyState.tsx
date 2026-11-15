import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state-card ${className}`}
      style={{
        padding: compact ? '32px 20px' : '48px 24px',
        textAlign: 'center',
        background: '#fbfbf8',
        border: '1px dashed #d5d8cd',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '12px 0',
      }}
    >
      <div
        style={{
          width: compact ? '36px' : '44px',
          height: compact ? '36px' : '44px',
          borderRadius: '10px',
          background: '#eef1e5',
          color: '#556b2f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
        }}
      >
        <Icon size={compact ? 18 : 22} />
      </div>

      <h3
        style={{
          fontSize: compact ? '14px' : '16px',
          fontWeight: 600,
          color: '#202320',
          margin: '0 0 6px',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '13px',
          color: '#666b60',
          maxWidth: '420px',
          lineHeight: 1.5,
          margin: '0 0 18px',
        }}
      >
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              style={{
                background: '#202320',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'opacity 0.15s ease',
              }}
            >
              {actionLabel}
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              style={{
                background: '#ffffff',
                color: '#494f45',
                border: '1px solid #d5d8cd',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
