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
  });

  describe("Minter Management", function () {
    it("Should allow owner to add minter", async function () {
      await resToken.addMinter(minter.address);
      expect(await resToken.isMinter(minter.address)).to.be.true;
    });

    it("Should emit MinterAdded event", async function () {
      await expect(resToken.addMinter(minter.address))
        .to.emit(resToken, "MinterAdded")
        .withArgs(minter.address);
    });

    it("Should not allow non-owner to add minter", async function () {
      await expect(
        resToken.connect(user1).addMinter(minter.address)
      ).to.be.reverted;
    });

    it("Should not allow adding zero address as minter", async function () {
      await expect(
        resToken.addMinter(ethers.ZeroAddress)
      ).to.be.revertedWith("RESToken: minter is zero address");
    });

    it("Should not allow adding existing minter", async function () {
      await resToken.addMinter(minter.address);
      await expect(
        resToken.addMinter(minter.address)
      ).to.be.revertedWith("RESToken: address is already a minter");
    });

    it("Should allow owner to remove minter", async function () {
      await resToken.addMinter(minter.address);
      await resToken.removeMinter(minter.address);
      expect(await resToken.isMinter(minter.address)).to.be.false;
    });

    it("Should emit MinterRemoved event", async function () {
      await resToken.addMinter(minter.address);
      await expect(resToken.removeMinter(minter.address))
        .to.emit(resToken, "MinterRemoved")
        .withArgs(minter.address);
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      await resToken.addMinter(minter.address);
    });

    it("Should allow minter to mint tokens", async function () {
      const amount = ethers.parseEther("100");
      await resToken.connect(minter).mint(user1.address, amount, "Email verification");
      
      expect(await resToken.balanceOf(user1.address)).to.equal(amount);
      expect(await resToken.totalSupply()).to.equal(amount);
    });

    it("Should emit TokensMinted event", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        resToken.connect(minter).mint(user1.address, amount, "Email verification")
      )
        .to.emit(resToken, "TokensMinted")
        .withArgs(user1.address, amount, "Email verification");
    });

    it("Should not allow non-minter to mint", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        resToken.connect(user1).mint(user2.address, amount, "Test")
      ).to.be.revertedWith("RESToken: caller is not a minter");
    });

    it("Should not allow minting to zero address", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        resToken.connect(minter).mint(ethers.ZeroAddress, amount, "Test")
      ).to.be.revertedWith("RESToken: mint to zero address");
    });

    it("Should not allow minting zero amount", async function () {
      await expect(
        resToken.connect(minter).mint(user1.address, 0, "Test")
      ).to.be.revertedWith("RESToken: amount must be greater than 0");
    });

    it("Should not allow minting beyond max supply", async function () {
      const exceedAmount = MAX_SUPPLY + ethers.parseEther("1");
      await expect(
        resToken.connect(minter).mint(user1.address, exceedAmount, "Test")
      ).to.be.revertedWith("RESToken: would exceed max supply");
    });
  });

  describe("Batch Minting", function () {
    beforeEach(async function () {
      await resToken.addMinter(minter.address);
    });

    it("Should allow batch minting", async function () {
      const recipients = [user1.address, user2.address];
      const amounts = [ethers.parseEther("10"), ethers.parseEther("20")];
      
      await resToken.connect(minter).batchMint(recipients, amounts, "Batch reward");
      
      expect(await resToken.balanceOf(user1.address)).to.equal(amounts[0]);
      expect(await resToken.balanceOf(user2.address)).to.equal(amounts[1]);
    });

    it("Should not allow batch mint with mismatched arrays", async function () {
      const recipients = [user1.address];
      const amounts = [ethers.parseEther("10"), ethers.parseEther("20")];
      
      await expect(
        resToken.connect(minter).batchMint(recipients, amounts, "Test")
      ).to.be.revertedWith("RESToken: arrays length mismatch");
    });

    it("Should not allow batch mint with empty arrays", async function () {
      await expect(
        resToken.connect(minter).batchMint([], [], "Test")
      ).to.be.revertedWith("RESToken: empty arrays");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await resToken.addMinter(minter.address);
      const amount = ethers.parseEther("100");
      await resToken.connect(minter).mint(user1.address, amount, "Test");
    });

    it("Should allow users to burn their tokens", async function () {
      const burnAmount = ethers.parseEther("10");
      await resToken.connect(user1).burn(burnAmount);
      
      expect(await resToken.balanceOf(user1.address)).to.equal(ethers.parseEther("90"));
    });
  });

  describe("Remaining Supply", function () {
    it("Should return correct remaining supply", async function () {
      expect(await resToken.remainingSupply()).to.equal(MAX_SUPPLY);
      
      await resToken.mint(user1.address, ethers.parseEther("1000"), "Test");
      expect(await resToken.remainingSupply()).to.equal(MAX_SUPPLY - ethers.parseEther("1000"));
    });
  });
});

