import React, { useState } from 'react';
import { useJobFlowStore } from '../store';
import { QuickAddRequest, Job } from '../types';

declare var chrome: any;

export const Dashboard: React.FC = () => {
  const { jobs, config, appState } = useJobFlowStore();
  const [quickAddUrl, setQuickAddUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const jobsList = (Object.values(jobs) as Job[]).sort((a, b) => b.addedAt - a.addedAt);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddUrl) return;

    setIsProcessing(true);
    try {
      const message: QuickAddRequest = { type: 'QUICK_ADD_JOB', url: quickAddUrl };
      await chrome.runtime.sendMessage(message);
      setQuickAddUrl('');
      // Ideally, we'd show a success toast here
    } catch (error) {
      console.error('Quick Add Error', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-indigo-600 tracking-tight">JobFlow Mission Control</h1>
        <div className="text-sm text-gray-500">
          State: {appState.isLoading ? 'Syncing...' : 'Connected'}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8">
        
        {/* Left Column: Stats & Config */}
        <aside className="col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Analytics</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Discovered</span>
                <span className="font-medium">{jobsList.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Applied</span>
                <span className="font-medium">{jobsList.filter(j => j.status === 'APPLIED').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg ATS Score</span>
                <span className="font-medium text-green-600">85%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
             <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Profile Config</h2>
             <div className="text-sm space-y-2">
                <p><span className="text-gray-500">Target:</span> {config.preferences.currency} {config.preferences.salaryTarget}</p>
                <p><span className="text-gray-500">Notice:</span> {config.preferences.noticePeriod}</p>
                <p><span className="text-gray-500">Remote:</span> {config.preferences.remote ? 'Yes' : 'No'}</p>
             </div>
          </div>
        </aside>

        {/* Center Column: Job Queue */}
        <div className="col-span-9 space-y-6">
          
          {/* Quick Add Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-indigo-100">
            <h2 className="text-lg font-semibold mb-2">⚡ Quick Add</h2>
            <form onSubmit={handleQuickAdd} className="flex gap-4">
              <input 
                type="url" 
                placeholder="Paste LinkedIn, Indeed, or Career Page URL..." 
                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={quickAddUrl}
                onChange={(e) => setQuickAddUrl(e.target.value)}
                required
              />
              <button 
                type="submit" 
                disabled={isProcessing}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'Analyzing...' : 'Process Job'}
              </button>
            </form>
          </div>

          {/* Job Queue List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Job Queue</h3>
                <span className="text-xs font-medium bg-gray-200 px-2 py-1 rounded-full text-gray-600">{jobsList.length} Active</span>
             </div>
             
             {jobsList.length === 0 ? (
               <div className="p-12 text-center text-gray-400">
                 No jobs in queue. Use Quick Add or the Sidepanel to start.
               </div>
             ) : (
               <ul>
                 {jobsList.map(job => (
                   <li key={job.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                     <div className="px-6 py-4 flex items-center justify-between">
                       <div>
                         <h4 className="font-medium text-indigo-600 text-lg hover:underline cursor-pointer">{job.title}</h4>
                         <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                       </div>
                       <div className="flex items-center gap-4">
                         <div className="text-right">
                           <div className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded mb-1">ATS: {job.atsScore}%</div>
                           <span className="text-xs text-gray-400">{new Date(job.addedAt).toLocaleDateString()}</span>
                         </div>
                         <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                           job.status === 'NEW' ? 'bg-blue-100 text-blue-800' :
                           job.status === 'APPLIED' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                         }`}>
                           {job.status}
                         </div>
                       </div>
                     </div>
                   </li>
                 ))}
               </ul>
             )}
          </div>

        </div>
      </main>
    </div>
  );
};