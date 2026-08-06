import { apiFetch, apiFetchPaginated } from './api';

export interface ContactOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  phone: string;
  email: string | null;
  tags: string | null;
  notes: string | null;
  ownerId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  owner: ContactOwner;
  deals?: ContactDeal[];
  calls?: any[];
  messages?: import('../types/messages.types').Message[];
}

export interface ContactDeal {
  id: string;
  title: string;
  value: number;
  stage: string;
  createdAt: string;
}

export interface ContactsResponse {
  data: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateContactData {
  firstName: string;
  lastName: string;
  company?: string;
  phone: string;
  email?: string;
  tags?: string[];
  notes?: string;
  ownerId?: string;
}

export type UpdateContactData = Partial<CreateContactData>;

export class ContactsService {
  static async getContacts(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ContactsResponse> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs}` : '';

    return apiFetchPaginated<Contact>(`/contacts${query}`);
  }

  static async getContact(id: string): Promise<Contact> {
    return apiFetch<Contact>(`/contacts/${id}`);
  }

  static async createContact(data: CreateContactData): Promise<Contact> {
    return apiFetch<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateContact(id: string, data: UpdateContactData): Promise<Contact> {
    return apiFetch<Contact>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteContact(id: string): Promise<void> {
    await apiFetch<void>(`/contacts/${id}`, { method: 'DELETE' });
  }

  /** NF-05 : télécharge l'export RGPD du contact (JSON). */
  static async downloadExport(id: string): Promise<void> {
    const token = localStorage.getItem('crm_token');
    const response = await fetch(`/api/contacts/${id}/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error?.message || 'Export impossible.');
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    const filename = disposition?.match(/filename="(.+)"/)?.[1] || `contact-${id}-export.json`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// Helper: parse tags JSON string → string array
export const parseTags = (tags: string | null): string[] => {
  if (!tags) return [];
  try { return JSON.parse(tags); } catch { return tags.split(',').map(t => t.trim()).filter(Boolean); }
};
