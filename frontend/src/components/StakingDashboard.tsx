import { DollarSign, TrendingUp, Users, Clock } from 'lucide-react';

const stakingPools = [
  {
    id: 1,
    name: 'Token A Pool',
    token: 'MTKA',
    apr: 42.5,
    totalStaked: '$156,789',
    yourStake: '0',
    rewards: '0',
    lockPeriod: '7 days',
    status: 'active'
  },
  {
    id: 2,
    name: 'Token B Pool',
    token: 'MTKB',
    apr: 38.2,
    totalStaked: '$89,234',
    yourStake: '0',
    rewards: '0',
    lockPeriod: '14 days',
    status: 'active'
  },
  {
    id: 3,
    name: 'AIMIDX Pool',
    token: 'AIMIDX',
    apr: 56.8,
    totalStaked: '$234,567',
    yourStake: '0',
    rewards: '0',
    lockPeriod: '30 days',
    status: 'active'
  },
];

export function StakingDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Staking Pools</h2>
        <p className="text-gray-400">Stake tokens to earn passive rewards managed by AI</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <span className="text-gray-400 text-sm">Total Staked</span>
          </div>
          <p className="text-3xl font-bold text-white">$480.6K</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-gray-400 text-sm">Avg APR</span>
          </div>
          <p className="text-3xl font-bold text-white">45.8%</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <span className="text-gray-400 text-sm">Total Stakers</span>
          </div>
          <p className="text-3xl font-bold text-white">892</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-pink-500/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-pink-400" />
            </div>
            <span className="text-gray-400 text-sm">Your Rewards</span>
          </div>
          <p className="text-3xl font-bold text-white">$0</p>
        </div>
      </div>

      {/* Staking Pools */}
      <div className="space-y-4">
        {stakingPools.map((pool) => (
          <div key={pool.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-2xl font-bold text-white">{pool.name}</h3>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                    {pool.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-400">{pool.token}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {pool.apr}%
                </p>
                <p className="text-gray-400 text-sm">APR</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Staked</p>
                <p className="text-white font-semibold">{pool.totalStaked}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Your Stake</p>
                <p className="text-white font-semibold">${pool.yourStake}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Your Rewards</p>
                <p className="text-green-400 font-semibold">${pool.rewards}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Lock Period</p>
                <p className="text-white font-semibold flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{pool.lockPeriod}</span>
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all duration-200">
                Stake
              </button>
              <button className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-all duration-200">
                Unstake
              </button>
              <button className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg text-white font-semibold transition-all duration-200">
                Claim Rewards
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/20">
        <h3 className="text-lg font-bold text-white mb-2">How Staking Works</h3>
        <p className="text-gray-300 mb-4">
          Stake your tokens to earn rewards. AI agents optimize yield across multiple DeFi protocols, automatically compound rewards, and manage risk.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-blue-400 font-bold">1</span>
            </div>
            <div>
              <p className="text-white font-semibold">Stake Tokens</p>
              <p className="text-gray-400 text-sm">Lock tokens for the specified period</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-purple-400 font-bold">2</span>
            </div>
            <div>
              <p className="text-white font-semibold">Earn Rewards</p>
              <p className="text-gray-400 text-sm">AI agents optimize your yield</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
              <span className="text-pink-400 font-bold">3</span>
            </div>
            <div>
              <p className="text-white font-semibold">Claim & Compound</p>
              <p className="text-gray-400 text-sm">Withdraw or reinvest rewards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
