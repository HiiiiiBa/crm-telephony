import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Loader2, KanbanSquare, AlertCircle, X, Trash2 } from 'lucide-react';
import { DealsService } from '../services/deals.service';
import { Deal, DealStage, DealStats, CreateDealDto, DEAL_STAGES, STAGE_LABELS } from '../types/deals.types';
import { DealForm } from '../components/deals/DealForm';
import { KanbanColumn } from '../components/deals/KanbanColumn';
import { ToastContainer, ToastMessage } from '../components/deals/Toast';

type ModalState = 'none' | 'create' | 'edit' | 'delete';

export const DealsPage: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DealStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [modal, setModal] = useState<ModalState>('none');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastCounter = React.useRef(0);

  const addToast = (type: 'success' | 'error', text: string) => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, type, text }]);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dealsRes, statsRes] = await Promise.all([
        DealsService.getDeals({ search: search || undefined, limit: 100 }),
        DealsService.getDealStats(),
      ]);
      setDeals(dealsRes.data);
      setStats(statsRes);
    } catch (e: any) {
      setError(e.message || 'Impossible de charger les affaires.');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleCreate = async (data: CreateDealDto) => {
    setFormLoading(true); setFormError(null);
    try {
      await DealsService.createDeal(data);
      setModal('none');
      addToast('success', 'Affaire créée avec succès.');
      fetchData();
    } catch (e: any) { setFormError(e.message); }
    finally { setFormLoading(false); }
  };

  const handleEdit = async (data: CreateDealDto) => {
    if (!selectedDeal) return;
    setFormLoading(true); setFormError(null);
    try {
      await DealsService.updateDeal(selectedDeal.id, data);
      setModal('none');
      setSelectedDeal(null);
      addToast('success', 'Affaire modifiée avec succès.');
      fetchData();
    } catch (e: any) { setFormError(e.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!selectedDeal) return;
    setDeleteLoading(true);
    try {
      await DealsService.deleteDeal(selectedDeal.id);
      setModal('none');
      setSelectedDeal(null);
      addToast('success', 'Affaire supprimée.');
      fetchData();
    } catch (e: any) { setError(e.message); setModal('none'); }
    finally { setDeleteLoading(false); }
  };

  const handleDrop = async (stage: DealStage) => {
    if (!draggingId) return;
    const deal = deals.find(d => d.id === draggingId);
    if (!deal || deal.stage === stage) {
      setDraggingId(null);
      setDragOverStage(null);
      return;
    }

    const previousDeals = [...deals];
    setDeals(prev => prev.map(d => d.id === draggingId ? { ...d, stage } : d));
    setDraggingId(null);
    setDragOverStage(null);

    try {
      await DealsService.updateDealStage(draggingId, stage);
      addToast('success', `Affaire déplacée vers « ${STAGE_LABELS[stage] } ».`);
      const statsRes = await DealsService.getDealStats();
      setStats(statsRes);
    } catch (e: any) {
      setDeals(previousDeals);
      addToast('error', e.message || 'Échec du déplacement.');
    }
  };

  const dealsByStage = (stage: DealStage) => deals.filter(d => d.stage === stage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Pipeline Commercial</h2>
          <p className="text-xs text-slate-400">Suivi visuel des opportunités — glissez-déposez pour changer d'étape</p>
        </div>
        <button onClick={() => { setSelectedDeal(null); setFormError(null); setModal('create'); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition">
          <Plus className="w-4 h-4" />
          <span>Nouvelle affaire</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Rechercher par titre..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500 transition" />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition">Rechercher</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }}
              className="px-3 py-2 bg-slate-800 text-slate-400 text-xs rounded-xl hover:text-slate-200 transition">Effacer</button>
          )}
        </form>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Chargement du pipeline...</span>
        </div>
      ) : deals.length === 0 && !search ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-3">
          <KanbanSquare className="w-12 h-12 opacity-30" />
          <p className="text-sm font-medium">Aucune affaire. Créez votre première opportunité commerciale !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {DEAL_STAGES.map(stage => (
            <KanbanColumn
              key={stage}
              stage={stage}
              deals={dealsByStage(stage)}
              stats={stats?.[stage]}
              isDragOver={dragOverStage === stage}
              onDragOver={e => { e.preventDefault(); setDragOverStage(stage); }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={e => { e.preventDefault(); handleDrop(stage); }}
              onDragStart={setDraggingId}
              onDragEnd={() => { setDraggingId(null); setDragOverStage(null); }}
            />
          ))}
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">{modal === 'create' ? 'Nouvelle affaire' : 'Modifier l\'affaire'}</h3>
              <button onClick={() => setModal('none')} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <DealForm
              initial={modal === 'edit' ? selectedDeal : null}
              onSubmit={modal === 'create' ? handleCreate : handleEdit}
              onCancel={() => setModal('none')}
              isLoading={formLoading}
              error={formError}
            />
          </div>
        </div>
      )}

      {modal === 'delete' && selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Supprimer cette affaire ?</h3>
            <p className="text-xs text-slate-400"><span className="text-rose-300 font-semibold">{selectedDeal.title}</span> sera définitivement supprimée.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal('none')} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition">Annuler</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
};
