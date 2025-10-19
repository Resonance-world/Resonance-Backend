// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RESToken - Resonance Ecosystem Token
 * @author Resonance Team
 * @notice ERC20 token with flexible allocation system and built-in safety mechanisms
 * 
 * Key Features:
 * - Fixed allocation buckets (50% users, 20% team, 15% treasury, 10% liquidity, 5% airdrop)
 * - Flexible distribution within each bucket 
 * - Rate limiting to prevent abuse
 * - Optional vesting schedules (can add after deployment)
 * - Pausable for emergencies
 * - Transparent minting with public notes
 * 
 */
contract RESToken is ERC20, ERC20Burnable, Ownable, Pausable, ReentrancyGuard {
    
    // ============================================
    // CONSTANTS - Fixed at deployment
    // ============================================
    
    /// @notice Maximum total supply - cannot mint beyond this
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    
    /// @notice Allocation limits - percentage of max supply reserved for each purpose
    uint256 public constant USER_REWARDS_ALLOCATION = 500_000_000 * 10**18; // 50%
    uint256 public constant TEAM_ALLOCATION = 200_000_000 * 10**18; // 20%
    uint256 public constant TREASURY_ALLOCATION = 150_000_000 * 10**18; // 15%
    uint256 public constant LIQUIDITY_ALLOCATION = 100_000_000 * 10**18; // 10%
    uint256 public constant AIRDROP_ALLOCATION = 50_000_000 * 10**18; // 5%
    
    /// @notice Allocation identifiers
    bytes32 public constant USER_REWARDS = keccak256("USER_REWARDS");
    bytes32 public constant TEAM = keccak256("TEAM");
    bytes32 public constant TREASURY = keccak256("TREASURY");
    bytes32 public constant LIQUIDITY = keccak256("LIQUIDITY");
    bytes32 public constant AIRDROP = keccak256("AIRDROP");
    
    // ============================================
    // STATE VARIABLES - Can be modified
    // ============================================
    
    /// @notice Track how much has been minted from each allocation
    mapping(bytes32 => uint256) public allocationMinted;
    
    /// @notice Addresses authorized to mint tokens
    mapping(address => bool) public isMinter;
    
    /// @notice Daily minting limits per minter (prevents abuse)
    mapping(address => uint256) public dailyMintLimit;
    
    /// @notice Track minting activity for rate limiting
    mapping(address => uint256) public mintedToday;
    mapping(address => uint256) public lastMintDay;
    
    /// @notice Optional vesting schedules (can add after deployment)
    mapping(address => VestingSchedule) public vestingSchedules;
    
    /// @notice Vesting schedule structure
    struct VestingSchedule {
        uint256 totalAmount;        // Total tokens to vest
        uint256 released;           // Tokens already released
        uint256 startTime;          // When vesting starts
        uint256 cliffDuration;      // Cliff period (no tokens released)
        uint256 vestingDuration;    // Total vesting period
        bool isActive;              // Whether schedule is active
    }
    
    // ============================================
    // EVENTS
    // ============================================
    
    event MinterAdded(address indexed minter, uint256 dailyLimit);
    event MinterRemoved(address indexed minter);
    event MinterLimitUpdated(address indexed minter, uint256 newLimit);
    
    event TokensMinted(
        address indexed minter,
        address indexed recipient,
        uint256 amount,
        bytes32 indexed allocation,
        string publicNote
    );
    
    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration
    );
    
    event VestingScheduleRevoked(address indexed beneficiary, uint256 unvestedAmount);
    event TokensVested(address indexed beneficiary, uint256 amount);
    
    // ============================================
    // ERRORS
    // ============================================
    
    error NotAuthorized();
    error InvalidAddress();
    error InvalidAmount();
    error ExceedsMaxSupply();
    error ExceedsAllocation();
    error ExceedsDailyLimit();
    error AlreadyMinter();
    error NotAMinter();
    error VestingScheduleExists();
    error NoVestingSchedule();
    error NoTokensToRelease();
    error InvalidVestingParameters();
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    /**
     * @notice Deploy the token contract
     * @param initialOwner Address that will own the contract (your address)
     * @dev Owner is automatically added as minter with 100K daily limit
     */
    constructor(address initialOwner) 
        ERC20("Resonance Token", "RES") 
        Ownable(initialOwner) 
    {
        if (initialOwner == address(0)) revert InvalidAddress();
        
        // Add deployer as minter with reasonable daily limit
        isMinter[initialOwner] = true;
        dailyMintLimit[initialOwner] = 100_000 * 10**18; // 100K tokens per day
        
        emit MinterAdded(initialOwner, dailyMintLimit[initialOwner]);
    }
    
    // ============================================
    // MINTER MANAGEMENT
    // ============================================
    
    /**
     * @notice Add a new address as authorized minter
     * @param minter Address to authorize
     * @param limit Daily minting limit for this address
     * @dev Typically used to add backend service for automated rewards
     */
    function addMinter(address minter, uint256 limit) external onlyOwner {
        if (minter == address(0)) revert InvalidAddress();
        if (isMinter[minter]) revert AlreadyMinter();
        
        isMinter[minter] = true;
        dailyMintLimit[minter] = limit;
        
        emit MinterAdded(minter, limit);
    }
    
    /**
     * @notice Remove minting authorization from an address
     * @param minter Address to remove
     */
    function removeMinter(address minter) external onlyOwner {
        if (!isMinter[minter]) revert NotAMinter();
        
        isMinter[minter] = false;
        
        emit MinterRemoved(minter);
    }
    
    /**
     * @notice Update daily minting limit for a minter
     * @param minter Address to update
     * @param newLimit New daily limit
     */
    function updateMinterLimit(address minter, uint256 newLimit) external onlyOwner {
        if (!isMinter[minter]) revert NotAMinter();
        
        dailyMintLimit[minter] = newLimit;
        
        emit MinterLimitUpdated(minter, newLimit);
    }
    
    // ============================================
    // MINTING
    // ============================================
    
    /**
     * @notice Mint tokens to an address
     * @param to Recipient address
     * @param amount Amount of tokens to mint (in wei, 18 decimals)
     * @param allocation Which allocation bucket (USER_REWARDS, TEAM, etc.)
     * @param note Public explanation for transparency (e.g., "Onboarding reward for user")
     * @dev Enforces allocation limits and daily rate limits
     */
    function mint(
        address to,
        uint256 amount,
        bytes32 allocation,
        string memory note
    ) external whenNotPaused nonReentrant {
        // Authorization check
        if (!isMinter[msg.sender]) revert NotAuthorized();
        
        // Validation checks
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        
        // Check allocation limit
        uint256 allocLimit = _getAllocationLimit(allocation);
        if (allocationMinted[allocation] + amount > allocLimit) {
            revert ExceedsAllocation();
        }
        
        // Check and update rate limit
        _checkAndUpdateRateLimit(msg.sender, amount);
        
        // Mint tokens
        _mint(to, amount);
        
        // Update allocation tracking
        allocationMinted[allocation] += amount;
        
        // Emit detailed event for transparency
        emit TokensMinted(msg.sender, to, amount, allocation, note);
    }
    
    /**
     * @notice Batch mint tokens to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to mint
     * @param allocation Which allocation bucket
     * @param note Public explanation
     * @dev Useful for airdrops or batch reward distribution
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32 allocation,
        string memory note
    ) external whenNotPaused nonReentrant {
        if (!isMinter[msg.sender]) revert NotAuthorized();
        if (recipients.length != amounts.length || recipients.length == 0) {
            revert InvalidAmount();
        }
        
        // Calculate total amount
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        // Validation checks
        if (totalSupply() + totalAmount > MAX_SUPPLY) revert ExceedsMaxSupply();
        
        uint256 allocLimit = _getAllocationLimit(allocation);
        if (allocationMinted[allocation] + totalAmount > allocLimit) {
            revert ExceedsAllocation();
        }
        
        // Check rate limit for total amount
        _checkAndUpdateRateLimit(msg.sender, totalAmount);
        
        // Mint to each recipient
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert InvalidAddress();
            if (amounts[i] == 0) revert InvalidAmount();
            
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(msg.sender, recipients[i], amounts[i], allocation, note);
        }
        
        // Update allocation tracking
        allocationMinted[allocation] += totalAmount;
    }
    
    // ============================================
    // VESTING (Optional - can use after deployment)
    // ============================================
    
    /**
     * @notice Create a vesting schedule for team members
     * @param beneficiary Address that will receive vested tokens
     * @param totalAmount Total tokens to vest
     * @param cliffDuration Cliff period in seconds (typically 365 days)
     * @param vestingDuration Total vesting period in seconds (typically 4 years)
     * @dev Tokens are minted gradually as they vest, not upfront
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 cliffDuration,
        uint256 vestingDuration
    ) external onlyOwner {
        if (beneficiary == address(0)) revert InvalidAddress();
        if (totalAmount == 0) revert InvalidAmount();
        if (vestingDuration <= cliffDuration) revert InvalidVestingParameters();
        if (vestingSchedules[beneficiary].isActive) revert VestingScheduleExists();
        
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: totalAmount,
            released: 0,
            startTime: block.timestamp,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            isActive: true
        });
        
        emit VestingScheduleCreated(
            beneficiary,
            totalAmount,
            block.timestamp,
            cliffDuration,
            vestingDuration
        );
    }
    
    /**
     * @notice Release vested tokens to caller
     * @dev Anyone with a vesting schedule can call this to claim their vested tokens
     */
    function releaseVestedTokens() external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        
        if (!schedule.isActive) revert NoVestingSchedule();
        
        uint256 vestedAmount = _calculateVestedAmount(schedule);
        uint256 releasable = vestedAmount - schedule.released;
        
        if (releasable == 0) revert NoTokensToRelease();
        
        // This counts against TEAM allocation
        if (allocationMinted[TEAM] + releasable > TEAM_ALLOCATION) {
            revert ExceedsAllocation();
        }
        if (totalSupply() + releasable > MAX_SUPPLY) {
            revert ExceedsMaxSupply();
        }
        
        schedule.released += releasable;
        allocationMinted[TEAM] += releasable;
        
        _mint(msg.sender, releasable);
        
        emit TokensVested(msg.sender, releasable);
    }
    
    /**
     * @notice Revoke a vesting schedule (only unvested tokens)
     * @param beneficiary Address whose schedule to revoke
     * @dev Can only revoke unvested tokens, already vested tokens remain
     */
    function revokeVestingSchedule(address beneficiary) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        
        if (!schedule.isActive) revert NoVestingSchedule();
        
        uint256 vestedAmount = _calculateVestedAmount(schedule);
        uint256 unvestedAmount = schedule.totalAmount - vestedAmount;
        
        schedule.totalAmount = vestedAmount; // Can only claim up to what's vested
        schedule.isActive = false;
        
        emit VestingScheduleRevoked(beneficiary, unvestedAmount);
    }
    
    /**
     * @dev Calculate how many tokens have vested for a schedule
     */
    function _calculateVestedAmount(VestingSchedule memory schedule) 
        internal 
        view 
        returns (uint256) 
    {
        // Before cliff: nothing vested
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }
        
        // After full vesting: everything vested
        if (block.timestamp >= schedule.startTime + schedule.vestingDuration) {
            return schedule.totalAmount;
        }
        
        // During vesting: linear interpolation
        uint256 timeVested = block.timestamp - schedule.startTime;
        return (schedule.totalAmount * timeVested) / schedule.vestingDuration;
    }
    
    /**
     * @notice Get vesting information for an address
     * @param beneficiary Address to query
     * @return totalAmount Total amount in vesting schedule
     * @return released Amount already released
     * @return vested Amount currently vested
     * @return releasable Amount available to release
     * @return startTime When vesting started
     * @return cliffEnd When cliff period ends
     * @return vestingEnd When vesting ends
     * @return isActive Whether schedule is active
     */
    function getVestingInfo(address beneficiary) external view returns (
        uint256 totalAmount,
        uint256 released,
        uint256 vested,
        uint256 releasable,
        uint256 startTime,
        uint256 cliffEnd,
        uint256 vestingEnd,
        bool isActive
    ) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        uint256 vestedAmount = _calculateVestedAmount(schedule);
        
        return (
            schedule.totalAmount,
            schedule.released,
            vestedAmount,
            vestedAmount - schedule.released,
            schedule.startTime,
            schedule.startTime + schedule.cliffDuration,
            schedule.startTime + schedule.vestingDuration,
            schedule.isActive
        );
    }
    
    // ============================================
    // RATE LIMITING
    // ============================================
    
    /**
     * @dev Check and enforce daily minting rate limit
     */
    function _checkAndUpdateRateLimit(address minter, uint256 amount) internal {
        uint256 currentDay = block.timestamp / 1 days;
        
        // Reset counter if new day
        if (currentDay > lastMintDay[minter]) {
            mintedToday[minter] = 0;
            lastMintDay[minter] = currentDay;
        }
        
        // Check limit
        if (mintedToday[minter] + amount > dailyMintLimit[minter]) {
            revert ExceedsDailyLimit();
        }
        
        // Update counter
        mintedToday[minter] += amount;
    }
    
    // ============================================
    // EMERGENCY CONTROLS
    // ============================================
    
    /**
     * @notice Pause all token transfers
     * @dev Only owner can pause - use in emergency
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override to enforce pause on transfers
     */
    function _update(address from, address to, uint256 value)
        internal
        override
        whenNotPaused
    {
        super._update(from, to, value);
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @notice Get allocation limit for a given allocation type
     */
    function _getAllocationLimit(bytes32 allocation) internal pure returns (uint256) {
        if (allocation == USER_REWARDS) return USER_REWARDS_ALLOCATION;
        if (allocation == TEAM) return TEAM_ALLOCATION;
        if (allocation == TREASURY) return TREASURY_ALLOCATION;
        if (allocation == LIQUIDITY) return LIQUIDITY_ALLOCATION;
        if (allocation == AIRDROP) return AIRDROP_ALLOCATION;
        revert("Unknown allocation");
    }
    
    /**
     * @notice Get detailed allocation information
     * @param allocation Allocation identifier
     * @return limit Total allocation limit
     * @return minted Amount already minted
     * @return remaining Amount still available
     */
    function getAllocationInfo(bytes32 allocation) external view returns (
        uint256 limit,
        uint256 minted,
        uint256 remaining
    ) {
        limit = _getAllocationLimit(allocation);
        minted = allocationMinted[allocation];
        remaining = limit - minted;
    }
    
    /**
     * @notice Get minter information
     * @param minter Address to query
     * @return authorized Whether address can mint
     * @return dailyLimit_ Maximum tokens per day
     * @return mintedToday_ Tokens minted today
     * @return remainingToday Tokens remaining today
     */
    function getMinterInfo(address minter) external view returns (
        bool authorized,
        uint256 dailyLimit_,
        uint256 mintedToday_,
        uint256 remainingToday
    ) {
        authorized = isMinter[minter];
        dailyLimit_ = dailyMintLimit[minter];
        
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > lastMintDay[minter]) {
            mintedToday_ = 0;
        } else {
            mintedToday_ = mintedToday[minter];
        }
        
        remainingToday = dailyLimit_ > mintedToday_ ? dailyLimit_ - mintedToday_ : 0;
    }
    
    /**
     * @notice Get total remaining supply that can be minted
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
    
    /**
     * @notice Get all allocation data at once
     * @return names Array of allocation names
     * @return limits Array of allocation limits
     * @return minted Array of minted amounts
     * @return remaining Array of remaining amounts
     */
    function getAllAllocations() external view returns (
        string[] memory names,
        uint256[] memory limits,
        uint256[] memory minted,
        uint256[] memory remaining
    ) {
        names = new string[](5);
        limits = new uint256[](5);
        minted = new uint256[](5);
        remaining = new uint256[](5);
        
        bytes32[5] memory allocs = [USER_REWARDS, TEAM, TREASURY, LIQUIDITY, AIRDROP];
        string[5] memory allocNames = ["USER_REWARDS", "TEAM", "TREASURY", "LIQUIDITY", "AIRDROP"];
        
        for (uint256 i = 0; i < 5; i++) {
            names[i] = allocNames[i];
            limits[i] = _getAllocationLimit(allocs[i]);
            minted[i] = allocationMinted[allocs[i]];
            remaining[i] = limits[i] - minted[i];
        }
    }
}