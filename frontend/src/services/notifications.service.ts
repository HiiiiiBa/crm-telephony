import { ApiError } from './api';
import { AppNotification, NotificationsResponse } from '../types/notifications.types';

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('crm_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

const parseResponse = async (response: Response) => {
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(json.error?.message || 'Erreur notifications.', response.status);
  }
  return json;
};

export class NotificationsService {
  static async fetchAll(): Promise<NotificationsResponse> {
    const response = await fetch('/api/notifications', { headers: authHeaders() });
    const json = await parseResponse(response);
    return {
      items: (json.data ?? json.items) as AppNotification[],
      unreadCount: json.unreadCount ?? 0,
    };
  }

  static async markRead(id: string): Promise<AppNotification> {
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    const json = await parseResponse(response);
    return json.data as AppNotification;
  }

  static async markAllRead(): Promise<number> {
    const response = await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: authHeaders(),
    });
    const json = await parseResponse(response);
    return json.data?.count ?? 0;
  }
}
