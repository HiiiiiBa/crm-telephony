import React from 'react';
import { X } from 'lucide-react';
import { DialerPanel } from './dialer/DialerPanel';

interface PersistentDialerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersistentDialer: React.FC<PersistentDialerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-950/80 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">Dialer Téléphonie</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700/50 transition">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        <DialerPanel compact />
      </div>
    </div>
  );
};
