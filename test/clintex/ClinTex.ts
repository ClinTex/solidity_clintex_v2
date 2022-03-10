import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { BigNumber, BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { ClinTex__factory } from "../../src/types";
import { Signers } from "../types";

describe("ClinTex tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.user1 = signers[1];
    this.signers.user2 = signers[2];
    this.signers.user3 = signers[3];
  });

  describe("Constructor check", function () {
    it("Should give error when the token cap is 0", async function () {
      const cap = 0;

      const factory = new ClinTex__factory(this.signers.admin);
      await expect(factory.deploy("Test", "TST", cap)).to.revertedWith("ERC20Capped: cap is 0");
    });
  });

  describe("Initial values check", function () {
    before(async function () {
      this.tokenClinTexNew = await getClinTexContract(this.signers);
    });

    it("Should give correct values after deploy", async function () {
      const args = clinTexContractArgs();

      const tokenName: string = args[0];
      const tokenSymbol: string = args[1];
      const tokenCap: BigNumber = args[2];
      const tokenDecimals = 18;
      const tokenTotalSupply = 0;

      expect(await this.tokenClinTexNew.name()).equal(tokenName);
      expect(await this.tokenClinTexNew.symbol()).equal(tokenSymbol);
      expect(await this.tokenClinTexNew.cap()).equal(tokenCap);
      expect(await this.tokenClinTexNew.decimals()).equal(tokenDecimals);
      expect(await this.tokenClinTexNew.totalSupply()).equal(tokenTotalSupply);
    });

    it("Should give correct owner after deploy", async function () {
      expect(await this.tokenClinTexNew.owner()).equal(this.signers.admin.address);
    });
  });

  describe("Minting check", function () {
    before(async function () {
      this.tokenClinTexNew = await getClinTexContract(this.signers);
    });

    it("Should not be mintable by non owner", async function () {
      const mintTo = this.signers.user1.address;
      const amount = ethers.utils.parseEther("100");

      await expect(this.tokenClinTexNew.connect(this.signers.user1).mint(mintTo, amount)).to.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("Should give correct values after mint", async function () {
      const mintTo = this.signers.user1.address;
      const amount = ethers.utils.parseEther("100");
      const totalSupplyBefore = await this.tokenClinTexNew.totalSupply();
      const balanceBefore = await this.tokenClinTexNew.balanceOf(mintTo);
      const balanceAfterMint = balanceBefore.add(amount);
      const totalSupplyAfterMint = totalSupplyBefore.add(amount);

      await expect(this.tokenClinTexNew.mint(mintTo, amount))
        .to.emit(this.tokenClinTexNew, "Transfer")
        .withArgs(ethers.constants.AddressZero, mintTo, amount);

      expect(await this.tokenClinTexNew.balanceOf(mintTo)).equal(balanceAfterMint);
      expect(await this.tokenClinTexNew.totalSupply()).equal(totalSupplyAfterMint);
    });

    it("Should not mint more than cap", async function () {
      const mintTo = this.signers.user1.address;
      const cap = await this.tokenClinTexNew.cap();
      const amount = cap.add(ethers.utils.parseEther("1"));

      await expect(this.tokenClinTexNew.mint(mintTo, amount)).to.revertedWith("ERC20Capped: cap exceeded");
    });
  });
});

async function getClinTexContract(signers: Signers) {
  const factory = new ClinTex__factory(signers.admin);
  const args = clinTexContractArgs();
  const contract = await factory.deploy(args[0], args[1], args[2]);
  await contract.deployed();

  return contract;
}

function clinTexContractArgs() {
  const tokenName = "Token";
  const tokenSymbol = "TKN";
  const tokenCap = ethers.utils.parseEther("200000000"); // 200,000,000

  return clinTexContractArgsArray(tokenName, tokenSymbol, tokenCap);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clinTexContractArgsArray(tokenName: string, tokenSymbol: string, tokenCap: BigNumberish): any[] {
  return [tokenName, tokenSymbol, tokenCap];
}
