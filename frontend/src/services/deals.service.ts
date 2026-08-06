import { apiFetch, apiFetchPaginated } from './api';
import { Deal, DealStats, CreateDealDto, UpdateDealDto, DealStage } from '../types/deals.types';

export class DealsService {
  static async getDeals(params?: {
    search?: string;
    stage?: DealStage;
    ownerId?: string;
    contactId?: string;
    page?: number;
    limit?: number;
  }) {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.stage) qs.set('stage', params.stage);
    if (params?.ownerId) qs.set('ownerId', params.ownerId);
    if (params?.contactId) qs.set('contactId', params.contactId);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs}` : '';
    return apiFetchPaginated<Deal>(`/deals${query}`);
  }

  static async getDeal(id: string): Promise<Deal> {
    return apiFetch<Deal>(`/deals/${id}`);
  }

  static async getDealStats(): Promise<DealStats> {
    return apiFetch<DealStats>('/deals/stats');
  }

  static async createDeal(data: CreateDealDto): Promise<Deal> {
    return apiFetch<Deal>('/deals', { method: 'POST', body: JSON.stringify(data) });
  }

  static async updateDeal(id: string, data: UpdateDealDto): Promise<Deal> {
    return apiFetch<Deal>(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  static async updateDealStage(id: string, stage: DealStage): Promise<Deal> {
    return apiFetch<Deal>(`/deals/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) });
  }

  static async deleteDeal(id: string): Promise<void> {
    await apiFetch<void>(`/deals/${id}`, { method: 'DELETE' });
  }
}
