import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Loader2, AlertCircle, Calendar, User, Building,
  PhoneCall, MessageSquare
} from 'lucide-react';
import { DealsService } from '../services/deals.service';
import { Deal, CreateDealDto, STAGE_LABELS, formatCurrency } from '../types/deals.types';
import { DealForm } from '../components/deals/DealForm';

export const DealDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        setDeal(await DealsService.getDeal(id));
      } catch (e: any) {
        setError(e.message || 'Affaire introuvable.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleEdit = async (data: CreateDealDto) => {
    if (!id) return;
    setFormLoading(true); setFormError(null);
    try {
      const updated = await DealsService.updateDeal(id, data);
      setDeal(updated);
      setIsEditing(false);
    } catch (e: any) { setFormError(e.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await DealsService.deleteDeal(id);
      navigate('/deals');
    } catch (e: any) { setError(e.message); }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Chargement de l'affaire...</span>
    </div>
  );

  if (error || !deal) return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4" /><span>{error || 'Affaire introuvable.'}</span>
      </div>
      <Link to="/deals" className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition">
        <ArrowLeft className="w-4 h-4" /> Retour au pipeline
      </Link>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link to="/deals" className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition">
          <ArrowLeft className="w-4 h-4" /> Retour au pipeline
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-indigo-600/30">
            <Edit className="w-3.5 h-3.5" /> Modifier
          </button>
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/30 transition">
            <Trash2 className="w-3.5 h-3.5" /> Supprimer
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div>
          <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-3">
            {STAGE_LABELS[deal.stage]}
          </span>
          <h2 className="text-lg font-bold text-slate-100">{deal.title}</h2>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{formatCurrency(deal.value)}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          <InfoRow icon={<Building className="w-4 h-4" />} label="Contact">
            <Link to={`/contacts/${deal.contact.id}`} className="text-indigo-400 hover:text-indigo-300 transition">
              {deal.contact.firstName} {deal.contact.lastName}
              {deal.contact.company && ` — ${deal.contact.company}`}
            </Link>
          </InfoRow>
          <InfoRow icon={<User className="w-4 h-4" />} label="Propriétaire" value={`${deal.owner.firstName} ${deal.owner.lastName}`} />
          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Créé le" value={new Date(deal.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Modifié le" value={new Date(deal.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlaceholderSection icon={<PhoneCall className="w-5 h-5" />} title="Historique d'appels" message="Aucun appel enregistré" subtext="L'historique apparaîtra ici (Étape 6)." />
        <PlaceholderSection icon={<MessageSquare className="w-5 h-5" />} title="Messages SMS" message="Aucun message" subtext="Les SMS apparaîtront ici (Étape 7)." />
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-100">Modifier l'affaire</h3>
            <DealForm initial={deal} onSubmit={handleEdit} onCancel={() => setIsEditing(false)} isLoading={formLoading} error={formError} />
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4 text-center">
            <Trash2 className="w-10 h-10 mx-auto text-rose-400" />
            <h3 className="text-sm font-bold text-slate-100">Supprimer cette affaire ?</h3>
            <p className="text-xs text-slate-400">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition">Annuler</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string; children?: React.ReactNode }> = ({ icon, label, value, children }) => (
  <div>
    <p className="text-[11px] text-slate-500 mb-1 flex items-center gap-1.5">{icon}{label}</p>
    {children || <p className="text-xs font-medium text-slate-200">{value}</p>}
  </div>
);

const PlaceholderSection: React.FC<{ icon: React.ReactNode; title: string; message: string; subtext: string }> = ({ icon, title, message, subtext }) => (
  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
    <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">{icon}{title}</h3>
    <div className="text-center py-4 space-y-1">
      <p className="text-xs font-medium text-slate-400">{message}</p>
      <p className="text-[10px] text-slate-600">{subtext}</p>
    </div>
  </div>
);
