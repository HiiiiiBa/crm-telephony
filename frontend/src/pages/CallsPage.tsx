import React from 'react';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Play, FileText } from 'lucide-react';

export const CallsPage: React.FC = () => {
  const dummyCalls = [
    { id: '1', caller: '+33 6 12 34 56 78', called: '+33 1 80 00 11 22', contact: 'Sophie Martin', direction: 'INBOUND', status: 'COMPLETED', duration: '03:45', agent: 'Admin Demo', date: 'Aujourd\'hui 10:14' },
    { id: '2', caller: '+33 1 80 00 11 22', called: '+33 6 98 76 54 32', contact: 'Alexandre Dubois', direction: 'OUTBOUND', status: 'COMPLETED', duration: '05:12', agent: 'Thomas Manager', date: 'Aujourd\'hui 09:30' },
    { id: '3', caller: '+33 7 44 55 66 77', called: '+33 1 80 00 11 22', contact: 'Marie Leroy', direction: 'INBOUND', status: 'MISSED', duration: '00:00', agent: 'Non attribué', date: 'Hier 16:45' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Historique des appels</h2>
        <p className="text-xs text-slate-400">Journal détaillé des communications entrantes et sortantes</p>
      </div>

      {/* Calls Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-6 py-3.5">Direction & Contact</th>
              <th className="px-6 py-3.5">Appelant / Appelé</th>
              <th className="px-6 py-3.5">Statut</th>
              <th className="px-6 py-3.5">Durée</th>
              <th className="px-6 py-3.5">Agent</th>
              <th className="px-6 py-3.5">Date & Heure</th>
              <th className="px-6 py-3.5 text-right">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {dummyCalls.map((call) => (
              <tr key={call.id} className="hover:bg-slate-800/30 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${
                      call.status === 'MISSED'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : call.direction === 'INBOUND'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    }`}>
                      {call.status === 'MISSED' ? (
                        <PhoneMissed className="w-4 h-4" />
                      ) : call.direction === 'INBOUND' ? (
                        <PhoneIncoming className="w-4 h-4" />
                      ) : (
                        <PhoneOutgoing className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{call.contact}</p>
                      <p className="text-[10px] text-slate-400">{call.direction === 'INBOUND' ? 'Entrant' : 'Sortant'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-slate-200 font-mono">{call.caller}</p>
                  <p className="text-[11px] text-slate-500 font-mono">➞ {call.called}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                    call.status === 'MISSED' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {call.status === 'MISSED' ? 'Manqué' : 'Répondu'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-300 font-mono">{call.duration}</td>
                <td className="px-6 py-4 text-slate-400">{call.agent}</td>
                <td className="px-6 py-4 text-slate-500">{call.date}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition">
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
