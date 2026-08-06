import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, User, GripVertical } from 'lucide-react';
import { Deal, formatCurrency } from '../../types/deals.types';

interface DealCardProps {
  deal: Deal;
  onDragStart: (dealId: string) => void;
  onDragEnd: () => void;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onDragStart, onDragEnd }) => (
  <div
    draggable
    onDragStart={() => onDragStart(deal.id)}
    onDragEnd={onDragEnd}
    className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-indigo-500/50 shadow-md transition cursor-grab active:cursor-grabbing group"
  >
    <div className="flex items-start gap-2">
      <GripVertical className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition" />
      <div className="flex-1 min-w-0">
        <Link to={`/deals/${deal.id}`} className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition line-clamp-2" onClick={e => e.stopPropagation()}>
          {deal.title}
        </Link>
        <p className="text-[11px] text-slate-400 mt-1 truncate">
          {deal.contact.firstName} {deal.contact.lastName}
          {deal.contact.company && <span className="text-slate-500"> · {deal.contact.company}</span>}
        </p>
        <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-400">{formatCurrency(deal.value)}</span>
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <User className="w-3 h-3" />
            {deal.owner.firstName.charAt(0)}{deal.owner.lastName.charAt(0)}
          </span>
        </div>
      </div>
    </div>
  </div>
);
