import api from './api';

export interface AuditLog {
  id: number;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  role?: string;
  action: string;
  endpoint: string;
  method: string;
  status_code: number;
  ip_address: string;
  user_agent: string;
  request_body?: string;
  response_body?: string;
  duration_ms: number;
  error_message?: string;
  created_at: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const auditLogsService = {
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    user_id?: string;
    endpoint?: string;
  }): Promise<AuditLogsResponse> => {
    const { data } = await api.get<AuditLogsResponse>('/audit-logs', { params });
    return data;
  },
};

