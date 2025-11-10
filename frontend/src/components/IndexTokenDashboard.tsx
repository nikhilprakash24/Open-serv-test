import { TrendingUp, DollarSign, Layers, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const navHistory = [
  { date: '10 Nov', nav: 1.00 },
  { date: '11 Nov', nav: 1.02 },
  { date: '12 Nov', nav: 1.04 },
  { date: '13 Nov', nav: 1.03 },
  { date: '14 Nov', nav: 1.06 },
  { date: '15 Nov', nav: 1.07 },
  { date: 'Today', nav: 1.08 },
];

const assetBreakdown = [
  { asset: 'Token A', amount: '$41,000', weight: 50, target: 50 },
  { asset: 'Token B', amount: '$24,600', weight: 30, target: 30 },
  { asset: 'Token C', amount: '$16,400', weight: 20, target: 20 },
];

export function IndexTokenDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">AI-Managed Index Token</h2>
        <p className="text-gray-400">Track portfolio performance and composition</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-gray-400 text-sm">Current NAV</span>
          </div>
          <p className="text-3xl font-bold text-white">$1.08</p>
          <p className="text-green-400 text-sm mt-1">+8.0% all time</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Layers className="h-5 w-5 text-purple-400" />
            </div>
            <span className="text-gray-400 text-sm">Total Supply</span>
          </div>
          <p className="text-3xl font-bold text-white">76,389</p>
          <p className="text-gray-400 text-sm mt-1">AIMIDX tokens</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <span className="text-gray-400 text-sm">Total Assets</span>
          </div>
          <p className="text-3xl font-bold text-white">$82,450</p>
          <p className="text-green-400 text-sm mt-1">+12.5% this week</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-pink-500/20 rounded-lg">
              <PieChart className="h-5 w-5 text-pink-400" />
            </div>
            <span className="text-gray-400 text-sm">Management Fee</span>
          </div>
          <p className="text-3xl font-bold text-white">2%</p>
          <p className="text-gray-400 text-sm mt-1">Performance: 20%</p>
        </div>
      </div>

      {/* NAV History Chart */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold text-white mb-4">NAV History</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={navHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" domain={[0.98, 1.10]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Line type="monotone" dataKey="nav" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Asset Breakdown */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-xl font-bold text-white mb-4">Asset Breakdown</h3>
        <div className="space-y-4">
          {assetBreakdown.map((asset, index) => (
            <div key={index} className="p-4 bg-gray-900/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-white font-semibold">{asset.asset}</h4>
                  <p className="text-gray-400 text-sm">{asset.amount}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{asset.weight}%</p>
                  <p className="text-gray-400 text-sm">Target: {asset.target}%</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${asset.weight}%` }}
                  ></div>
                </div>
                <span className={`text-xs ${Math.abs(asset.weight - asset.target) < 1 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {asset.weight === asset.target ? '✓ Balanced' : `${Math.abs(asset.weight - asset.target)}% off`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/20">
          <h3 className="text-xl font-bold text-white mb-2">Mint Index Tokens</h3>
          <p className="text-gray-400 mb-4">Deposit underlying assets to mint AIMIDX tokens</p>
          <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all duration-200">
            Mint Tokens
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-xl font-bold text-white mb-2">Burn Index Tokens</h3>
          <p className="text-gray-400 mb-4">Burn AIMIDX to withdraw underlying assets</p>
          <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-semibold transition-all duration-200">
            Burn Tokens
          </button>
        </div>
      </div>
    </div>
  );
}
