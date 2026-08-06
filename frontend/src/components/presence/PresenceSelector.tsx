import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Coffee, Phone, Power, Circle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PresenceService } from '../../services/presence.service';
import { PresenceStatus, PRESENCE_DOT, PRESENCE_LABELS, MANUAL_PRESENCE_OPTIONS } from '../../types/presence.types';
import { useCall } from '../../contexts/CallContext';
import { PresenceBadge } from './PresenceBadge';

const OPTION_ICONS: Record<PresenceStatus, React.ReactNode> = {
  ONLINE: <Circle className="w-3.5 h-3.5 text-emerald-400" />,
  ON_CALL: <Phone className="w-3.5 h-3.5 text-indigo-400" />,
  PAUSE: <Coffee className="w-3.5 h-3.5 text-amber-400" />,
  OFFLINE: <Power className="w-3.5 h-3.5 text-slate-400" />,
};

export const PresenceSelector: React.FC = () => {
  const { user, updatePresenceStatus } = useAuth();
  const { activeCall } = useCall();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentStatus: PresenceStatus = activeCall
    ? 'ON_CALL'
    : ((user?.presenceStatus as PresenceStatus) || 'OFFLINE');

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSelect = async (status: PresenceStatus) => {
    if (status === 'ON_CALL' || status === currentStatus) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const updated = await PresenceService.updateMyStatus(status);
      updatePresenceStatus(updated.presenceStatus);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const disabled = Boolean(activeCall) || loading;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
        title={activeCall ? 'Statut verrouillé pendant l\'appel' : 'Changer votre statut'}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
          disabled
            ? 'bg-slate-800/50 border-slate-700 text-slate-400 cursor-default'
            : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
        }`}
      >
        <PresenceBadge status={currentStatus} showLabel={false} pulse={currentStatus === 'ONLINE' || currentStatus === 'ON_CALL'} />
        <span>{PRESENCE_LABELS[currentStatus]}</span>
        {!disabled && <ChevronDown className={`w-3.5 h-3.5 transition ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 py-1 rounded-xl bg-slate-900 border border-slate-700 shadow-xl z-50">
          {MANUAL_PRESENCE_OPTIONS.map(status => (
            <button
              key={status}
              type="button"
              onClick={() => handleSelect(status)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-slate-800 transition ${
                currentStatus === status ? 'text-indigo-300 bg-indigo-500/10' : 'text-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${PRESENCE_DOT[status]}`} />
              {OPTION_ICONS[status]}
              {PRESENCE_LABELS[status]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
