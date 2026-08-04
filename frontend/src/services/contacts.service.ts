import { apiFetch } from './api';

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
  deals?: any[];
  calls?: any[];
  messages?: any[];
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

    const result = await apiFetch<ContactsResponse & { data: Contact[]; pagination: any }>(`/contacts${query}`);
    return result as unknown as ContactsResponse;
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
}

// Helper: parse tags JSON string → string array
export const parseTags = (tags: string | null): string[] => {
  if (!tags) return [];
  try { return JSON.parse(tags); } catch { return tags.split(',').map(t => t.trim()).filter(Boolean); }
};
