import api from './api';

export interface BugReport {
  id: number;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  platform: string;
  title: string;
  description: string;
  error_type?: string;
  stack_trace?: string;
  device_info?: string;
  app_version?: string;
  os_version?: string;
  status: 'open' | 'investigating' | 'fixed' | 'resolved' | 'closed';
  resolved_by?: number;
  resolved_by_user?: {
    id: number;
    name: string;
    email: string;
  };
  resolved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BugReportsResponse {
  data: BugReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UpdateBugReportData {
  status?: 'open' | 'investigating' | 'fixed' | 'resolved' | 'closed';
  notes?: string;
}

export const bugsService = {
  getBugReports: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    platform?: string;
  }): Promise<BugReportsResponse> => {
    const { data } = await api.get<BugReportsResponse>('/bug-reports', { params });
    return data;
  },

  getBugReport: async (id: number): Promise<BugReport> => {
    const { data } = await api.get<BugReport>(`/bug-reports/${id}`);
    return data;
  },

  updateBugReport: async (id: number, updates: UpdateBugReportData): Promise<BugReport> => {
    const { data } = await api.put<BugReport>(`/bug-reports/${id}`, updates);
    return data;
  },

  deleteBugReport: async (id: number): Promise<void> => {
    await api.delete(`/bug-reports/${id}`);
  },
};

