import { prisma } from '../../services/prisma.js';
import { CallDirection, CallStatus, DealStage, Role } from '../../types/enums.js';
import { buildCallVisibilityFilter } from '../calls/calls.permissions.js';
import { buildContactVisibilityFilter } from '../contacts/contacts.permissions.js';
import { buildVisibilityFilter as buildDealVisibilityFilter } from '../deals/deals.permissions.js';
import { PresenceService } from '../presence/presence.service.js';
import {
  AgentPerformance,
  AuthContext,
  CallVolumeDay,
  DashboardData,
  DashboardDirection,
  DashboardFilters,
  DashboardKpis,
  LiveActivity,
  PipelineStageValue,
} from './dashboard.types.js';

const OPEN_DEAL_STAGES: DealStage[] = [
  DealStage.LEAD,
  DealStage.QUALIFIE,
  DealStage.PROPOSITION,
  DealStage.NEGOTIATION,
];

const PIPELINE_CHART_STAGES: DealStage[] = [
  DealStage.LEAD,
  DealStage.QUALIFIE,
  DealStage.PROPOSITION,
  DealStage.NEGOTIATION,
  DealStage.GAGNE,
];

const LIVE_STATUSES: CallStatus[] = [CallStatus.RINGING, CallStatus.CONNECTED];

interface CallRow {
  agentId: string;
  direction: string;
  status: string;
  duration: number;
  createdAt: Date;
}

function normalizeFilters(days?: number, direction?: string): DashboardFilters {
  const allowedDays = [7, 14, 30];
  const d = allowedDays.includes(days ?? 0) ? days! : 14;
  const dir = direction === CallDirection.INBOUND || direction === CallDirection.OUTBOUND
    ? direction
    : 'ALL';
  return { days: d, direction: dir as DashboardDirection };
}

function getLastNDayKeys(days: number): string[] {
  const keys: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }

  return keys;
}

function buildDirectionFilter(direction: DashboardDirection): Record<string, unknown> {
  if (direction === 'ALL') return {};
  return { direction };
}

function canViewTeamAnalytics(role: string): boolean {
  return role === Role.ADMIN || role === Role.MANAGER;
}

export class DashboardService {
  static async getDashboard(
    auth: AuthContext,
    queryDays?: number,
    queryDirection?: string,
  ): Promise<DashboardData> {
    const filters = normalizeFilters(queryDays, queryDirection);
    const [callVisibility, contactVisibility, dealVisibility] = await Promise.all([
      buildCallVisibilityFilter(auth),
      buildContactVisibilityFilter(auth),
      buildDealVisibilityFilter(auth),
    ]);

    const dayKeys = getLastNDayKeys(filters.days);
    const startDate = new Date(`${dayKeys[0]}T00:00:00.000Z`);
    const periodCallWhere = {
      ...callVisibility,
      ...buildDirectionFilter(filters.direction),
      createdAt: { gte: startDate },
    };

    const [periodCalls, liveActivity, teamPresenceRaw, crmCounts] = await Promise.all([
      prisma.call.findMany({
        where: periodCallWhere,
        select: { agentId: true, direction: true, status: true, duration: true, createdAt: true },
      }),
      DashboardService._computeLiveActivity(auth, callVisibility),
      PresenceService.getTeamPresence(auth),
      DashboardService._computeCrmCounts(contactVisibility, dealVisibility),
    ]);

    const teamPresence = teamPresenceRaw.map(p => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      role: p.role,
      phoneExtension: p.phoneExtension,
      teamName: p.teamName,
      presenceStatus: p.presenceStatus,
      presenceUpdatedAt: p.presenceUpdatedAt?.toISOString() ?? null,
    }));

    const kpis = DashboardService._computeKpis(periodCalls as CallRow[], crmCounts);
    const showAnalytics = canViewTeamAnalytics(auth.role);

    let callVolume: CallVolumeDay[] | null = null;
    let agentPerformance: AgentPerformance[] | null = null;
    let pipelineByStage: PipelineStageValue[] | null = null;

    if (showAnalytics) {
      [callVolume, agentPerformance, pipelineByStage] = await Promise.all([
        Promise.resolve(DashboardService._computeCallVolume(dayKeys, periodCalls as CallRow[])),
        Promise.resolve(DashboardService._computeAgentPerformance(periodCalls as CallRow[])),
        DashboardService._computePipelineByStage(dealVisibility),
      ]);
    } else {
      callVolume = DashboardService._computeCallVolume(dayKeys, periodCalls as CallRow[]);
    }

    return {
      filters,
      liveActivity,
      teamPresence,
      kpis,
      callVolume,
      callVolume14Days: callVolume,
      agentPerformance,
      callsByAgent: agentPerformance?.map(a => ({
        agentId: a.agentId,
        firstName: a.firstName,
        lastName: a.lastName,
        totalCalls: a.totalCalls,
      })) ?? null,
      pipelineByStage,
    };
  }

  static async exportCsv(
    auth: AuthContext,
    queryDays?: number,
    queryDirection?: string,
  ): Promise<string> {
    const data = await DashboardService.getDashboard(auth, queryDays, queryDirection);
    const lines: string[] = [
      'Section;Indicateur;Valeur',
      `Filtres;Période;${data.filters.days} jours`,
      `Filtres;Direction;${data.filters.direction}`,
      `Temps réel;Appels en cours;${data.liveActivity.callsInProgress}`,
      `Temps réel;En sonnerie;${data.liveActivity.callsRinging}`,
      `Temps réel;Agents en appel;${data.liveActivity.agentsOnCall}`,
      `Temps réel;Agents disponibles;${data.liveActivity.agentsAvailable}`,
      `Temps réel;Agents en pause;${data.liveActivity.agentsOnPause}`,
      `Temps réel;Agents hors ligne;${data.liveActivity.agentsOffline}`,
      `KPI;Total appels;${data.kpis.totalCalls}`,
      `KPI;Entrants;${data.kpis.inboundCalls}`,
      `KPI;Sortants;${data.kpis.outboundCalls}`,
      `KPI;Répondus;${data.kpis.answeredCalls}`,
      `KPI;Manqués;${data.kpis.missedCalls}`,
      `KPI;Niveau de service (%);${data.kpis.serviceLevelPercent}`,
      `KPI;Durée moyenne (s);${data.kpis.averageCallDurationSeconds}`,
      `KPI;Contacts;${data.kpis.totalContacts}`,
      `KPI;Affaires ouvertes;${data.kpis.openDeals}`,
      `KPI;CA gagné;${data.kpis.wonRevenue}`,
    ];

    if (data.agentPerformance?.length) {
      lines.push('Agent;Prénom;Nom;Total;Entrants;Sortants;Répondus;Manqués;Durée moy. (s)');
      for (const a of data.agentPerformance) {
        lines.push(
          `${a.agentId};${a.firstName};${a.lastName};${a.totalCalls};${a.inboundCalls};${a.outboundCalls};${a.answeredCalls};${a.missedCalls};${a.averageDurationSeconds}`,
        );
      }
    }

    if (data.callVolume?.length) {
      lines.push('Date;Total;Entrants;Sortants;Répondus;Manqués');
      for (const d of data.callVolume) {
        lines.push(`${d.date};${d.total};${d.inbound};${d.outbound};${d.answered};${d.missed}`);
      }
    }

    return lines.join('\n');
  }

  private static async _computeLiveActivity(
    auth: AuthContext,
    callVisibility: Record<string, unknown>,
  ): Promise<LiveActivity> {
    const [presenceSummary, callsInProgress, callsRinging] = await Promise.all([
      PresenceService.getSummary(auth),
      prisma.call.count({
        where: { ...callVisibility, status: { in: LIVE_STATUSES } },
      }),
      prisma.call.count({
        where: { ...callVisibility, status: CallStatus.RINGING },
      }),
    ]);

    return {
      callsInProgress,
      callsRinging,
      agentsOnCall: presenceSummary.onCall,
      agentsAvailable: presenceSummary.online,
      agentsOnPause: presenceSummary.onPause,
      agentsOffline: presenceSummary.offline,
      agentsOnline: presenceSummary.online,
      totalActiveAgents: presenceSummary.total,
    };
  }

  private static async _computeCrmCounts(
    contactVisibility: Record<string, unknown>,
    dealVisibility: Record<string, unknown>,
  ) {
    const [totalContacts, openDeals, wonAgg] = await Promise.all([
      prisma.contact.count({ where: contactVisibility }),
      prisma.deal.count({ where: { ...dealVisibility, stage: { in: OPEN_DEAL_STAGES } } }),
      prisma.deal.aggregate({
        where: { ...dealVisibility, stage: DealStage.GAGNE },
        _sum: { value: true },
      }),
    ]);

    return {
      totalContacts,
      openDeals,
      wonRevenue: wonAgg._sum.value ?? 0,
    };
  }

  private static _computeKpis(
    calls: CallRow[],
    crm: { totalContacts: number; openDeals: number; wonRevenue: number },
  ): DashboardKpis {
    const inbound = calls.filter(c => c.direction === CallDirection.INBOUND);
    const outbound = calls.filter(c => c.direction === CallDirection.OUTBOUND);
    const answered = calls.filter(c => c.status === CallStatus.COMPLETED);
    const missed = calls.filter(c => c.status === CallStatus.MISSED);
    const inboundAnswered = inbound.filter(c => c.status === CallStatus.COMPLETED).length;
    const inboundTotal = inbound.length;
    const completedWithDuration = answered.filter(c => c.duration > 0);
    const inboundCompleted = inbound.filter(c => c.status === CallStatus.COMPLETED && c.duration > 0);
    const outboundCompleted = outbound.filter(c => c.status === CallStatus.COMPLETED && c.duration > 0);

    const avg = (rows: CallRow[]) =>
      rows.length > 0 ? Math.round(rows.reduce((s, c) => s + c.duration, 0) / rows.length) : 0;

    const serviceLevel = inboundTotal > 0
      ? Math.round((inboundAnswered / inboundTotal) * 1000) / 10
      : 100;

    const missedRate = calls.length > 0
      ? Math.round((missed.length / calls.length) * 1000) / 10
      : 0;

    return {
      totalCalls: calls.length,
      inboundCalls: inbound.length,
      outboundCalls: outbound.length,
      answeredCalls: answered.length,
      missedCalls: missed.length,
      serviceLevelPercent: serviceLevel,
      averageCallDurationSeconds: avg(completedWithDuration),
      averageInboundDurationSeconds: avg(inboundCompleted),
      averageOutboundDurationSeconds: avg(outboundCompleted),
      missedRatePercent: missedRate,
      totalContacts: crm.totalContacts,
      openDeals: crm.openDeals,
      wonRevenue: crm.wonRevenue,
    };
  }

  private static _computeCallVolume(dayKeys: string[], calls: CallRow[]): CallVolumeDay[] {
    const byDay = new Map<string, CallVolumeDay>();
    for (const key of dayKeys) {
      byDay.set(key, { date: key, total: 0, inbound: 0, outbound: 0, answered: 0, missed: 0 });
    }

    for (const call of calls) {
      const key = call.createdAt.toISOString().slice(0, 10);
      const bucket = byDay.get(key);
      if (!bucket) continue;
      bucket.total += 1;
      if (call.direction === CallDirection.INBOUND) bucket.inbound += 1;
      if (call.direction === CallDirection.OUTBOUND) bucket.outbound += 1;
      if (call.status === CallStatus.COMPLETED) bucket.answered += 1;
      if (call.status === CallStatus.MISSED) bucket.missed += 1;
    }

    return dayKeys.map(key => byDay.get(key)!);
  }

  private static async _computeAgentPerformance(calls: CallRow[]): Promise<AgentPerformance[]> {
    if (calls.length === 0) return [];

    const byAgent = new Map<string, CallRow[]>();
    for (const call of calls) {
      const list = byAgent.get(call.agentId) ?? [];
      list.push(call);
      byAgent.set(call.agentId, list);
    }

    const agentIds = [...byAgent.keys()];
    const agents = await prisma.user.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const agentMap = new Map(agents.map(a => [a.id, a]));

    return agentIds
      .map(agentId => {
        const rows = byAgent.get(agentId)!;
        const completed = rows.filter(c => c.status === CallStatus.COMPLETED && c.duration > 0);
        const avgDuration = completed.length > 0
          ? Math.round(completed.reduce((s, c) => s + c.duration, 0) / completed.length)
          : 0;

        const agent = agentMap.get(agentId);
        return {
          agentId,
          firstName: agent?.firstName ?? 'Inconnu',
          lastName: agent?.lastName ?? '',
          totalCalls: rows.length,
          inboundCalls: rows.filter(c => c.direction === CallDirection.INBOUND).length,
          outboundCalls: rows.filter(c => c.direction === CallDirection.OUTBOUND).length,
          answeredCalls: rows.filter(c => c.status === CallStatus.COMPLETED).length,
          missedCalls: rows.filter(c => c.status === CallStatus.MISSED).length,
          averageDurationSeconds: avgDuration,
        };
      })
      .sort((a, b) => b.totalCalls - a.totalCalls);
  }

  private static async _computePipelineByStage(
    dealVisibility: Record<string, unknown>,
  ): Promise<PipelineStageValue[]> {
    return Promise.all(
      PIPELINE_CHART_STAGES.map(async stage => {
        const where = { ...dealVisibility, stage };
        const [count, agg] = await Promise.all([
          prisma.deal.count({ where }),
          prisma.deal.aggregate({ where, _sum: { value: true } }),
        ]);
        return { stage, value: agg._sum.value ?? 0, count };
      }),
    );
  }
}
