// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IndexToken
 * @notice An ERC-20 token representing shares in an AI-managed index of crypto assets
 * @dev This contract allows users to mint index tokens by depositing assets,
 *      and burn tokens to withdraw their proportional share of the underlying assets.
 *      The AI agents can rebalance the underlying portfolio through authorized calls.
 */
contract IndexToken is ERC20, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct Asset {
        address token;          // Token address
        uint256 balance;        // Current balance held
        uint256 targetWeight;   // Target weight in basis points (10000 = 100%)
        bool isActive;          // Whether this asset is currently in the index
    }

    // ============ State Variables ============

    /// @notice Array of all assets in the index
    address[] public assetList;

    /// @notice Mapping from token address to asset details
    mapping(address => Asset) public assets;

    /// @notice Authorized AI agent addresses that can execute rebalancing
    mapping(address => bool) public authorizedAgents;

    /// @notice Management fee in basis points (e.g., 200 = 2%)
    uint256 public managementFee;

    /// @notice Performance fee in basis points (e.g., 2000 = 20%)
    uint256 public performanceFee;

    /// @notice Timestamp of last fee collection
    uint256 public lastFeeCollection;

    /// @notice Accumulated fees (in index token terms)
    uint256 public accumulatedFees;

    /// @notice Minimum deposit amount to prevent dust attacks
    uint256 public minDepositAmount;

    /// @notice Maximum number of assets allowed in the index
    uint256 public constant MAX_ASSETS = 20;

    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice Time window for fee collection (1 year in seconds)
    uint256 public constant FEE_COLLECTION_PERIOD = 365 days;

    // ============ Events ============

    event AssetAdded(address indexed token, uint256 targetWeight);
    event AssetRemoved(address indexed token);
    event AssetWeightUpdated(address indexed token, uint256 oldWeight, uint256 newWeight);
    event Minted(address indexed user, uint256 amount, uint256 navPerToken);
    event Burned(address indexed user, uint256 amount, uint256 navPerToken);
    event Rebalanced(address indexed agent, uint256 timestamp);
    event AgentAuthorized(address indexed agent);
    event AgentRevoked(address indexed agent);
    event FeesCollected(uint256 amount);
    event ManagementFeeUpdated(uint256 oldFee, uint256 newFee);
    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);
    event EmergencyWithdraw(address indexed token, uint256 amount);

    // ============ Errors ============

    error Unauthorized();
    error InvalidAsset();
    error AssetAlreadyExists();
    error AssetNotFound();
    error InvalidWeight();
    error TotalWeightMismatch();
    error MaxAssetsReached();
    error InsufficientBalance();
    error BelowMinimumDeposit();
    error InvalidFee();
    error ZeroAddress();
    error ZeroAmount();

    // ============ Modifiers ============

    modifier onlyAuthorizedAgent() {
        if (!authorizedAgents[msg.sender]) revert Unauthorized();
        _;
    }

    // ============ Constructor ============

    constructor(
        string memory name,
        string memory symbol,
        uint256 _managementFee,
        uint256 _performanceFee
    ) ERC20(name, symbol) Ownable(msg.sender) {
        if (_managementFee > 500) revert InvalidFee(); // Max 5%
        if (_performanceFee > 3000) revert InvalidFee(); // Max 30%

        managementFee = _managementFee;
        performanceFee = _performanceFee;
        lastFeeCollection = block.timestamp;
        minDepositAmount = 1e16; // 0.01 tokens minimum
    }

    // ============ Asset Management Functions ============

    /**
     * @notice Add a new asset to the index
     * @param token Address of the ERC20 token to add
     * @param targetWeight Target weight in basis points
     */
    function addAsset(address token, uint256 targetWeight) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (assets[token].isActive) revert AssetAlreadyExists();
        if (assetList.length >= MAX_ASSETS) revert MaxAssetsReached();
        if (targetWeight == 0 || targetWeight > BASIS_POINTS) revert InvalidWeight();

        assets[token] = Asset({
            token: token,
            balance: 0,
            targetWeight: targetWeight,
            isActive: true
        });

        assetList.push(token);
        emit AssetAdded(token, targetWeight);
    }

    /**
     * @notice Remove an asset from the index
     * @param token Address of the token to remove
     */
    function removeAsset(address token) external onlyOwner {
        if (!assets[token].isActive) revert AssetNotFound();

        assets[token].isActive = false;
        assets[token].targetWeight = 0;

        // Remove from assetList array
        for (uint256 i = 0; i < assetList.length; i++) {
            if (assetList[i] == token) {
                assetList[i] = assetList[assetList.length - 1];
                assetList.pop();
                break;
            }
        }

        emit AssetRemoved(token);
    }

    /**
     * @notice Update the target weight of an asset
     * @param token Address of the token
     * @param newWeight New target weight in basis points
     */
    function updateAssetWeight(address token, uint256 newWeight) external onlyOwner {
        if (!assets[token].isActive) revert AssetNotFound();
        if (newWeight == 0 || newWeight > BASIS_POINTS) revert InvalidWeight();

        uint256 oldWeight = assets[token].targetWeight;
        assets[token].targetWeight = newWeight;

        emit AssetWeightUpdated(token, oldWeight, newWeight);
    }

    // ============ Minting and Burning ============

    /**
     * @notice Mint index tokens by depositing underlying assets
     * @param depositAmounts Array of amounts to deposit for each asset
     * @return mintAmount Amount of index tokens minted
     */
    function mint(uint256[] calldata depositAmounts)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 mintAmount)
    {
        if (depositAmounts.length != assetList.length) revert InvalidAsset();

        // Calculate total value to be deposited
        uint256 totalValueDeposited = 0;
        for (uint256 i = 0; i < assetList.length; i++) {
            totalValueDeposited += depositAmounts[i]; // Simplified: assuming all tokens have same value
        }

        if (totalValueDeposited < minDepositAmount) revert BelowMinimumDeposit();

        // Get NAV BEFORE transferring assets
        uint256 currentSupply = totalSupply();
        uint256 totalNavBefore = getTotalNav();

        // Transfer assets from user
        for (uint256 i = 0; i < assetList.length; i++) {
            address token = assetList[i];
            uint256 amount = depositAmounts[i];

            if (amount > 0) {
                IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
                assets[token].balance += amount;
            }
        }

        // Calculate mint amount based on NAV before deposit
        if (currentSupply == 0) {
            // First deposit: 1:1 ratio
            mintAmount = totalValueDeposited;
        } else {
            // Subsequent deposits: proportional to NAV before deposit
            mintAmount = (totalValueDeposited * currentSupply) / totalNavBefore;
        }

        _mint(msg.sender, mintAmount);
        emit Minted(msg.sender, mintAmount, getNavPerToken());
    }

    /**
     * @notice Burn index tokens to withdraw underlying assets
     * @param amount Amount of index tokens to burn
     */
    function burn(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();

        uint256 currentSupply = totalSupply();

        // Calculate proportional share of each asset
        for (uint256 i = 0; i < assetList.length; i++) {
            address token = assetList[i];
            uint256 assetBalance = assets[token].balance;
            uint256 withdrawAmount = (assetBalance * amount) / currentSupply;

            if (withdrawAmount > 0) {
                assets[token].balance -= withdrawAmount;
                IERC20(token).safeTransfer(msg.sender, withdrawAmount);
            }
        }

        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount, getNavPerToken());
    }

    // ============ NAV Calculation ============

    /**
     * @notice Get the total Net Asset Value of the index
     * @return Total NAV in base units
     */
    function getTotalNav() public view returns (uint256) {
        uint256 totalValue = 0;

        for (uint256 i = 0; i < assetList.length; i++) {
            address token = assetList[i];
            if (assets[token].isActive) {
                totalValue += assets[token].balance;
            }
        }

        return totalValue;
    }

    /**
     * @notice Get NAV per index token
     * @return NAV per token
     */
    function getNavPerToken() public view returns (uint256) {
        uint256 currentSupply = totalSupply();
        if (currentSupply == 0) return 0;

        return (getTotalNav() * 1e18) / currentSupply;
    }

    /**
     * @notice Get detailed portfolio composition
     * @return tokens Array of token addresses
     * @return balances Array of current balances
     * @return weights Array of target weights
     */
    function getPortfolioComposition()
        external
        view
        returns (
            address[] memory tokens,
            uint256[] memory balances,
            uint256[] memory weights
        )
    {
        uint256 activeCount = assetList.length;
        tokens = new address[](activeCount);
        balances = new uint256[](activeCount);
        weights = new uint256[](activeCount);

        for (uint256 i = 0; i < activeCount; i++) {
            address token = assetList[i];
            tokens[i] = token;
            balances[i] = assets[token].balance;
            weights[i] = assets[token].targetWeight;
        }

        return (tokens, balances, weights);
    }

    // ============ AI Agent Functions ============

    /**
     * @notice Authorize an AI agent to execute rebalancing
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

    /**
     * @notice Execute rebalancing (called by authorized AI agents)
     * @dev This is a simplified version - actual implementation would include
     *      swap logic through DEX integrations
     */
    function rebalance() external onlyAuthorizedAgent whenNotPaused {
        // In production, this would:
        // 1. Calculate current weights vs target weights
        // 2. Execute swaps through DEX to rebalance
        // 3. Update balances
        // For now, just emit event

        emit Rebalanced(msg.sender, block.timestamp);
    }

    // ============ Fee Management ============

    /**
     * @notice Collect accumulated management fees
     */
    function collectFees() external onlyOwner {
        uint256 timeSinceLastCollection = block.timestamp - lastFeeCollection;

        if (timeSinceLastCollection > 0) {
            uint256 currentSupply = totalSupply();
            uint256 feeAmount = (currentSupply * managementFee * timeSinceLastCollection) /
                                (BASIS_POINTS * FEE_COLLECTION_PERIOD);

            if (feeAmount > 0) {
                accumulatedFees += feeAmount;
                _mint(owner(), feeAmount);
                emit FeesCollected(feeAmount);
            }

            lastFeeCollection = block.timestamp;
        }
    }

    /**
     * @notice Update management fee
     * @param newFee New fee in basis points
     */
    function setManagementFee(uint256 newFee) external onlyOwner {
        if (newFee > 500) revert InvalidFee(); // Max 5%

        uint256 oldFee = managementFee;
        managementFee = newFee;
        emit ManagementFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Update performance fee
     * @param newFee New fee in basis points
     */
    function setPerformanceFee(uint256 newFee) external onlyOwner {
        if (newFee > 3000) revert InvalidFee(); // Max 30%

        uint256 oldFee = performanceFee;
        performanceFee = newFee;
        emit PerformanceFeeUpdated(oldFee, newFee);
    }

    // ============ Emergency Functions ============

    /**
     * @notice Pause the contract in case of emergency
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
     * @notice Emergency withdraw function (only owner, only when paused)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner whenPaused {
        IERC20(token).safeTransfer(owner(), amount);
        emit EmergencyWithdraw(token, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get the number of active assets in the index
     */
    function getAssetCount() external view returns (uint256) {
        return assetList.length;
    }

    /**
     * @notice Get all asset addresses
     */
    function getAssetList() external view returns (address[] memory) {
        return assetList;
    }

    /**
     * @notice Check if an address is an authorized agent
     */
    function isAuthorizedAgent(address agent) external view returns (bool) {
        return authorizedAgents[agent];
    }
}
