import { Bot, Activity, CheckCircle, AlertCircle, TrendingUp, Shield, Zap } from 'lucide-react';

const agents = [
  {
    id: 1,
    name: 'Market Analyzer',
    status: 'active',
    description: 'Real-time market analysis and trend detection',
    lastAction: 'Analyzed 156 data points',
    timeAgo: '30 seconds ago',
    confidence: 94,
    actions: 2847,
    icon: TrendingUp,
    color: 'blue'
  },
  {
    id: 2,
    name: 'Risk Manager',
    status: 'active',
    description: 'Portfolio risk assessment and mitigation',
    lastAction: 'Updated position limits',
    timeAgo: '2 minutes ago',
    confidence: 89,
    actions: 1523,
    icon: Shield,
    color: 'green'
  },
  {
    id: 3,
    name: 'Portfolio Rebalancer',
    status: 'active',
    description: 'Automatic portfolio rebalancing',
    lastAction: 'Executed rebalance (3 swaps)',
    timeAgo: '15 minutes ago',
    confidence: 92,
    actions: 456,
    icon: Activity,
    color: 'purple'
  },
  {
    id: 4,
    name: 'Execution Agent',
    status: 'active',
    description: 'Trade execution with MEV protection',
    lastAction: 'Completed swap: 0.05% slippage',
    timeAgo: '15 minutes ago',
    confidence: 96,
    actions: 1789,
    icon: Zap,
    color: 'yellow'
  },
  {
    id: 5,
    name: 'Monitoring Agent',
    status: 'active',
    description: 'System health and performance tracking',
    lastAction: 'Generated performance report',
    timeAgo: '1 hour ago',
    confidence: 98,
    actions: 8934,
    icon: CheckCircle,
    color: 'pink'
  },
];

const getColorClasses = (color: string) => {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/20 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/20',
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

export function AgentsDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">AI Agent System</h2>
        <p className="text-gray-400">Monitor and manage autonomous trading agents</p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <span className="text-gray-400 text-sm">System Health</span>
          </div>
          <p className="text-3xl font-bold text-white">100%</p>
          <p className="text-green-400 text-sm mt-1">All systems operational</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Bot className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-gray-400 text-sm">Active Agents</span>
          </div>
          <p className="text-3xl font-bold text-white">5/5</p>
          <p className="text-blue-400 text-sm mt-1">All agents active</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Activity className="h-5 w-5 text-purple-400" />
            </div>
            <span className="text-gray-400 text-sm">Total Actions</span>
          </div>
          <p className="text-3xl font-bold text-white">15,549</p>
          <p className="text-purple-400 text-sm mt-1">Since launch</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-400" />
            </div>
            <span className="text-gray-400 text-sm">Avg Confidence</span>
          </div>
          <p className="text-3xl font-bold text-white">93.8%</p>
          <p className="text-yellow-400 text-sm mt-1">High confidence</p>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const colorClasses = getColorClasses(agent.color);

          return (
            <div key={agent.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className={`p-3 rounded-lg ${colorClasses}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{agent.name}</h3>
                    <p className="text-gray-400 text-sm">{agent.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-semibold">{agent.status}</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400 text-sm">Last Action</span>
                  <span className="text-white font-medium text-sm">{agent.lastAction}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <span className="text-gray-400 text-sm">Updated</span>
                  <span className="text-gray-300 text-sm">{agent.timeAgo}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Confidence</span>
                    <span className="text-white font-semibold text-sm">{agent.confidence}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${agent.color === 'blue' ? 'bg-blue-500' : agent.color === 'green' ? 'bg-green-500' : agent.color === 'purple' ? 'bg-purple-500' : agent.color === 'yellow' ? 'bg-yellow-500' : 'bg-pink-500'}`}
                      style={{ width: `${agent.confidence}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Total Actions</span>
                    <span className="text-white font-semibold text-sm">{agent.actions.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${(agent.actions / 9000) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Insights */}
      <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/20">
        <div className="flex items-center space-x-3 mb-4">
          <Bot className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Recent Insights</h3>
        </div>
        <div className="space-y-3">
          {[
            { agent: 'Market Analyzer', insight: 'Detected bullish trend in Token A (+5.2% momentum)', severity: 'success' },
            { agent: 'Risk Manager', insight: 'Portfolio risk within acceptable range (VaR: 2.3%)', severity: 'success' },
            { agent: 'Rebalancer', insight: 'All assets within 1% of target weights', severity: 'success' },
            { agent: 'Execution Agent', insight: 'Average slippage: 0.04% (excellent)', severity: 'success' },
          ].map((item, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-900/50 rounded-lg">
              {item.severity === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-white font-medium text-sm">{item.agent}</p>
                <p className="text-gray-400 text-sm">{item.insight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
