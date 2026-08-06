import React from 'react';
import { Delete } from 'lucide-react';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

interface DialPadProps {
  phoneNumber: string;
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onClear: () => void;
  compact?: boolean;
}

export const DialPad: React.FC<DialPadProps> = ({ phoneNumber, onDigit, onDelete, onClear, compact }) => {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (/^[0-9*#+]$/.test(e.key)) onDigit(e.key === '+' ? '+' : e.key);
      else if (e.key === 'Backspace') onDelete();
      else if (e.key === 'Escape') onClear();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onDigit, onDelete, onClear]);

  return (
    <div className="space-y-3">
      <div className="relative py-2 flex items-center justify-between px-2 bg-slate-950/60 rounded-xl border border-slate-800">
        <input
          type="text"
          readOnly
          value={phoneNumber}
          placeholder="Composer un numéro..."
          className="w-full text-center bg-transparent text-lg font-bold text-slate-100 focus:outline-none placeholder-slate-600 tracking-wider"
        />
        {phoneNumber && (
          <div className="flex gap-1 shrink-0">
            <button onClick={onDelete} className="text-slate-400 hover:text-rose-400 p-1 transition" title="Supprimer">
              <Delete className="w-4 h-4" />
            </button>
            <button onClick={onClear} className="text-[10px] text-slate-500 hover:text-slate-300 px-1 transition" title="Effacer">C</button>
          </div>
        )}
      </div>

      <div className={`grid grid-cols-3 gap-2 ${compact ? '' : 'px-2'}`}>
        {DIGITS.map(digit => (
          <button
            key={digit}
            onClick={() => onDigit(digit)}
            className={`${compact ? 'h-10' : 'h-11'} rounded-xl bg-slate-800/60 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700/50 text-slate-200 font-semibold text-base transition active:scale-95`}
          >
            {digit}
          </button>
        ))}
      </div>
    </div>
  );
};
