import React from 'react';
import { PresenceStatus, PRESENCE_DOT, PRESENCE_LABELS } from '../../types/presence.types';

interface PresenceBadgeProps {
  status: PresenceStatus;
  showLabel?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export const PresenceBadge: React.FC<PresenceBadgeProps> = ({
  status,
  showLabel = true,
  pulse = status === 'ONLINE' || status === 'ON_CALL',
  size = 'sm',
}) => {
  const dotSize = size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex">
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${PRESENCE_DOT[status]}`} />
        )}
        <span className={`relative inline-flex rounded-full ${dotSize} ${PRESENCE_DOT[status]}`} />
      </span>
      {showLabel && (
        <span className="text-[10px] font-medium text-slate-400">{PRESENCE_LABELS[status]}</span>
      )}
    </span>
  );
};
