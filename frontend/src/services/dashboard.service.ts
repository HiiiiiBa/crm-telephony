import { apiFetch } from './api';
import { DashboardData, DashboardQuery } from '../types/dashboard.types';

export class DashboardService {
  static async getDashboard(params?: DashboardQuery): Promise<DashboardData> {
    const qs = new URLSearchParams();
    if (params?.days) qs.set('days', String(params.days));
    if (params?.direction && params.direction !== 'ALL') qs.set('direction', params.direction);
    const query = qs.toString() ? `?${qs}` : '';
    return apiFetch<DashboardData>(`/dashboard${query}`);
  }

  static async downloadExport(params?: DashboardQuery): Promise<void> {
    const token = localStorage.getItem('crm_token');
    const qs = new URLSearchParams();
    if (params?.days) qs.set('days', String(params.days));
    if (params?.direction && params.direction !== 'ALL') qs.set('direction', params.direction);
    const query = qs.toString() ? `?${qs}` : '';

    const response = await fetch(`/api/dashboard/export${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error?.message || 'Export impossible.');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
