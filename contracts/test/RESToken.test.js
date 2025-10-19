const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RESToken", function () {
  let resToken;
  let owner;
  let minter;
  let user1;
  let user2;

  const INITIAL_SUPPLY = 0;
  const MAX_SUPPLY = ethers.parseEther("1000000000"); // 1 billion tokens
  const USER_REWARDS_ALLOCATION = ethers.parseEther("500000000"); // 500M tokens
  const DAILY_LIMIT = ethers.parseEther("100000"); // 100K tokens per day

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();

    const RESToken = await ethers.getContractFactory("RESToken");
    resToken = await RESToken.deploy(owner.address);
    await resToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await resToken.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await resToken.name()).to.equal("Resonance Token");
      expect(await resToken.symbol()).to.equal("RES");
    });

    it("Should have 18 decimals", async function () {
      expect(await resToken.decimals()).to.equal(18);
    });

    it("Should have zero initial supply", async function () {
      expect(await resToken.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Should have correct max supply", async function () {
      expect(await resToken.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    });

    it("Should set owner as initial minter", async function () {
      expect(await resToken.isMinter(owner.address)).to.be.true;
    });

    it("Should set correct daily limit for owner", async function () {
      expect(await resToken.dailyMintLimit(owner.address)).to.equal(DAILY_LIMIT);
    });
  });

  describe("Allocation Constants", function () {
    it("Should have correct allocation limits", async function () {
      expect(await resToken.USER_REWARDS_ALLOCATION()).to.equal(ethers.parseEther("500000000"));
      expect(await resToken.TEAM_ALLOCATION()).to.equal(ethers.parseEther("200000000"));
      expect(await resToken.TREASURY_ALLOCATION()).to.equal(ethers.parseEther("150000000"));
      expect(await resToken.LIQUIDITY_ALLOCATION()).to.equal(ethers.parseEther("100000000"));
      expect(await resToken.AIRDROP_ALLOCATION()).to.equal(ethers.parseEther("50000000"));
    });
  });

  describe("Minter Management", function () {
    it("Should allow owner to add minter", async function () {
      const limit = ethers.parseEther("10000");
      await resToken.addMinter(minter.address, limit);
      expect(await resToken.isMinter(minter.address)).to.be.true;
      expect(await resToken.dailyMintLimit(minter.address)).to.equal(limit);
    });

    it("Should emit MinterAdded event", async function () {
      const limit = ethers.parseEther("10000");
      await expect(resToken.addMinter(minter.address, limit))
        .to.emit(resToken, "MinterAdded")
        .withArgs(minter.address, limit);
    });

    it("Should not allow non-owner to add minter", async function () {
      const limit = ethers.parseEther("10000");
      await expect(
        resToken.connect(user1).addMinter(minter.address, limit)
      ).to.be.revertedWithCustomError(resToken, "OwnableUnauthorizedAccount");
    });

    it("Should not allow adding zero address as minter", async function () {
      const limit = ethers.parseEther("10000");
      await expect(
        resToken.addMinter(ethers.ZeroAddress, limit)
      ).to.be.revertedWithCustomError(resToken, "InvalidAddress");
    });

    it("Should not allow adding existing minter", async function () {
      const limit = ethers.parseEther("10000");
      await resToken.addMinter(minter.address, limit);
      await expect(
        resToken.addMinter(minter.address, limit)
      ).to.be.revertedWithCustomError(resToken, "AlreadyMinter");
    });

    it("Should allow owner to remove minter", async function () {
      const limit = ethers.parseEther("10000");
      await resToken.addMinter(minter.address, limit);
      await resToken.removeMinter(minter.address);
      expect(await resToken.isMinter(minter.address)).to.be.false;
    });

    it("Should emit MinterRemoved event", async function () {
      const limit = ethers.parseEther("10000");
      await resToken.addMinter(minter.address, limit);
      await expect(resToken.removeMinter(minter.address))
        .to.emit(resToken, "MinterRemoved")
        .withArgs(minter.address);
    });

    it("Should allow owner to update minter limit", async function () {
      const limit1 = ethers.parseEther("10000");
      const limit2 = ethers.parseEther("20000");
      await resToken.addMinter(minter.address, limit1);
      await resToken.updateMinterLimit(minter.address, limit2);
      expect(await resToken.dailyMintLimit(minter.address)).to.equal(limit2);
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      const limit = ethers.parseEther("10000");
      await resToken.addMinter(minter.address, limit);
    });

    it("Should allow minter to mint tokens with USER_REWARDS allocation", async function () {
      const amount = ethers.parseEther("10");
      const allocation = await resToken.USER_REWARDS();
      const note = "Email verification reward";
      
      await resToken.connect(minter).mint(user1.address, amount, allocation, note);
      
      expect(await resToken.balanceOf(user1.address)).to.equal(amount);
      expect(await resToken.totalSupply()).to.equal(amount);
    });

    it("Should emit TokensMinted event", async function () {
      const amount = ethers.parseEther("10");
      const allocation = await resToken.USER_REWARDS();
      const note = "Email verification reward";
      
      await expect(
        resToken.connect(minter).mint(user1.address, amount, allocation, note)
      )
        .to.emit(resToken, "TokensMinted")
        .withArgs(minter.address, user1.address, amount, allocation, note);
    });

    it("Should not allow non-minter to mint", async function () {
      const amount = ethers.parseEther("10");
      const allocation = await resToken.USER_REWARDS();
      await expect(
        resToken.connect(user1).mint(user2.address, amount, allocation, "Test")
      ).to.be.revertedWithCustomError(resToken, "NotAuthorized");
    });

    it("Should not allow minting to zero address", async function () {
      const amount = ethers.parseEther("10");
      const allocation = await resToken.USER_REWARDS();
      await expect(
        resToken.connect(minter).mint(ethers.ZeroAddress, amount, allocation, "Test")
      ).to.be.revertedWithCustomError(resToken, "InvalidAddress");
    });

    it("Should not allow minting zero amount", async function () {
      const allocation = await resToken.USER_REWARDS();
      await expect(
        resToken.connect(minter).mint(user1.address, 0, allocation, "Test")
      ).to.be.revertedWithCustomError(resToken, "InvalidAmount");
    });

    it("Should not allow minting beyond max supply", async function () {
      const exceedAmount = MAX_SUPPLY + ethers.parseEther("1");
      const allocation = await resToken.USER_REWARDS();
      await expect(
        resToken.connect(minter).mint(user1.address, exceedAmount, allocation, "Test")
      ).to.be.revertedWithCustomError(resToken, "ExceedsMaxSupply");
    });

    it("Should not allow minting beyond allocation limit", async function () {
      const exceedAmount = USER_REWARDS_ALLOCATION + ethers.parseEther("1");
      const allocation = await resToken.USER_REWARDS();
      await expect(
        resToken.connect(minter).mint(user1.address, exceedAmount, allocation, "Test")
      ).to.be.revertedWithCustomError(resToken, "ExceedsAllocation");
    });

    it("Should track allocation minted amounts", async function () {
      const amount = ethers.parseEther("100");
      const allocation = await resToken.USER_REWARDS();
      
      await resToken.connect(minter).mint(user1.address, amount, allocation, "Test");
      
      expect(await resToken.allocationMinted(allocation)).to.equal(amount);
    });
  });

  describe("Batch Minting", function () {
    beforeEach(async function () {
      const limit = ethers.parseEther("10000");
      await resToken.addMinter(minter.address, limit);
    });

    it("Should allow batch minting", async function () {
      const recipients = [user1.address, user2.address];
      const amounts = [ethers.parseEther("10"), ethers.parseEther("20")];
      const allocation = await resToken.USER_REWARDS();
      const note = "Batch reward";
      
      await resToken.connect(minter).batchMint(recipients, amounts, allocation, note);
      
      expect(await resToken.balanceOf(user1.address)).to.equal(amounts[0]);
      expect(await resToken.balanceOf(user2.address)).to.equal(amounts[1]);
    });

    it("Should not allow batch mint with mismatched arrays", async function () {
      const recipients = [user1.address];
      const amounts = [ethers.parseEther("10"), ethers.parseEther("20")];
      const allocation = await resToken.USER_REWARDS();
      
      await expect(
        resToken.connect(minter).batchMint(recipients, amounts, allocation, "Test")
      ).to.be.revertedWithCustomError(resToken, "InvalidAmount");
    });

    it("Should not allow batch mint with empty arrays", async function () {
      const allocation = await resToken.USER_REWARDS();
      await expect(
        resToken.connect(minter).batchMint([], [], allocation, "Test")
      ).to.be.revertedWithCustomError(resToken, "InvalidAmount");
    });
  });

  describe("Rate Limiting", function () {
    beforeEach(async function () {
      const limit = ethers.parseEther("100"); // Small limit for testing
      await resToken.addMinter(minter.address, limit);
    });

    it("Should enforce daily minting limit", async function () {
      const amount = ethers.parseEther("50");
      const allocation = await resToken.USER_REWARDS();
      
      // First mint should succeed
      await resToken.connect(minter).mint(user1.address, amount, allocation, "Test");
      
      // Second mint should also succeed (total 100, within limit)
      await resToken.connect(minter).mint(user2.address, amount, allocation, "Test");
      
      // Third mint should fail (total would be 150, exceeds limit)
      await expect(
        resToken.connect(minter).mint(user1.address, amount, allocation, "Test")
      ).to.be.revertedWithCustomError(resToken, "ExceedsDailyLimit");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      const limit = ethers.parseEther("10000");
      await resToken.addMinter(minter.address, limit);
      const amount = ethers.parseEther("100");
      const allocation = await resToken.USER_REWARDS();
      await resToken.connect(minter).mint(user1.address, amount, allocation, "Test");
    });

    it("Should allow users to burn their tokens", async function () {
      const burnAmount = ethers.parseEther("10");
      await resToken.connect(user1).burn(burnAmount);
      
      expect(await resToken.balanceOf(user1.address)).to.equal(ethers.parseEther("90"));
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow owner to pause and unpause", async function () {
      await resToken.pause();
      expect(await resToken.paused()).to.be.true;
      
      await resToken.unpause();
      expect(await resToken.paused()).to.be.false;
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(
        resToken.connect(user1).pause()
      ).to.be.revertedWithCustomError(resToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    it("Should return correct remaining supply", async function () {
      expect(await resToken.remainingSupply()).to.equal(MAX_SUPPLY);
      
      const amount = ethers.parseEther("1000");
      const allocation = await resToken.USER_REWARDS();
      await resToken.mint(user1.address, amount, allocation, "Test");
      expect(await resToken.remainingSupply()).to.equal(MAX_SUPPLY - amount);
    });

    it("Should return correct allocation info", async function () {
      const allocation = await resToken.USER_REWARDS();
      const [limit, minted, remaining] = await resToken.getAllocationInfo(allocation);
      
      expect(limit).to.equal(USER_REWARDS_ALLOCATION);
      expect(minted).to.equal(0);
      expect(remaining).to.equal(USER_REWARDS_ALLOCATION);
    });

    it("Should return correct minter info", async function () {
      const [authorized, dailyLimit, mintedToday, remainingToday] = await resToken.getMinterInfo(owner.address);
      
      expect(authorized).to.be.true;
      expect(dailyLimit).to.equal(DAILY_LIMIT);
      expect(mintedToday).to.equal(0);
      expect(remainingToday).to.equal(DAILY_LIMIT);
    });
  });
});





