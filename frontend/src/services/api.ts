const API_BASE_URL = '/api';

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const buildHeaders = (options: RequestInit): Record<string, string> => {
  const token = localStorage.getItem('crm_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response: Response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Session invalide : token expiré, utilisateur supprimé, etc.
    if (response.status === 401 || (response.status === 404 && localStorage.getItem('crm_token'))) {
      localStorage.removeItem('crm_token');
    }
    throw new ApiError(
      data.error?.message || 'Une erreur est survenue lors de la requête API.',
      response.status,
      data.error?.details
    );
  }

  return data;
};

export const apiFetch = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: buildHeaders(options),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await handleResponse(response);
  return data.data as T;
};

/** Pour les endpoints paginés retournant { data, pagination } à la racine. */
export const apiFetchPaginated = async <T>(endpoint: string, options: RequestInit = {}): Promise<PaginatedResult<T>> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: buildHeaders(options),
  });

  const data = await handleResponse(response);
  return {
    data: data.data as T[],
    pagination: data.pagination,
  };
};
