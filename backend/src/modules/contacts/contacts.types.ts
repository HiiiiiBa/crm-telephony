export interface CreateContactDTO {
  firstName: string;
  lastName: string;
  company?: string;
  phone: string;
  email?: string;
  tags?: string[];
  notes?: string;
  ownerId?: string;
}

export interface UpdateContactDTO {
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  email?: string;
  tags?: string[];
  notes?: string;
  ownerId?: string;
}

export interface ContactFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuthContext {
  userId: string;
  workspaceId: string;
  role: string;
}

export interface PaginatedContacts {
  data: ContactWithOwner[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ContactWithOwner {
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
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
