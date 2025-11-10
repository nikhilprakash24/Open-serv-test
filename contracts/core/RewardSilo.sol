// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RewardSilo
 * @notice Managed reward vault system for staking pools
 * @dev Allows pool managers and AI agents to top off rewards for specific staking pools.
 *      Silos can be loaded with rewards and distributed over time to staking pools.
 */
contract RewardSilo is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct Silo {
        IERC20 rewardToken;          // Token used for rewards
        uint256 totalDeposited;      // Total rewards deposited
        uint256 totalDistributed;    // Total rewards distributed
        uint256 availableBalance;    // Current available balance
        uint256 distributionRate;    // Tokens per second to distribute
        uint256 lastUpdateTime;      // Last distribution update
        address targetPool;          // StakingPool to distribute to
        bool isActive;               // Whether silo is active
        string name;                 // Human-readable name
    }

    // ============ State Variables ============

    /// @notice Mapping from silo ID to silo details
    mapping(uint256 => Silo) public silos;

    /// @notice Array of all silo IDs
    uint256[] public siloIds;

    /// @notice Next silo ID
    uint256 public nextSiloId;

    /// @notice Authorized managers who can create and manage silos
    mapping(address => bool) public authorizedManagers;

    /// @notice Authorized AI agents who can distribute rewards
    mapping(address => bool) public authorizedAgents;

    /// @notice Minimum distribution rate (to prevent dust)
    uint256 public constant MIN_DISTRIBUTION_RATE = 0.001 ether;

    /// @notice Maximum distribution rate (safety check)
    uint256 public constant MAX_DISTRIBUTION_RATE = 1000 ether;

    // ============ Events ============

    event SiloCreated(uint256 indexed siloId, address indexed rewardToken, string name);
    event SiloFunded(uint256 indexed siloId, uint256 amount, uint256 newBalance);
    event RewardsDistributed(uint256 indexed siloId, address indexed targetPool, uint256 amount);
    event DistributionRateUpdated(uint256 indexed siloId, uint256 oldRate, uint256 newRate);
    event SiloStatusChanged(uint256 indexed siloId, bool isActive);
    event ManagerAuthorized(address indexed manager);
    event ManagerRevoked(address indexed manager);
    event AgentAuthorized(address indexed agent);
    event AgentRevoked(address indexed agent);
    event EmergencyWithdraw(uint256 indexed siloId, uint256 amount);

    // ============ Errors ============

    error Unauthorized();
    error SiloNotFound();
    error SiloNotActive();
    error InvalidAmount();
    error InvalidRate();
    error InsufficientBalance();
    error ZeroAddress();
    error InvalidName();

    // ============ Modifiers ============

    modifier onlyManagerOrOwner() {
        if (!authorizedManagers[msg.sender] && msg.sender != owner()) revert Unauthorized();
        _;
    }

    modifier onlyAgentOrManager() {
        if (!authorizedAgents[msg.sender] && !authorizedManagers[msg.sender] && msg.sender != owner()) {
            revert Unauthorized();
        }
        _;
    }

    modifier validSilo(uint256 siloId) {
        if (address(silos[siloId].rewardToken) == address(0)) revert SiloNotFound();
        _;
    }

    modifier activeSilo(uint256 siloId) {
        if (!silos[siloId].isActive) revert SiloNotActive();
        _;
    }

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {
        nextSiloId = 1;
    }

    // ============ Silo Management ============

    /**
     * @notice Create a new reward silo
     * @param rewardToken Token to use for rewards
     * @param targetPool StakingPool address to distribute rewards to
     * @param distributionRate Initial distribution rate (tokens per second)
     * @param name Human-readable name for the silo
     */
    function createSilo(
        address rewardToken,
        address targetPool,
        uint256 distributionRate,
        string memory name
    ) external onlyManagerOrOwner returns (uint256 siloId) {
        if (rewardToken == address(0)) revert ZeroAddress();
        if (targetPool == address(0)) revert ZeroAddress();
        if (bytes(name).length == 0) revert InvalidName();
        if (distributionRate < MIN_DISTRIBUTION_RATE || distributionRate > MAX_DISTRIBUTION_RATE) {
            revert InvalidRate();
        }

        siloId = nextSiloId++;

        silos[siloId] = Silo({
            rewardToken: IERC20(rewardToken),
            totalDeposited: 0,
            totalDistributed: 0,
            availableBalance: 0,
            distributionRate: distributionRate,
            lastUpdateTime: block.timestamp,
            targetPool: targetPool,
            isActive: true,
            name: name
        });

        siloIds.push(siloId);

        emit SiloCreated(siloId, rewardToken, name);
    }

    /**
     * @notice Fund a silo with reward tokens (top off)
     * @param siloId ID of the silo to fund
     * @param amount Amount of reward tokens to deposit
     */
    function fundSilo(uint256 siloId, uint256 amount)
        external
        nonReentrant
        whenNotPaused
        validSilo(siloId)
        onlyManagerOrOwner
    {
        if (amount == 0) revert InvalidAmount();

        Silo storage silo = silos[siloId];

        // Transfer tokens from sender
        silo.rewardToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update silo balances
        silo.totalDeposited += amount;
        silo.availableBalance += amount;

        emit SiloFunded(siloId, amount, silo.availableBalance);
    }

    /**
     * @notice Distribute rewards from silo to target staking pool
     * @param siloId ID of the silo to distribute from
     * @return distributedAmount Amount of rewards distributed
     */
    function distributeRewards(uint256 siloId)
        external
        nonReentrant
        whenNotPaused
        validSilo(siloId)
        activeSilo(siloId)
        onlyAgentOrManager
        returns (uint256 distributedAmount)
    {
        Silo storage silo = silos[siloId];

        // Calculate how much should be distributed based on time elapsed
        uint256 timeElapsed = block.timestamp - silo.lastUpdateTime;
        distributedAmount = timeElapsed * silo.distributionRate;

        // Cap at available balance
        if (distributedAmount > silo.availableBalance) {
            distributedAmount = silo.availableBalance;
        }

        if (distributedAmount == 0) revert InvalidAmount();

        // Update silo state
        silo.availableBalance -= distributedAmount;
        silo.totalDistributed += distributedAmount;
        silo.lastUpdateTime = block.timestamp;

        // Transfer rewards to target pool
        silo.rewardToken.safeTransfer(silo.targetPool, distributedAmount);

        emit RewardsDistributed(siloId, silo.targetPool, distributedAmount);
    }

    /**
     * @notice Update distribution rate for a silo
     * @param siloId ID of the silo
     * @param newRate New distribution rate (tokens per second)
     */
    function updateDistributionRate(uint256 siloId, uint256 newRate)
        external
        onlyManagerOrOwner
        validSilo(siloId)
    {
        if (newRate < MIN_DISTRIBUTION_RATE || newRate > MAX_DISTRIBUTION_RATE) {
            revert InvalidRate();
        }

        Silo storage silo = silos[siloId];
        uint256 oldRate = silo.distributionRate;

        silo.distributionRate = newRate;
        silo.lastUpdateTime = block.timestamp;

        emit DistributionRateUpdated(siloId, oldRate, newRate);
    }

    /**
     * @notice Set silo active status
     * @param siloId ID of the silo
     * @param isActive Whether silo should be active
     */
    function setSiloStatus(uint256 siloId, bool isActive)
        external
        onlyManagerOrOwner
        validSilo(siloId)
    {
        silos[siloId].isActive = isActive;
        emit SiloStatusChanged(siloId, isActive);
    }

    // ============ Authorization Management ============

    /**
     * @notice Authorize a manager
     * @param manager Address to authorize
     */
    function authorizeManager(address manager) external onlyOwner {
        if (manager == address(0)) revert ZeroAddress();
        authorizedManagers[manager] = true;
        emit ManagerAuthorized(manager);
    }

    /**
     * @notice Revoke a manager's authorization
     * @param manager Address to revoke
     */
    function revokeManager(address manager) external onlyOwner {
        authorizedManagers[manager] = false;
        emit ManagerRevoked(manager);
    }

    /**
     * @notice Authorize an AI agent
     * @param agent Address to authorize
     */
    function authorizeAgent(address agent) external onlyOwner {
        if (agent == address(0)) revert ZeroAddress();
        authorizedAgents[agent] = true;
        emit AgentAuthorized(agent);
    }

    /**
     * @notice Revoke an AI agent's authorization
     * @param agent Address to revoke
     */
    function revokeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = false;
        emit AgentRevoked(agent);
    }

    // ============ Emergency Functions ============

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
     * @notice Emergency withdraw from a silo (only when paused)
     * @param siloId ID of the silo
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 siloId, uint256 amount)
        external
        onlyOwner
        validSilo(siloId)
    {
        if (!paused()) revert Unauthorized();
        if (amount == 0) revert InvalidAmount();

        Silo storage silo = silos[siloId];
        if (amount > silo.availableBalance) revert InsufficientBalance();

        silo.availableBalance -= amount;
        silo.rewardToken.safeTransfer(owner(), amount);

        emit EmergencyWithdraw(siloId, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get pending distribution amount for a silo
     * @param siloId ID of the silo
     * @return Pending amount that can be distributed
     */
    function getPendingDistribution(uint256 siloId) external view validSilo(siloId) returns (uint256) {
        Silo storage silo = silos[siloId];

        if (!silo.isActive) return 0;

        uint256 timeElapsed = block.timestamp - silo.lastUpdateTime;
        uint256 pendingAmount = timeElapsed * silo.distributionRate;

        return pendingAmount > silo.availableBalance ? silo.availableBalance : pendingAmount;
    }

    /**
     * @notice Get estimated days until silo is empty
     * @param siloId ID of the silo
     * @return Days until empty (0 if already empty or not distributing)
     */
    function getDaysUntilEmpty(uint256 siloId) external view validSilo(siloId) returns (uint256) {
        Silo storage silo = silos[siloId];

        if (silo.availableBalance == 0 || silo.distributionRate == 0 || !silo.isActive) {
            return 0;
        }

        uint256 secondsUntilEmpty = silo.availableBalance / silo.distributionRate;
        return secondsUntilEmpty / 1 days;
    }

    /**
     * @notice Get silo details
     * @param siloId ID of the silo
     */
    function getSiloInfo(uint256 siloId)
        external
        view
        validSilo(siloId)
        returns (
            address rewardToken,
            uint256 totalDeposited,
            uint256 totalDistributed,
            uint256 availableBalance,
            uint256 distributionRate,
            uint256 lastUpdateTime,
            address targetPool,
            bool isActive,
            string memory name
        )
    {
        Silo storage silo = silos[siloId];
        return (
            address(silo.rewardToken),
            silo.totalDeposited,
            silo.totalDistributed,
            silo.availableBalance,
            silo.distributionRate,
            silo.lastUpdateTime,
            silo.targetPool,
            silo.isActive,
            silo.name
        );
    }

    /**
     * @notice Get all silo IDs
     */
    function getAllSiloIds() external view returns (uint256[] memory) {
        return siloIds;
    }

    /**
     * @notice Get number of silos
     */
    function getSiloCount() external view returns (uint256) {
        return siloIds.length;
    }

    /**
     * @notice Check if an address is an authorized manager
     */
    function isAuthorizedManager(address manager) external view returns (bool) {
        return authorizedManagers[manager];
    }

    /**
     * @notice Check if an address is an authorized agent
     */
    function isAuthorizedAgent(address agent) external view returns (bool) {
        return authorizedAgents[agent];
    }
}
