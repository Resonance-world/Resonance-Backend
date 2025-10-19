require("@nomicfoundation/hardhat-toolbox");

// Load environment variables if .env exists
try {
  require("dotenv").config({ path: "../.env" });
} catch (e) {
  // .env file doesn't exist, that's okay for compilation
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // World Chain Sepolia Testnet
    worldChainSepolia: {
      url: process.env.WORLD_CHAIN_SEPOLIA_RPC_URL || "https://worldchain-sepolia.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 4801,
    },
    // World Chain Mainnet (for future use)
    worldChain: {
      url: process.env.WORLD_CHAIN_RPC_URL || "https://worldchain-mainnet.g.alchemy.com/v2/YOUR-API-KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 480,
    },
    // Localhost for testing
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    apiKey: {
      worldChainSepolia: process.env.WORLDSCAN_API_KEY || "",
      worldChain: process.env.WORLDSCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "worldChainSepolia",
        chainId: 4801,
        urls: {
          apiURL: "https://worldchain-sepolia.explorer.alchemy.com/api",
          browserURL: "https://worldchain-sepolia.explorer.alchemy.com"
        }
      },
      {
        network: "worldChain",
        chainId: 480,
        urls: {
          apiURL: "https://worldchain.explorer.alchemy.com/api",
          browserURL: "https://worldchain.explorer.alchemy.com"
        }
      }
    ]
  }
};

