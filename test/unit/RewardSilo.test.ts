import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { RewardSilo, MockERC20, StakingPool } from "../../typechain-types";

describe("RewardSilo", function () {
  async function deployRewardSiloFixture() {
    const [owner, manager, agent, user1, pool] = await ethers.getSigners();

    // Deploy RewardSilo
    const RewardSilo = await ethers.getContractFactory("RewardSilo");
    const rewardSilo = await RewardSilo.deploy();

    // Deploy reward token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const rewardToken = await MockERC20.deploy("Reward Token", "RWD", 18);

    // Mint tokens to owner and manager
    const mintAmount = ethers.parseEther("1000000");
    await rewardToken.mint(owner.address, mintAmount);
    await rewardToken.mint(manager.address, mintAmount);

    return { rewardSilo, rewardToken, owner, manager, agent, user1, pool };
  }

  describe("Deployment", function () {
    it("Should deploy with correct initial state", async function () {
      const { rewardSilo, owner } = await loadFixture(deployRewardSiloFixture);

      expect(await rewardSilo.owner()).to.equal(owner.address);
      expect(await rewardSilo.nextSiloId()).to.equal(1);
      expect(await rewardSilo.getSiloCount()).to.equal(0);
    });

    it("Should have correct constants", async function () {
      const { rewardSilo } = await loadFixture(deployRewardSiloFixture);

      expect(await rewardSilo.MIN_DISTRIBUTION_RATE()).to.equal(ethers.parseEther("0.001"));
      expect(await rewardSilo.MAX_DISTRIBUTION_RATE()).to.equal(ethers.parseEther("1000"));
    });
  });

  describe("Authorization", function () {
    it("Should authorize a manager", async function () {
      const { rewardSilo, manager } = await loadFixture(deployRewardSiloFixture);

      await expect(rewardSilo.authorizeManager(manager.address))
        .to.emit(rewardSilo, "ManagerAuthorized")
        .withArgs(manager.address);

      expect(await rewardSilo.isAuthorizedManager(manager.address)).to.be.true;
    });

    it("Should revoke a manager", async function () {
      const { rewardSilo, manager } = await loadFixture(deployRewardSiloFixture);

      await rewardSilo.authorizeManager(manager.address);

      await expect(rewardSilo.revokeManager(manager.address))
        .to.emit(rewardSilo, "ManagerRevoked")
        .withArgs(manager.address);

      expect(await rewardSilo.isAuthorizedManager(manager.address)).to.be.false;
    });

    it("Should authorize an agent", async function () {
      const { rewardSilo, agent } = await loadFixture(deployRewardSiloFixture);

      await expect(rewardSilo.authorizeAgent(agent.address))
        .to.emit(rewardSilo, "AgentAuthorized")
        .withArgs(agent.address);

      expect(await rewardSilo.isAuthorizedAgent(agent.address)).to.be.true;
    });

    it("Should revoke an agent", async function () {
      const { rewardSilo, agent } = await loadFixture(deployRewardSiloFixture);

      await rewardSilo.authorizeAgent(agent.address);

      await expect(rewardSilo.revokeAgent(agent.address))
        .to.emit(rewardSilo, "AgentRevoked")
        .withArgs(agent.address);

      expect(await rewardSilo.isAuthorizedAgent(agent.address)).to.be.false;
    });

    it("Should revert when non-owner tries to authorize", async function () {
      const { rewardSilo, manager, user1 } = await loadFixture(deployRewardSiloFixture);

      await expect(
        rewardSilo.connect(user1).authorizeManager(manager.address)
      ).to.be.reverted;
    });
  });

  describe("Silo Creation", function () {
    it("Should create a new silo", async function () {
      const { rewardSilo, rewardToken, pool } = await loadFixture(deployRewardSiloFixture);

      const distributionRate = ethers.parseEther("1");
      const name = "Test Silo";

      await expect(
        rewardSilo.createSilo(rewardToken.target, pool.address, distributionRate, name)
      )
        .to.emit(rewardSilo, "SiloCreated")
        .withArgs(1, rewardToken.target, name);

      expect(await rewardSilo.getSiloCount()).to.equal(1);

      const [
        tokenAddr,
        totalDeposited,
        totalDistributed,
        availableBalance,
        rate,
        ,
        targetPool,
        isActive,
        siloName,
      ] = await rewardSilo.getSiloInfo(1);

      expect(tokenAddr).to.equal(rewardToken.target);
      expect(totalDeposited).to.equal(0);
      expect(totalDistributed).to.equal(0);
      expect(availableBalance).to.equal(0);
      expect(rate).to.equal(distributionRate);
      expect(targetPool).to.equal(pool.address);
      expect(isActive).to.be.true;
      expect(siloName).to.equal(name);
    });

    it("Should create multiple silos", async function () {
      const { rewardSilo, rewardToken, pool } = await loadFixture(deployRewardSiloFixture);

      await rewardSilo.createSilo(rewardToken.target, pool.address, ethers.parseEther("1"), "Silo 1");
      await rewardSilo.createSilo(rewardToken.target, pool.address, ethers.parseEther("2"), "Silo 2");

      expect(await rewardSilo.getSiloCount()).to.equal(2);

      const siloIds = await rewardSilo.getAllSiloIds();
      expect(siloIds).to.have.lengthOf(2);
      expect(siloIds[0]).to.equal(1);
      expect(siloIds[1]).to.equal(2);
    });

    it("Should allow authorized manager to create silo", async function () {
      const { rewardSilo, rewardToken, pool, manager } = await loadFixture(deployRewardSiloFixture);

      await rewardSilo.authorizeManager(manager.address);

      await expect(
        rewardSilo.connect(manager).createSilo(
          rewardToken.target,
          pool.address,
          ethers.parseEther("1"),
          "Manager Silo"
        )
      ).to.emit(rewardSilo, "SiloCreated");
    });

    it("Should revert with invalid distribution rate", async function () {
      const { rewardSilo, rewardToken, pool } = await loadFixture(deployRewardSiloFixture);

      // Too low
      await expect(
        rewardSilo.createSilo(rewardToken.target, pool.address, ethers.parseEther("0.0001"), "Test")
      ).to.be.reverted;

      // Too high
      await expect(
        rewardSilo.createSilo(rewardToken.target, pool.address, ethers.parseEther("2000"), "Test")
      ).to.be.reverted;
    });

    it("Should revert with zero addresses", async function () {
      const { rewardSilo, rewardToken, pool } = await loadFixture(deployRewardSiloFixture);

      await expect(
        rewardSilo.createSilo(ethers.ZeroAddress, pool.address, ethers.parseEther("1"), "Test")
      ).to.be.reverted;

      await expect(
        rewardSilo.createSilo(rewardToken.target, ethers.ZeroAddress, ethers.parseEther("1"), "Test")
      ).to.be.reverted;
    });

    it("Should revert with empty name", async function () {
      const { rewardSilo, rewardToken, pool } = await loadFixture(deployRewardSiloFixture);

      await expect(
        rewardSilo.createSilo(rewardToken.target, pool.address, ethers.parseEther("1"), "")
      ).to.be.reverted;
    });
  });

  describe("Silo Funding", function () {
    async function createSiloFixture() {
      const fixture = await deployRewardSiloFixture();
      const { rewardSilo, rewardToken, pool } = fixture;

      await rewardSilo.createSilo(
        rewardToken.target,
        pool.address,
        ethers.parseEther("1"),
        "Test Silo"
      );

      return fixture;
    }

    it("Should fund a silo", async function () {
      const { rewardSilo, rewardToken, owner } = await loadFixture(createSiloFixture);

      const fundAmount = ethers.parseEther("1000");
      await rewardToken.approve(rewardSilo.target, fundAmount);

      await expect(rewardSilo.fundSilo(1, fundAmount))
        .to.emit(rewardSilo, "SiloFunded")
        .withArgs(1, fundAmount, fundAmount);

      const [, totalDeposited, , availableBalance] = await rewardSilo.getSiloInfo(1);
      expect(totalDeposited).to.equal(fundAmount);
      expect(availableBalance).to.equal(fundAmount);
    });

    it("Should fund silo multiple times (top off)", async function () {
      const { rewardSilo, rewardToken } = await loadFixture(createSiloFixture);

      const fundAmount1 = ethers.parseEther("1000");
      const fundAmount2 = ethers.parseEther("500");

      await rewardToken.approve(rewardSilo.target, fundAmount1 + fundAmount2);

      await rewardSilo.fundSilo(1, fundAmount1);
      await rewardSilo.fundSilo(1, fundAmount2);

      const [, totalDeposited, , availableBalance] = await rewardSilo.getSiloInfo(1);
      expect(totalDeposited).to.equal(fundAmount1 + fundAmount2);
      expect(availableBalance).to.equal(fundAmount1 + fundAmount2);
    });

    it("Should allow authorized manager to fund silo", async function () {
      const { rewardSilo, rewardToken, manager } = await loadFixture(createSiloFixture);

      await rewardSilo.authorizeManager(manager.address);

      const fundAmount = ethers.parseEther("500");
      await rewardToken.connect(manager).approve(rewardSilo.target, fundAmount);

      await expect(rewardSilo.connect(manager).fundSilo(1, fundAmount))
        .to.emit(rewardSilo, "SiloFunded");
    });

    it("Should revert when funding with zero amount", async function () {
      const { rewardSilo } = await loadFixture(createSiloFixture);

      await expect(rewardSilo.fundSilo(1, 0)).to.be.reverted;
    });

    it("Should revert when unauthorized user tries to fund", async function () {
      const { rewardSilo, rewardToken, user1 } = await loadFixture(createSiloFixture);

      const fundAmount = ethers.parseEther("100");
      await rewardToken.mint(user1.address, fundAmount);
      await rewardToken.connect(user1).approve(rewardSilo.target, fundAmount);

      await expect(rewardSilo.connect(user1).fundSilo(1, fundAmount)).to.be.reverted;
    });
  });

  describe("Reward Distribution", function () {
    async function fundedSiloFixture() {
      const fixture = await createSiloFixture();
      const { rewardSilo, rewardToken } = fixture;

      const fundAmount = ethers.parseEther("10000");
      await rewardToken.approve(rewardSilo.target, fundAmount);
      await rewardSilo.fundSilo(1, fundAmount);

      return fixture;
    }

    async function createSiloFixture() {
      const fixture = await deployRewardSiloFixture();
      const { rewardSilo, rewardToken, pool } = fixture;

      await rewardSilo.createSilo(
        rewardToken.target,
        pool.address,
        ethers.parseEther("1"), // 1 token per second
        "Test Silo"
      );

      return fixture;
    }

    it("Should distribute rewards based on time elapsed", async function () {
      const { rewardSilo, rewardToken, pool, agent } = await loadFixture(fundedSiloFixture);

      await rewardSilo.authorizeAgent(agent.address);

      // Wait 100 seconds
      await time.increase(100);

      const poolBalanceBefore = await rewardToken.balanceOf(pool.address);

      await expect(rewardSilo.connect(agent).distributeRewards(1))
        .to.emit(rewardSilo, "RewardsDistributed");

      const poolBalanceAfter = await rewardToken.balanceOf(pool.address);
      const distributed = poolBalanceAfter - poolBalanceBefore;

      // Should distribute approximately 100 tokens (100 seconds * 1 token/second)
      expect(distributed).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("5"));
    });

    it("Should update silo state after distribution", async function () {
      const { rewardSilo, agent } = await loadFixture(fundedSiloFixture);

      await rewardSilo.authorizeAgent(agent.address);
      await time.increase(100);

      const [, , totalDistributedBefore, availableBalanceBefore] = await rewardSilo.getSiloInfo(1);

      await rewardSilo.connect(agent).distributeRewards(1);

      const [, , totalDistributedAfter, availableBalanceAfter] = await rewardSilo.getSiloInfo(1);

      expect(totalDistributedAfter).to.be.gt(totalDistributedBefore);
      expect(availableBalanceAfter).to.be.lt(availableBalanceBefore);
    });

    it("Should not distribute more than available balance", async function () {
      const { rewardSilo, rewardToken, agent } = await loadFixture(createSiloFixture);

      await rewardSilo.authorizeAgent(agent.address);

      // Fund with small amount
      const fundAmount = ethers.parseEther("50");
      await rewardToken.approve(rewardSilo.target, fundAmount);
      await rewardSilo.fundSilo(1, fundAmount);

      // Wait long enough to drain the silo
      await time.increase(100); // Would want 100 tokens but only have 50

      await rewardSilo.connect(agent).distributeRewards(1);

      const [, , totalDistributed, availableBalance] = await rewardSilo.getSiloInfo(1);
      expect(totalDistributed).to.equal(fundAmount);
      expect(availableBalance).to.equal(0);
    });

    it("Should allow manager to distribute rewards", async function () {
      const { rewardSilo, manager } = await loadFixture(fundedSiloFixture);

      await rewardSilo.authorizeManager(manager.address);
      await time.increase(50);

      await expect(rewardSilo.connect(manager).distributeRewards(1))
        .to.emit(rewardSilo, "RewardsDistributed");
    });

    it("Should revert when distributing from inactive silo", async function () {
      const { rewardSilo, agent } = await loadFixture(fundedSiloFixture);

      await rewardSilo.authorizeAgent(agent.address);
      await rewardSilo.setSiloStatus(1, false);

      await time.increase(100);

      await expect(rewardSilo.connect(agent).distributeRewards(1)).to.be.reverted;
    });

    it("Should distribute correct amount after waiting", async function () {
      const { rewardSilo, agent, pool, rewardToken } = await loadFixture(fundedSiloFixture);

      await rewardSilo.authorizeAgent(agent.address);

      // Wait 10 seconds for more predictable distribution
      await time.increase(10);

      const poolBalanceBefore = await rewardToken.balanceOf(pool.address);
      await rewardSilo.connect(agent).distributeRewards(1);
      const poolBalanceAfter = await rewardToken.balanceOf(pool.address);

      // Should distribute approximately 10 tokens (10 seconds * 1 token/sec)
      expect(poolBalanceAfter - poolBalanceBefore).to.be.closeTo(
        ethers.parseEther("10"),
        ethers.parseEther("5")
      );
    });
  });

  describe("Distribution Rate", function () {
    async function createSiloFixture() {
      const fixture = await deployRewardSiloFixture();
      const { rewardSilo, rewardToken, pool } = fixture;

      await rewardSilo.createSilo(
        rewardToken.target,
        pool.address,
        ethers.parseEther("1"),
        "Test Silo"
      );

      return fixture;
    }

    it("Should update distribution rate", async function () {
      const { rewardSilo } = await loadFixture(createSiloFixture);

      const newRate = ethers.parseEther("2");

      await expect(rewardSilo.updateDistributionRate(1, newRate))
        .to.emit(rewardSilo, "DistributionRateUpdated")
        .withArgs(1, ethers.parseEther("1"), newRate);

      const [, , , , rate] = await rewardSilo.getSiloInfo(1);
      expect(rate).to.equal(newRate);
    });

    it("Should allow manager to update rate", async function () {
      const { rewardSilo, manager } = await loadFixture(createSiloFixture);

      await rewardSilo.authorizeManager(manager.address);

      await expect(
        rewardSilo.connect(manager).updateDistributionRate(1, ethers.parseEther("3"))
      ).to.emit(rewardSilo, "DistributionRateUpdated");
    });

    it("Should revert with invalid rate", async function () {
      const { rewardSilo } = await loadFixture(createSiloFixture);

      await expect(
        rewardSilo.updateDistributionRate(1, ethers.parseEther("0.0001"))
      ).to.be.reverted;

      await expect(
        rewardSilo.updateDistributionRate(1, ethers.parseEther("2000"))
      ).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    async function fundedSiloFixture() {
      const fixture = await createSiloFixture();
      const { rewardSilo, rewardToken } = fixture;

      const fundAmount = ethers.parseEther("10000");
      await rewardToken.approve(rewardSilo.target, fundAmount);
      await rewardSilo.fundSilo(1, fundAmount);

      return fixture;
    }

    async function createSiloFixture() {
      const fixture = await deployRewardSiloFixture();
      const { rewardSilo, rewardToken, pool } = fixture;

      await rewardSilo.createSilo(
        rewardToken.target,
        pool.address,
        ethers.parseEther("1"),
        "Test Silo"
      );

      return fixture;
    }

    it("Should calculate pending distribution correctly", async function () {
      const { rewardSilo } = await loadFixture(fundedSiloFixture);

      await time.increase(100);

      const pending = await rewardSilo.getPendingDistribution(1);
      expect(pending).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("5"));
    });

    it("Should return 0 pending for inactive silo", async function () {
      const { rewardSilo } = await loadFixture(fundedSiloFixture);

      await rewardSilo.setSiloStatus(1, false);
      await time.increase(100);

      const pending = await rewardSilo.getPendingDistribution(1);
      expect(pending).to.equal(0);
    });

    it("Should calculate days until empty", async function () {
      const { rewardSilo, rewardToken } = await loadFixture(createSiloFixture);

      // Fund with 86400 tokens (1 day worth at 1 token/sec)
      const fundAmount = ethers.parseEther("86400");
      await rewardToken.approve(rewardSilo.target, fundAmount);
      await rewardSilo.fundSilo(1, fundAmount);

      const daysUntilEmpty = await rewardSilo.getDaysUntilEmpty(1);
      expect(daysUntilEmpty).to.equal(1);
    });

    it("Should return 0 days for empty silo", async function () {
      const { rewardSilo } = await loadFixture(createSiloFixture);

      const daysUntilEmpty = await rewardSilo.getDaysUntilEmpty(1);
      expect(daysUntilEmpty).to.equal(0);
    });
  });

  describe("Emergency Functions", function () {
    async function fundedSiloFixture() {
      const fixture = await createSiloFixture();
      const { rewardSilo, rewardToken } = fixture;

      const fundAmount = ethers.parseEther("1000");
      await rewardToken.approve(rewardSilo.target, fundAmount);
      await rewardSilo.fundSilo(1, fundAmount);

      return fixture;
    }

    async function createSiloFixture() {
      const fixture = await deployRewardSiloFixture();
      const { rewardSilo, rewardToken, pool } = fixture;

      await rewardSilo.createSilo(
        rewardToken.target,
        pool.address,
        ethers.parseEther("1"),
        "Test Silo"
      );

      return fixture;
    }

    it("Should pause and unpause", async function () {
      const { rewardSilo } = await loadFixture(deployRewardSiloFixture);

      await rewardSilo.pause();
      expect(await rewardSilo.paused()).to.be.true;

      await rewardSilo.unpause();
      expect(await rewardSilo.paused()).to.be.false;
    });

    it("Should emergency withdraw when paused", async function () {
      const { rewardSilo, rewardToken, owner } = await loadFixture(fundedSiloFixture);

      await rewardSilo.pause();

      const withdrawAmount = ethers.parseEther("500");
      const ownerBalanceBefore = await rewardToken.balanceOf(owner.address);

      await expect(rewardSilo.emergencyWithdraw(1, withdrawAmount))
        .to.emit(rewardSilo, "EmergencyWithdraw")
        .withArgs(1, withdrawAmount);

      const ownerBalanceAfter = await rewardToken.balanceOf(owner.address);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(withdrawAmount);
    });

    it("Should revert emergency withdraw when not paused", async function () {
      const { rewardSilo } = await loadFixture(fundedSiloFixture);

      await expect(rewardSilo.emergencyWithdraw(1, ethers.parseEther("100"))).to.be.reverted;
    });

    it("Should revert distribution when paused", async function () {
      const { rewardSilo, agent } = await loadFixture(fundedSiloFixture);

      await rewardSilo.authorizeAgent(agent.address);
      await rewardSilo.pause();
      await time.increase(100);

      await expect(rewardSilo.connect(agent).distributeRewards(1)).to.be.reverted;
    });
  });
});
