import React, { useState } from 'react';
import { useJobFlowStore } from '../store';
import { syncJobsToSheets } from '../scripts/sheets';

export const Settings: React.FC = () => {
  const { config, setConfig, jobs } = useJobFlowStore();
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Zustand persists automatically, but we could add validation here
    alert('Settings Saved');
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Syncing...');
    try {
      const result = await syncJobsToSheets(jobs, config.sheets.spreadsheetId);
      setSyncStatus(result.message);
    } catch (e: any) {
      setSyncStatus(`Error: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-indigo-600">Configuration</h1>
            <a href="index.html?view=dashboard" className="text-sm text-gray-500 hover:text-indigo-600">Back to Dashboard</a>
        </header>

        <form onSubmit={handleSave} className="p-6 space-y-8">
            
            {/* Profile Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold border-b pb-2 text-gray-700">Profile</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input 
                            type="text" 
                            className="mt-1 w-full border rounded-md p-2"
                            value={config.profile.fullName}
                            onChange={(e) => setConfig({ profile: { ...config.profile, fullName: e.target.value }})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input 
                            type="email" 
                            className="mt-1 w-full border rounded-md p-2"
                            value={config.profile.email}
                            onChange={(e) => setConfig({ profile: { ...config.profile, email: e.target.value }})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input 
                            type="tel" 
                            className="mt-1 w-full border rounded-md p-2"
                            value={config.profile.phone}
                            onChange={(e) => setConfig({ profile: { ...config.profile, phone: e.target.value }})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                        <input 
                            type="url" 
                            className="mt-1 w-full border rounded-md p-2"
                            value={config.profile.linkedinUrl}
                            onChange={(e) => setConfig({ profile: { ...config.profile, linkedinUrl: e.target.value }})}
                        />
                    </div>
                </div>
            </section>

            {/* Preferences Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold border-b pb-2 text-gray-700">Job Preferences</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Target Salary</label>
                        <input 
                            type="number" 
                            className="mt-1 w-full border rounded-md p-2"
                            value={config.preferences.salaryTarget}
                            onChange={(e) => setConfig({ preferences: { ...config.preferences, salaryTarget: parseInt(e.target.value) }})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Notice Period</label>
                        <input 
                            type="text" 
                            className="mt-1 w-full border rounded-md p-2"
                            value={config.preferences.noticePeriod}
                            onChange={(e) => setConfig({ preferences: { ...config.preferences, noticePeriod: e.target.value }})}
                        />
                    </div>
                    <div className="flex items-center pt-6">
                        <label className="flex items-center">
                            <input 
                                type="checkbox" 
                                className="mr-2 h-4 w-4"
                                checked={config.preferences.remote}
                                onChange={(e) => setConfig({ preferences: { ...config.preferences, remote: e.target.checked }})}
                            />
                            <span className="text-sm font-medium text-gray-700">Remote Only</span>
                        </label>
                    </div>
                </div>
            </section>

            {/* Integration Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold border-b pb-2 text-gray-700">Integrations</h2>
                
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">n8n Webhook Base URL</label>
                    <input 
                        type="url" 
                        className="w-full border rounded-md p-2"
                        value={config.n8n.webhookBaseUrl}
                        onChange={(e) => setConfig({ n8n: { ...config.n8n, webhookBaseUrl: e.target.value }})}
                    />
                </div>

                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Sheet ID</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border rounded-md p-2"
                            placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBkJ..."
                            value={config.sheets.spreadsheetId}
                            onChange={(e) => setConfig({ sheets: { ...config.sheets, spreadsheetId: e.target.value }})}
                        />
                        <button 
                            type="button" 
                            onClick={handleSync}
                            disabled={isSyncing || !config.sheets.spreadsheetId}
                            className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                    </div>
                    {syncStatus && <p className="text-sm mt-2 text-gray-600">{syncStatus}</p>}
                </div>
            </section>

        </form>
      </div>
    </div>
  );
};
