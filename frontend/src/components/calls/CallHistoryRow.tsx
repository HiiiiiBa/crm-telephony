import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import {
  Call, CallDirection, CallStatus,
  CALL_STATUS_LABELS, CALL_DIRECTION_LABELS,
  formatCallDuration, formatCallDate, getStatusBadgeClass,
} from '../../types/calls.types';

interface CallHistoryRowProps {
  call: Call;
  onEditNote?: (call: Call) => void;
  compact?: boolean;
}

export const CallHistoryRow: React.FC<CallHistoryRowProps> = ({ call, onEditNote, compact }) => {
  const contactName = call.contact
    ? `${call.contact.firstName} ${call.contact.lastName}`
    : 'Contact inconnu';

  const DirectionIcon = call.status === CallStatus.MISSED
    ? PhoneMissed
    : call.direction === CallDirection.INBOUND
    ? PhoneIncoming
    : PhoneOutgoing;

  const iconClass = call.status === CallStatus.MISSED
    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
    : call.direction === CallDirection.INBOUND
    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';

  return (
    <tr className="hover:bg-slate-800/30 transition">
      <td className={compact ? 'px-4 py-3' : 'px-6 py-4'}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${iconClass}`}>
            <DirectionIcon className="w-4 h-4" />
          </div>
          <div>
            {call.contact ? (
              <Link to={`/contacts/${call.contact.id}`} className="font-semibold text-slate-100 hover:text-indigo-300 transition">
                {contactName}
              </Link>
            ) : (
              <p className="font-semibold text-slate-400">{contactName}</p>
            )}
            <p className="text-[10px] text-slate-400">{CALL_DIRECTION_LABELS[call.direction as CallDirection] || call.direction}</p>
          </div>
        </div>
      </td>
      <td className={compact ? 'px-4 py-3' : 'px-6 py-4'}>
        <p className="text-slate-200 font-mono text-[11px]">{call.callerNumber}</p>
        <p className="text-[10px] text-slate-500 font-mono">→ {call.calledNumber}</p>
      </td>
      <td className={compact ? 'px-4 py-3' : 'px-6 py-4'}>
        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusBadgeClass(call.status)}`}>
          {CALL_STATUS_LABELS[call.status as CallStatus] || call.status}
        </span>
      </td>
      <td className={`${compact ? 'px-4 py-3' : 'px-6 py-4'} text-slate-300 font-mono`}>{formatCallDuration(call.duration)}</td>
      {!compact && (
        <td className="px-6 py-4 text-slate-400">{call.agent.firstName} {call.agent.lastName}</td>
      )}
      <td className={`${compact ? 'px-4 py-3' : 'px-6 py-4'} text-slate-500 text-[11px]`}>{formatCallDate(call.createdAt)}</td>
      {onEditNote && (
        <td className={`${compact ? 'px-4 py-3' : 'px-6 py-4'} text-right`}>
          <button
            onClick={() => onEditNote(call)}
            title={call.note || 'Ajouter une note'}
            className={`p-1.5 rounded-lg transition text-xs ${call.note ? 'bg-indigo-500/10 text-indigo-300' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            {call.note ? '📝' : '+ Note'}
          </button>
        </td>
      )}
    </tr>
  );
};
