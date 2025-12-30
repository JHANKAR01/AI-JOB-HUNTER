export type JobStatus = 'NEW' | 'ANALYZING' | 'READY' | 'APPLIED' | 'REJECTED' | 'INTERVIEW';

export interface Job {
  id: string;
  url: string;
  company: string;
  title: string;
  location: string;
  source: string;
  addedAt: number;
  updatedAt: number;
  
  // Analysis Data
  rawDescription: string;
  summary: string;
  atsScore: number;
  keywords: string[];
  
  // Application State
  status: JobStatus;
  resumePath?: string;
  notes: string;
}

export interface UserConfig {
  profile: {
    fullName: string;
    email: string;
    phone: string;
    linkedinUrl: string;
    portfolioUrl: string;
    // Basic array structure for experience/education to support resume gen
    experience: any[];
    education: any[];
    skills: string[];
  };
  preferences: {
    noticePeriod: string;
    salaryMin: number;
    salaryTarget: number;
    currency: string;
    isNegotiable: boolean;
    locations: string[];
    remote: boolean;
  };
  n8n: {
    webhookBaseUrl: string;
  };
  sheets: {
    spreadsheetId: string;
    autoSync: boolean;
    lastSync: number;
  };
}

export interface AppState {
  isLoading: boolean;
  activeJobId: string | null;
  lastSyncTimestamp: number;
  errorLog: Array<{ timestamp: number; message: string; code: string }>;
}

export interface JobFlowState {
  jobs: Record<string, Job>;
  config: UserConfig;
  appState: AppState;
  
  addJob: (job: Job) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;
  setLoading: (loading: boolean) => void;
  setActiveJob: (id: string | null) => void;
  setConfig: (config: Partial<UserConfig>) => void;
}

// Messaging Types
export type MessageType = 'QUICK_ADD_JOB' | 'OPEN_DASHBOARD' | 'STATE_UPDATED' | 'TRIGGER_AUTOFILL' | 'DOWNLOAD_RESUME';

export interface QuickAddRequest {
  type: 'QUICK_ADD_JOB';
  url: string;
}

export interface TriggerAutofillRequest {
  type: 'TRIGGER_AUTOFILL';
  profile: UserConfig['profile'];
  preferences: UserConfig['preferences'];
}

export interface DownloadResumeRequest {
  type: 'DOWNLOAD_RESUME';
  dataUrl: string;
  filename: string;
}
