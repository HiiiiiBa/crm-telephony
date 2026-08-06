import { DealStage } from '../../types/enums.js';

export interface CreateDealDTO {
  title: string;
  value: number;
  stage?: DealStage;
  contactId: string;
  ownerId?: string;
}

export interface UpdateDealDTO {
  title?: string;
  value?: number;
  stage?: DealStage;
  contactId?: string;
  ownerId?: string;
}

export interface UpdateDealStageDTO {
  stage: DealStage;
}

export interface DealFilters {
  search?: string;
  stage?: DealStage;
  ownerId?: string;
  contactId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedDeals {
  data: DealWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DealStageStats {
  count: number;
  totalValue: number;
}

export type DealStatsMap = Record<DealStage, DealStageStats>;

export interface DealWithRelations {
  id: string;
  title: string;
  value: number;
  stage: string;
  contactId: string;
  ownerId: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AuthContext {
  userId: string;
  workspaceId: string;
  role: string;
}
