import React, { useState, useEffect } from 'react';
import { X, FileText, DollarSign, KanbanSquare, User, Building, Save, Loader2 } from 'lucide-react';
import { Deal, CreateDealDto, DEAL_STAGES, STAGE_LABELS, DealStage } from '../../types/deals.types';
import { ContactsService, Contact } from '../../services/contacts.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

interface DealFormProps {
  initial?: Deal | null;
  onSubmit: (data: CreateDealDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const DealForm: React.FC<DealFormProps> = ({ initial, onSubmit, onCancel, isLoading, error }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(initial?.title || '');
  const [value, setValue] = useState(String(initial?.value ?? ''));
  const [stage, setStage] = useState<DealStage>(initial?.stage || DealStage.LEAD);
  const [contactId, setContactId] = useState(initial?.contactId || '');
  const [ownerId, setOwnerId] = useState(initial?.ownerId || user?.id || '');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    ContactsService.getContacts({ limit: 100 }).then(r => setContacts(r.data)).catch(() => {});
    AuthService.getWorkspaceMembers().then(setMembers).catch(() => setMembers(user ? [user] : []));
  }, [user]);

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setValue(String(initial.value));
      setStage(initial.stage);
      setContactId(initial.contactId);
      setOwnerId(initial.ownerId);
    } else if (user) {
      setOwnerId(user.id);
    }
  }, [initial, user]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('Le titre est obligatoire.');
    const numValue = parseFloat(value);
    if (value === '' || isNaN(numValue) || numValue < 0) errs.push('La valeur doit être un nombre positif ou nul.');
    if (!contactId) errs.push('Le contact est obligatoire.');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      title: title.trim(),
      value: parseFloat(value),
      stage,
      contactId,
      ownerId: ownerId || undefined,
    });
  };

  const inputClass = 'w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition placeholder-slate-600';
  const labelClass = 'text-xs font-medium text-slate-300 mb-1 block';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(errors.length > 0 || error) && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 space-y-1">
          {errors.map((e, i) => <p key={i}>{e}</p>)}
          {error && <p>{error}</p>}
        </div>
      )}

      <div>
        <label className={labelClass}>Titre *</label>
        <div className="relative">
          <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contrat entreprise" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Valeur (€) *</label>
          <div className="relative">
            <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="number" min="0" step="100" value={value} onChange={e => setValue(e.target.value)} placeholder="15000" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Étape</label>
          <div className="relative">
            <KanbanSquare className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select value={stage} onChange={e => setStage(e.target.value as DealStage)} className={`${inputClass} appearance-none cursor-pointer`}>
              {DEAL_STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Contact *</label>
        <div className="relative">
          <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <select value={contactId} onChange={e => setContactId(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
            <option value="">Sélectionner un contact</option>
            {contacts.map(c => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}{c.company ? ` — ${c.company}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Propriétaire</label>
        <div className="relative">
          <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <select value={ownerId} onChange={e => setOwnerId(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.role})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition flex items-center justify-center gap-2">
          <X className="w-3.5 h-3.5" /> Annuler
        </button>
        <button type="submit" disabled={isLoading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{initial ? 'Enregistrer' : 'Créer l\'affaire'}</span>
        </button>
      </div>
    </form>
  );
};
