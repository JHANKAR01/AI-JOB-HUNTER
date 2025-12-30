import React from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './src/components/Dashboard';
import { SidePanel } from './src/components/SidePanel';
import './index.css'; // Assuming Tailwind/CSS is imported here in original boiler

const App: React.FC = () => {
  // Simple routing based on query params set in manifest.json
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');

  if (view === 'sidepanel') {
    return <SidePanel />;
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
