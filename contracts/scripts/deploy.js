const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying RES Token to World Chain Sepolia...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy RES Token
  console.log("\n📦 Deploying RES Token contract...");
  const RESToken = await hre.ethers.getContractFactory("RESToken");
  const resToken = await RESToken.deploy(deployer.address);

  await resToken.waitForDeployment();
  const tokenAddress = await resToken.getAddress();

  console.log("✅ RES Token deployed to:", tokenAddress);
  console.log("👤 Owner:", deployer.address);

  // Get token details
  const name = await resToken.name();
  const symbol = await resToken.symbol();
  const decimals = await resToken.decimals();
  const maxSupply = await resToken.MAX_SUPPLY();

  console.log("\n📊 Token Details:");
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals);
  console.log("   Max Supply:", hre.ethers.formatEther(maxSupply), "RES");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: tokenAddress,
    deployer: deployer.address,
    name,
    symbol,
    decimals: decimals.toString(),
    maxSupply: hre.ethers.formatEther(maxSupply),
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  console.log("\n💾 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n✅ Deployment info saved to:", deploymentFile);

  // Verify contract (if on testnet/mainnet)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n⏳ Waiting for block confirmations...");
    await resToken.deploymentTransaction().wait(5);
    
    console.log("\n🔍 Verifying contract on explorer...");
    try {
      await hre.run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [deployer.address],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("   You can verify manually later using:");
      console.log(`   pnpm exec hardhat verify --network ${hre.network.name} ${tokenAddress} ${deployer.address}`);
    }
  }

  console.log("\n🎉 Deployment complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Save the contract address in your backend .env:");
  console.log(`   RES_TOKEN_ADDRESS=${tokenAddress}`);
  console.log("2. Add the backend minter address as a minter");
  console.log("3. Test minting tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

