import { TrendingUp, DollarSign, Users, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const tvlData = [
  { date: '10 Nov', value: 0 },
  { date: '11 Nov', value: 45000 },
  { date: '12 Nov', value: 52000 },
  { date: '13 Nov', value: 48000 },
  { date: '14 Nov', value: 67000 },
  { date: '15 Nov', value: 71000 },
  { date: 'Today', value: 82000 },
];

const portfolioData = [
  { name: 'Token A', value: 50, color: '#3b82f6' },
  { name: 'Token B', value: 30, color: '#8b5cf6' },
  { name: 'Token C', value: 20, color: '#ec4899' },
];

const stats = [
  { label: 'Total Value Locked', value: '$82,450', change: '+12.5%', icon: DollarSign, positive: true },
  { label: 'Total Users', value: '1,247', change: '+8.2%', icon: Users, positive: true },
  { label: 'Index Token NAV', value: '$1.08', change: '+8.0%', icon: TrendingUp, positive: true },
  { label: 'Active Agents', value: '5/5', change: '100%', icon: Activity, positive: true },
];

export function OverviewDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Platform Overview</h2>
        <p className="text-gray-400">Real-time metrics from your AI-managed DeFi platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-700/50 rounded-lg">
                  <Icon className="h-5 w-5 text-blue-400" />
                </div>
                <div className={`flex items-center space-x-1 text-sm ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.positive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TVL Chart */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4">Total Value Locked</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={tvlData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Portfolio Composition */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-xl font-bold text-white mb-4">Portfolio Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={portfolioData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {portfolioData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {portfolioData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-300">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold text-white mb-4">Recent AI Agent Activity</h3>
        <div className="space-y-3">
          {[
            { agent: 'Rebalancer Agent', action: 'Executed portfolio rebalance', time: '2 minutes ago', status: 'success' },
            { agent: 'Risk Manager', action: 'Updated position limits', time: '15 minutes ago', status: 'success' },
            { agent: 'Market Analyzer', action: 'Detected high volatility in Token B', time: '1 hour ago', status: 'warning' },
            { agent: 'Executor Agent', action: 'Completed 3 swap transactions', time: '2 hours ago', status: 'success' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700/30">
              <div className="flex items-center space-x-4">
                <div className={`h-2 w-2 rounded-full ${activity.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <div>
                  <p className="text-white font-medium">{activity.agent}</p>
                  <p className="text-sm text-gray-400">{activity.action}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
