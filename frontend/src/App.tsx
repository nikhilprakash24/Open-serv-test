import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

function App() {
  const [activeView, setActiveView] = useState<'overview' | 'index' | 'staking' | 'agents'>('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header />
      <div className="flex">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="flex-1 p-8">
          <Dashboard activeView={activeView} />
        </main>
      </div>
    </div>
  );
}

export default App;
