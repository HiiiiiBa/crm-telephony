import React from 'react';
import { PhoneCall, Users, DollarSign, PhoneMissed, ArrowUpRight, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';

const callVolumeData = [
  { day: 'Lun 24', appels: 42, manques: 4 },
  { day: 'Mar 25', appels: 58, manques: 6 },
  { day: 'Mer 26', appels: 65, manques: 3 },
  { day: 'Jeu 27', appels: 49, manques: 7 },
  { day: 'Ven 28', appels: 72, manques: 5 },
  { day: 'Sam 29', appels: 20, manques: 2 },
  { day: 'Dim 30', appels: 12, manques: 1 },
  { day: 'Lun 31', appels: 84, manques: 8 },
  { day: 'Mar 01', appels: 91, manques: 5 },
  { day: 'Mer 02', appels: 76, manques: 4 },
  { day: 'Jeu 03', appels: 88, manques: 9 },
  { day: 'Ven 04', appels: 95, manques: 6 },
];

const pipelineData = [
  { stage: 'Lead', valeur: 45000 },
  { stage: 'Qualifié', valeur: 82000 },
  { stage: 'Proposition', valeur: 110000 },
  { stage: 'Négociation', valeur: 64000 },
  { stage: 'Gagné', valeur: 145000 },
];

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Tableau de bord analytique</h2>
          <p className="text-xs text-slate-400">Vue d'ensemble des activités téléphoniques et commerciales</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            +18.4% ce mois
          </span>
        </div>
      </div>

      {/* Top Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Appels</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">752</p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> +12% vs semaine passée
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Contacts Actifs</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">1,248</p>
          <p className="text-[11px] text-slate-400 mt-1">Base qualifiée</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">CA Gagné</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">145,000 €</p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> +24% objectif du mois
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Appels Manqués</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <PhoneMissed className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">56</p>
          <p className="text-[11px] text-rose-400 mt-1">7.4% du volume total</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Volume Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Volume d'appels (14 derniers jours)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={callVolumeData}>
                <defs>
                  <linearGradient id="colorAppels" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="appels" stroke="#6366f1" fillOpacity={1} fill="url(#colorAppels)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Value Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Valeur du Pipeline par Étape (€)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="stage" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="valeur" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
