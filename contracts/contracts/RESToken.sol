// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RESToken
 * @dev ERC20 Token for the Resonance ecosystem
 * 
 * Features:
 * - Standard ERC20 functionality
 * - Burnable tokens
 * - Owner-controlled minting
 * - Deployed on World Chain
 */
contract RESToken is ERC20, ERC20Burnable, Ownable {
    // Maximum supply: 1 billion RES tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // Minter role - only designated minters can mint tokens
    mapping(address => bool) public isMinter;
    
    // Events
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event TokensMinted(address indexed to, uint256 amount, string reason);
    
    /**
     * @dev Constructor
     * @param initialOwner Address of the initial owner
     */
    constructor(address initialOwner) ERC20("Resonance Token", "RES") Ownable(initialOwner) {
        // Owner is automatically a minter
        isMinter[initialOwner] = true;
        emit MinterAdded(initialOwner);
    }
    
    /**
     * @dev Modifier to check if caller is a minter
     */
    modifier onlyMinter() {
        require(isMinter[msg.sender], "RESToken: caller is not a minter");
        _;
    }
    
    /**
     * @dev Add a new minter
     * @param minter Address to be granted minter role
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "RESToken: minter is zero address");
        require(!isMinter[minter], "RESToken: address is already a minter");
        
        isMinter[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @dev Remove a minter
     * @param minter Address to have minter role revoked
     */
    function removeMinter(address minter) external onlyOwner {
        require(isMinter[minter], "RESToken: address is not a minter");
        
        isMinter[minter] = false;
        emit MinterRemoved(minter);
    }
    
    /**
     * @dev Mint tokens to a specific address
     * @param to Recipient address
     * @param amount Amount of tokens to mint
     * @param reason Reason for minting (for tracking purposes)
     */
    function mint(address to, uint256 amount, string memory reason) external onlyMinter {
        require(to != address(0), "RESToken: mint to zero address");
        require(amount > 0, "RESToken: amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "RESToken: would exceed max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @dev Batch mint tokens to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to mint
     * @param reason Reason for minting
     */
    function batchMint(
        address[] memory recipients,
        uint256[] memory amounts,
        string memory reason
    ) external onlyMinter {
        require(recipients.length == amounts.length, "RESToken: arrays length mismatch");
        require(recipients.length > 0, "RESToken: empty arrays");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalSupply() + totalAmount <= MAX_SUPPLY, "RESToken: would exceed max supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "RESToken: mint to zero address");
            require(amounts[i] > 0, "RESToken: amount must be greater than 0");
            
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i], reason);
        }
    }
    
    /**
     * @dev Get remaining supply that can be minted
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
}


