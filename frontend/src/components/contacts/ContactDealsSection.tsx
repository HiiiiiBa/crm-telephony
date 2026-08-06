import React from 'react';
import { Link } from 'react-router-dom';
import { KanbanSquare } from 'lucide-react';
import { DealStage, STAGE_LABELS, formatCurrency } from '../../types/deals.types';

export interface ContactDeal {
  id: string;
  title: string;
  value: number;
  stage: DealStage | string;
  createdAt: string;
}

interface ContactDealsSectionProps {
  deals: ContactDeal[];
  contactId: string;
}

const stageBadgeClass = (stage: string): string => {
  if (stage === 'GAGNE') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (stage === 'PERDU') return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  if (stage === 'NEGOTIATION') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
};

export const ContactDealsSection: React.FC<ContactDealsSectionProps> = ({ deals, contactId }) => (
  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
        <KanbanSquare className="w-5 h-5 text-indigo-400" />
        Affaires liées
      </h3>
      <Link to={`/deals?contactId=${contactId}`} className="text-[10px] text-indigo-400 hover:text-indigo-300 transition">
        Voir le pipeline →
      </Link>
    </div>

    {deals.length === 0 ? (
      <div className="text-center py-6 space-y-1">
        <p className="text-xs font-medium text-slate-400">Aucune affaire liée</p>
        <p className="text-[10px] text-slate-600">Créez une opportunité depuis le pipeline Kanban.</p>
      </div>
    ) : (
      <div className="space-y-2">
        {deals.map(deal => (
          <Link
            key={deal.id}
            to={`/deals/${deal.id}`}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/30 transition group"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-100 truncate group-hover:text-indigo-300 transition">
                {deal.title}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {new Date(deal.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageBadgeClass(deal.stage)}`}>
                {STAGE_LABELS[deal.stage as DealStage] || deal.stage}
              </span>
              <span className="text-xs font-bold text-slate-200">{formatCurrency(deal.value)}</span>
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
);
