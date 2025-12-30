import React, { useState } from 'react';
import { useJobFlowStore } from '../store';
import { TriggerAutofillRequest } from '../types';

declare var chrome: any;

export const SidePanel: React.FC = () => {
  const { appState, jobs, config } = useJobFlowStore();
  const activeJob = appState.activeJobId ? jobs[appState.activeJobId] : null;
  const [isAutofilling, setIsAutofilling] = useState(false);

  const openDashboard = () => {
    chrome.tabs.create({ url: 'index.html?view=dashboard' });
  };

  const handleAutofill = async () => {
    setIsAutofilling(true);
    try {
        const msg: TriggerAutofillRequest = {
            type: 'TRIGGER_AUTOFILL',
            profile: config.profile,
            preferences: config.preferences
        };
        await chrome.runtime.sendMessage(msg);
    } catch (e) {
        console.error("Autofill failed", e);
    } finally {
        // Short timeout to reset UI state
        setTimeout(() => setIsAutofilling(false), 2000);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900 font-sans">
      <header className="px-4 py-3 border-b border-gray-200 flex justify-between items-center shadow-sm">
        <h1 className="font-bold text-indigo-600">JobFlow Pilot</h1>
        <button onClick={openDashboard} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
          Dashboard ↗
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {!activeJob ? (
          <div className="text-center py-10 space-y-4">
            <div className="text-4xl">👋</div>
            <p className="text-gray-500 text-sm">
              Navigate to a job post to activate the Pilot or select a job from the Dashboard.
            </p>
            <button className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-md text-sm font-medium border border-indigo-100 hover:bg-indigo-100">
              Scan Current Page
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-l-4 border-indigo-500 pl-3">
              <h2 className="font-bold text-lg leading-tight">{activeJob.title}</h2>
              <p className="text-sm text-gray-600">{activeJob.company}</p>
            </div>

            {/* Status Card */}
            <div className="bg-gray-50 p-3 rounded border border-gray-200 flex justify-between items-center">
              <span className="text-xs font-semibold uppercase text-gray-500">Status</span>
              <span className="text-sm font-bold text-indigo-700">{activeJob.status}</span>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button 
                onClick={handleAutofill}
                disabled={isAutofilling}
                className="w-full bg-indigo-600 text-white py-2 rounded shadow-sm hover:bg-indigo-700 transition font-medium disabled:opacity-70 flex justify-center items-center"
              >
                {isAutofilling ? 'Filing...' : 'Auto-Fill Application'}
              </button>
              <button className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 font-medium">
                Regenerate Resume
              </button>
            </div>
            
            {/* Insights */}
            <div className="bg-yellow-50 p-3 rounded border border-yellow-100 text-sm text-yellow-800">
               <strong>ATS Insight:</strong> Your resume is missing 3 key terms found in this JD.
            </div>
          </div>
        )}
      </main>

      <footer className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-center text-gray-400">
        JobFlow Local • Secure
      </footer>
    </div>
  );
};
