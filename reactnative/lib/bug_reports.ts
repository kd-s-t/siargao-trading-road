import api from './api';
import { Platform } from 'react-native';

export interface BugReport {
  id: number;
  user_id?: number;
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
  resolved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBugReportData {
  platform: string;
  title: string;
  description: string;
  error_type?: string;
  stack_trace?: string;
  device_info?: string;
  app_version?: string;
  os_version?: string;
}

export const bugReportService = {
  create: async (data: CreateBugReportData): Promise<BugReport> => {
    const { data: bugReport } = await api.post<BugReport>('/bug-reports', data);
    return bugReport;
  },

  reportError: async (error: Error, title?: string): Promise<void> => {
    try {
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
      };

      await bugReportService.create({
        platform: Platform.OS,
        title: title || error.message || 'Unknown Error',
        description: error.message || 'An error occurred',
        error_type: error.name || 'Error',
        stack_trace: error.stack || '',
        device_info: JSON.stringify(deviceInfo),
        app_version: '1.0.0',
        os_version: Platform.Version.toString(),
      });
    } catch (err) {
      console.error('Failed to report bug:', err);
    }
  },
};

