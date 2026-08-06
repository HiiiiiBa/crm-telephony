import { DealStage } from '../../types/enums.js';

export interface AuthContext {
  userId: string;
  workspaceId: string;
  role: string;
}

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

/** @deprecated Utiliser agentPerformance */
export interface CallsByAgent {
  agentId: string;
  firstName: string;
  lastName: string;
  totalCalls: number;
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
  /** Alias rétrocompatibilité */
  callVolume14Days: CallVolumeDay[] | null;
  agentPerformance: AgentPerformance[] | null;
  /** Alias rétrocompatibilité */
  callsByAgent: CallsByAgent[] | null;
  pipelineByStage: PipelineStageValue[] | null;
}
