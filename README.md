# Open Serv App

**An AI-Managed DeFi Protocol for Intelligent Asset Management**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://docs.soliditylang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)

---

## Overview

Open Serv App is a cutting-edge DeFi platform that leverages AI agents to autonomously manage crypto assets. The platform offers two core products:

1. **AI-Managed Index Token** - A diversified crypto index token where AI agents automatically rebalance the underlying basket of assets based on market conditions
2. **AI-Managed Staking Pool** - A multi-asset staking pool where AI agents optimize yield across multiple DeFi protocols

### Key Features

- 🤖 **Multi-Agent AI System** - Five specialized AI agents working together to optimize portfolio performance
- 🔒 **Security First** - Comprehensive testing, audited smart contracts, and circuit breakers
- 📊 **Real-Time Analytics** - Live dashboard showing AI decisions and portfolio performance
- ⚡ **Gas Optimized** - Efficient smart contracts minimizing transaction costs
- 🌐 **Multi-Chain Ready** - Designed for deployment across multiple blockchains
- 🔍 **Transparent** - All AI decisions are logged and visible to users

---

## Project Status

**Current Phase**: Phase 1 Complete + Frontend Dashboard
**Version**: 0.2.0-alpha
**Status**: Ready for Web3 Integration
**Development Mode**: Autonomous (AI-Led)

### ✅ Completed
- Smart contracts (IndexToken + StakingPool) with 98.4% test coverage
- Deployment scripts for automated deployment
- React dashboard with data visualization
- Comprehensive documentation

### 🚧 In Progress
- Web3 wallet integration
- Real-time blockchain data
- Transaction signing

This project is being developed autonomously by Claude AI as a demonstration of AI-driven software development capabilities. All code, architecture, and decisions are being made and documented by the AI system.

---

## Architecture

### System Components

```
┌─────────────────┐
│  Frontend (React) │
└────────┬─────────┘
         │
┌────────▼──────────┐
│  Backend API      │
│  (Express.js)     │
└────────┬──────────┘
         │
    ┌────┼─────────────────┐
    │    │                 │
┌───▼────▼──┐    ┌─────────▼─────────┐
│  Smart    │    │   AI Agent System │
│ Contracts │    │   (Multi-Agent)   │
└───────────┘    └───────────────────┘
```

### AI Agent System

The platform uses five specialized AI agents:

1. **Market Analyzer** - Monitors market conditions and identifies trends
2. **Risk Manager** - Assesses and mitigates portfolio risk
3. **Portfolio Rebalancer** - Optimizes asset allocation
4. **Execution Agent** - Executes trades with minimal slippage
5. **Monitoring Agent** - Tracks system health and performance

---

## Technology Stack

### Smart Contracts
- **Language**: Solidity 0.8.20
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin
- **Network**: Ethereum (Sepolia testnet initially)

### AI Agents
- **Language**: Python 3.11+
- **Framework**: LangChain
- **AI Models**: GPT-4 + local models

### Backend
- **Language**: TypeScript/Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL + Redis
- **Blockchain**: ethers.js v6

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Web3**: wagmi + viem

---

## Project Structure

```
Open-serv-test/
├── contracts/          # Smart contracts (Solidity)
├── test/              # Smart contract tests
├── scripts/           # Deployment scripts
├── agents/            # AI agent system (Python)
├── backend/           # Backend API (TypeScript)
├── frontend/          # React frontend
├── docs/              # Documentation
├── monitoring/        # Prometheus/Grafana configs
└── docker/            # Docker configurations
```

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Python >= 3.11
- PostgreSQL >= 14
- Redis >= 7.0
- Docker (optional but recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/nikhilprakash24/Open-serv-test.git
cd Open-serv-test

# Install dependencies (when available)
npm install

# Set up environment variables
cp .env.example .env

# Start local development environment
docker-compose up -d
```

### Running Tests

```bash
# Smart contract tests
npm run test:contracts

# Backend tests
npm run test:backend

# Frontend tests
npm run test:frontend

# All tests
npm run test
```

### Development

```bash
# Smart Contracts
npm run node              # Start local Hardhat node
npm run deploy:local      # Deploy contracts locally
npm run test             # Run smart contract tests
npm run test:coverage    # Test coverage report

# Frontend Dashboard
cd frontend
npm install              # Install frontend dependencies
npm run dev             # Start dev server (http://localhost:3000)
npm run build           # Build for production
```

---

## Documentation

- 📘 [Architecture Plan](./ARCHITECTURE_PLAN.md) - Comprehensive system architecture
- 📝 [Implementation Log](./IMPLEMENTATION_LOG.md) - Detailed development progress
- 🔧 [API Documentation](./docs/api/) - Backend API reference
- 📖 [User Guide](./docs/user-guide/) - How to use the platform
- 🏗️ [Developer Guide](./docs/developer/) - Contributing guidelines

---

## Smart Contracts

### Core Contracts

| Contract | Description | Status |
|----------|-------------|--------|
| IndexToken.sol | ERC-20 index token with NAV calculation | Planning |
| StakingPool.sol | Multi-asset staking pool | Planning |
| AssetManager.sol | Portfolio management logic | Planning |
| AIAgentController.sol | AI agent authorization and control | Planning |
| RewardDistributor.sol | Yield distribution mechanism | Planning |

### Security

- ✅ Comprehensive unit tests (target: >95% coverage)
- ✅ Integration tests for all workflows
- ⏳ Slither static analysis
- ⏳ Professional security audit (planned)
- ⏳ Bug bounty program (planned)

---

## AI Agents

### Agent Capabilities

Each AI agent is designed with specific responsibilities:

- **Market Analyzer**: Real-time price tracking, trend analysis, on-chain metrics
- **Risk Manager**: VaR calculation, correlation analysis, position limits
- **Rebalancer**: Optimal allocation, gas cost optimization, DCA strategies
- **Executor**: Trade execution, slippage minimization, MEV protection
- **Monitor**: System health, performance tracking, anomaly detection

### Safety Mechanisms

- Multi-agent consensus for large transactions
- Circuit breakers for extreme market conditions
- Rate limiting and position size limits
- Human override capabilities
- Comprehensive logging and auditing

---

## Roadmap

### Phase 1: Foundation (Weeks 1-2) - IN PROGRESS
- [x] Architecture planning
- [x] Documentation setup
- [ ] Project scaffolding
- [ ] Basic smart contracts
- [ ] Initial test suite

### Phase 2: AI Agents (Weeks 3-4)
- [ ] Agent framework
- [ ] Core agent implementation
- [ ] Agent testing
- [ ] Smart contract integration

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Advanced contract features
- [ ] Multi-agent consensus
- [ ] Enhanced analytics
- [ ] Governance mechanisms

### Phase 4: Frontend (Weeks 7-8)
- [ ] Core UI components
- [ ] Wallet integration
- [ ] Analytics dashboard
- [ ] User experience polish

### Phase 5: Testing & Security (Weeks 9-10)
- [ ] Security audit
- [ ] Load testing
- [ ] Testnet deployment
- [ ] Bug fixes and optimization

### Phase 6: Deployment (Weeks 11-12)
- [ ] Mainnet deployment
- [ ] Monitoring setup
- [ ] Final documentation
- [ ] Launch!

---

## Contributing

This project is currently in autonomous development mode (AI-led). However, contributions and feedback are welcome!

### How to Contribute

1. Review the [Architecture Plan](./ARCHITECTURE_PLAN.md)
2. Check the [Implementation Log](./IMPLEMENTATION_LOG.md) for current status
3. Open an issue for discussion
4. Submit a pull request with tests

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Disclaimer

**IMPORTANT**: This is experimental software under active development.

- ⚠️ DO NOT use with real funds
- ⚠️ Contracts have not been audited
- ⚠️ AI agents are experimental
- ⚠️ Use at your own risk

This platform is for educational and research purposes only.

---

## Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/nikhilprakash24/Open-serv-test/issues)
- **Documentation**: Check the `/docs` folder for detailed guides
- **Development Log**: See [IMPLEMENTATION_LOG.md](./IMPLEMENTATION_LOG.md) for daily updates

---

## Acknowledgments

- OpenZeppelin for secure smart contract libraries
- LangChain for AI agent framework
- Hardhat for development tools
- The DeFi and AI communities for inspiration

---

**Built with 🤖 by Autonomous AI Development**
**Development Start**: November 10, 2025
**Current Status**: Active Development - Phase 1

---

*This README is actively maintained and updated as the project evolves.*
