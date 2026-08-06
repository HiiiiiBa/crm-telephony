import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  KanbanSquare, 
  PhoneCall, 
  MessageSquare, 
  Users2, 
  Phone,
  ShieldCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const canManageTeam = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const navItems = [
    { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/contacts', label: 'Contacts CRM', icon: Users },
    { to: '/deals', label: 'Pipeline Kanban', icon: KanbanSquare },
    { to: '/dialer', label: 'Dialer', icon: Phone },
    { to: '/calls', label: 'Historique d\'appels', icon: PhoneCall },
    { to: '/messages', label: 'Messagerie SMS', icon: MessageSquare },
    ...(canManageTeam ? [{ to: '/team', label: 'Équipe & Utilisateurs', icon: Users2 }] : []),
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-900/90 flex flex-col justify-between h-screen sticky top-0 backdrop-blur-md">
      <div>
        {/* Logo / Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-sm leading-tight tracking-wide">RingCRM</h1>
            <p className="text-[11px] text-indigo-400 font-medium">Cloud & Téléphonie</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Role / Workspace Footer */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">Espace Admin</p>
            <p className="text-[10px] text-slate-400 truncate">Mode Développement</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
