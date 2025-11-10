# Open Serv Dashboard

Beautiful, modern React dashboard for the AI-Managed DeFi Platform.

## Features

### 🎨 Modern UI
- Dark mode design with gradient accents
- Responsive layout for all screen sizes
- Smooth animations and transitions
- TailwindCSS for styling

### 📊 Data Visualization
- Real-time TVL and NAV charts
- Portfolio composition pie charts
- Asset breakdown with progress bars
- Agent activity monitoring

### 🔍 Dashboard Views

#### Overview
- Platform statistics (TVL, users, NAV, active agents)
- TVL growth chart
- Portfolio allocation visualization
- Recent AI agent activity feed

#### Index Token
- Current NAV and historical chart
- Total supply and assets
- Asset breakdown with target vs. actual weights
- Mint/burn token actions

#### Staking Pools
- Multiple staking pools with APR
- Total staked, your stake, and rewards
- Lock period information
- Stake/unstake/claim actions

#### AI Agents
- 5 specialized agents monitoring
- Real-time status and confidence levels
- Action history and insights
- System health metrics

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **wagmi** - Web3 integration (ready)
- **viem** - Ethereum interactions (ready)

## Getting Started

### Installation

\`\`\`bash
cd frontend
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

Dashboard will be available at http://localhost:3000

### Build

\`\`\`bash
npm run build
\`\`\`

### Preview Production Build

\`\`\`bash
npm run preview
\`\`\`

## Project Structure

\`\`\`
frontend/
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Top navigation bar
│   │   ├── Sidebar.tsx          # Side navigation
│   │   ├── Dashboard.tsx        # Main dashboard router
│   │   ├── OverviewDashboard.tsx    # Overview view
│   │   ├── IndexTokenDashboard.tsx  # Index token view
│   │   ├── StakingDashboard.tsx     # Staking pools view
│   │   └── AgentsDashboard.tsx      # AI agents view
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
\`\`\`

## Components

### Header
- Platform branding
- Network indicator (Sepolia Testnet)
- Wallet connect button

### Sidebar
- Navigation between views
- AI agent status indicator
- Active view highlighting

### Dashboards
Each dashboard view shows relevant metrics, charts, and actions:
- **Overview**: High-level platform metrics
- **Index Token**: Portfolio management
- **Staking**: Pool information and actions
- **AI Agents**: Agent monitoring and insights

## Next Steps

### Web3 Integration
- Connect with deployed smart contracts
- Implement wallet connection (RainbowKit)
- Real-time data from blockchain
- Transaction signing and submission

### Features to Add
- User portfolio tracking
- Transaction history
- Notifications/alerts
- Advanced charting
- Mobile optimization
- Dark/light mode toggle

## Design Philosophy

- **Data-Driven**: All visualizations based on real metrics
- **User-Centric**: Simple, intuitive interface
- **Performance**: Optimized rendering and lazy loading
- **Accessibility**: Semantic HTML and ARIA labels
- **Responsive**: Mobile-first design approach

## Contributing

The dashboard is designed to be easily extensible:
1. Add new dashboard views in `src/components/`
2. Update routing in `Dashboard.tsx`
3. Add navigation items in `Sidebar.tsx`
4. Use consistent styling with TailwindCSS

## License

MIT License - see root LICENSE file
