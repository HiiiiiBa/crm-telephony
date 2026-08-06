import { apiFetch, apiFetchPaginated } from './api';
import { Call, StartCallDto, CallStatus, CallsListParams } from '../types/calls.types';

export class CallsService {
  static async getCalls(params?: CallsListParams) {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.direction) qs.set('direction', params.direction);
    if (params?.status) qs.set('status', params.status);
    if (params?.agentId) qs.set('agentId', params.agentId);
    if (params?.contactId) qs.set('contactId', params.contactId);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs}` : '';
    return apiFetchPaginated<Call>(`/calls${query}`);
  }

  static async startCall(data: StartCallDto): Promise<Call> {
    return apiFetch<Call>('/calls', { method: 'POST', body: JSON.stringify(data) });
  }

  static async getCall(id: string): Promise<Call> {
    return apiFetch<Call>(`/calls/${id}`);
  }

  static async updateCallNote(id: string, note: string | null): Promise<Call> {
    return apiFetch<Call>(`/calls/${id}/note`, { method: 'PATCH', body: JSON.stringify({ note }) });
  }

  static async hangupCall(id: string): Promise<Call> {
    return apiFetch<Call>(`/calls/${id}/hangup`, { method: 'POST' });
  }

  static async muteCall(id: string): Promise<{ muted: boolean }> {
    return apiFetch<{ muted: boolean }>(`/calls/${id}/mute`, { method: 'POST' });
  }

  static async unmuteCall(id: string): Promise<{ muted: boolean }> {
    return apiFetch<{ muted: boolean }>(`/calls/${id}/unmute`, { method: 'POST' });
  }

  static async updateCallStatus(id: string, status: CallStatus): Promise<Call> {
    return apiFetch<Call>(`/calls/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }
}
