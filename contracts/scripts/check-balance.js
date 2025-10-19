const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking RES Token balance...");

  // Your wallet address
  const walletAddress = "0x5a97507edb8aB8c9f57F56Bb272FDf9f5764B15C";
  const contractAddress = "0x837D94Ed3067BB934124F491f4fF4983fADD5354";

  console.log("👤 Wallet address:", walletAddress);
  console.log("📦 Contract address:", contractAddress);

  // Get the contract
  const RESToken = await hre.ethers.getContractFactory("RESToken");
  const resToken = RESToken.attach(contractAddress);

  try {
    // Check balance
    const balance = await resToken.balanceOf(walletAddress);
    const formattedBalance = hre.ethers.formatEther(balance);
    
    console.log("💰 RES Token balance:", formattedBalance, "RES");
    
    if (balance > 0) {
      console.log("✅ You have RES tokens!");
    } else {
      console.log("❌ No RES tokens found");
    }

    // Get token details
    const name = await resToken.name();
    const symbol = await resToken.symbol();
    const decimals = await resToken.decimals();
    
    console.log("\n📊 Token Details:");
    console.log("   Name:", name);
    console.log("   Symbol:", symbol);
    console.log("   Decimals:", decimals);
    console.log("   Contract:", contractAddress);

    // Check recent transactions
    console.log("\n🔗 View on Block Explorer:");
    console.log(`   Wallet: https://worldchain-sepolia.explorer.alchemy.com/address/${walletAddress}`);
    console.log(`   Contract: https://worldchain-sepolia.explorer.alchemy.com/address/${contractAddress}`);

  } catch (error) {
    console.error("❌ Error checking balance:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
