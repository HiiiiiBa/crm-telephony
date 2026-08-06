import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, Shield, CheckCircle, XCircle, Loader2, AlertCircle,
  Pencil, Trash2, X, UserX, Users2, Phone, Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UsersService, TeamMember, InviteUserData } from '../services/users.service';
import { TeamsService, TeamSummary } from '../services/teams.service';
import { PresenceBadge } from '../components/presence/PresenceBadge';
import { PresenceStatus } from '../types/presence.types';

type ModalState = 'none' | 'invite' | 'editRole' | 'deactivate' | 'delete' | 'assignTeam' | 'createTeam';

const ROLE_OPTIONS = [
  { value: 'AGENT', label: 'Agent' },
  { value: 'MANAGER', label: 'Manager' },
] as const;

export const TeamPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
  const isManager = currentUser?.role === 'MANAGER';
  const canManage = isAdmin || isManager;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
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
    phoneExtension: '',
    teamId: '',
  });
  const [editRole, setEditRole] = useState<'AGENT' | 'MANAGER'>('AGENT');
  const [assignTeamId, setAssignTeamId] = useState<string>('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const users = await UsersService.listUsers();
      setMembers(users);
      if (canManage) {
        const teamList = await TeamsService.listTeams();
        setTeams(teamList);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Impossible de charger les membres.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [canManage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const closeModal = () => {
    setModal('none');
    setSelected(null);
    setFormError(null);
    setInviteForm({ firstName: '', lastName: '', email: '', password: '', role: 'AGENT', phoneExtension: '', teamId: '' });
    setNewTeamName('');
    setNewTeamDesc('');
  };

  const openInvite = () => {
    setFormError(null);
    setInviteForm({ firstName: '', lastName: '', email: '', password: '', role: 'AGENT', phoneExtension: '', teamId: '' });
    setModal('invite');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const payload: InviteUserData = {
        ...inviteForm,
        phoneExtension: inviteForm.phoneExtension?.trim() || undefined,
        teamId: inviteForm.teamId || undefined,
      };
      if (isManager) delete payload.role;
      await UsersService.inviteUser(payload);
      closeModal();
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l\'invitation.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await TeamsService.createTeam({
        name: newTeamName.trim(),
        description: newTeamDesc.trim() || undefined,
      });
      closeModal();
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setFormLoading(false);
    }
  };

  const openAssignTeam = (member: TeamMember) => {
    setSelected(member);
    setAssignTeamId(member.team?.id ?? '');
    setFormError(null);
    setModal('assignTeam');
  };

  const handleAssignTeam = async () => {
    if (!selected) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await UsersService.updateUser(selected.id, { teamId: assignTeamId || null });
      closeModal();
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de l\'assignation.');
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
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la modification du rôle.');
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
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la modification du statut.');
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
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
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
            {canManage
              ? 'Annuaire de l\'espace · Invitation et regroupement par équipes'
              : 'Annuaire des membres de votre espace de travail'}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setFormError(null); setModal('createTeam'); }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              <Plus className="w-4 h-4" />
              Nouvelle équipe
            </button>
            <button
              onClick={openInvite}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              <UserPlus className="w-4 h-4" />
              Inviter un membre
            </button>
          </div>
        )}
      </div>

      {canManage && teams.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teams.map(team => (
            <div key={team.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold">
                <Users2 className="w-4 h-4 text-indigo-400" />
                {team.name}
              </div>
              {team.description && <p className="text-[11px] text-slate-500 mt-1">{team.description}</p>}
              <p className="text-[10px] text-slate-400 mt-2">{team.memberCount} membre{team.memberCount !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement des membres…
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300 min-w-[720px]">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Identité</th>
                <th className="px-6 py-3.5">Extension</th>
                <th className="px-6 py-3.5">Rôle</th>
                <th className="px-6 py-3.5">Équipe</th>
                <th className="px-6 py-3.5">Présence</th>
                <th className="px-6 py-3.5">Compte</th>
                {canManage && <th className="px-6 py-3.5 text-right">Actions</th>}
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
                      <span className="inline-flex items-center gap-1 text-slate-300 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {member.phoneExtension ? `Ext. ${member.phoneExtension}` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${roleBadgeClass(member.role)}`}>
                        <Shield className="w-2.5 h-2.5" />
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{member.team?.name ?? '—'}</td>
                    <td className="px-6 py-4">
                      <PresenceBadge
                        status={(member.presenceStatus as PresenceStatus) || 'OFFLINE'}
                        size="md"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {member.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                          <CheckCircle className="w-3 h-3" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-medium text-[11px]">
                          <XCircle className="w-3 h-3" />
                          Inactif
                        </span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isSelf && (
                            <button
                              onClick={() => openAssignTeam(member)}
                              className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition"
                              title="Assigner à une équipe"
                            >
                              <Users2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && member.role !== 'ADMIN' && !isSelf && (
                            <button
                              onClick={() => openEditRole(member)}
                              className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition"
                              title="Modifier le rôle"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && !isSelf && (
                            <button
                              onClick={() => openDeactivate(member)}
                              className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition"
                              title={member.isActive ? 'Désactiver' : 'Réactiver'}
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && !isSelf && member.role !== 'ADMIN' && (
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

      {modal === 'invite' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Inviter un membre (F-70)</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Prénom" value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
                <input required placeholder="Nom" value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
              <input required type="email" placeholder="Email" value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
              <input required type="password" placeholder="Mot de passe temporaire (min. 6 car.)" minLength={6}
                value={inviteForm.password} onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
              <input placeholder="Extension téléphonique (ex. 104)" value={inviteForm.phoneExtension}
                onChange={(e) => setInviteForm({ ...inviteForm, phoneExtension: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500" />
              {teams.length > 0 && (
                <select value={inviteForm.teamId} onChange={(e) => setInviteForm({ ...inviteForm, teamId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
                  <option value="">— Aucune équipe —</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
              {isAdmin && (
                <select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'AGENT' | 'MANAGER' })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
                  {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              )}
              {formError && <p className="text-[11px] text-rose-400">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition">Annuler</button>
                <button type="submit" disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Inviter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'createTeam' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Créer une équipe (F-72)</h3>
            <form onSubmit={handleCreateTeam} className="space-y-3">
              <input required placeholder="Nom de l'équipe" value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500" />
              <input placeholder="Description (optionnel)" value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500" />
              {formError && <p className="text-[11px] text-rose-400">{formError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Annuler</button>
                <button type="submit" disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'assignTeam' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Assigner à une équipe</h3>
            <p className="text-xs text-slate-400">{selected.firstName} {selected.lastName}</p>
            <select value={assignTeamId} onChange={e => setAssignTeamId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
              <option value="">— Aucune équipe —</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {formError && <p className="text-[11px] text-rose-400">{formError}</p>}
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Annuler</button>
              <button onClick={handleAssignTeam} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'editRole' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Modifier le rôle (F-73)</h3>
            <p className="text-xs text-slate-400">{selected.firstName} {selected.lastName}</p>
            <select value={editRole} onChange={(e) => setEditRole(e.target.value as 'AGENT' | 'MANAGER')}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
              {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {formError && <p className="text-[11px] text-rose-400">{formError}</p>}
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Annuler</button>
              <button onClick={handleEditRole} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'deactivate' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UserX className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">{selected.isActive ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'}</h3>
            <p className="text-xs text-slate-400">{selected.firstName} {selected.lastName}</p>
            {formError && <p className="text-[11px] text-rose-400">{formError}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Annuler</button>
              <button onClick={handleToggleActive} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-semibold disabled:opacity-50">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : selected.isActive ? 'Désactiver' : 'Réactiver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Supprimer ce compte ?</h3>
            {formError && <p className="text-[11px] text-rose-400">{formError}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">Annuler</button>
              <button onClick={handleDelete} disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
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
