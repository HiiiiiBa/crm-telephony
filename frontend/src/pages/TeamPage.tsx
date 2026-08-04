import React from 'react';
import { UserPlus, Shield, CheckCircle, XCircle } from 'lucide-react';

export const TeamPage: React.FC = () => {
  const users = [
    { id: '1', name: 'Admin Demo', email: 'admin@crm-telephony.local', role: 'ADMIN', team: 'Direction Commerciale', status: 'Actif' },
    { id: '2', name: 'Thomas Manager', email: 'thomas@crm-telephony.local', role: 'MANAGER', team: 'Équipe Ventes Nord', status: 'Actif' },
    { id: '3', name: 'Julie Agent', email: 'julie@crm-telephony.local', role: 'AGENT', team: 'Équipe Ventes Nord', status: 'Actif' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Gestion des Équipes & Utilisateurs</h2>
          <p className="text-xs text-slate-400">Contrôle d'accès et attribution des rôles (Admin, Manager, Agent)</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition">
          <UserPlus className="w-4 h-4" />
          <span>Inviter un Membre</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="px-6 py-3.5">Membre</th>
              <th className="px-6 py-3.5">Rôle</th>
              <th className="px-6 py-3.5">Équipe</th>
              <th className="px-6 py-3.5">Statut</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/30 transition">
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-100">{user.name}</p>
                  <p className="text-[11px] text-slate-400">{user.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    user.role === 'ADMIN'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : user.role === 'MANAGER'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    <Shield className="w-2.5 h-2.5" />
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-300">{user.team}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                    <CheckCircle className="w-3 h-3" />
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition">
                    Éditer rôle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
