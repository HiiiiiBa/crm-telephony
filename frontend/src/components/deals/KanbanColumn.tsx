import React from 'react';
import { Deal, DealStage, DealStats, STAGE_LABELS, formatCurrency } from '../../types/deals.types';
import { DealCard } from './DealCard';

interface KanbanColumnProps {
  stage: DealStage;
  deals: Deal[];
  stats?: DealStats[DealStage];
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (dealId: string) => void;
  onDragEnd: () => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage, deals, stats, isDragOver, onDragOver, onDragLeave, onDrop, onDragStart, onDragEnd,
}) => (
  <div
    className={`flex flex-col rounded-2xl bg-slate-900/60 border p-3 min-h-[480px] transition ${
      isDragOver ? 'border-indigo-500/60 bg-indigo-500/5' : 'border-slate-800'
    }`}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
  >
    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
      <span className="text-xs font-bold text-slate-200">{STAGE_LABELS[stage]}</span>
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-indigo-400">
        {stats?.count ?? deals.length}
      </span>
    </div>
    <div className="text-[11px] font-medium text-emerald-400 mb-3">
      {formatCurrency(stats?.totalValue ?? deals.reduce((s, d) => s + d.value, 0))}
    </div>
    <div className="space-y-3 flex-1">
      {deals.length === 0 ? (
        <p className="text-[10px] text-slate-600 text-center py-6">Aucune affaire</p>
      ) : (
        deals.map(deal => (
          <DealCard key={deal.id} deal={deal} onDragStart={onDragStart} onDragEnd={onDragEnd} />
        ))
      )}
    </div>
  </div>
);
