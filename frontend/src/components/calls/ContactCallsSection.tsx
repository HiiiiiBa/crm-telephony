import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall } from 'lucide-react';
import { Call } from '../../types/calls.types';
import { CallHistoryRow } from './CallHistoryRow';

interface ContactCallsSectionProps {
  calls: Call[];
  contact: { id: string; firstName: string; lastName: string };
}

export const ContactCallsSection: React.FC<ContactCallsSectionProps> = ({ calls, contact }) => (
  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 md:col-span-3">
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
        <PhoneCall className="w-5 h-5 text-emerald-400" />
        Historique d'appels
      </h3>
      <Link to={`/calls?contactId=${contact.id}`} className="text-[10px] text-indigo-400 hover:text-indigo-300 transition">
        Voir tout →
      </Link>
    </div>
    {calls.length === 0 ? (
      <div className="text-center py-6 space-y-1">
        <p className="text-xs font-medium text-slate-400">Aucun appel enregistré</p>
        <p className="text-[10px] text-slate-600">Les appels avec ce contact apparaîtront ici.</p>
      </div>
    ) : (
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <tbody className="divide-y divide-slate-800/60">
            {calls.slice(0, 5).map(call => (
              <CallHistoryRow
                key={call.id}
                call={{
                  ...call,
                  contact: call.contact || {
                    id: contact.id,
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    phone: '',
                    company: null,
                  },
                }}
                compact
              />
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
