import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { JobFlowState, Job, JobStatus, UserConfig } from './types';

declare var chrome: any;

// Custom Storage Adapter for Chrome Extension
const chromeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(name);
      return result[name] || null;
    }
    return localStorage.getItem(name); // Fallback for dev
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [name]: value });
    } else {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.remove(name);
    } else {
      localStorage.removeItem(name);
    }
  },
};

const DEFAULT_CONFIG: UserConfig = {
  profile: {
    fullName: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    portfolioUrl: ''
  },
  preferences: {
    noticePeriod: '2 weeks',
    salaryMin: 0,
    salaryTarget: 0,
    currency: 'USD',
    isNegotiable: true,
    locations: [],
    remote: true
  },
  n8n: {
    webhookBaseUrl: 'http://localhost:5678/webhook/'
  }
};

export const useJobFlowStore = create<JobFlowState>()(
  persist(
    (set) => ({
      jobs: {},
      config: DEFAULT_CONFIG,
      appState: {
        isLoading: false,
        activeJobId: null,
        lastSyncTimestamp: Date.now(),
        errorLog: []
      },

      addJob: (job: Job) => set((state) => ({
        jobs: { ...state.jobs, [job.id]: job }
      })),

      updateJobStatus: (id: string, status: JobStatus) => set((state) => {
        const job = state.jobs[id];
        if (!job) return state;
        return {
          jobs: {
            ...state.jobs,
            [id]: { ...job, status, updatedAt: Date.now() }
          }
        };
      }),

      setLoading: (loading: boolean) => set((state) => ({
        appState: { ...state.appState, isLoading: loading }
      })),

      setActiveJob: (id: string | null) => set((state) => ({
        appState: { ...state.appState, activeJobId: id }
      })),

      setConfig: (newConfig: Partial<UserConfig>) => set((state) => ({
        config: { ...state.config, ...newConfig }
      }))
    }),
    {
      name: 'jobflow-storage',
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);