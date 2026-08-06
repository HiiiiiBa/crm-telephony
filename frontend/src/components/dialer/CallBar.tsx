import React from 'react';
import { Phone, PhoneOff, Mic, MicOff, User } from 'lucide-react';
import { useCall, formatCallDuration } from '../../contexts/CallContext';
import { CALL_STATUS_LABELS, CallStatus } from '../../types/calls.types';

export const CallBar: React.FC = () => {
  const { activeCall, callDuration, isMuted, hangup, mute, unmute } = useCall();

  if (!activeCall) return null;

  const displayName = activeCall.contact
    ? `${activeCall.contact.firstName} ${activeCall.contact.lastName}`
    : activeCall.calledNumber;

  const statusLabel = CALL_STATUS_LABELS[activeCall.status as CallStatus] || activeCall.status;
  const isConnected = activeCall.status === CallStatus.CONNECTED;

  return (
    <div className="sticky top-0 z-40 px-6 py-2.5 bg-emerald-950/90 border-b border-emerald-500/30 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 max-w-full">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isConnected ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-amber-500/20 text-amber-400'
          }`}>
            <Phone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-100 truncate flex items-center gap-1.5">
              <User className="w-3 h-3 text-slate-400 shrink-0" />
              {displayName}
            </p>
            <p className="text-[10px] text-emerald-400/80 font-mono truncate">{activeCall.calledNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            {statusLabel}
          </span>
          <span className="text-xs font-mono font-bold text-slate-100 tabular-nums min-w-[40px] text-center">
            {formatCallDuration(callDuration)}
          </span>
          <button
            onClick={() => isMuted ? unmute() : mute()}
            className={`p-2 rounded-xl transition ${isMuted ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            title={isMuted ? 'Activer le micro' : 'Couper le micro'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={hangup}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shadow-lg shadow-rose-600/30"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Raccrocher</span>
          </button>
        </div>
      </div>
    </div>
  );
};
