import { Session, Participant, User } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Get auth token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || `HTTP error! status: ${response.status}`,
      response.status,
      errorData.details
    );
  }

  return response.json();
}

// Sessions API
export const sessionsApi = {
  getAll: async (status?: string): Promise<Session[]> => {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return request<Session[]>(`/sessions${query}`);
  },

  getUpcoming: async (): Promise<Session[]> => {
    return request<Session[]>('/sessions/upcoming');
  },

  getCompleted: async (): Promise<Session[]> => {
    return request<Session[]>('/sessions/completed');
  },

  getById: async (id: string): Promise<Session> => {
    return request<Session>(`/sessions/${id}`);
  },

  create: async (data: {
    date: string;
    registrationStartTime: string;
    startTime: string;
    endTime?: string;
    closingMinutes?: number;
    comments?: string;
  }): Promise<Session> => {
    return request<Session>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    comments?: string;
    status?: Session['status'];
  }): Promise<Session> => {
    return request<Session>(`/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    await request(`/sessions/${id}`, {
      method: 'DELETE',
    });
  },

  getParticipants: async (sessionId: string): Promise<Participant[]> => {
    return request<Participant[]>(`/sessions/${sessionId}/participants`);
  },
};

// Participants API
export const participantsApi = {
  getAll: async (sessionId?: string): Promise<Participant[]> => {
    const query = sessionId ? `?sessionId=${sessionId}` : '';
    return request<Participant[]>(`/participants${query}`);
  },

  getById: async (id: string): Promise<Participant> => {
    return request<Participant>(`/participants/${id}`);
  },

  create: async (data: {
    sessionId: string;
    name: string;
    validationCode: string;
  }): Promise<Participant> => {
    return request<Participant>('/participants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    isValid?: boolean | null;
  }): Promise<Participant> => {
    return request<Participant>(`/participants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    await request(`/participants/${id}`, {
      method: 'DELETE',
    });
  },
};

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
    return request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register: async (username: string, password: string, name: string): Promise<{ token: string; user: User }> => {
    return request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name }),
    });
  },

  getMe: async (): Promise<User> => {
    return request<User>('/auth/me');
  },

  createDispatcher: async (username: string, password: string, name: string): Promise<User & { password: string }> => {
    return request<User & { password: string }>('/auth/dispatchers', {
      method: 'POST',
      body: JSON.stringify({ username, password, name }),
    });
  },

  getDispatchers: async (): Promise<User[]> => {
    return request<User[]>('/auth/dispatchers');
  },
};
