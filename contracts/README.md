# Resonance Smart Contracts

This directory contains the smart contracts for the Resonance tokenization system.

## Overview

The RES Token is an ERC-20 token deployed on World Chain that powers the Resonance ecosystem.

### Features
- **Standard ERC-20**: Full compatibility with wallets and exchanges
- **Burnable**: Users can burn their tokens
- **Controlled Minting**: Only designated minters can mint tokens
- **Max Supply**: Capped at 1 billion RES tokens
- **OpenZeppelin**: Built with audited, industry-standard contracts

## Setup

### Prerequisites
- Node.js 18+
- pnpm

### Install Dependencies
```bash
cd contracts
pnpm install
```

### Configure Environment
Create a `.env` file in the backend root with:
```env
# Deployment
PRIVATE_KEY=your_private_key_here

# RPC URLs
WORLD_CHAIN_SEPOLIA_RPC_URL=https://worldchain-sepolia.g.alchemy.com/v2/YOUR-API-KEY
WORLD_CHAIN_RPC_URL=https://worldchain-mainnet.g.alchemy.com/v2/YOUR-API-KEY

# Block Explorer
WORLDSCAN_API_KEY=your_api_key_here

# Contract Address (after deployment)
RES_TOKEN_ADDRESS=
```

## Development

### Compile Contracts
```bash
pnpm exec hardhat compile
```

### Run Tests
```bash
pnpm exec hardhat test
```

### Run Tests with Coverage
```bash
pnpm exec hardhat coverage
```

## Deployment

### Deploy to World Chain Sepolia (Testnet)
```bash
pnpm exec hardhat run scripts/deploy.js --network worldChainSepolia
```

### Deploy to World Chain Mainnet
```bash
pnpm exec hardhat run scripts/deploy.js --network worldChain
```

### Verify Contract
```bash
pnpm exec hardhat verify --network worldChainSepolia <CONTRACT_ADDRESS> <OWNER_ADDRESS>
```

## Contract Management

### Add Minter
After deployment, you need to add your backend as a minter:
```bash
pnpm exec hardhat console --network worldChainSepolia
```

Then in the console:
```javascript
const RESToken = await ethers.getContractFactory("RESToken");
const token = await RESToken.attach("YOUR_CONTRACT_ADDRESS");
await token.addMinter("BACKEND_WALLET_ADDRESS");
```

## Testing

The contract includes comprehensive tests covering:
- Deployment and initialization
- Minter management (add/remove)
- Token minting (single and batch)
- Burning functionality
- Supply limits and constraints
- Access control

Run tests:
```bash
pnpm exec hardhat test
```

## Contract Structure

```
contracts/
├── contracts/
│   └── RESToken.sol          # Main ERC-20 token contract
├── scripts/
│   └── deploy.js             # Deployment script
├── test/
│   └── RESToken.test.js      # Contract tests
├── deployments/              # Deployment records (generated)
├── artifacts/                # Compiled contracts (generated)
├── cache/                    # Build cache (generated)
└── hardhat.config.js         # Hardhat configuration
```

## Integration with Backend

After deployment:

1. **Save the contract address** in backend `.env`:
   ```env
   RES_TOKEN_ADDRESS=0x...
   ```

2. **Add backend wallet as minter**:
   - The backend wallet needs the minter role to mint tokens
   - Use the `addMinter()` function from the owner account

3. **Mint tokens** when users verify email or complete actions:
   ```javascript
   // Example: Mint 10 RES tokens
   await contract.mint(userWalletAddress, ethers.parseEther("10"), "Email verification");
   ```

## Security Considerations

- ✅ Uses OpenZeppelin audited contracts
- ✅ Owner-controlled minting
- ✅ Max supply cap (1 billion tokens)
- ✅ No proxy/upgradeable pattern (immutable after deployment)
- ✅ Standard ERC-20 compliance
- ⚠️  Keep private keys secure
- ⚠️  Test thoroughly on testnet before mainnet deployment

## Network Information

### World Chain Sepolia (Testnet)
- Chain ID: 4801
- RPC: https://worldchain-sepolia.g.alchemy.com/v2/YOUR-API-KEY
- Explorer: https://worldchain-sepolia.explorer.alchemy.com
- Faucet: (Check World Chain documentation)

### World Chain Mainnet
- Chain ID: 480
- RPC: https://worldchain-mainnet.g.alchemy.com/v2/YOUR-API-KEY
- Explorer: https://worldchain.explorer.alchemy.com

## Support

For issues or questions:
1. Check Hardhat documentation: https://hardhat.org/
2. Check OpenZeppelin documentation: https://docs.openzeppelin.com/
3. Check World Chain documentation: https://worldcoin.org/developers

