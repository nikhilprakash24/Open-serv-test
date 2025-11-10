import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { IndexToken, MockERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("IndexToken", function () {
  // Test fixtures
  async function deployIndexTokenFixture() {
    const [owner, agent, user1, user2, user3] = await ethers.getSigners();

    // Deploy IndexToken
    const IndexToken = await ethers.getContractFactory("IndexToken");
    const indexToken = await IndexToken.deploy(
      "AI Index Token",
      "AIIDX",
      200, // 2% management fee
      2000 // 20% performance fee
    );

    // Deploy mock tokens for the index
    const MockERC20 = await ethers.getContractFactory("MockERC20");

    const tokenA = await MockERC20.deploy("Token A", "TKNA", 18);
    const tokenB = await MockERC20.deploy("Token B", "TKNB", 18);
    const tokenC = await MockERC20.deploy("Token C", "TKNC", 18);

    // Mint tokens to users for testing
    const mintAmount = ethers.parseEther("10000");
    await tokenA.mint(user1.address, mintAmount);
    await tokenB.mint(user1.address, mintAmount);
    await tokenC.mint(user1.address, mintAmount);

    await tokenA.mint(user2.address, mintAmount);
    await tokenB.mint(user2.address, mintAmount);
    await tokenC.mint(user2.address, mintAmount);

    return {
      indexToken,
      tokenA,
      tokenB,
      tokenC,
      owner,
      agent,
      user1,
      user2,
      user3,
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      const { indexToken, owner } = await loadFixture(deployIndexTokenFixture);

      expect(await indexToken.name()).to.equal("AI Index Token");
      expect(await indexToken.symbol()).to.equal("AIIDX");
      expect(await indexToken.owner()).to.equal(owner.address);
      expect(await indexToken.managementFee()).to.equal(200);
      expect(await indexToken.performanceFee()).to.equal(2000);
    });

    it("Should revert if management fee is too high", async function () {
      const IndexToken = await ethers.getContractFactory("IndexToken");
      await expect(
        IndexToken.deploy("AI Index", "AIIDX", 600, 2000) // 6% > max 5%
      ).to.be.reverted;
    });

    it("Should revert if performance fee is too high", async function () {
      const IndexToken = await ethers.getContractFactory("IndexToken");
      await expect(
        IndexToken.deploy("AI Index", "AIIDX", 200, 3100) // 31% > max 30%
      ).to.be.reverted;
    });
  });

  describe("Asset Management", function () {
    it("Should add an asset to the index", async function () {
      const { indexToken, tokenA } = await loadFixture(deployIndexTokenFixture);

      await expect(indexToken.addAsset(tokenA.target, 5000))
        .to.emit(indexToken, "AssetAdded")
        .withArgs(tokenA.target, 5000);

      const asset = await indexToken.assets(tokenA.target);
      expect(asset.isActive).to.be.true;
      expect(asset.targetWeight).to.equal(5000);
      expect(await indexToken.getAssetCount()).to.equal(1);
    });

    it("Should add multiple assets", async function () {
      const { indexToken, tokenA, tokenB, tokenC } = await loadFixture(
        deployIndexTokenFixture
      );

      await indexToken.addAsset(tokenA.target, 3000); // 30%
      await indexToken.addAsset(tokenB.target, 5000); // 50%
      await indexToken.addAsset(tokenC.target, 2000); // 20%

      expect(await indexToken.getAssetCount()).to.equal(3);

      const assetList = await indexToken.getAssetList();
      expect(assetList).to.have.lengthOf(3);
      expect(assetList[0]).to.equal(tokenA.target);
      expect(assetList[1]).to.equal(tokenB.target);
      expect(assetList[2]).to.equal(tokenC.target);
    });

    it("Should revert when adding duplicate asset", async function () {
      const { indexToken, tokenA } = await loadFixture(deployIndexTokenFixture);

      await indexToken.addAsset(tokenA.target, 5000);
      await expect(indexToken.addAsset(tokenA.target, 3000)).to.be.reverted;
    });

    it("Should revert when adding asset with zero weight", async function () {
      const { indexToken, tokenA } = await loadFixture(deployIndexTokenFixture);

      await expect(indexToken.addAsset(tokenA.target, 0)).to.be.reverted;
    });

    it("Should revert when adding asset with weight > 100%", async function () {
      const { indexToken, tokenA } = await loadFixture(deployIndexTokenFixture);

      await expect(indexToken.addAsset(tokenA.target, 10001)).to.be.reverted;
    });

    it("Should remove an asset from the index", async function () {
      const { indexToken, tokenA } = await loadFixture(deployIndexTokenFixture);

      await indexToken.addAsset(tokenA.target, 5000);

      await expect(indexToken.removeAsset(tokenA.target))
        .to.emit(indexToken, "AssetRemoved")
        .withArgs(tokenA.target);

      const asset = await indexToken.assets(tokenA.target);
      expect(asset.isActive).to.be.false;
      expect(await indexToken.getAssetCount()).to.equal(0);
    });

    it("Should update asset weight", async function () {
      const { indexToken, tokenA } = await loadFixture(deployIndexTokenFixture);

      await indexToken.addAsset(tokenA.target, 5000);

      await expect(indexToken.updateAssetWeight(tokenA.target, 7000))
        .to.emit(indexToken, "AssetWeightUpdated")
        .withArgs(tokenA.target, 5000, 7000);

      const asset = await indexToken.assets(tokenA.target);
      expect(asset.targetWeight).to.equal(7000);
    });

    it("Should revert when non-owner tries to add asset", async function () {
      const { indexToken, tokenA, user1 } = await loadFixture(
        deployIndexTokenFixture
      );

      await expect(
        indexToken.connect(user1).addAsset(tokenA.target, 5000)
      ).to.be.reverted;
    });
  });

  describe("Minting", function () {
    async function setupAssetsFixture() {
      const fixture = await deployIndexTokenFixture();
      const { indexToken, tokenA, tokenB, tokenC } = fixture;

      // Add assets to index
      await indexToken.addAsset(tokenA.target, 5000); // 50%
      await indexToken.addAsset(tokenB.target, 3000); // 30%
      await indexToken.addAsset(tokenC.target, 2000); // 20%

      return fixture;
    }

    it("Should mint index tokens on first deposit", async function () {
      const { indexToken, tokenA, tokenB, tokenC, user1 } = await loadFixture(
        setupAssetsFixture
      );

      const depositAmount = ethers.parseEther("100");

      // Approve tokens
      await tokenA.connect(user1).approve(indexToken.target, depositAmount);
      await tokenB.connect(user1).approve(indexToken.target, depositAmount);
      await tokenC.connect(user1).approve(indexToken.target, depositAmount);

      // Mint index tokens
      await expect(
        indexToken
          .connect(user1)
          .mint([depositAmount, depositAmount, depositAmount])
      ).to.emit(indexToken, "Minted");

      expect(await indexToken.balanceOf(user1.address)).to.equal(
        depositAmount * 3n
      );

      // Check NAV per token is correct after minting
      const navPerToken = await indexToken.getNavPerToken();
      expect(navPerToken).to.equal(ethers.parseEther("1")); // Should be 1:1 on first deposit
    });

    it("Should calculate NAV correctly after minting", async function () {
      const { indexToken, tokenA, tokenB, tokenC, user1 } = await loadFixture(
        setupAssetsFixture
      );

      const depositAmount = ethers.parseEther("100");

      await tokenA.connect(user1).approve(indexToken.target, depositAmount);
      await tokenB.connect(user1).approve(indexToken.target, depositAmount);
      await tokenC.connect(user1).approve(indexToken.target, depositAmount);

      await indexToken
        .connect(user1)
        .mint([depositAmount, depositAmount, depositAmount]);

      const totalNav = await indexToken.getTotalNav();
      expect(totalNav).to.equal(depositAmount * 3n);

      const navPerToken = await indexToken.getNavPerToken();
      expect(navPerToken).to.be.gt(0);
    });

    it("Should mint proportional amount on subsequent deposits", async function () {
      const { indexToken, tokenA, tokenB, tokenC, user1, user2 } = await loadFixture(
        setupAssetsFixture
      );

      const depositAmount = ethers.parseEther("100");

      // First user deposits
      await tokenA.connect(user1).approve(indexToken.target, depositAmount);
      await tokenB.connect(user1).approve(indexToken.target, depositAmount);
      await tokenC.connect(user1).approve(indexToken.target, depositAmount);
      await indexToken
        .connect(user1)
        .mint([depositAmount, depositAmount, depositAmount]);

      const user1Balance = await indexToken.balanceOf(user1.address);

      // Second user deposits same amount
      await tokenA.connect(user2).approve(indexToken.target, depositAmount);
      await tokenB.connect(user2).approve(indexToken.target, depositAmount);
      await tokenC.connect(user2).approve(indexToken.target, depositAmount);
      await indexToken
        .connect(user2)
        .mint([depositAmount, depositAmount, depositAmount]);

      const user2Balance = await indexToken.balanceOf(user2.address);

      // Both users should receive same amount of index tokens
      expect(user2Balance).to.equal(user1Balance);
    });

    it("Should revert if deposit is below minimum", async function () {
      const { indexToken, tokenA, tokenB, tokenC, user1 } = await loadFixture(
        setupAssetsFixture
      );

      const tinyAmount = ethers.parseEther("0.001");

      await tokenA.connect(user1).approve(indexToken.target, tinyAmount);
      await tokenB.connect(user1).approve(indexToken.target, tinyAmount);
      await tokenC.connect(user1).approve(indexToken.target, tinyAmount);

      await expect(
        indexToken.connect(user1).mint([tinyAmount, tinyAmount, tinyAmount])
      ).to.be.reverted;
    });

    it("Should revert if array length doesn't match asset count", async function () {
      const { indexToken, user1 } = await loadFixture(setupAssetsFixture);

      const depositAmount = ethers.parseEther("100");

      await expect(
        indexToken.connect(user1).mint([depositAmount, depositAmount]) // Only 2 amounts, need 3
      ).to.be.reverted;
    });
  });

  describe("Burning", function () {
    async function setupWithDepositsFixture() {
      const fixture = await deployIndexTokenFixture();
      const { indexToken, tokenA, tokenB, tokenC, user1 } = fixture;

      // Add assets
      await indexToken.addAsset(tokenA.target, 5000);
      await indexToken.addAsset(tokenB.target, 3000);
      await indexToken.addAsset(tokenC.target, 2000);

      // User1 deposits
      const depositAmount = ethers.parseEther("100");
      await tokenA.connect(user1).approve(indexToken.target, depositAmount);
      await tokenB.connect(user1).approve(indexToken.target, depositAmount);
      await tokenC.connect(user1).approve(indexToken.target, depositAmount);
      await indexToken
        .connect(user1)
        .mint([depositAmount, depositAmount, depositAmount]);

      return { ...fixture, depositAmount };
    }

    it("Should burn index tokens and return assets", async function () {
      const { indexToken, tokenA, tokenB, tokenC, user1 } = await loadFixture(
        setupWithDepositsFixture
      );

      const indexBalance = await indexToken.balanceOf(user1.address);
      const burnAmount = indexBalance / 2n; // Burn half

      const tokenABalanceBefore = await tokenA.balanceOf(user1.address);

      await expect(indexToken.connect(user1).burn(burnAmount))
        .to.emit(indexToken, "Burned")
        .withArgs(user1.address, burnAmount, await indexToken.getNavPerToken());

      // Check index token balance decreased
      expect(await indexToken.balanceOf(user1.address)).to.equal(
        indexBalance - burnAmount
      );

      // Check user received underlying assets
      expect(await tokenA.balanceOf(user1.address)).to.be.gt(
        tokenABalanceBefore
      );
    });

    it("Should burn all tokens and receive all assets back", async function () {
      const { indexToken, user1, depositAmount } = await loadFixture(
        setupWithDepositsFixture
      );

      const indexBalance = await indexToken.balanceOf(user1.address);

      await indexToken.connect(user1).burn(indexBalance);

      expect(await indexToken.balanceOf(user1.address)).to.equal(0);
    });

    it("Should revert when burning zero amount", async function () {
      const { indexToken, user1 } = await loadFixture(setupWithDepositsFixture);

      await expect(indexToken.connect(user1).burn(0)).to.be.reverted;
    });

    it("Should revert when burning more than balance", async function () {
      const { indexToken, user1 } = await loadFixture(setupWithDepositsFixture);

      const balance = await indexToken.balanceOf(user1.address);

      await expect(indexToken.connect(user1).burn(balance + 1n)).to.be.reverted;
    });
  });

  describe("AI Agent Authorization", function () {
    it("Should authorize an AI agent", async function () {
      const { indexToken, agent } = await loadFixture(deployIndexTokenFixture);

      await expect(indexToken.authorizeAgent(agent.address))
        .to.emit(indexToken, "AgentAuthorized")
        .withArgs(agent.address);

      expect(await indexToken.isAuthorizedAgent(agent.address)).to.be.true;
    });

    it("Should revoke an AI agent", async function () {
      const { indexToken, agent } = await loadFixture(deployIndexTokenFixture);

      await indexToken.authorizeAgent(agent.address);

      await expect(indexToken.revokeAgent(agent.address))
        .to.emit(indexToken, "AgentRevoked")
        .withArgs(agent.address);

      expect(await indexToken.isAuthorizedAgent(agent.address)).to.be.false;
    });

    it("Should allow authorized agent to rebalance", async function () {
      const { indexToken, agent } = await loadFixture(deployIndexTokenFixture);

      await indexToken.authorizeAgent(agent.address);

      await expect(indexToken.connect(agent).rebalance())
        .to.emit(indexToken, "Rebalanced");
    });

    it("Should revert when unauthorized agent tries to rebalance", async function () {
      const { indexToken, user1 } = await loadFixture(deployIndexTokenFixture);

      await expect(indexToken.connect(user1).rebalance()).to.be.reverted;
    });

    it("Should revert when non-owner tries to authorize agent", async function () {
      const { indexToken, agent, user1 } = await loadFixture(
        deployIndexTokenFixture
      );

      await expect(
        indexToken.connect(user1).authorizeAgent(agent.address)
      ).to.be.reverted;
    });
  });

  describe("Fee Management", function () {
    it("Should collect management fees over time", async function () {
      const { indexToken, tokenA, user1, owner } = await loadFixture(
        deployIndexTokenFixture
      );

      // Add asset and mint
      await indexToken.addAsset(tokenA.target, 10000);
      const depositAmount = ethers.parseEther("1000");
      await tokenA.connect(user1).approve(indexToken.target, depositAmount);
      await indexToken.connect(user1).mint([depositAmount]);

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]); // 1 year
      await ethers.provider.send("evm_mine", []);

      const ownerBalanceBefore = await indexToken.balanceOf(owner.address);

      await expect(indexToken.collectFees()).to.emit(indexToken, "FeesCollected");

      const ownerBalanceAfter = await indexToken.balanceOf(owner.address);
      expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
    });

    it("Should update management fee", async function () {
      const { indexToken } = await loadFixture(deployIndexTokenFixture);

      await expect(indexToken.setManagementFee(300))
        .to.emit(indexToken, "ManagementFeeUpdated")
        .withArgs(200, 300);

      expect(await indexToken.managementFee()).to.equal(300);
    });

    it("Should update performance fee", async function () {
      const { indexToken } = await loadFixture(deployIndexTokenFixture);

      await expect(indexToken.setPerformanceFee(2500))
        .to.emit(indexToken, "PerformanceFeeUpdated")
        .withArgs(2000, 2500);

      expect(await indexToken.performanceFee()).to.equal(2500);
    });

    it("Should revert when setting invalid management fee", async function () {
      const { indexToken } = await loadFixture(deployIndexTokenFixture);

      await expect(indexToken.setManagementFee(600)).to.be.reverted;
    });

    it("Should revert when setting invalid performance fee", async function () {
      const { indexToken } = await loadFixture(deployIndexTokenFixture);

      await expect(indexToken.setPerformanceFee(3100)).to.be.reverted;
    });
  });

  describe("Emergency Functions", function () {
    it("Should pause and unpause the contract", async function () {
      const { indexToken } = await loadFixture(deployIndexTokenFixture);

      await indexToken.pause();
      expect(await indexToken.paused()).to.be.true;

      await indexToken.unpause();
      expect(await indexToken.paused()).to.be.false;
    });

    it("Should revert minting when paused", async function () {
      const { indexToken, tokenA, user1 } = await loadFixture(
        deployIndexTokenFixture
      );

      await indexToken.addAsset(tokenA.target, 10000);
      await indexToken.pause();

      const depositAmount = ethers.parseEther("100");
      await tokenA.connect(user1).approve(indexToken.target, depositAmount);

      await expect(
        indexToken.connect(user1).mint([depositAmount])
      ).to.be.reverted;
    });

    it("Should allow emergency withdraw when paused", async function () {
      const { indexToken, tokenA, owner } = await loadFixture(
        deployIndexTokenFixture
      );

      // Transfer some tokens to contract
      const amount = ethers.parseEther("100");
      await tokenA.mint(indexToken.target, amount);

      await indexToken.pause();

      await expect(indexToken.emergencyWithdraw(tokenA.target, amount))
        .to.emit(indexToken, "EmergencyWithdraw")
        .withArgs(tokenA.target, amount);

      expect(await tokenA.balanceOf(owner.address)).to.equal(amount);
    });

    it("Should revert emergency withdraw when not paused", async function () {
      const { indexToken, tokenA } = await loadFixture(deployIndexTokenFixture);

      await expect(
        indexToken.emergencyWithdraw(tokenA.target, 100)
      ).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should return correct portfolio composition", async function () {
      const { indexToken, tokenA, tokenB, tokenC } = await loadFixture(
        deployIndexTokenFixture
      );

      await indexToken.addAsset(tokenA.target, 5000);
      await indexToken.addAsset(tokenB.target, 3000);
      await indexToken.addAsset(tokenC.target, 2000);

      const [tokens, balances, weights] = await indexToken.getPortfolioComposition();

      expect(tokens).to.have.lengthOf(3);
      expect(balances).to.have.lengthOf(3);
      expect(weights).to.have.lengthOf(3);

      expect(tokens[0]).to.equal(tokenA.target);
      expect(weights[0]).to.equal(5000);
    });

    it("Should calculate NAV correctly with multiple assets", async function () {
      const { indexToken, tokenA, tokenB, user1 } = await loadFixture(
        deployIndexTokenFixture
      );

      await indexToken.addAsset(tokenA.target, 5000);
      await indexToken.addAsset(tokenB.target, 5000);

      const depositAmount = ethers.parseEther("100");
      await tokenA.connect(user1).approve(indexToken.target, depositAmount);
      await tokenB.connect(user1).approve(indexToken.target, depositAmount);
      await indexToken.connect(user1).mint([depositAmount, depositAmount]);

      const totalNav = await indexToken.getTotalNav();
      expect(totalNav).to.equal(depositAmount * 2n);
    });
  });
});
