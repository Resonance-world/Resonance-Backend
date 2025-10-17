import { ethers } from 'ethers';

// RES Token ABI (only the functions we need)
const RES_TOKEN_ABI = [
  'function mint(address to, uint256 amount, string memory reason) external',
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function remainingSupply() external view returns (uint256)',
  'event TokensMinted(address indexed to, uint256 amount, string reason)',
];

/**
 * Token Service for interacting with RES Token smart contract
 */
class TokenService {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;
  private wallet: ethers.Wallet | null = null;

  /**
   * Initialize the token service
   */
  initialize() {
    try {
      const rpcUrl = process.env.WORLD_CHAIN_SEPOLIA_RPC_URL || process.env.WORLD_CHAIN_RPC_URL;
      const privateKey = process.env.PRIVATE_KEY;
      const tokenAddress = process.env.RES_TOKEN_ADDRESS;

      if (!rpcUrl) {
        console.warn('⚠️  RPC URL not configured. Token minting will be simulated.');
        return;
      }

      if (!privateKey) {
        console.warn('⚠️  Private key not configured. Token minting will be simulated.');
        return;
      }

      if (!tokenAddress) {
        console.warn('⚠️  Token address not configured. Token minting will be simulated.');
        return;
      }

      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Initialize wallet
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // Initialize contract
      this.contract = new ethers.Contract(tokenAddress, RES_TOKEN_ABI, this.wallet);

      console.log('✅ Token service initialized');
      console.log('   Contract:', tokenAddress);
      console.log('   Minter:', this.wallet.address);
    } catch (error) {
      console.error('❌ Error initializing token service:', error);
      this.provider = null;
      this.contract = null;
      this.wallet = null;
    }
  }

  /**
   * Check if token service is available
   */
  isAvailable(): boolean {
    return this.contract !== null && this.wallet !== null;
  }

  /**
   * Mint RES tokens to a user's wallet
   * @param toAddress Recipient wallet address
   * @param amount Amount of tokens to mint (in RES, not wei)
   * @param reason Reason for minting (e.g., "Email verification")
   * @returns Transaction hash or null if simulated
   */
  async mintTokens(
    toAddress: string,
    amount: number,
    reason: string
  ): Promise<{ txHash: string | null; success: boolean; error?: string }> {
    try {
      // Validate address
      if (!ethers.isAddress(toAddress)) {
        return {
          success: false,
          txHash: null,
          error: 'Invalid wallet address',
        };
      }

      // If service not available, simulate minting
      if (!this.isAvailable()) {
        console.log(`🔄 [SIMULATED] Minting ${amount} RES to ${toAddress} for: ${reason}`);
        return {
          success: true,
          txHash: null, // Simulated - no real transaction
        };
      }

      // Convert amount to wei (18 decimals)
      const amountInWei = ethers.parseEther(amount.toString());

      console.log(`💎 Minting ${amount} RES to ${toAddress}...`);
      console.log(`   Reason: ${reason}`);

      // Call mint function
      const tx = await this.contract!.mint(toAddress, amountInWei, reason);

      console.log(`⏳ Transaction submitted: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log(`✅ Tokens minted successfully!`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
        
        return {
          success: true,
          txHash: tx.hash,
        };
      } else {
        console.error('❌ Transaction failed');
        return {
          success: false,
          txHash: tx.hash,
          error: 'Transaction failed',
        };
      }
    } catch (error: any) {
      console.error('❌ Error minting tokens:', error);
      return {
        success: false,
        txHash: null,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get token balance for an address
   * @param address Wallet address
   * @returns Balance in RES (not wei)
   */
  async getBalance(address: string): Promise<number> {
    try {
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid wallet address');
      }

      if (!this.isAvailable()) {
        console.log(`🔄 [SIMULATED] Getting balance for ${address}`);
        return 0;
      }

      const balanceInWei = await this.contract!.balanceOf(address);
      const balance = ethers.formatEther(balanceInWei);
      
      return parseFloat(balance);
    } catch (error: any) {
      console.error('❌ Error getting balance:', error);
      return 0;
    }
  }

  /**
   * Get total supply of RES tokens
   * @returns Total supply in RES
   */
  async getTotalSupply(): Promise<number> {
    try {
      if (!this.isAvailable()) {
        return 0;
      }

      const totalSupplyInWei = await this.contract!.totalSupply();
      const totalSupply = ethers.formatEther(totalSupplyInWei);
      
      return parseFloat(totalSupply);
    } catch (error: any) {
      console.error('❌ Error getting total supply:', error);
      return 0;
    }
  }

  /**
   * Get remaining supply that can be minted
   * @returns Remaining supply in RES
   */
  async getRemainingSupply(): Promise<number> {
    try {
      if (!this.isAvailable()) {
        return 1000000000; // Max supply
      }

      const remainingSupplyInWei = await this.contract!.remainingSupply();
      const remainingSupply = ethers.formatEther(remainingSupplyInWei);
      
      return parseFloat(remainingSupply);
    } catch (error: any) {
      console.error('❌ Error getting remaining supply:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const tokenService = new TokenService();


