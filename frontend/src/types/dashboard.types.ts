import { DealStage } from './deals.types';

export type DashboardDirection = 'ALL' | 'INBOUND' | 'OUTBOUND';

export interface DashboardFilters {
  days: number;
  direction: DashboardDirection;
}

export interface LiveActivity {
  callsInProgress: number;
  callsRinging: number;
  agentsOnCall: number;
  agentsAvailable: number;
  agentsOnPause: number;
  agentsOffline: number;
  agentsOnline: number;
  totalActiveAgents: number;
}

export interface TeamPresenceMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneExtension: string | null;
  teamName: string | null;
  presenceStatus: string;
  presenceUpdatedAt: string | null;
}

export interface DashboardKpis {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  answeredCalls: number;
  missedCalls: number;
  serviceLevelPercent: number;
  averageCallDurationSeconds: number;
  averageInboundDurationSeconds: number;
  averageOutboundDurationSeconds: number;
  missedRatePercent: number;
  totalContacts: number;
  openDeals: number;
  wonRevenue: number;
}

export interface CallVolumeDay {
  date: string;
  total: number;
  inbound: number;
  outbound: number;
  answered: number;
  missed: number;
}

export interface AgentPerformance {
  agentId: string;
  firstName: string;
  lastName: string;
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  answeredCalls: number;
  missedCalls: number;
  averageDurationSeconds: number;
}

export interface PipelineStageValue {
  stage: DealStage;
  value: number;
  count: number;
}

export interface DashboardData {
  filters: DashboardFilters;
  liveActivity: LiveActivity;
  teamPresence: TeamPresenceMember[] | null;
  kpis: DashboardKpis;
  callVolume: CallVolumeDay[] | null;
  callVolume14Days: CallVolumeDay[] | null;
  agentPerformance: AgentPerformance[] | null;
  callsByAgent: { agentId: string; firstName: string; lastName: string; totalCalls: number }[] | null;
  pipelineByStage: PipelineStageValue[] | null;
}

export interface DashboardQuery {
  days?: number;
  direction?: DashboardDirection;
}

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

export const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} min ${s}s` : `${s}s`;
};

export const formatChartDay = (isoDate: string, days: number): string => {
  const d = new Date(`${isoDate}T12:00:00`);
  if (days <= 7) {
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
  }
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

export type KpiAlertLevel = 'good' | 'warn' | 'bad';

export const serviceLevelAlert = (percent: number): KpiAlertLevel => {
  if (percent >= 80) return 'good';
  if (percent >= 60) return 'warn';
  return 'bad';
};

export const missedRateAlert = (percent: number): KpiAlertLevel => {
  if (percent <= 5) return 'good';
  if (percent <= 15) return 'warn';
  return 'bad';
};

export const ALERT_BORDER: Record<KpiAlertLevel, string> = {
  good: 'border-l-emerald-500',
  warn: 'border-l-amber-500',
  bad: 'border-l-rose-500',
};

export const ALERT_TEXT: Record<KpiAlertLevel, string> = {
  good: 'text-emerald-400',
  warn: 'text-amber-400',
  bad: 'text-rose-400',
};
