import React from 'react';
import { Phone } from 'lucide-react';
import { DialerPanel } from '../components/dialer/DialerPanel';

export const DialerPage: React.FC = () => (
  <div className="max-w-md mx-auto space-y-6">
    <div className="text-center space-y-1">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
        <Phone className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-slate-100 tracking-tight">Dialer</h2>
      <p className="text-xs text-slate-400">Composez un numéro ou lancez un appel depuis un contact</p>
    </div>

    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
      <DialerPanel />
    </div>
  </div>
);
