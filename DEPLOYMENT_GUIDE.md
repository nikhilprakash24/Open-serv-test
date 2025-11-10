# Deployment Guide - Open Serv AI-Managed DeFi Platform

Complete guide for deploying the Open Serv platform to Sepolia testnet and running the dashboard.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Testing](#local-testing)
4. [Testnet Deployment](#testnet-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Contract Verification](#contract-verification)
7. [Post-Deployment](#post-deployment)

---

## Prerequisites

### Required Tools

- **Node.js**: v18+ ([Download](https://nodejs.org/))
- **npm**: v8+ (comes with Node.js)
- **Git**: Latest version
- **Metamask** or other Web3 wallet

### Required Accounts & API Keys

1. **Infura Account** (or other Ethereum RPC provider)
   - Sign up at https://infura.io
   - Create a new project
   - Copy the Sepolia endpoint URL

2. **Etherscan Account** (for contract verification)
   - Sign up at https://etherscan.io
   - Navigate to API Keys section
   - Create a new API key

3. **WalletConnect Project** (for frontend wallet connection)
   - Sign up at https://cloud.walletconnect.com
   - Create a new project
   - Copy the Project ID

4. **Test ETH on Sepolia**
   - Visit https://sepoliafaucet.com or https://faucet.sepolia.dev
   - Request test ETH (you'll need ~0.5 ETH for deployment)

---

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd Open-serv-test

# Install smart contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Network Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY

# Private Keys (NEVER COMMIT THESE!)
# Export from Metamask: Account Details > Export Private Key
PRIVATE_KEY=your_private_key_without_0x_prefix

# Etherscan API
ETHERSCAN_API_KEY=your_etherscan_api_key

# Gas Reporting (optional)
REPORT_GAS=false
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

⚠️ **SECURITY WARNING**: Never commit your `.env` file or share your private keys!

### 3. Configure Frontend

Update `frontend/src/wagmi.ts` with your WalletConnect Project ID:

```typescript
export const config = getDefaultConfig({
  appName: 'Open Serv AI-Managed DeFi',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Replace this
  chains: [sepolia, hardhat],
  ssr: false,
});
```

---

## Local Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run coverage

# Run with gas reporting
REPORT_GAS=true npm test
```

Expected output:
```
110 passing (3s)

Contract Coverage:
- IndexToken: 98.4%
- StakingPool: 97.8%
- RewardSilo: 96.5%
```

### Local Deployment

Test deployment on local Hardhat network:

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.ts --network localhost
```

This creates `deployments.json` with contract addresses.

### Start Frontend Locally

```bash
cd frontend
npm run dev
```

Dashboard available at: http://localhost:3000

---

## Testnet Deployment

### Step 1: Compile Contracts

```bash
npm run compile
```

Verify contract sizes are within limits:
```
✓ IndexToken: 7.825 KiB
✓ StakingPool: 7.313 KiB
✓ RewardSilo: 6.765 KiB
```

### Step 2: Verify Environment

Check your configuration:

```bash
# Verify Sepolia RPC connection
npx hardhat run --network sepolia scripts/check-connection.js

# Check deployer balance (need ~0.5 ETH)
npx hardhat run --network sepolia scripts/check-balance.js
```

### Step 3: Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

Expected output:
```
🚀 Starting deployment...

📝 Deploying contracts with account: 0x...
💰 Account balance: 0.5 ETH

📦 Deploying IndexToken...
✅ IndexToken deployed to: 0x...

📦 Deploying StakingPool...
✅ StakingPool deployed to: 0x...

📦 Deploying RewardSilo...
✅ RewardSilo deployed to: 0x...

📦 Deploying mock tokens for testing...
✅ Token A deployed to: 0x...
✅ Token B deployed to: 0x...
✅ Token C deployed to: 0x...

⚙️  Configuring IndexToken...
⚙️  Creating staking pool...
💰 Funding staking pool with rewards...
⚙️  Configuring RewardSilo...

============================================================
🎉 DEPLOYMENT COMPLETE!
============================================================

📄 Deployment info saved to: ./deployments.json
```

### Step 4: Save Deployment Addresses

The deployment script automatically saves addresses to `deployments.json`:

```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "contracts": {
    "indexToken": "0x...",
    "stakingPool": "0x...",
    "rewardSilo": "0x...",
    "mockTokenA": "0x...",
    "mockTokenB": "0x...",
    "mockTokenC": "0x..."
  }
}
```

---

## Contract Verification

Verify contracts on Etherscan for transparency:

```bash
# Verify all contracts
npx hardhat run scripts/verify.ts --network sepolia
```

Or verify individually:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

Example:
```bash
npx hardhat verify --network sepolia 0x123... "AI Managed Index" "AIMIDX" 200 2000
```

After verification, contracts will be viewable on Sepolia Etherscan with source code.

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy frontend:
```bash
cd frontend
vercel
```

3. Set environment variables in Vercel dashboard:
   - `VITE_WALLETCONNECT_PROJECT_ID`

### Option 2: Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

### Option 3: Traditional Hosting

```bash
cd frontend
npm run build
```

Upload the `dist/` folder to your hosting provider.

---

## Post-Deployment

### 1. Update Frontend Contract Addresses

Create `frontend/src/contracts.ts`:

```typescript
export const contracts = {
  indexToken: {
    address: '0x...', // From deployments.json
    abi: [], // Import from artifacts
  },
  stakingPool: {
    address: '0x...',
    abi: [],
  },
  rewardSilo: {
    address: '0x...',
    abi: [],
  },
} as const;
```

### 2. Test Frontend Connection

1. Visit your deployed dashboard
2. Click "Connect Wallet"
3. Connect Metamask to Sepolia
4. Verify contract interactions work

### 3. Authorize AI Agents

```bash
# Authorize agent addresses for autonomous management
npx hardhat run scripts/authorize-agents.ts --network sepolia
```

### 4. Fund Reward Silos

To enable staking rewards:

```bash
npx hardhat run scripts/fund-silos.ts --network sepolia
```

### 5. Monitor Contracts

- **Sepolia Etherscan**: https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS>
- **Dashboard**: Your deployed frontend URL
- **Logs**: Check Hardhat/Ethers.js logs for transactions

---

## Troubleshooting

### Deployment Fails

**Error**: `insufficient funds for gas`
- **Solution**: Request more test ETH from faucet

**Error**: `nonce too low`
- **Solution**: Wait for pending transactions or reset Metamask account

**Error**: `Contract size exceeds 24kb`
- **Solution**: Enable `viaIR` compiler optimization in `hardhat.config.ts`

### Frontend Issues

**Wallet not connecting**
- Verify WalletConnect Project ID in `wagmi.ts`
- Check browser console for errors
- Try different wallet (MetaMask, WalletConnect, etc.)

**Contract calls failing**
- Verify you're on Sepolia network
- Check contract addresses in frontend config
- Ensure wallet has test ETH for gas

### Verification Fails

**Error**: `Already Verified`
- Contract is already verified, no action needed

**Error**: `Invalid API Key`
- Verify ETHERSCAN_API_KEY in `.env`

---

## Network Details

### Sepolia Testnet
- Chain ID: 11155111
- RPC: https://sepolia.infura.io/v3/YOUR_KEY
- Explorer: https://sepolia.etherscan.io
- Faucet: https://sepoliafaucet.com

### Contract Gas Estimates
- IndexToken deployment: ~2.5M gas (~0.025 ETH)
- StakingPool deployment: ~2.2M gas (~0.022 ETH)
- RewardSilo deployment: ~1.8M gas (~0.018 ETH)
- Total estimated: ~0.1 ETH (with buffer)

---

## Security Checklist

Before mainnet deployment:

- [ ] All tests passing (110/110)
- [ ] Smart contracts audited by professional firm
- [ ] Emergency pause mechanisms tested
- [ ] Timelocks configured for admin functions
- [ ] MultiSig wallet for contract ownership
- [ ] Rate limits on AI agent actions
- [ ] Circuit breakers for unusual activity
- [ ] Bug bounty program launched
- [ ] Comprehensive documentation published

---

## Next Steps

1. **Monitor Performance**: Track TVL, user activity, agent actions
2. **Gather Feedback**: Engage with testnet users
3. **Iterate**: Fix bugs, add features based on feedback
4. **Audit**: Complete professional security audit
5. **Mainnet**: Deploy to Ethereum mainnet

---

## Support

- **Documentation**: See README.md and ARCHITECTURE_PLAN.md
- **Issues**: Report bugs on GitHub
- **Community**: Join Discord/Telegram for discussions

---

## License

MIT License - See LICENSE file for details
