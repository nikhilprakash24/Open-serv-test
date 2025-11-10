import { Activity, Wallet } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Open Serv</h1>
              <p className="text-sm text-gray-400">AI-Managed DeFi Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Sepolia Testnet</span>
            </div>

            <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
              <Wallet className="h-5 w-5 text-white" />
              <span className="text-white font-medium">Connect Wallet</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
