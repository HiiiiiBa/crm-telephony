import { CallDirection, CallStatus } from '../../types/enums.js';

export interface StartCallDTO {
  phoneNumber: string;
  contactId?: string;
}

export interface UpdateCallStatusDTO {
  status: CallStatus;
}

export interface UpdateCallNoteDTO {
  note?: string | null;
}

export interface CallFilters {
  search?: string;
  direction?: CallDirection;
  status?: CallStatus;
  agentId?: string;
  contactId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedCalls {
  data: CallWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CallWithRelations {
  id: string;
  callerNumber: string;
  calledNumber: string;
  direction: string;
  status: string;
  duration: number;
  agentId: string;
  contactId: string | null;
  workspaceId: string;
  startedAt: Date | null;
  endedAt: Date | null;
  note: string | null;
  recordingUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  agent: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    company: string | null;
  } | null;
}

export interface AuthContext {
  userId: string;
  workspaceId: string;
  role: string;
}
