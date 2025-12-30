import React from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './src/components/Dashboard';
import { SidePanel } from './src/components/SidePanel';
import { Settings } from './src/components/Settings';
import './index.css';

const App: React.FC = () => {
  // Simple routing based on query params set in manifest.json
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');

  if (view === 'sidepanel') {
    return <SidePanel />;
  }
  
  if (view === 'settings') {
    return <Settings />;
  }
  
  // Default to Dashboard
  return <Dashboard />;
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
