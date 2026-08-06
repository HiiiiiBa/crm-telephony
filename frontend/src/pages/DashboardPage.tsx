import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  PhoneCall, Users, DollarSign, PhoneMissed, Briefcase, Clock, Loader2, AlertCircle,
  RefreshCw, Radio, PhoneIncoming, PhoneOutgoing, Headphones, UserCheck, Download,
  Activity, BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar,
  CartesianGrid, Legend,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { DashboardService } from '../services/dashboard.service';
import {
  DashboardData,
  DashboardDirection,
  formatChartDay,
  formatCurrency,
  formatDuration,
  serviceLevelAlert,
  missedRateAlert,
  ALERT_BORDER,
  ALERT_TEXT,
  KpiAlertLevel,
} from '../types/dashboard.types';
import { STAGE_LABELS, DealStage } from '../types/deals.types';
import { formatLastUpdated, useAutoRefresh } from '../hooks/useAutoRefresh';
import { PresenceBadge } from '../components/presence/PresenceBadge';
import { TeamPresenceMember } from '../types/dashboard.types';
import { PresenceStatus } from '../types/presence.types';

const REFRESH_INTERVAL_MS = 30_000;
const PERIOD_OPTIONS = [7, 14, 30] as const;

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const canViewAnalytics = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [days, setDays] = useState<number>(14);
  const [direction, setDirection] = useState<DashboardDirection>('ALL');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const hasDataRef = useRef(false);

  const loadDashboard = useCallback(async (silent: boolean) => {
    if (!silent && !hasDataRef.current) setLoading(true);

    try {
      const result = await DashboardService.getDashboard({ days, direction });
      setData(result);
      hasDataRef.current = true;
      setError(null);
      setRefreshError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de charger le tableau de bord.';
      if (!hasDataRef.current) setError(message);
      else if (silent) setRefreshError(message);
    } finally {
      if (!silent || !hasDataRef.current) setLoading(false);
    }
  }, [days, direction]);

  const { refresh, refreshing, lastUpdated, paused } = useAutoRefresh(loadDashboard, {
    intervalMs: REFRESH_INTERVAL_MS,
    fetchOnMount: false,
  });

  useEffect(() => {
    hasDataRef.current = false;
    void loadDashboard(false);
  }, [days, direction, loadDashboard]);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await DashboardService.downloadExport({ days, direction });
    } catch (e: unknown) {
      setRefreshError(e instanceof Error ? e.message : 'Export impossible.');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm">Chargement des statistiques…</span>
      </div>
    );
  }

  if ((error && !data) || !data) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error || 'Données indisponibles.'}
        </div>
        <button type="button" onClick={() => refresh(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition">
          <RefreshCw className="w-4 h-4" /> Réessayer
        </button>
      </div>
    );
  }

  const { liveActivity, kpis, callVolume, agentPerformance, pipelineByStage, teamPresence } = data;
  const volume = callVolume ?? data.callVolume14Days ?? [];

  const volumeChart = volume.map(d => ({
    day: formatChartDay(d.date, days),
    entrants: d.inbound,
    sortants: d.outbound,
    manques: d.missed,
    total: d.total,
  }));

  const pipelineChart = (pipelineByStage ?? []).map(p => ({
    stage: STAGE_LABELS[p.stage as DealStage] || p.stage,
    valeur: p.value,
  }));

  const slAlert = serviceLevelAlert(kpis.serviceLevelPercent);
  const missedAlert = missedRateAlert(kpis.missedRatePercent);

  return (
    <div className="space-y-6">
      {/* En-tête style Ringover */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">Statistiques & Analytics</h2>
          </div>
          <p className="text-xs text-slate-400">
            {canViewAnalytics
              ? 'Supervision temps réel et analytique téléphonique de l\'équipe'
              : 'Vos indicateurs d\'activité personnelle'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtres période / direction */}
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
            {PERIOD_OPTIONS.map(d => (
              <option key={d} value={d}>{d} derniers jours</option>
            ))}
          </select>
          <select value={direction} onChange={e => setDirection(e.target.value as DashboardDirection)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
            <option value="ALL">Tous les appels</option>
            <option value="INBOUND">Entrants</option>
            <option value="OUTBOUND">Sortants</option>
          </select>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
            {!paused && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
            <Radio className={`w-3.5 h-3.5 ${paused ? 'text-slate-500' : 'text-emerald-400'}`} />
            <span>{paused ? 'Pause' : 'Live'}</span>
            <span className="text-slate-600">·</span>
            <span>{formatLastUpdated(lastUpdated)}</span>
          </div>

          <button type="button" onClick={() => refresh(false)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          {canViewAnalytics && (
            <button type="button" onClick={handleExport} disabled={exportLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50">
              {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Export CSV
            </button>
          )}
        </div>
      </div>

      {refreshError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Dernière actualisation échouée — affichage des données précédentes.
        </div>
      )}

      {/* Bandeau temps réel (Ringover) */}
      <section className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 to-indigo-950/40 border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Activité en direct</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <LiveStat label="Appels en cours" value={liveActivity.callsInProgress} accent="text-indigo-400" />
          <LiveStat label="En sonnerie" value={liveActivity.callsRinging} accent="text-amber-400" />
          <LiveStat label="Disponibles" value={liveActivity.agentsOnline} accent="text-emerald-400" />
          <LiveStat label="En appel" value={liveActivity.agentsOnCall} accent="text-indigo-300" />
          <LiveStat label="En pause" value={liveActivity.agentsOnPause} accent="text-amber-300" />
          <LiveStat label="Hors ligne" value={liveActivity.agentsOffline} accent="text-slate-400" />
          <LiveStat label="Agents actifs" value={liveActivity.totalActiveAgents} accent="text-slate-300" />
        </div>
      </section>

      {/* Grille présence équipe (Ringover) */}
      {teamPresence && teamPresence.length > 0 && (
        <section className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Présence de l&apos;équipe</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {teamPresence.map(member => (
              <TeamPresenceCard key={member.id} member={member} />
            ))}
          </div>
        </section>
      )}

      {/* KPIs téléphonie avec alertes couleur */}
      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Indicateurs d'appels</h3>
        <div className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 transition-opacity ${refreshing ? 'opacity-90' : ''}`}>
          <AlertKpi label="Niveau de service" value={`${kpis.serviceLevelPercent} %`} sub="Entrants répondus"
            icon={<Headphones className="w-4 h-4" />} alert={slAlert} />
          <MetricKpi label="Total appels" value={String(kpis.totalCalls)} icon={<PhoneCall className="w-4 h-4" />} />
          <MetricKpi label="Entrants" value={String(kpis.inboundCalls)} icon={<PhoneIncoming className="w-4 h-4" />} />
          <MetricKpi label="Sortants" value={String(kpis.outboundCalls)} icon={<PhoneOutgoing className="w-4 h-4" />} />
          <MetricKpi label="Durée moy. (AHT)" value={formatDuration(kpis.averageCallDurationSeconds)}
            sub={`In: ${formatDuration(kpis.averageInboundDurationSeconds)} · Out: ${formatDuration(kpis.averageOutboundDurationSeconds)}`}
            icon={<Clock className="w-4 h-4" />} />
          <AlertKpi label="Appels manqués" value={String(kpis.missedCalls)} sub={`${kpis.missedRatePercent} % du volume`}
            icon={<PhoneMissed className="w-4 h-4" />} alert={missedAlert} />
        </div>
      </section>

      {/* KPIs CRM */}
      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Pipeline commercial</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricKpi label="Contacts" value={String(kpis.totalContacts)} icon={<Users className="w-4 h-4" />} compact />
          <MetricKpi label="Affaires ouvertes" value={String(kpis.openDeals)} icon={<Briefcase className="w-4 h-4" />} compact />
          <MetricKpi label="CA gagné" value={formatCurrency(kpis.wonRevenue)} icon={<DollarSign className="w-4 h-4" />} compact />
        </div>
      </section>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={`Volume d'appels (${days} jours)`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volumeChart}>
              <defs>
                <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="entrants" name="Entrants" stroke="#22d3ee" fill="url(#inGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="sortants" name="Sortants" stroke="#818cf8" fill="url(#outGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="manques" name="Manqués" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {canViewAnalytics && pipelineByStage ? (
          <ChartCard title="Valeur du pipeline par étape (€)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="stage" stroke="#64748b" fontSize={10} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(value: number) => [formatCurrency(value), 'Valeur']} />
                <Bar dataKey="valeur" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Répartition entrant / sortant">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { type: 'Entrants', count: kpis.inboundCalls },
                { type: 'Sortants', count: kpis.outboundCalls },
                { type: 'Répondus', count: kpis.answeredCalls },
                { type: 'Manqués', count: kpis.missedCalls },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="type" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="count" name="Appels" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Tableau agents (Ringover) */}
      {canViewAnalytics && agentPerformance && agentPerformance.length > 0 && (
        <section className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">Performance par agent</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="text-left py-2 pr-4 font-medium">Agent</th>
                  <th className="text-right py-2 px-2 font-medium">Total</th>
                  <th className="text-right py-2 px-2 font-medium">Entrants</th>
                  <th className="text-right py-2 px-2 font-medium">Sortants</th>
                  <th className="text-right py-2 px-2 font-medium">Répondus</th>
                  <th className="text-right py-2 px-2 font-medium">Manqués</th>
                  <th className="text-right py-2 pl-2 font-medium">Durée moy.</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance.map(a => (
                  <tr key={a.agentId} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition">
                    <td className="py-2.5 pr-4 text-slate-200 font-medium">{a.firstName} {a.lastName}</td>
                    <td className="text-right py-2.5 px-2 text-slate-300">{a.totalCalls}</td>
                    <td className="text-right py-2.5 px-2 text-cyan-400">{a.inboundCalls}</td>
                    <td className="text-right py-2.5 px-2 text-indigo-400">{a.outboundCalls}</td>
                    <td className="text-right py-2.5 px-2 text-emerald-400">{a.answeredCalls}</td>
                    <td className="text-right py-2.5 px-2 text-rose-400">{a.missedCalls}</td>
                    <td className="text-right py-2.5 pl-2 text-slate-400">{formatDuration(a.averageDurationSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

const LiveStat: React.FC<{ label: string; value: number; accent: string }> = ({ label, value, accent }) => (
  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center">
    <p className={`text-2xl font-bold ${accent}`}>{value}</p>
    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">{label}</p>
  </div>
);

const MetricKpi: React.FC<{
  label: string; value: string; sub?: string; icon: React.ReactNode; compact?: boolean;
}> = ({ label, value, sub, icon, compact }) => (
  <div className={`p-4 rounded-2xl bg-slate-900/80 border border-slate-800 border-l-4 border-l-slate-600 ${compact ? 'p-3' : ''}`}>
    <div className="flex items-center justify-between text-slate-400 mb-1">
      <span className="text-[11px] font-medium">{label}</span>
      <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">{icon}</div>
    </div>
    <p className={`font-bold text-slate-100 ${compact ? 'text-lg' : 'text-xl'}`}>{value}</p>
    {sub && <p className="text-[10px] text-slate-500 mt-1">{sub}</p>}
  </div>
);

const AlertKpi: React.FC<{
  label: string; value: string; sub?: string; icon: React.ReactNode; alert: KpiAlertLevel;
}> = ({ label, value, sub, icon, alert }) => (
  <div className={`p-4 rounded-2xl bg-slate-900/80 border border-slate-800 border-l-4 ${ALERT_BORDER[alert]}`}>
    <div className="flex items-center justify-between text-slate-400 mb-1">
      <span className="text-[11px] font-medium">{label}</span>
      <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">{icon}</div>
    </div>
    <p className={`text-xl font-bold ${ALERT_TEXT[alert]}`}>{value}</p>
    {sub && <p className="text-[10px] text-slate-500 mt-1">{sub}</p>}
  </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
    <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
    <div className="h-64 w-full">{children}</div>
  </div>
);

const TeamPresenceCard: React.FC<{ member: TeamPresenceMember }> = ({ member }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
      {member.firstName[0]}{member.lastName[0]}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-slate-200 truncate">{member.firstName} {member.lastName}</p>
      <p className="text-[10px] text-slate-500 truncate">
        {member.phoneExtension ? `Ext. ${member.phoneExtension}` : member.role}
        {member.teamName ? ` · ${member.teamName}` : ''}
      </p>
      <div className="mt-1">
        <PresenceBadge status={member.presenceStatus as PresenceStatus} size="md" />
      </div>
    </div>
  </div>
);
