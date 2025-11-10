import { run } from "hardhat";

async function main() {
  console.log("🔍 Starting contract verification...\n");

  // Load deployment addresses
  const fs = require("fs");
  const deploymentPath = "./deployments.json";

  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ deployments.json not found. Please deploy contracts first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { contracts, configuration } = deployment;

  console.log("📋 Verifying contracts on network:", deployment.network);
  console.log("🔗 Chain ID:", deployment.chainId, "\n");

  // Verify IndexToken
  console.log("1️⃣  Verifying IndexToken...");
  try {
    await run("verify:verify", {
      address: contracts.indexToken,
      constructorArguments: [
        configuration.indexToken.name,
        configuration.indexToken.symbol,
        200,  // 2% management fee
        2000, // 20% performance fee
      ],
    });
    console.log("✅ IndexToken verified\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ IndexToken already verified\n");
    } else {
      console.error("❌ IndexToken verification failed:", error.message, "\n");
    }
  }

  // Verify StakingPool
  console.log("2️⃣  Verifying StakingPool...");
  try {
    await run("verify:verify", {
      address: contracts.stakingPool,
      constructorArguments: [
        contracts.indexToken,     // reward token
        "1000000000000000000",    // 1 token per second
        1000,                     // 10% performance fee
        deployment.deployer,      // fee collector
      ],
    });
    console.log("✅ StakingPool verified\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ StakingPool already verified\n");
    } else {
      console.error("❌ StakingPool verification failed:", error.message, "\n");
    }
  }

  // Verify Mock Tokens
  console.log("3️⃣  Verifying Mock Token A...");
  try {
    await run("verify:verify", {
      address: contracts.mockTokenA,
      constructorArguments: ["Mock Token A", "MTKA", 18],
    });
    console.log("✅ Mock Token A verified\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Mock Token A already verified\n");
    } else {
      console.error("❌ Mock Token A verification failed:", error.message, "\n");
    }
  }

  console.log("4️⃣  Verifying Mock Token B...");
  try {
    await run("verify:verify", {
      address: contracts.mockTokenB,
      constructorArguments: ["Mock Token B", "MTKB", 18],
    });
    console.log("✅ Mock Token B verified\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Mock Token B already verified\n");
    } else {
      console.error("❌ Mock Token B verification failed:", error.message, "\n");
    }
  }

  console.log("5️⃣  Verifying Mock Token C...");
  try {
    await run("verify:verify", {
      address: contracts.mockTokenC,
      constructorArguments: ["Mock Token C", "MTKC", 18],
    });
    console.log("✅ Mock Token C verified\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Mock Token C already verified\n");
    } else {
      console.error("❌ Mock Token C verification failed:", error.message, "\n");
    }
  }

  console.log("=".repeat(60));
  console.log("🎉 VERIFICATION COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n💡 View verified contracts on Etherscan:");
  console.log("IndexToken:   ", `https://etherscan.io/address/${contracts.indexToken}`);
  console.log("StakingPool:  ", `https://etherscan.io/address/${contracts.stakingPool}`);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:");
    console.error(error);
    process.exit(1);
  });
