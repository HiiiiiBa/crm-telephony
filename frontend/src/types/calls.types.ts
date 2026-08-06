export enum CallStatus {
  RINGING = 'RINGING',
  CONNECTED = 'CONNECTED',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  FAILED = 'FAILED',
  VOICEMAIL = 'VOICEMAIL',
}

export enum CallDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  [CallStatus.RINGING]: 'Sonnerie',
  [CallStatus.CONNECTED]: 'Connecté',
  [CallStatus.COMPLETED]: 'Terminé',
  [CallStatus.MISSED]: 'Manqué',
  [CallStatus.FAILED]: 'Échec',
  [CallStatus.VOICEMAIL]: 'Messagerie',
};

export const CALL_DIRECTION_LABELS: Record<CallDirection, string> = {
  [CallDirection.INBOUND]: 'Entrant',
  [CallDirection.OUTBOUND]: 'Sortant',
};

export interface CallContact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string | null;
}

export interface Call {
  id: string;
  callerNumber: string;
  calledNumber: string;
  direction: CallDirection | string;
  status: CallStatus | string;
  duration: number;
  agentId: string;
  contactId: string | null;
  workspaceId: string;
  startedAt: string | null;
  endedAt: string | null;
  note: string | null;
  recordingUrl: string | null;
  createdAt: string;
  updatedAt: string;
  contact: CallContact | null;
  agent: { id: string; firstName: string; lastName: string; email: string };
}

export interface ActiveCall extends Call {
  isMuted: boolean;
}

export interface StartCallDto {
  phoneNumber: string;
  contactId?: string;
}

export interface CallsListParams {
  search?: string;
  direction?: CallDirection;
  status?: CallStatus;
  agentId?: string;
  contactId?: string;
  page?: number;
  limit?: number;
}

export const formatCallDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const formatCallDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Aujourd'hui ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Hier ${time}`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const isActiveStatus = (status: string): boolean =>
  status === CallStatus.RINGING || status === CallStatus.CONNECTED;

export const getStatusBadgeClass = (status: string): string => {
  if (status === CallStatus.MISSED || status === CallStatus.FAILED) return 'bg-rose-500/20 text-rose-300';
  if (status === CallStatus.COMPLETED) return 'bg-emerald-500/20 text-emerald-300';
  if (status === CallStatus.CONNECTED || status === CallStatus.RINGING) return 'bg-amber-500/20 text-amber-300';
  return 'bg-slate-500/20 text-slate-300';
};
