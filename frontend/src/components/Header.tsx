import React from 'react';
import { Search, PhoneCall, Circle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PresenceSelector } from './presence/PresenceSelector';
import { NotificationBell } from './notifications/NotificationBell';

interface HeaderProps {
  onToggleDialer: () => void;
  isDialerOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleDialer, isDialerOpen }) => {
  const { user, logout } = useAuth();

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'US';

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Bar */}
      <div className="relative w-80">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher contact, numéro, affaire..."
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950/70 border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder-slate-500 transition"
        />
      </div>

      {/* Action Bar & User Profile */}
      <div className="flex items-center gap-4">
        {/* Présence agent (Ringover) */}
        <PresenceSelector />

        {/* Toggle Dialer Button */}
        <button
          onClick={onToggleDialer}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
            isDialerOpen
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>{isDialerOpen ? 'Masquer Dialer' : 'Ouvrir Dialer'}</span>
          <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400 animate-pulse" />
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User Badge */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
            </p>
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300">
              {user?.role || 'AGENT'}
            </span>
          </div>

          <button
            onClick={logout}
            title="Se déconnecter"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
