import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, Building, Tag, FileText, Edit, Trash2,
  User, Loader2, AlertCircle, Calendar, MessageSquare, Download
} from 'lucide-react';
import { ContactsService, Contact, parseTags, CreateContactData } from '../services/contacts.service';
import { ContactForm } from '../components/contacts/ContactForm';
import { ContactCallsSection } from '../components/calls/ContactCallsSection';
import { ContactDealsSection } from '../components/contacts/ContactDealsSection';
import { ContactMessagesSection } from '../components/contacts/ContactMessagesSection';
import { useCall } from '../contexts/CallContext';
import { Call } from '../types/calls.types';
import { Message } from '../types/messages.types';

export const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const messagesRef = useRef<HTMLDivElement>(null);

  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [smsFocus, setSmsFocus] = useState(searchParams.get('sms') === '1');

  const { startCall } = useCall();

  const loadContact = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const c = await ContactsService.getContact(id);
      setContact(c);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Contact introuvable.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { loadContact(); }, [loadContact]);

  useEffect(() => {
    if (smsFocus && messagesRef.current && contact) {
      messagesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [smsFocus, contact]);

  const scrollToSms = () => {
    setSmsFocus(true);
    messagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleEdit = async (data: CreateContactData) => {
    if (!id) return;
    setFormLoading(true); setFormError(null);
    try {
      const updated = await ContactsService.updateContact(id, data);
      setContact(updated);
      setIsEditing(false);
    } catch (e: any) { setFormError(e.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await ContactsService.deleteContact(id);
      navigate('/contacts');
    } catch (e: any) { setError(e.message); }
  };

  const handleExport = async () => {
    if (!id) return;
    setExportLoading(true);
    try {
      await ContactsService.downloadExport(id);
    } catch (e: any) {
      setError(e.message || 'Export impossible.');
    } finally {
      setExportLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Chargement du contact...</span>
    </div>
  );

  if (error || !contact) return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>{error || 'Contact introuvable.'}</span>
      </div>
      <Link to="/contacts" className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition">
        <ArrowLeft className="w-4 h-4" /> Retour aux contacts
      </Link>
    </div>
  );

  const tags = parseTags(contact.tags);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link to="/contacts" className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition">
          <ArrowLeft className="w-4 h-4" /> Retour aux contacts
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            title="Exporter les données (RGPD)"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition disabled:opacity-50"
          >
            {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Exporter
          </button>
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-indigo-600/30">
            <Edit className="w-3.5 h-3.5" /> Modifier
          </button>
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/30 transition">
            <Trash2 className="w-3.5 h-3.5" /> Supprimer
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-5">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-600/30 shrink-0">
            {contact.firstName[0]}{contact.lastName[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-100">{contact.firstName} {contact.lastName}</h2>
            {contact.company && <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5"><Building className="w-3.5 h-3.5" />{contact.company}</p>}
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Créé le {new Date(contact.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => startCall(contact.phone, contact.id)}
              title="Appeler"
              className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={scrollToSms}
              title="Envoyer un SMS"
              className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 transition"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          <InfoRow icon={<Phone className="w-4 h-4" />} label="Téléphone" value={contact.phone} />
          <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={contact.email} />
          <InfoRow icon={<User className="w-4 h-4" />} label="Propriétaire" value={`${contact.owner.firstName} ${contact.owner.lastName}`} />
          <div>
            <p className="text-[11px] text-slate-500 mb-2 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.length > 0 ? tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{t}</span>
              )) : <span className="text-xs text-slate-600">Aucun tag</span>}
            </div>
          </div>
        </div>

        {contact.notes && (
          <div className="pt-4 border-t border-slate-800">
            <p className="text-[11px] text-slate-500 mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Notes</p>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{contact.notes}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <ContactDealsSection deals={contact.deals || []} contactId={contact.id} />
        <ContactCallsSection
          calls={(contact.calls || []) as Call[]}
          contact={{ id: contact.id, firstName: contact.firstName, lastName: contact.lastName }}
        />
        <div ref={messagesRef}>
          <ContactMessagesSection
            contactId={contact.id}
            contactName={`${contact.firstName} ${contact.lastName}`}
            messages={(contact.messages || []) as Message[]}
            onMessageSent={loadContact}
            autoFocus={smsFocus}
          />
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-100">Modifier le contact</h3>
            <ContactForm initial={contact} onSubmit={handleEdit} onCancel={() => setIsEditing(false)} isLoading={formLoading} error={formError} />
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Supprimer ce contact ?</h3>
            <p className="text-xs text-slate-400">Cette action est irréversible. Toutes les affaires liées seront également supprimées.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition">Annuler</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string | null }> = ({ icon, label, value }) => (
  <div>
    <p className="text-[11px] text-slate-500 mb-1 flex items-center gap-1.5">{icon}{label}</p>
    <p className="text-xs font-medium text-slate-200">{value || <span className="text-slate-600">—</span>}</p>
  </div>
);
