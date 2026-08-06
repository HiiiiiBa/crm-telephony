import React, { useState } from 'react';
import { Phone, Loader2, AlertCircle, User } from 'lucide-react';
import { DialPad } from './DialPad';
import { useCall } from '../../contexts/CallContext';
import { CALL_STATUS_LABELS, CallStatus } from '../../types/calls.types';

interface DialerPanelProps {
  compact?: boolean;
}

export const DialerPanel: React.FC<DialerPanelProps> = ({ compact }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { activeCall, startCall, error, clearError } = useCall();

  const handleDigit = (digit: string) => setPhoneNumber(prev => prev + digit);
  const handleDelete = () => setPhoneNumber(prev => prev.slice(0, -1));
  const handleClear = () => setPhoneNumber('');

  const handleCall = async () => {
    if (!phoneNumber.trim() || activeCall) return;
    setIsSubmitting(true);
    clearError();
    try {
      await startCall(phoneNumber.trim());
      setPhoneNumber('');
    } catch { /* error in context */ }
    finally { setIsSubmitting(false); }
  };

  const hasActiveCall = Boolean(activeCall);

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      {hasActiveCall && activeCall && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
          <p className="text-xs font-semibold text-emerald-300">
            Appel en cours — {CALL_STATUS_LABELS[activeCall.status as CallStatus]}
          </p>
          {activeCall.contact && (
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <User className="w-3 h-3" />
              {activeCall.contact.firstName} {activeCall.contact.lastName}
            </p>
          )}
        </div>
      )}

      {!hasActiveCall && (
        <>
          <DialPad
            phoneNumber={phoneNumber}
            onDigit={handleDigit}
            onDelete={handleDelete}
            onClear={handleClear}
            compact={compact}
          />
          <button
            onClick={handleCall}
            disabled={!phoneNumber.trim() || isSubmitting}
            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition ${
              phoneNumber.trim() && !isSubmitting
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
            <span>Lancer l'appel</span>
          </button>
        </>
      )}
    </div>
  );
};
