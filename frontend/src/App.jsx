import React, { useState } from 'react';
import InboxPage from './pages/InboxPage';
import Analytics from './components/analytics/AnalyticsPage'; // reuse earlier Analytics.jsx or lazy load

export default function App() {
  const [view, setView] = useState('inbox');
  return (
    <div>
      {view === 'inbox' && <InboxPage onSwitchView={setView} />}
      {view === 'analytics' && <Analytics onSwitchView={setView} />}
    </div>
  );
}
