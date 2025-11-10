// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title StakingPool
 * @notice AI-managed staking pool for multiple assets with automated yield optimization
 * @dev Users stake assets to earn rewards. AI agents optimize yield allocation across DeFi protocols.
 */
contract StakingPool is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct StakerInfo {
        uint256 amount;              // Amount staked
        uint256 rewardDebt;          // Reward debt for calculation
        uint256 pendingRewards;      // Unclaimed rewards
        uint256 lastStakeTime;       // Timestamp of last stake
    }

    struct PoolInfo {
        IERC20 stakingToken;         // Token to be staked
        uint256 totalStaked;         // Total amount staked in pool
        uint256 rewardPerShare;      // Accumulated reward per share (scaled by 1e18)
        uint256 lastRewardTime;      // Last time rewards were distributed
        uint256 minStakeAmount;      // Minimum stake amount
        uint256 unstakeLockPeriod;   // Lock period before unstaking (seconds)
        bool isActive;               // Whether pool is active
    }

    // ============ State Variables ============

    /// @notice Reward token (same for all pools)
    IERC20 public rewardToken;

    /// @notice Array of pool IDs
    uint256[] public poolIds;

    /// @notice Pool ID counter
    uint256 public nextPoolId;

    /// @notice Mapping from pool ID to pool info
    mapping(uint256 => PoolInfo) public pools;

    /// @notice Mapping from pool ID => staker address => staker info
    mapping(uint256 => mapping(address => StakerInfo)) public stakers;

    /// @notice Authorized AI agents that can execute yield strategies
    mapping(address => bool) public authorizedAgents;

    /// @notice Reward rate per second (tokens per second)
    uint256 public rewardRate;

    /// @notice Performance fee in basis points (e.g., 1000 = 10%)
    uint256 public performanceFee;

    /// @notice Fee collector address
    address public feeCollector;

    /// @notice Total rewards distributed
    uint256 public totalRewardsDistributed;

    /// @notice Precision multiplier for calculations
    uint256 public constant PRECISION = 1e18;

    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice Maximum performance fee (30%)
    uint256 public constant MAX_PERFORMANCE_FEE = 3000;

    // ============ Events ============

    event PoolCreated(uint256 indexed poolId, address indexed stakingToken, uint256 minStakeAmount);
    event PoolUpdated(uint256 indexed poolId, uint256 minStakeAmount, uint256 unstakeLockPeriod);
    event PoolStatusChanged(uint256 indexed poolId, bool isActive);
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount);
    event RewardClaimed(address indexed user, uint256 indexed poolId, uint256 amount);
    event RewardCompounded(address indexed user, uint256 indexed poolId, uint256 amount);
    event RewardsDistributed(uint256 amount, uint256 timestamp);
    event AgentAuthorized(address indexed agent);
    event AgentRevoked(address indexed agent);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address oldCollector, address newCollector);
    event EmergencyWithdraw(address indexed user, uint256 indexed poolId, uint256 amount);

    // ============ Errors ============

    error Unauthorized();
    error PoolNotFound();
    error PoolNotActive();
    error InvalidAmount();
    error BelowMinimumStake();
    error InsufficientStaked();
    error StakeLocked();
    error InvalidFee();
    error ZeroAddress();
    error PoolAlreadyExists();

    // ============ Modifiers ============

    modifier onlyAuthorizedAgent() {
        if (!authorizedAgents[msg.sender]) revert Unauthorized();
        _;
    }

    modifier validPool(uint256 poolId) {
        if (address(pools[poolId].stakingToken) == address(0)) revert PoolNotFound();
        _;
    }

    modifier activePool(uint256 poolId) {
        if (!pools[poolId].isActive) revert PoolNotActive();
        _;
    }

    // ============ Constructor ============

    constructor(
        address _rewardToken,
        uint256 _rewardRate,
        uint256 _performanceFee,
        address _feeCollector
    ) Ownable(msg.sender) {
        if (_rewardToken == address(0)) revert ZeroAddress();
        if (_feeCollector == address(0)) revert ZeroAddress();
        if (_performanceFee > MAX_PERFORMANCE_FEE) revert InvalidFee();

        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
        performanceFee = _performanceFee;
        feeCollector = _feeCollector;
        nextPoolId = 1;
    }

    // ============ Pool Management Functions ============

    /**
     * @notice Create a new staking pool
     * @param stakingToken Token to be staked
     * @param minStakeAmount Minimum amount that can be staked
     * @param unstakeLockPeriod Lock period before unstaking (in seconds)
     */
    function createPool(
        address stakingToken,
        uint256 minStakeAmount,
        uint256 unstakeLockPeriod
    ) external onlyOwner returns (uint256 poolId) {
        if (stakingToken == address(0)) revert ZeroAddress();

        poolId = nextPoolId++;

        pools[poolId] = PoolInfo({
            stakingToken: IERC20(stakingToken),
            totalStaked: 0,
            rewardPerShare: 0,
            lastRewardTime: block.timestamp,
            minStakeAmount: minStakeAmount,
            unstakeLockPeriod: unstakeLockPeriod,
            isActive: true
        });

        poolIds.push(poolId);

        emit PoolCreated(poolId, stakingToken, minStakeAmount);
    }

    /**
     * @notice Update pool parameters
     * @param poolId Pool ID
     * @param minStakeAmount New minimum stake amount
     * @param unstakeLockPeriod New unstake lock period
     */
    function updatePool(
        uint256 poolId,
        uint256 minStakeAmount,
        uint256 unstakeLockPeriod
    ) external onlyOwner validPool(poolId) {
        pools[poolId].minStakeAmount = minStakeAmount;
        pools[poolId].unstakeLockPeriod = unstakeLockPeriod;

        emit PoolUpdated(poolId, minStakeAmount, unstakeLockPeriod);
    }

    /**
     * @notice Set pool active status
     * @param poolId Pool ID
     * @param isActive Whether pool should be active
     */
    function setPoolStatus(uint256 poolId, bool isActive) external onlyOwner validPool(poolId) {
        pools[poolId].isActive = isActive;
        emit PoolStatusChanged(poolId, isActive);
    }

    // ============ Staking Functions ============

    /**
     * @notice Stake tokens in a pool
     * @param poolId Pool ID
     * @param amount Amount to stake
     */
    function stake(uint256 poolId, uint256 amount)
        external
        nonReentrant
        whenNotPaused
        validPool(poolId)
        activePool(poolId)
    {
        if (amount == 0) revert InvalidAmount();
        if (amount < pools[poolId].minStakeAmount) revert BelowMinimumStake();

        _updatePool(poolId);

        StakerInfo storage staker = stakers[poolId][msg.sender];
        PoolInfo storage pool = pools[poolId];

        // If user already has stake, harvest pending rewards
        if (staker.amount > 0) {
            uint256 pending = (staker.amount * pool.rewardPerShare) / PRECISION - staker.rewardDebt;
            if (pending > 0) {
                staker.pendingRewards += pending;
            }
        }

        // Transfer tokens from user
        pool.stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update staker info
        staker.amount += amount;
        staker.rewardDebt = (staker.amount * pool.rewardPerShare) / PRECISION;
        staker.lastStakeTime = block.timestamp;

        // Update pool info
        pool.totalStaked += amount;

        emit Staked(msg.sender, poolId, amount);
    }

    /**
     * @notice Unstake tokens from a pool
     * @param poolId Pool ID
     * @param amount Amount to unstake
     */
    function unstake(uint256 poolId, uint256 amount)
        external
        nonReentrant
        validPool(poolId)
    {
        StakerInfo storage staker = stakers[poolId][msg.sender];

        if (amount == 0) revert InvalidAmount();
        if (staker.amount < amount) revert InsufficientStaked();

        // Check lock period
        if (block.timestamp < staker.lastStakeTime + pools[poolId].unstakeLockPeriod) {
            revert StakeLocked();
        }

        _updatePool(poolId);

        PoolInfo storage pool = pools[poolId];

        // Calculate pending rewards
        uint256 pending = (staker.amount * pool.rewardPerShare) / PRECISION - staker.rewardDebt;
        if (pending > 0) {
            staker.pendingRewards += pending;
        }

        // Update staker info
        staker.amount -= amount;
        staker.rewardDebt = (staker.amount * pool.rewardPerShare) / PRECISION;

        // Update pool info
        pool.totalStaked -= amount;

        // Transfer tokens back to user
        pool.stakingToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, poolId, amount);
    }

    /**
     * @notice Claim pending rewards
     * @param poolId Pool ID
     */
    function claimRewards(uint256 poolId)
        external
        nonReentrant
        validPool(poolId)
    {
        _updatePool(poolId);

        StakerInfo storage staker = stakers[poolId][msg.sender];
        PoolInfo storage pool = pools[poolId];

        // Calculate pending rewards
        uint256 pending = (staker.amount * pool.rewardPerShare) / PRECISION - staker.rewardDebt;
        uint256 totalRewards = staker.pendingRewards + pending;

        if (totalRewards == 0) revert InvalidAmount();

        // Calculate and deduct performance fee
        uint256 fee = (totalRewards * performanceFee) / BASIS_POINTS;
        uint256 userReward = totalRewards - fee;

        // Reset pending rewards and update reward debt
        staker.pendingRewards = 0;
        staker.rewardDebt = (staker.amount * pool.rewardPerShare) / PRECISION;

        // Transfer rewards
        if (fee > 0) {
            rewardToken.safeTransfer(feeCollector, fee);
        }
        rewardToken.safeTransfer(msg.sender, userReward);

        totalRewardsDistributed += totalRewards;

        emit RewardClaimed(msg.sender, poolId, userReward);
    }

    /**
     * @notice Compound rewards back into staking
     * @param poolId Pool ID
     */
    function compound(uint256 poolId)
        external
        nonReentrant
        whenNotPaused
        validPool(poolId)
        activePool(poolId)
    {
        // Only works if staking token == reward token
        if (address(pools[poolId].stakingToken) != address(rewardToken)) revert InvalidAmount();

        _updatePool(poolId);

        StakerInfo storage staker = stakers[poolId][msg.sender];
        PoolInfo storage pool = pools[poolId];

        // Calculate pending rewards
        uint256 pending = (staker.amount * pool.rewardPerShare) / PRECISION - staker.rewardDebt;
        uint256 totalRewards = staker.pendingRewards + pending;

        if (totalRewards == 0) revert InvalidAmount();

        // Calculate fee
        uint256 fee = (totalRewards * performanceFee) / BASIS_POINTS;
        uint256 compoundAmount = totalRewards - fee;

        // Reset pending rewards
        staker.pendingRewards = 0;

        // Update staker amount
        staker.amount += compoundAmount;
        staker.rewardDebt = (staker.amount * pool.rewardPerShare) / PRECISION;

        // Update pool total
        pool.totalStaked += compoundAmount;

        // Transfer fee
        if (fee > 0) {
            rewardToken.safeTransfer(feeCollector, fee);
        }

        emit RewardCompounded(msg.sender, poolId, compoundAmount);
    }

    // ============ Reward Distribution ============

    /**
     * @notice Update pool reward variables
     * @param poolId Pool ID
     */
    function _updatePool(uint256 poolId) internal {
        PoolInfo storage pool = pools[poolId];

        if (block.timestamp <= pool.lastRewardTime) {
            return;
        }

        if (pool.totalStaked == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }

        uint256 timeElapsed = block.timestamp - pool.lastRewardTime;
        uint256 reward = timeElapsed * rewardRate;

        pool.rewardPerShare += (reward * PRECISION) / pool.totalStaked;
        pool.lastRewardTime = block.timestamp;
    }

    /**
     * @notice Distribute rewards to all pools (called by AI agents or owner)
     * @param amount Amount of reward tokens to distribute
     */
    function distributeRewards(uint256 amount) external onlyAuthorizedAgent {
        if (amount == 0) revert InvalidAmount();

        // Transfer reward tokens to contract
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);

        emit RewardsDistributed(amount, block.timestamp);
    }

    // ============ AI Agent Functions ============

    /**
     * @notice Authorize an AI agent
     * @param agent Address of the agent to authorize
     */
    function authorizeAgent(address agent) external onlyOwner {
        if (agent == address(0)) revert ZeroAddress();
        authorizedAgents[agent] = true;
        emit AgentAuthorized(agent);
    }

    /**
     * @notice Revoke an AI agent's authorization
     * @param agent Address of the agent to revoke
     */
    function revokeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = false;
        emit AgentRevoked(agent);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update reward rate
     * @param newRate New reward rate per second
     */
    function setRewardRate(uint256 newRate) external onlyOwner {
        uint256 oldRate = rewardRate;
        rewardRate = newRate;
        emit RewardRateUpdated(oldRate, newRate);
    }

    /**
     * @notice Update performance fee
     * @param newFee New performance fee in basis points
     */
    function setPerformanceFee(uint256 newFee) external onlyOwner {
        if (newFee > MAX_PERFORMANCE_FEE) revert InvalidFee();

        uint256 oldFee = performanceFee;
        performanceFee = newFee;
        emit PerformanceFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Update fee collector address
     * @param newCollector New fee collector address
     */
    function setFeeCollector(address newCollector) external onlyOwner {
        if (newCollector == address(0)) revert ZeroAddress();

        address oldCollector = feeCollector;
        feeCollector = newCollector;
        emit FeeCollectorUpdated(oldCollector, newCollector);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdraw (only when paused)
     * @param poolId Pool ID
     */
    function emergencyWithdraw(uint256 poolId) external nonReentrant validPool(poolId) {
        if (!paused()) revert Unauthorized();

        StakerInfo storage staker = stakers[poolId][msg.sender];
        uint256 amount = staker.amount;

        if (amount == 0) revert InvalidAmount();

        PoolInfo storage pool = pools[poolId];

        // Reset staker
        staker.amount = 0;
        staker.rewardDebt = 0;
        staker.pendingRewards = 0;

        // Update pool
        pool.totalStaked -= amount;

        // Transfer tokens (forfeits rewards)
        pool.stakingToken.safeTransfer(msg.sender, amount);

        emit EmergencyWithdraw(msg.sender, poolId, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get pending rewards for a staker
     * @param poolId Pool ID
     * @param staker Staker address
     * @return Pending reward amount
     */
    function pendingReward(uint256 poolId, address staker) external view returns (uint256) {
        PoolInfo storage pool = pools[poolId];
        StakerInfo storage stakerInfo = stakers[poolId][staker];

        uint256 rewardPerShare = pool.rewardPerShare;

        if (block.timestamp > pool.lastRewardTime && pool.totalStaked > 0) {
            uint256 timeElapsed = block.timestamp - pool.lastRewardTime;
            uint256 reward = timeElapsed * rewardRate;
            rewardPerShare += (reward * PRECISION) / pool.totalStaked;
        }

        uint256 pending = (stakerInfo.amount * rewardPerShare) / PRECISION - stakerInfo.rewardDebt;
        return stakerInfo.pendingRewards + pending;
    }

    /**
     * @notice Get staker info
     * @param poolId Pool ID
     * @param staker Staker address
     */
    function getStakerInfo(uint256 poolId, address staker)
        external
        view
        returns (
            uint256 amount,
            uint256 rewardDebt,
            uint256 pendingRewards,
            uint256 lastStakeTime
        )
    {
        StakerInfo storage stakerInfo = stakers[poolId][staker];
        return (
            stakerInfo.amount,
            stakerInfo.rewardDebt,
            stakerInfo.pendingRewards,
            stakerInfo.lastStakeTime
        );
    }

    /**
     * @notice Get pool info
     * @param poolId Pool ID
     */
    function getPoolInfo(uint256 poolId)
        external
        view
        returns (
            address stakingToken,
            uint256 totalStaked,
            uint256 rewardPerShare,
            uint256 lastRewardTime,
            uint256 minStakeAmount,
            uint256 unstakeLockPeriod,
            bool isActive
        )
    {
        PoolInfo storage pool = pools[poolId];
        return (
            address(pool.stakingToken),
            pool.totalStaked,
            pool.rewardPerShare,
            pool.lastRewardTime,
            pool.minStakeAmount,
            pool.unstakeLockPeriod,
            pool.isActive
        );
    }

    /**
     * @notice Get all pool IDs
     */
    function getAllPoolIds() external view returns (uint256[] memory) {
        return poolIds;
    }

    /**
     * @notice Get total number of pools
     */
    function getPoolCount() external view returns (uint256) {
        return poolIds.length;
    }

    /**
     * @notice Check if an address is an authorized agent
     */
    function isAuthorizedAgent(address agent) external view returns (bool) {
        return authorizedAgents[agent];
    }

    /**
     * @notice Get APR for a pool (simplified calculation)
     * @param poolId Pool ID
     * @return APR in basis points (10000 = 100%)
     */
    function getPoolAPR(uint256 poolId) external view validPool(poolId) returns (uint256) {
        PoolInfo storage pool = pools[poolId];

        if (pool.totalStaked == 0) return 0;

        // Annual rewards = rewardRate * seconds in year
        uint256 annualRewards = rewardRate * 365 days;

        // APR = (annual rewards / total staked) * 100%
        return (annualRewards * BASIS_POINTS) / pool.totalStaked;
    }
}
