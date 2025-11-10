import { OverviewDashboard } from './OverviewDashboard';
import { IndexTokenDashboard } from './IndexTokenDashboard';
import { StakingDashboard } from './StakingDashboard';
import { AgentsDashboard } from './AgentsDashboard';

interface DashboardProps {
  activeView: 'overview' | 'index' | 'staking' | 'agents';
}

export function Dashboard({ activeView }: DashboardProps) {
  switch (activeView) {
    case 'overview':
      return <OverviewDashboard />;
    case 'index':
      return <IndexTokenDashboard />;
    case 'staking':
      return <StakingDashboard />;
    case 'agents':
      return <AgentsDashboard />;
    default:
      return <OverviewDashboard />;
  }
}
