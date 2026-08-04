import React from 'react';
import { Plus, DollarSign, User } from 'lucide-react';

const stages = ['Lead', 'Qualifié', 'Proposition', 'Négociation', 'Gagné', 'Perdu'];

const initialDeals = [
  { id: 'd1', title: 'Licences Téléphonie Cloud 50p', value: 24000, stage: 'Lead', contact: 'Sophie Martin', company: 'TechCorp' },
  { id: 'd2', title: 'Integration CRM & Dialer API', value: 15000, stage: 'Qualifié', contact: 'Alexandre Dubois', company: 'Nexus' },
  { id: 'd3', title: 'Déploiement Téléphonie Siege', value: 65000, stage: 'Proposition', contact: 'Marie Leroy', company: 'Innovate Studio' },
  { id: 'd4', title: 'Souscription Annuelle 100 Agents', value: 48000, stage: 'Négociation', contact: 'Luc Dupont', company: 'Global Corp' },
  { id: 'd5', title: 'Equipement SIP Hardphones', value: 12000, stage: 'Gagné', contact: 'Elena Rostova', company: 'East Logistics' },
];

export const DealsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Pipeline Commercial (Kanban)</h2>
          <p className="text-xs text-slate-400">Suivi visuel des opportunités et affaires en cours</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition">
          <Plus className="w-4 h-4" />
          <span>Nouvelle Affaire</span>
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {stages.map((stageName) => {
          const stageDeals = initialDeals.filter((d) => d.stage === stageName);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div key={stageName} className="flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800 p-3 min-h-[500px]">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-200">{stageName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-indigo-400">
                  {stageDeals.length}
                </span>
              </div>
              <div className="text-[11px] font-medium text-emerald-400 mb-3">
                {stageTotal.toLocaleString('fr-FR')} €
              </div>

              {/* Cards */}
              <div className="space-y-3 flex-1">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-indigo-500/50 shadow-md transition cursor-pointer group"
                  >
                    <h4 className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition">
                      {deal.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      {deal.company}
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center">
                        <DollarSign className="w-3 h-3" />
                        {deal.value.toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
