export type PresenceStatus = 'ONLINE' | 'ON_CALL' | 'PAUSE' | 'OFFLINE';

export interface AgentPresence {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneExtension: string | null;
  teamId: string | null;
  teamName: string | null;
  presenceStatus: PresenceStatus;
  presenceUpdatedAt: string | null;
  isActive: boolean;
}

export interface PresenceSummary {
  online: number;
  onCall: number;
  onPause: number;
  offline: number;
  total: number;
}

export const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  ONLINE: 'Disponible',
  ON_CALL: 'En appel',
  PAUSE: 'En pause',
  OFFLINE: 'Hors ligne',
};

export const PRESENCE_DOT: Record<PresenceStatus, string> = {
  ONLINE: 'bg-emerald-500',
  ON_CALL: 'bg-indigo-500',
  PAUSE: 'bg-amber-500',
  OFFLINE: 'bg-slate-500',
};

export const PRESENCE_RING: Record<PresenceStatus, string> = {
  ONLINE: 'ring-emerald-500/40',
  ON_CALL: 'ring-indigo-500/40',
  PAUSE: 'ring-amber-500/40',
  OFFLINE: 'ring-slate-500/30',
};

export const MANUAL_PRESENCE_OPTIONS: PresenceStatus[] = ['ONLINE', 'PAUSE', 'OFFLINE'];
