import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, Shield, CheckCircle, XCircle, Loader2, AlertCircle,
  Pencil, Trash2, X, UserX
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UsersService, TeamMember, InviteUserData } from '../services/users.service';

type ModalState = 'none' | 'invite' | 'editRole' | 'deactivate' | 'delete';

const ROLE_OPTIONS = [
  { value: 'AGENT', label: 'Agent' },
  { value: 'MANAGER', label: 'Manager' },
] as const;

export const TeamPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
  const isManager = currentUser?.role === 'MANAGER';

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>('none');
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [inviteForm, setInviteForm] = useState<InviteUserData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'AGENT',
  });
  const [editRole, setEditRole] = useState<'AGENT' | 'MANAGER'>('AGENT');

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await UsersService.listUsers();
      setMembers(data);
    } catch (e: any) {
      setError(e.message || 'Impossible de charger les membres.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const closeModal = () => {
    setModal('none');
    setSelected(null);
    setFormError(null);
    setInviteForm({ firstName: '', lastName: '', email: '', password: '', role: 'AGENT' });
  };

  const openInvite = () => {
    setFormError(null);
    setInviteForm({ firstName: '', lastName: '', email: '', password: '', role: 'AGENT' });
    setModal('invite');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const payload: InviteUserData = { ...inviteForm };
      if (isManager) delete payload.role;
      await UsersService.inviteUser(payload);
      closeModal();
      fetchMembers();
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de l\'invitation.');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditRole = (member: TeamMember) => {
    if (member.role === 'ADMIN') return;
    setSelected(member);
    setEditRole(member.role === 'MANAGER' ? 'MANAGER' : 'AGENT');
    setFormError(null);
    setModal('editRole');
  };

  const handleEditRole = async () => {
    if (!selected) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await UsersService.updateUser(selected.id, { role: editRole });
      closeModal();
      fetchMembers();
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la modification du rôle.');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeactivate = (member: TeamMember) => {
    setSelected(member);
    setFormError(null);
    setModal('deactivate');
  };

  const handleToggleActive = async () => {
    if (!selected) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await UsersService.updateUser(selected.id, { isActive: !selected.isActive });
      closeModal();
      fetchMembers();
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la modification du statut.');
    } finally {
      setFormLoading(false);
    }
  };

  const openDelete = (member: TeamMember) => {
    setSelected(member);
    setFormError(null);
    setModal('delete');
  };

  const handleDelete = async () => {
    if (!selected) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await UsersService.deleteUser(selected.id);
      closeModal();
      fetchMembers();
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la suppression.');
    } finally {
      setFormLoading(false);
    }
  };

  const roleBadgeClass = (role: string) => {
    if (role === 'ADMIN') return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
    if (role === 'MANAGER') return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
    return 'bg-slate-800 text-slate-300 border border-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Gestion des Équipes & Utilisateurs</h2>
          <p className="text-xs text-slate-400">
            Invitation de membres (Admin/Manager) · Désactivation et suppression (Admin)
          </p>
        </div>
        {(isAdmin || isManager) && (
          <button
            onClick={openInvite}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Inviter un Membre</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement des membres…
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Membre</th>
                <th className="px-6 py-3.5">Rôle</th>
                <th className="px-6 py-3.5">Équipe</th>
                <th className="px-6 py-3.5">Statut</th>
                {isAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {members.map((member) => {
                const isSelf = member.id === currentUser?.id;
                return (
                  <tr key={member.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-100">
                        {member.firstName} {member.lastName}
                        {isSelf && <span className="ml-2 text-[10px] text-indigo-400">(vous)</span>}
                      </p>
                      <p className="text-[11px] text-slate-400">{member.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${roleBadgeClass(member.role)}`}>
                        <Shield className="w-2.5 h-2.5" />
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{member.team?.name ?? '—'}</td>
                    <td className="px-6 py-4">
                      {member.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                          <CheckCircle className="w-3 h-3" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-medium text-[11px]">
                          <XCircle className="w-3 h-3" />
                          Désactivé
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {member.role !== 'ADMIN' && !isSelf && (
                            <button
                              onClick={() => openEditRole(member)}
                              className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition"
                              title="Modifier le rôle"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!isSelf && (
                            <button
                              onClick={() => openDeactivate(member)}
                              className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition"
                              title={member.isActive ? 'Désactiver' : 'Réactiver'}
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!isSelf && member.role !== 'ADMIN' && (
                            <button
                              onClick={() => openDelete(member)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal invitation */}
      {modal === 'invite' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Inviter un membre</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Les comptes invités sont créés en tant qu&apos;Agent par défaut.
            </p>
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Prénom"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  required
                  placeholder="Nom"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <input
                required
                type="email"
                placeholder="Email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                required
                type="password"
                placeholder="Mot de passe initial (min. 6 car.)"
                minLength={6}
                value={inviteForm.password}
                onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {isAdmin && (
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'AGENT' | 'MANAGER' })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
              {formError && <p className="text-[11px] text-rose-400">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Inviter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal édition rôle */}
      {modal === 'editRole' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Modifier le rôle</h3>
            <p className="text-xs text-slate-400">
              {selected.firstName} {selected.lastName}
            </p>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as 'AGENT' | 'MANAGER')}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {formError && <p className="text-[11px] text-rose-400">{formError}</p>}
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition">Annuler</button>
              <button onClick={handleEditRole} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal désactivation */}
      {modal === 'deactivate' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UserX className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">
              {selected.isActive ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'}
            </h3>
            <p className="text-xs text-slate-400">
              {selected.firstName} {selected.lastName} ({selected.email})
            </p>
            {formError && <p className="text-[11px] text-rose-400">{formError}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition">Annuler</button>
              <button onClick={handleToggleActive} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition disabled:opacity-50">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : selected.isActive ? 'Désactiver' : 'Réactiver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Supprimer ce compte ?</h3>
            <p className="text-xs text-slate-400">
              {selected.firstName} {selected.lastName} sera définitivement supprimé(e).
            </p>
            {formError && <p className="text-[11px] text-rose-400">{formError}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition">Annuler</button>
              <button onClick={handleDelete} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
