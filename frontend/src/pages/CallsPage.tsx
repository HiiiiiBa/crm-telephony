import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, Loader2, AlertCircle, PhoneCall, ChevronLeft, ChevronRight, X, Save
} from 'lucide-react';
import { CallsService } from '../services/calls.service';
import {
  Call, CallDirection, CallStatus, CALL_STATUS_LABELS, CALL_DIRECTION_LABELS
} from '../types/calls.types';
import { CallHistoryRow } from '../components/calls/CallHistoryRow';

export const CallsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const contactIdFilter = searchParams.get('contactId') || undefined;

  const [calls, setCalls] = useState<Call[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [direction, setDirection] = useState<CallDirection | ''>('');
  const [status, setStatus] = useState<CallStatus | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteCall, setNoteCall] = useState<Call | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  const fetchCalls = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await CallsService.getCalls({
        search: search || undefined,
        direction: direction || undefined,
        status: status || undefined,
        contactId: contactIdFilter,
        page,
        limit: 20,
      });
      setCalls(res.data);
      setPagination(res.pagination);
    } catch (e: any) {
      setError(e.message || 'Impossible de charger l\'historique.');
    } finally {
      setIsLoading(false);
    }
  }, [search, direction, status, contactIdFilter]);

  useEffect(() => { fetchCalls(1); }, [fetchCalls]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); };

  const openNote = (call: Call) => { setNoteCall(call); setNoteText(call.note || ''); };
  const saveNote = async () => {
    if (!noteCall) return;
    setNoteSaving(true);
    try {
      await CallsService.updateCallNote(noteCall.id, noteText.trim() || null);
      setNoteCall(null);
      fetchCalls(pagination.page);
    } catch (e: any) { setError(e.message); }
    finally { setNoteSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Historique des appels</h2>
          <p className="text-xs text-slate-400">{pagination.total} appel{pagination.total !== 1 ? 's' : ''} enregistré{pagination.total !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/dialer" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition">
          <PhoneCall className="w-4 h-4" />
          <span>Nouvel appel</span>
        </Link>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Rechercher par numéro ou contact..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500 transition" />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition">Rechercher</button>
        </form>
        <div className="flex flex-wrap gap-3">
          <select value={direction} onChange={e => setDirection(e.target.value as CallDirection | '')}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500">
            <option value="">Toutes directions</option>
            {Object.values(CallDirection).map(d => <option key={d} value={d}>{CALL_DIRECTION_LABELS[d]}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value as CallStatus | '')}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500">
            <option value="">Tous statuts</option>
            {Object.values(CallStatus).map(s => <option key={s} value={s}>{CALL_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Chargement de l'historique...</span>
        </div>
      ) : calls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-3">
          <PhoneCall className="w-12 h-12 opacity-30" />
          <p className="text-sm font-medium">{search || direction || status ? 'Aucun appel trouvé.' : 'Aucun appel enregistré. Lancez votre premier appel depuis le Dialer.'}</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 min-w-[800px]">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Direction & Contact</th>
                  <th className="px-6 py-3.5">Appelant / Appelé</th>
                  <th className="px-6 py-3.5">Statut</th>
                  <th className="px-6 py-3.5">Durée</th>
                  <th className="px-6 py-3.5">Agent</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {calls.map(call => <CallHistoryRow key={call.id} call={call} onEditNote={openNote} />)}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}</span>
              <div className="flex items-center gap-2">
                <button disabled={pagination.page <= 1} onClick={() => fetchCalls(pagination.page - 1)}
                  className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 transition"><ChevronLeft className="w-4 h-4" /></button>
                <span className="px-3 py-1 rounded-lg bg-slate-800 font-medium">Page {pagination.page} / {pagination.totalPages}</span>
                <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchCalls(pagination.page + 1)}
                  className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 transition"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}

      {noteCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Note d'appel</h3>
              <button onClick={() => setNoteCall(null)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} placeholder="Compte-rendu de l'appel..."
              className="w-full px-4 py-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 resize-none" />
            <button onClick={saveNote} disabled={noteSaving}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {noteSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
