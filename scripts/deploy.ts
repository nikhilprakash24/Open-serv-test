import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy IndexToken
  console.log("📦 Deploying IndexToken...");
  const IndexToken = await ethers.getContractFactory("IndexToken");
  const indexToken = await IndexToken.deploy(
    "AI Managed Index",
    "AIMIDX",
    200,  // 2% management fee
    2000  // 20% performance fee
  );
  await indexToken.waitForDeployment();
  const indexTokenAddress = await indexToken.getAddress();
  console.log("✅ IndexToken deployed to:", indexTokenAddress);

  // Deploy a reward token for staking pool (using the index token as reward token)
  console.log("\n📦 Deploying StakingPool...");
  const StakingPool = await ethers.getContractFactory("StakingPool");
  const stakingPool = await StakingPool.deploy(
    indexTokenAddress,              // Use index token as reward token
    ethers.parseEther("1"),         // 1 token per second reward rate
    1000,                           // 10% performance fee
    deployer.address                // Fee collector
  );
  await stakingPool.waitForDeployment();
  const stakingPoolAddress = await stakingPool.getAddress();
  console.log("✅ StakingPool deployed to:", stakingPoolAddress);

  // Deploy mock tokens for testing
  console.log("\n📦 Deploying mock tokens for testing...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const tokenA = await MockERC20.deploy("Mock Token A", "MTKA", 18);
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("✅ Token A deployed to:", tokenAAddress);

  const tokenB = await MockERC20.deploy("Mock Token B", "MTKB", 18);
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("✅ Token B deployed to:", tokenBAddress);

  const tokenC = await MockERC20.deploy("Mock Token C", "MTKC", 18);
  await tokenC.waitForDeployment();
  const tokenCAddress = await tokenC.getAddress();
  console.log("✅ Token C deployed to:", tokenCAddress);

  // Set up IndexToken with initial assets
  console.log("\n⚙️  Configuring IndexToken...");
  await indexToken.addAsset(tokenAAddress, 5000); // 50%
  console.log("✅ Added Token A with 50% weight");

  await indexToken.addAsset(tokenBAddress, 3000); // 30%
  console.log("✅ Added Token B with 30% weight");

  await indexToken.addAsset(tokenCAddress, 2000); // 20%
  console.log("✅ Added Token C with 20% weight");

  // Create a staking pool
  console.log("\n⚙️  Creating staking pool...");
  const minStake = ethers.parseEther("10");
  const lockPeriod = 7 * 24 * 60 * 60; // 7 days
  await stakingPool.createPool(tokenAAddress, minStake, lockPeriod);
  console.log("✅ Created staking pool for Token A");

  // Mint some tokens to deployer for testing
  console.log("\n💎 Minting test tokens...");
  const mintAmount = ethers.parseEther("10000");
  await tokenA.mint(deployer.address, mintAmount);
  await tokenB.mint(deployer.address, mintAmount);
  await tokenC.mint(deployer.address, mintAmount);
  console.log("✅ Minted 10,000 of each token to deployer");

  // Mint index tokens by depositing underlying assets
  console.log("\n💰 Minting index tokens...");
  const depositAmount = ethers.parseEther("1000");
  await tokenA.approve(indexTokenAddress, depositAmount);
  await tokenB.approve(indexTokenAddress, ethers.parseEther("600"));
  await tokenC.approve(indexTokenAddress, ethers.parseEther("400"));

  await indexToken.mint([
    depositAmount,
    ethers.parseEther("600"),
    ethers.parseEther("400")
  ]);
  const indexBalance = await indexToken.balanceOf(deployer.address);
  console.log("✅ Minted", ethers.formatEther(indexBalance), "AIMIDX tokens");

  // Fund staking pool with reward tokens
  console.log("\n💰 Funding staking pool with rewards...");
  await indexToken.transfer(stakingPoolAddress, indexBalance / 2n);
  console.log("✅ Transferred", ethers.formatEther(indexBalance / 2n), "AIMIDX to staking pool");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("├─ IndexToken:      ", indexTokenAddress);
  console.log("├─ StakingPool:     ", stakingPoolAddress);
  console.log("├─ Mock Token A:    ", tokenAAddress);
  console.log("├─ Mock Token B:    ", tokenBAddress);
  console.log("└─ Mock Token C:    ", tokenCAddress);

  console.log("\n📊 Configuration:");
  console.log("├─ Index Composition:");
  console.log("│  ├─ Token A: 50%");
  console.log("│  ├─ Token B: 30%");
  console.log("│  └─ Token C: 20%");
  console.log("├─ Management Fee: 2%");
  console.log("├─ Performance Fee: 20%");
  console.log("├─ Staking Reward Rate: 1 token/second");
  console.log("└─ Staking Lock Period: 7 days");

  console.log("\n💡 Next Steps:");
  console.log("1. Verify contracts on Etherscan (if on public network)");
  console.log("2. Set up frontend with these addresses");
  console.log("3. Authorize AI agents for autonomous management");
  console.log("4. Start monitoring and analytics\n");

  // Save deployment addresses to file
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      indexToken: indexTokenAddress,
      stakingPool: stakingPoolAddress,
      mockTokenA: tokenAAddress,
      mockTokenB: tokenBAddress,
      mockTokenC: tokenCAddress,
    },
    configuration: {
      indexToken: {
        name: "AI Managed Index",
        symbol: "AIMIDX",
        managementFee: "2%",
        performanceFee: "20%",
        assets: [
          { token: tokenAAddress, weight: "50%" },
          { token: tokenBAddress, weight: "30%" },
          { token: tokenCAddress, weight: "20%" },
        ],
      },
      stakingPool: {
        rewardToken: indexTokenAddress,
        rewardRate: "1 token/second",
        performanceFee: "10%",
        pools: [
          {
            id: 1,
            stakingToken: tokenAAddress,
            minStake: "10",
            lockPeriod: "7 days",
          },
        ],
      },
    },
  };

  const fs = require("fs");
  const deploymentPath = "./deployments.json";
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to:", deploymentPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
