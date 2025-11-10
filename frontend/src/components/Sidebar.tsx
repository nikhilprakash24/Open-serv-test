import { BarChart3, Layers, TrendingUp, Bot } from 'lucide-react';

interface SidebarProps {
  activeView: 'overview' | 'index' | 'staking' | 'agents';
  setActiveView: (view: 'overview' | 'index' | 'staking' | 'agents') => void;
}

const navItems = [
  { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
  { id: 'index' as const, label: 'Index Token', icon: Layers },
  { id: 'staking' as const, label: 'Staking Pools', icon: TrendingUp },
  { id: 'agents' as const, label: 'AI Agents', icon: Bot },
];

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-900/30 backdrop-blur-sm border-r border-gray-700/50 min-h-[calc(100vh-73px)]">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-8 px-4">
        <div className="p-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/20">
          <div className="flex items-center space-x-2 mb-2">
            <Bot className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400">AI Status</span>
          </div>
          <p className="text-xs text-gray-400">
            5 agents active • Last rebalance: 2m ago
          </p>
          <div className="mt-3 flex items-center space-x-1">
            <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
            <span className="text-xs text-gray-400">75%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
