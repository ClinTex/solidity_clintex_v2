import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { ClinTex__factory, TokenSwap__factory } from "../../src/types";
import { Signers } from "../types";

describe("TokenSwap tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.user1 = signers[1];
    this.signers.user2 = signers[2];
    this.signers.user3 = signers[3];

    this.tokenClinTexOld = await getClinTexContract(this.signers);
    this.tokenClinTexNew = await getClinTexContract(this.signers);
  });

  describe("Constructor check", function () {
    it("Should give error when ERC20 addresses are 0", async function () {
      let addressTokenSwapFrom = ethers.constants.AddressZero;
      const addressTokenSwapTo = ethers.constants.AddressZero;
      const factory = new TokenSwap__factory(this.signers.admin);

      await expect(factory.deploy(addressTokenSwapFrom, addressTokenSwapTo)).to.revertedWith(
        "TokenSwap: tokenSwapFrom address cannot be zero",
      );

      addressTokenSwapFrom = this.tokenClinTexOld.address;
      await expect(factory.deploy(addressTokenSwapFrom, addressTokenSwapTo)).to.revertedWith(
        "TokenSwap: tokenSwapTo address cannot be zero",
      );
    });
  });

  describe("Swapping check", function () {
    before(async function () {
      this.tokenSwap = await getTokenSwapContract(
        this.signers,
        this.tokenClinTexOld.address,
        this.tokenClinTexNew.address,
      );
    });

    it("Should not swap if user is not approved its old tokens", async function () {
      const amount = ethers.utils.parseEther("100");

      await expect(this.tokenSwap.swap(amount)).to.revertedWith("ERC20: insufficient allowance");
    });

    it("Should not swap if user does not have enough balance", async function () {
      const amount = ethers.utils.parseEther("100");

      // approve tokenSwap
      await this.tokenClinTexOld.approve(this.tokenSwap.address, amount);

      await expect(this.tokenSwap.swap(amount)).to.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should not swap if swap contract does not have enough balance", async function () {
      const amount = ethers.utils.parseEther("100");

      // mint admin `amount` tokens
      await this.tokenClinTexOld.mint(this.signers.admin.address, amount);

      await expect(this.tokenSwap.swap(amount)).to.revertedWith(
        "TokenSwap: contract balance is not enough to perform swap",
      );
    });

    it("Should give correct values after swap", async function () {
      const swapper = this.signers.admin.address;
      const amount = ethers.utils.parseEther("100");

      // mint tokenSwap contract `amount` tokens (for swap)
      await this.tokenClinTexNew.mint(this.tokenSwap.address, amount);

      // Before swap
      const balanceUserClinTexOldBefore = await this.tokenClinTexOld.balanceOf(swapper);
      const balanceUserClinTexNewBefore = await this.tokenClinTexNew.balanceOf(swapper);
      const balanceTokenSwapClinTexOldBefore = await this.tokenClinTexOld.balanceOf(this.tokenSwap.address);
      const balanceTokenSwapClinTexNewBefore = await this.tokenClinTexNew.balanceOf(this.tokenSwap.address);
      // After swap
      const balanceUserClinTexOldAfterSwap = balanceUserClinTexOldBefore.sub(amount);
      const balanceUserClinTexNewAfterSwap = balanceUserClinTexNewBefore.add(amount);
      const balanceTokenSwapClinTexOldAfterSwap = balanceTokenSwapClinTexOldBefore.add(amount);
      const balanceTokenSwapClinTexNewAfterSwap = balanceTokenSwapClinTexNewBefore.sub(amount);

      await expect(this.tokenSwap.swap(amount))
        .to.emit(this.tokenClinTexOld, "Transfer")
        .withArgs(swapper, this.tokenSwap.address, amount)
        .and.to.emit(this.tokenClinTexNew, "Transfer")
        .withArgs(this.tokenSwap.address, swapper, amount)
        .and.to.emit(this.tokenSwap, "Swapped")
        .withArgs(swapper, amount);

      expect(await this.tokenClinTexOld.balanceOf(swapper)).equal(balanceUserClinTexOldAfterSwap);
      expect(await this.tokenClinTexNew.balanceOf(swapper)).equal(balanceUserClinTexNewAfterSwap);
      expect(await this.tokenClinTexOld.balanceOf(this.tokenSwap.address)).equal(balanceTokenSwapClinTexOldAfterSwap);
      expect(await this.tokenClinTexNew.balanceOf(this.tokenSwap.address)).equal(balanceTokenSwapClinTexNewAfterSwap);
    });
  });
});

async function getTokenSwapContract(signers: Signers, addressTokenSwapFrom: string, addressTokenSwapTo: string) {
  const factory = new TokenSwap__factory(signers.admin);
  const args = tokenSwapContractArgs(addressTokenSwapFrom, addressTokenSwapTo);
  const contract = await factory.deploy(args[0], args[1]);
  await contract.deployed();

  return contract;
}

function tokenSwapContractArgs(addressTokenSwapFrom: string, addressTokenSwapTo: string) {
  return tokenSwapContractArgsArray(addressTokenSwapFrom, addressTokenSwapTo);
}

function tokenSwapContractArgsArray(addressTokenSwapFrom: string, addressTokenSwapTo: string) {
  return [addressTokenSwapFrom, addressTokenSwapTo];
}

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
