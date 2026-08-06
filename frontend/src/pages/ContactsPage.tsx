import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus, Search, Phone, MessageSquare, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, AlertCircle, Loader2, Users, Tag, X
} from 'lucide-react';
import { ContactsService, Contact, parseTags, CreateContactData } from '../services/contacts.service';
import { ContactForm } from '../components/contacts/ContactForm';
import { useCall } from '../contexts/CallContext';

type ModalState = 'none' | 'create' | 'edit' | 'delete';

export const ContactsPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>('none');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { startCall } = useCall();

  const fetchContacts = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ContactsService.getContacts({ search: search || undefined, page, limit: 20 });
      setContacts(res.data);
      setPagination(res.pagination);
    } catch (e: any) {
      setError(e.message || 'Impossible de charger les contacts.');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchContacts(1); }, [fetchContacts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const openCreate = () => { setSelectedContact(null); setFormError(null); setModal('create'); };
  const openEdit = (c: Contact) => { setSelectedContact(c); setFormError(null); setModal('edit'); };
  const openDelete = (c: Contact) => { setSelectedContact(c); setModal('delete'); };
  const closeModal = () => { setModal('none'); setSelectedContact(null); setFormError(null); };

  const handleCreate = async (data: CreateContactData) => {
    setFormLoading(true); setFormError(null);
    try {
      await ContactsService.createContact(data);
      closeModal();
      fetchContacts(1);
    } catch (e: any) { setFormError(e.message || 'Erreur lors de la création.'); }
    finally { setFormLoading(false); }
  };

  const handleEdit = async (data: CreateContactData) => {
    if (!selectedContact) return;
    setFormLoading(true); setFormError(null);
    try {
      await ContactsService.updateContact(selectedContact.id, data);
      closeModal();
      fetchContacts(pagination.page);
    } catch (e: any) { setFormError(e.message || 'Erreur lors de la modification.'); }
    finally { setFormLoading(false); }
  };

  const handleCall = async (c: Contact) => {
    try { await startCall(c.phone, c.id); }
    catch { /* error shown in CallBar/Context */ }
  };

  const handleDelete = async () => {
    if (!selectedContact) return;
    setDeleteLoading(true);
    try {
      await ContactsService.deleteContact(selectedContact.id);
      closeModal();
      fetchContacts(pagination.page);
    } catch (e: any) { setError(e.message || 'Erreur lors de la suppression.'); closeModal(); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Contacts</h2>
          <p className="text-xs text-slate-400">{pagination.total} contact{pagination.total !== 1 ? 's' : ''} dans votre espace</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition">
          <UserPlus className="w-4 h-4" />
          <span>Ajouter un contact</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Rechercher par nom, société, téléphone ou email..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500 transition"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl transition">
            Rechercher
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="px-3 py-2 bg-slate-800 text-slate-400 text-xs rounded-xl hover:text-slate-200 transition">
              Effacer
            </button>
          )}
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Chargement des contacts...</span>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-3">
          <Users className="w-12 h-12 opacity-30" />
          <p className="text-sm font-medium">{search ? 'Aucun contact trouvé pour cette recherche.' : 'Aucun contact encore. Créez votre premier contact !'}</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Nom & Contact</th>
                  <th className="px-5 py-3.5">Société</th>
                  <th className="px-5 py-3.5">Téléphone</th>
                  <th className="px-5 py-3.5">Tags</th>
                  <th className="px-5 py-3.5">Propriétaire</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {contacts.map(c => {
                  const tags = parseTags(c.tags);
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition group">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-100 group-hover:text-indigo-300 transition">{c.firstName} {c.lastName}</p>
                        <p className="text-[11px] text-slate-400">{c.email || '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-300">{c.company || '—'}</td>
                      <td className="px-5 py-4 font-mono text-indigo-400">{c.phone}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {tags.length > 0 ? tags.slice(0, 2).map(t => (
                            <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              <Tag className="w-2.5 h-2.5" />{t}
                            </span>
                          )) : <span className="text-slate-600">—</span>}
                          {tags.length > 2 && <span className="text-[10px] text-slate-500">+{tags.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-[11px]">
                        {c.owner.firstName} {c.owner.lastName}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/contacts/${c.id}`} title="Voir le détail" className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => openEdit(c)} title="Modifier" className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleCall(c)} title="Appeler" className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition">
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <Link to={`/contacts/${c.id}?sms=1`} title="Envoyer SMS" className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => openDelete(c)} title="Supprimer" className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchContacts(pagination.page - 1)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 rounded-lg bg-slate-800 font-medium text-slate-200">Page {pagination.page} / {pagination.totalPages}</span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchContacts(pagination.page + 1)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">{modal === 'create' ? 'Nouveau contact' : 'Modifier le contact'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ContactForm
              initial={modal === 'edit' ? selectedContact : null}
              onSubmit={modal === 'create' ? handleCreate : handleEdit}
              onCancel={closeModal}
              isLoading={formLoading}
              error={formError}
            />
          </div>
        </div>
      )}

      {modal === 'delete' && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Supprimer ce contact ?</h3>
            <p className="text-xs text-slate-400">
              <span className="text-rose-300 font-semibold">{selectedContact.firstName} {selectedContact.lastName}</span> sera définitivement supprimé(e) avec toutes ses affaires associées.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition">Annuler</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
