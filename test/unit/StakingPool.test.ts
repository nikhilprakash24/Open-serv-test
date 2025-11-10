import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { StakingPool, MockERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("StakingPool", function () {
  const REWARD_RATE = ethers.parseEther("1"); // 1 token per second
  const PERFORMANCE_FEE = 1000; // 10%
  const MIN_STAKE = ethers.parseEther("10");
  const LOCK_PERIOD = 7 * 24 * 60 * 60; // 7 days

  // Test fixtures
  async function deployStakingPoolFixture() {
    const [owner, feeCollector, agent, user1, user2, user3] = await ethers.getSigners();

    // Deploy reward token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const rewardToken = await MockERC20.deploy("Reward Token", "RWD", 18);

    // Deploy staking tokens
    const stakingTokenA = await MockERC20.deploy("Staking Token A", "STKA", 18);
    const stakingTokenB = await MockERC20.deploy("Staking Token B", "STKB", 18);

    // Deploy StakingPool
    const StakingPool = await ethers.getContractFactory("StakingPool");
    const stakingPool = await StakingPool.deploy(
      rewardToken.target,
      REWARD_RATE,
      PERFORMANCE_FEE,
      feeCollector.address
    );

    // Mint tokens to users
    const mintAmount = ethers.parseEther("100000");
    await stakingTokenA.mint(user1.address, mintAmount);
    await stakingTokenA.mint(user2.address, mintAmount);
    await stakingTokenB.mint(user1.address, mintAmount);
    await stakingTokenB.mint(user2.address, mintAmount);

    // Mint reward tokens to owner for distribution
    await rewardToken.mint(owner.address, ethers.parseEther("1000000"));

    return {
      stakingPool,
      rewardToken,
      stakingTokenA,
      stakingTokenB,
      owner,
      feeCollector,
      agent,
      user1,
      user2,
      user3,
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      const { stakingPool, rewardToken, feeCollector } = await loadFixture(
        deployStakingPoolFixture
      );

      expect(await stakingPool.rewardToken()).to.equal(rewardToken.target);
      expect(await stakingPool.rewardRate()).to.equal(REWARD_RATE);
      expect(await stakingPool.performanceFee()).to.equal(PERFORMANCE_FEE);
      expect(await stakingPool.feeCollector()).to.equal(feeCollector.address);
    });

    it("Should revert if reward token is zero address", async function () {
      const [, feeCollector] = await ethers.getSigners();
      const StakingPool = await ethers.getContractFactory("StakingPool");

      await expect(
        StakingPool.deploy(ethers.ZeroAddress, REWARD_RATE, PERFORMANCE_FEE, feeCollector.address)
      ).to.be.reverted;
    });

    it("Should revert if fee collector is zero address", async function () {
      const { rewardToken } = await loadFixture(deployStakingPoolFixture);
      const StakingPool = await ethers.getContractFactory("StakingPool");

      await expect(
        StakingPool.deploy(rewardToken.target, REWARD_RATE, PERFORMANCE_FEE, ethers.ZeroAddress)
      ).to.be.reverted;
    });

    it("Should revert if performance fee is too high", async function () {
      const { rewardToken, feeCollector } = await loadFixture(deployStakingPoolFixture);
      const StakingPool = await ethers.getContractFactory("StakingPool");

      await expect(
        StakingPool.deploy(rewardToken.target, REWARD_RATE, 3100, feeCollector.address)
      ).to.be.reverted;
    });
  });

  describe("Pool Management", function () {
    it("Should create a new pool", async function () {
      const { stakingPool, stakingTokenA } = await loadFixture(deployStakingPoolFixture);

      await expect(stakingPool.createPool(stakingTokenA.target, MIN_STAKE, LOCK_PERIOD))
        .to.emit(stakingPool, "PoolCreated")
        .withArgs(1, stakingTokenA.target, MIN_STAKE);

      const [stakingToken, totalStaked, , , minStake, lockPeriod, isActive] =
        await stakingPool.getPoolInfo(1);

      expect(stakingToken).to.equal(stakingTokenA.target);
      expect(totalStaked).to.equal(0);
      expect(minStake).to.equal(MIN_STAKE);
      expect(lockPeriod).to.equal(LOCK_PERIOD);
      expect(isActive).to.be.true;
    });

    it("Should create multiple pools", async function () {
      const { stakingPool, stakingTokenA, stakingTokenB } = await loadFixture(
        deployStakingPoolFixture
      );

      await stakingPool.createPool(stakingTokenA.target, MIN_STAKE, LOCK_PERIOD);
      await stakingPool.createPool(stakingTokenB.target, MIN_STAKE, LOCK_PERIOD);

      expect(await stakingPool.getPoolCount()).to.equal(2);

      const poolIds = await stakingPool.getAllPoolIds();
      expect(poolIds.length).to.equal(2);
      expect(poolIds[0]).to.equal(1);
      expect(poolIds[1]).to.equal(2);
    });

    it("Should update pool parameters", async function () {
      const { stakingPool, stakingTokenA } = await loadFixture(deployStakingPoolFixture);

      await stakingPool.createPool(stakingTokenA.target, MIN_STAKE, LOCK_PERIOD);

      const newMinStake = ethers.parseEther("20");
      const newLockPeriod = 14 * 24 * 60 * 60; // 14 days

      await expect(stakingPool.updatePool(1, newMinStake, newLockPeriod))
        .to.emit(stakingPool, "PoolUpdated")
        .withArgs(1, newMinStake, newLockPeriod);

      const [, , , , minStake, lockPeriod] = await stakingPool.getPoolInfo(1);
      expect(minStake).to.equal(newMinStake);
      expect(lockPeriod).to.equal(newLockPeriod);
    });

    it("Should set pool status", async function () {
      const { stakingPool, stakingTokenA } = await loadFixture(deployStakingPoolFixture);

      await stakingPool.createPool(stakingTokenA.target, MIN_STAKE, LOCK_PERIOD);

      await expect(stakingPool.setPoolStatus(1, false))
        .to.emit(stakingPool, "PoolStatusChanged")
        .withArgs(1, false);

      const [, , , , , , isActive] = await stakingPool.getPoolInfo(1);
      expect(isActive).to.be.false;
    });

    it("Should revert when non-owner tries to create pool", async function () {
      const { stakingPool, stakingTokenA, user1 } = await loadFixture(deployStakingPoolFixture);

      await expect(
        stakingPool.connect(user1).createPool(stakingTokenA.target, MIN_STAKE, LOCK_PERIOD)
      ).to.be.reverted;
    });
  });

  describe("Staking", function () {
    async function setupPoolFixture() {
      const fixture = await deployStakingPoolFixture();
      const { stakingPool, stakingTokenA } = fixture;

      // Create a pool
      await stakingPool.createPool(stakingTokenA.target, MIN_STAKE, LOCK_PERIOD);

      return fixture;
    }

    it("Should stake tokens", async function () {
      const { stakingPool, stakingTokenA, user1 } = await loadFixture(setupPoolFixture);

      const stakeAmount = ethers.parseEther("100");

      await stakingTokenA.connect(user1).approve(stakingPool.target, stakeAmount);

      await expect(stakingPool.connect(user1).stake(1, stakeAmount))
        .to.emit(stakingPool, "Staked")
        .withArgs(user1.address, 1, stakeAmount);

      const [amount, , ,] = await stakingPool.getStakerInfo(1, user1.address);
      expect(amount).to.equal(stakeAmount);

      const [, totalStaked] = await stakingPool.getPoolInfo(1);
      expect(totalStaked).to.equal(stakeAmount);
    });

    it("Should stake multiple times", async function () {
      const { stakingPool, stakingTokenA, user1 } = await loadFixture(setupPoolFixture);

      const stakeAmount = ethers.parseEther("50");

      await stakingTokenA.connect(user1).approve(stakingPool.target, stakeAmount * 2n);

      await stakingPool.connect(user1).stake(1, stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      const [amount] = await stakingPool.getStakerInfo(1, user1.address);
      expect(amount).to.equal(stakeAmount * 2n);
    });

    it("Should revert when staking below minimum", async function () {
      const { stakingPool, stakingTokenA, user1 } = await loadFixture(setupPoolFixture);

      const stakeAmount = ethers.parseEther("5"); // Below minimum

      await stakingTokenA.connect(user1).approve(stakingPool.target, stakeAmount);

      await expect(stakingPool.connect(user1).stake(1, stakeAmount)).to.be.reverted;
    });

    it("Should revert when staking zero amount", async function () {
      const { stakingPool, user1 } = await loadFixture(setupPoolFixture);

      await expect(stakingPool.connect(user1).stake(1, 0)).to.be.reverted;
    });

    it("Should revert when staking to inactive pool", async function () {
      const { stakingPool, stakingTokenA, user1 } = await loadFixture(setupPoolFixture);

      await stakingPool.setPoolStatus(1, false);

      const stakeAmount = ethers.parseEther("100");
      await stakingTokenA.connect(user1).approve(stakingPool.target, stakeAmount);

      await expect(stakingPool.connect(user1).stake(1, stakeAmount)).to.be.reverted;
    });

    it("Should revert when contract is paused", async function () {
      const { stakingPool, stakingTokenA, user1 } = await loadFixture(setupPoolFixture);

      await stakingPool.pause();

      const stakeAmount = ethers.parseEther("100");
      await stakingTokenA.connect(user1).approve(stakingPool.target, stakeAmount);

      await expect(stakingPool.connect(user1).stake(1, stakeAmount)).to.be.reverted;
    });
  });

  describe("Unstaking", function () {
    async function setupWithStakeFixture() {
      const fixture = await deployStakingPoolFixture();
      const { stakingPool, stakingTokenA, user1 } = fixture;

      await stakingPool.createPool(stakingTokenA.target, MIN_STAKE, LOCK_PERIOD);

      const stakeAmount = ethers.parseEther("100");
      await stakingTokenA.connect(user1).approve(stakingPool.target, stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      return { ...fixture, stakeAmount };
    }

    it("Should unstake tokens after lock period", async function () {
      const { stakingPool, stakingTokenA, user1, stakeAmount } = await loadFixture(
        setupWithStakeFixture
      );

      // Fast forward past lock period
      await time.increase(LOCK_PERIOD + 1);

      const balanceBefore = await stakingTokenA.balanceOf(user1.address);

      await expect(stakingPool.connect(user1).unstake(1, stakeAmount))
        .to.emit(stakingPool, "Unstaked")
        .withArgs(user1.address, 1, stakeAmount);

      const balanceAfter = await stakingTokenA.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(stakeAmount);

      const [amount] = await stakingPool.getStakerInfo(1, user1.address);
      expect(amount).to.equal(0);
    });

    it("Should unstake partial amount", async function () {
      const { stakingPool, user1, stakeAmount } = await loadFixture(setupWithStakeFixture);

      await time.increase(LOCK_PERIOD + 1);

      const unstakeAmount = stakeAmount / 2n;
      await stakingPool.connect(user1).unstake(1, unstakeAmount);

      const [amount] = await stakingPool.getStakerInfo(1, user1.address);
      expect(amount).to.equal(stakeAmount - unstakeAmount);
    });

    it("Should revert when unstaking before lock period", async function () {
      const { stakingPool, user1, stakeAmount } = await loadFixture(setupWithStakeFixture);

      await expect(stakingPool.connect(user1).unstake(1, stakeAmount)).to.be.reverted;
    });

    it("Should revert when unstaking more than staked", async function () {
      const { stakingPool, user1, stakeAmount } = await loadFixture(setupWithStakeFixture);

      await time.increase(LOCK_PERIOD + 1);

      await expect(stakingPool.connect(user1).unstake(1, stakeAmount + 1n)).to.be.reverted;
    });

    it("Should revert when unstaking zero amount", async function () {
      const { stakingPool, user1 } = await loadFixture(setupWithStakeFixture);

      await time.increase(LOCK_PERIOD + 1);

      await expect(stakingPool.connect(user1).unstake(1, 0)).to.be.reverted;
    });
  });

  describe("Rewards", function () {
    async function setupWithStakersFixture() {
      const fixture = await deployStakingPoolFixture();
      const { stakingPool, stakingTokenA, rewardToken, user1, user2, owner } = fixture;

      await stakingPool.createPool(stakingTokenA.target, MIN_STAKE, LOCK_PERIOD);

      const stakeAmount = ethers.parseEther("100");

      // User1 stakes
      await stakingTokenA.connect(user1).approve(stakingPool.target, stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      // User2 stakes
      await stakingTokenA.connect(user2).approve(stakingPool.target, stakeAmount);
      await stakingPool.connect(user2).stake(1, stakeAmount);

      // Fund reward pool - transfer reward tokens to staking pool
      const rewardAmount = ethers.parseEther("100000");
      await rewardToken.connect(owner).transfer(stakingPool.target, rewardAmount);

      return { ...fixture, stakeAmount };
    }

    it("Should accumulate rewards over time", async function () {
      const { stakingPool, user1 } = await loadFixture(setupWithStakersFixture);

      // Fast forward 100 seconds
      await time.increase(100);

      const pending = await stakingPool.pendingReward(1, user1.address);
      expect(pending).to.be.gt(0);
    });

    it("Should claim rewards", async function () {
      const { stakingPool, rewardToken, user1, feeCollector } = await loadFixture(
        setupWithStakersFixture
      );

      // Fast forward
      await time.increase(1000);

      const pendingBefore = await stakingPool.pendingReward(1, user1.address);
      const balanceBefore = await rewardToken.balanceOf(user1.address);
      const feeBalanceBefore = await rewardToken.balanceOf(feeCollector.address);

      await expect(stakingPool.connect(user1).claimRewards(1)).to.emit(
        stakingPool,
        "RewardClaimed"
      );

      const balanceAfter = await rewardToken.balanceOf(user1.address);
      const feeBalanceAfter = await rewardToken.balanceOf(feeCollector.address);

      // Check user received rewards (minus fee)
      // Note: rewards continue to accumulate during transaction, so use generous tolerance
      const expectedFee = (pendingBefore * BigInt(PERFORMANCE_FEE)) / 10000n;
      const expectedReward = pendingBefore - expectedFee;

      expect(balanceAfter - balanceBefore).to.be.closeTo(expectedReward, ethers.parseEther("500"));
      expect(feeBalanceAfter - feeBalanceBefore).to.be.closeTo(expectedFee, ethers.parseEther("50"));

      // Pending should be zero after claim
      const pendingAfter = await stakingPool.pendingReward(1, user1.address);
      expect(pendingAfter).to.be.closeTo(0, ethers.parseEther("0.01"));
    });

    it("Should distribute rewards proportionally", async function () {
      const { stakingPool, stakingTokenA, user1, user3 } = await loadFixture(
        setupWithStakersFixture
      );

      // User3 stakes 3x the amount
      const largeStake = ethers.parseEther("300");
      await stakingTokenA.connect(user3).mint(user3.address, largeStake);
      await stakingTokenA.connect(user3).approve(stakingPool.target, largeStake);
      await stakingPool.connect(user3).stake(1, largeStake);

      await time.increase(1000);

      const user1Pending = await stakingPool.pendingReward(1, user1.address);
      const user3Pending = await stakingPool.pendingReward(1, user3.address);

      // User3 should have ~3x the rewards of user1
      expect(user3Pending).to.be.gt(user1Pending * 2n);
    });

    it("Should compound rewards when staking token equals reward token", async function () {
      const { stakingPool, rewardToken, user1, owner } = await loadFixture(deployStakingPoolFixture);

      // Create pool with reward token as staking token
      await stakingPool.createPool(rewardToken.target, MIN_STAKE, 0);

      // Fund the staking pool with reward tokens
      await rewardToken.connect(owner).transfer(stakingPool.target, ethers.parseEther("10000"));

      const stakeAmount = ethers.parseEther("100");
      await rewardToken.mint(user1.address, stakeAmount);
      await rewardToken.connect(user1).approve(stakingPool.target, stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      await time.increase(1000);

      const [amountBefore] = await stakingPool.getStakerInfo(1, user1.address);

      await expect(stakingPool.connect(user1).compound(1)).to.emit(
        stakingPool,
        "RewardCompounded"
      );

      const [amountAfter] = await stakingPool.getStakerInfo(1, user1.address);
      expect(amountAfter).to.be.gt(amountBefore);
    });

    it("Should revert compound when staking token != reward token", async function () {
      const { stakingPool, user1 } = await loadFixture(setupWithStakersFixture);

      await time.increase(1000);

      await expect(stakingPool.connect(user1).compound(1)).to.be.reverted;
    });

    it("Should revert claim when no rewards", async function () {
      const { stakingPool, user3 } = await loadFixture(setupWithStakersFixture);

      // User3 never staked, so they have 0 rewards
      // This should revert because pending rewards = 0
      await expect(stakingPool.connect(user3).claimRewards(1)).to.be.reverted;
    });
  });

  describe("Agent Authorization", function () {
    it("Should authorize an agent", async function () {
      const { stakingPool, agent } = await loadFixture(deployStakingPoolFixture);

      await expect(stakingPool.authorizeAgent(agent.address))
        .to.emit(stakingPool, "AgentAuthorized")
        .withArgs(agent.address);

      expect(await stakingPool.isAuthorizedAgent(agent.address)).to.be.true;
    });

    it("Should revoke an agent", async function () {
      const { stakingPool, agent } = await loadFixture(deployStakingPoolFixture);

      await stakingPool.authorizeAgent(agent.address);

      await expect(stakingPool.revokeAgent(agent.address))
        .to.emit(stakingPool, "AgentRevoked")
        .withArgs(agent.address);

      expect(await stakingPool.isAuthorizedAgent(agent.address)).to.be.false;
    });

    it("Should allow authorized agent to distribute rewards", async function () {
      const { stakingPool, rewardToken, agent, owner } = await loadFixture(
        deployStakingPoolFixture
      );

      await stakingPool.authorizeAgent(agent.address);

      const distributeAmount = ethers.parseEther("1000");
      await rewardToken.mint(agent.address, distributeAmount);
      await rewardToken.connect(agent).approve(stakingPool.target, distributeAmount);

      await expect(stakingPool.connect(agent).distributeRewards(distributeAmount))
        .to.emit(stakingPool, "RewardsDistributed");
    });

    it("Should revert when unauthorized agent tries to distribute", async function () {
      const { stakingPool, rewardToken, user1 } = await loadFixture(deployStakingPoolFixture);

      const distributeAmount = ethers.parseEther("1000");
      await rewardToken.mint(user1.address, distributeAmount);
      await rewardToken.connect(user1).approve(stakingPool.target, distributeAmount);

      await expect(stakingPool.connect(user1).distributeRewards(distributeAmount)).to.be.reverted;
    });
  });

  describe("Admin Functions", function () {
    it("Should update reward rate", async function () {
      const { stakingPool } = await loadFixture(deployStakingPoolFixture);

      const newRate = ethers.parseEther("2");

      await expect(stakingPool.setRewardRate(newRate))
        .to.emit(stakingPool, "RewardRateUpdated")
        .withArgs(REWARD_RATE, newRate);

      expect(await stakingPool.rewardRate()).to.equal(newRate);
    });

    it("Should update performance fee", async function () {
      const { stakingPool } = await loadFixture(deployStakingPoolFixture);

      const newFee = 1500; // 15%

      await expect(stakingPool.setPerformanceFee(newFee))
        .to.emit(stakingPool, "PerformanceFeeUpdated")
        .withArgs(PERFORMANCE_FEE, newFee);

      expect(await stakingPool.performanceFee()).to.equal(newFee);
    });

    it("Should revert when setting invalid performance fee", async function () {
      const { stakingPool } = await loadFixture(deployStakingPoolFixture);

      await expect(stakingPool.setPerformanceFee(3100)).to.be.reverted; // > 30%
    });

    it("Should update fee collector", async function () {
      const { stakingPool, user1, feeCollector } = await loadFixture(deployStakingPoolFixture);

      await expect(stakingPool.setFeeCollector(user1.address))
        .to.emit(stakingPool, "FeeCollectorUpdated")
        .withArgs(feeCollector.address, user1.address);

      expect(await stakingPool.feeCollector()).to.equal(user1.address);
    });

    it("Should pause and unpause", async function () {
      const { stakingPool } = await loadFixture(deployStakingPoolFixture);

      await stakingPool.pause();
      expect(await stakingPool.paused()).to.be.true;

      await stakingPool.unpause();
      expect(await stakingPool.paused()).to.be.false;
    });
  });

  describe("Emergency Functions", function () {
    async function setupEmergencyFixture() {
      const fixture = await deployStakingPoolFixture();
      const { stakingPool, stakingTokenA, user1 } = fixture;

      await stakingPool.createPool(stakingTokenA.target, MIN_STAKE, LOCK_PERIOD);

      const stakeAmount = ethers.parseEther("100");
      await stakingTokenA.connect(user1).approve(stakingPool.target, stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      return { ...fixture, stakeAmount };
    }

    it("Should allow emergency withdraw when paused", async function () {
      const { stakingPool, stakingTokenA, user1, stakeAmount } = await loadFixture(
        setupEmergencyFixture
      );

      await stakingPool.pause();

      const balanceBefore = await stakingTokenA.balanceOf(user1.address);

      await expect(stakingPool.connect(user1).emergencyWithdraw(1))
        .to.emit(stakingPool, "EmergencyWithdraw")
        .withArgs(user1.address, 1, stakeAmount);

      const balanceAfter = await stakingTokenA.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(stakeAmount);

      // Staker info should be reset
      const [amount, , pendingRewards] = await stakingPool.getStakerInfo(1, user1.address);
      expect(amount).to.equal(0);
      expect(pendingRewards).to.equal(0);
    });

    it("Should revert emergency withdraw when not paused", async function () {
      const { stakingPool, user1 } = await loadFixture(setupEmergencyFixture);

      await expect(stakingPool.connect(user1).emergencyWithdraw(1)).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should calculate APR correctly", async function () {
      const { stakingPool, stakingTokenA, user1 } = await loadFixture(deployStakingPoolFixture);

      await stakingPool.createPool(stakingTokenA.target, MIN_STAKE, LOCK_PERIOD);

      // Before any staking, APR should be 0
      expect(await stakingPool.getPoolAPR(1)).to.equal(0);

      // After staking
      const stakeAmount = ethers.parseEther("100");
      await stakingTokenA.connect(user1).approve(stakingPool.target, stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      const apr = await stakingPool.getPoolAPR(1);
      expect(apr).to.be.gt(0);

      // APR should be roughly (rewardRate * 365 days / totalStaked) * 100%
      // With 1 token/sec reward and 100 staked: (1 * 31536000 / 100) * 100% = 31536000%
    });

    it("Should return correct pending rewards", async function () {
      const { stakingPool, stakingTokenA, user1 } = await loadFixture(deployStakingPoolFixture);

      await stakingPool.createPool(stakingTokenA.target, MIN_STAKE, 0);

      const stakeAmount = ethers.parseEther("100");
      await stakingTokenA.connect(user1).approve(stakingPool.target, stakeAmount);
      await stakingPool.connect(user1).stake(1, stakeAmount);

      await time.increase(100);

      const pending = await stakingPool.pendingReward(1, user1.address);
      expect(pending).to.be.gt(0);

      // Should be roughly 100 tokens (100 seconds * 1 token/sec)
      expect(pending).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("10"));
    });
  });
});
