import React, { useState, useEffect } from 'react';
import { X, User, Building, Phone, Mail, Tag, FileText, Save, Loader2 } from 'lucide-react';
import { Contact, CreateContactData, parseTags } from '../../services/contacts.service';

interface ContactFormProps {
  initial?: Contact | null;
  onSubmit: (data: CreateContactData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const ContactForm: React.FC<ContactFormProps> = ({ initial, onSubmit, onCancel, isLoading, error }) => {
  const [firstName, setFirstName] = useState(initial?.firstName || '');
  const [lastName, setLastName] = useState(initial?.lastName || '');
  const [company, setCompany] = useState(initial?.company || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [tagsInput, setTagsInput] = useState(parseTags(initial?.tags || null).join(', '));
  const [notes, setNotes] = useState(initial?.notes || '');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (initial) {
      setFirstName(initial.firstName);
      setLastName(initial.lastName);
      setCompany(initial.company || '');
      setPhone(initial.phone);
      setEmail(initial.email || '');
      setTagsInput(parseTags(initial.tags || null).join(', '));
      setNotes(initial.notes || '');
    }
  }, [initial]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!firstName.trim()) errs.push('Le prénom est obligatoire.');
    if (!lastName.trim()) errs.push('Le nom est obligatoire.');
    if (!phone.trim()) errs.push('Le numéro de téléphone est obligatoire.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Email invalide.');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company.trim() || undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      notes: notes.trim() || undefined,
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Prénom *</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jean" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Nom *</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont" className={inputClass} />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Société</label>
        <div className="relative">
          <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Téléphone *</label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@exemple.com" className={inputClass} />
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Tags (séparés par des virgules)</label>
        <div className="relative">
          <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="prospect, vip, client" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <div className="relative">
          <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Informations complémentaires..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 transition placeholder-slate-600 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition flex items-center justify-center gap-2"
        >
          <X className="w-3.5 h-3.5" /> Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{initial ? 'Enregistrer' : 'Créer le contact'}</span>
        </button>
      </div>
    </form>
  );
};
