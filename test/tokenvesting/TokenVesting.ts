import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { BigNumber, BigNumberish } from "ethers";
import fs from "fs-extra";
import { ethers } from "hardhat";
import { ClinTex__factory, TokenVesting, TokenVesting__factory } from "../../src/types";
import { Signers } from "../types";

let addresses: string[];
let vestings: TokenVesting.VestingStruct[];

describe("TokenVesting tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.user1 = signers[1];
    this.signers.user2 = signers[2];
    this.signers.user3 = signers[3];

    this.tokenClinTexNew = await getClinTexContract(this.signers);

    const json = fs.readJSONSync("./test/tokenvesting/vestings.json");
    vestings = getVestings(json, signers.length);
    addresses = getAddresses(signers, vestings.length).map(signer => signer.address);
  });

  describe("Constructor check", async function () {
    it("Should give error when token address is zero", async function () {
      const addressToken = ethers.constants.AddressZero;
      const factory = new TokenVesting__factory(this.signers.admin);

      await expect(factory.deploy(addressToken, 0, 0, 0)).to.revertedWith("TokenVesting: token address cannot be zero");
    });

    it("Should give error when first unlock time is before current time", async function () {
      const addressToken = this.tokenClinTexNew.address;
      // 1 day before current time
      const firstUnlockTime = (await getCurrentTime()).sub(60 * 60 * 24);
      const factory = new TokenVesting__factory(this.signers.admin);

      await expect(factory.deploy(addressToken, firstUnlockTime, 0, 0)).to.revertedWith(
        "TokenVesting: first unlock time is before current time",
      );
    });

    it("Should give error when second unlock time is before first unlock time", async function () {
      const addressToken = this.tokenClinTexNew.address;
      const thirtyDays = BigNumber.from(30 * (60 * 60 * 24));
      const firstUnlockTime = (await getCurrentTime()).add(thirtyDays);
      // 1 day before firstUnlockTime
      const secondUnlockTime = firstUnlockTime.sub(60 * 60 * 24);
      const factory = new TokenVesting__factory(this.signers.admin);

      await expect(factory.deploy(addressToken, firstUnlockTime, secondUnlockTime, 0)).to.revertedWith(
        "TokenVesting: second unlock time is before first unlock time",
      );
    });

    it("Should give error when third unlock time is before second unlock time", async function () {
      const addressToken = this.tokenClinTexNew.address;
      const thirtyDays = BigNumber.from(30 * (60 * 60 * 24));
      const firstUnlockTime = (await getCurrentTime()).add(thirtyDays);
      const secondUnlockTime = firstUnlockTime.add(thirtyDays);
      // 1 day before secondUnlockTime
      const thirdUnlockTime = secondUnlockTime.sub(60 * 60 * 24);
      const factory = new TokenVesting__factory(this.signers.admin);

      await expect(factory.deploy(addressToken, firstUnlockTime, secondUnlockTime, thirdUnlockTime)).to.revertedWith(
        "TokenVesting: third unlock time is before second unlock time",
      );
    });
  });

  describe("Beneficiary add check", function () {
    before(async function () {
      this.tokenVesting = await getTokenVestingContract(this.signers, this.tokenClinTexNew.address);
    });

    it("Should not add beneficiaries by non owner", async function () {
      await expect(this.tokenVesting.connect(this.signers.user1).addBeneficiaries([], [])).to.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("Should not add beneficiaries if arrays have different sizes", async function () {
      const addressesTest = [this.signers.admin.address, this.signers.user1.address, this.signers.user2.address];
      const vestingsTest = [
        {
          amountToClaimOnFirstUnlockTime: 0,
          amountToClaimOnSecondUnlockTime: 0,
          amountToClaimOnThirdUnlockTime: 300,
          totalClaimed: 0,
        },
        {
          amountToClaimOnFirstUnlockTime: 0,
          amountToClaimOnSecondUnlockTime: 200,
          amountToClaimOnThirdUnlockTime: 0,
          totalClaimed: 0,
        },
      ];

      await expect(this.tokenVesting.addBeneficiaries(addressesTest, vestingsTest)).to.revertedWith(
        "TokenVesting: arrays of incorrect length",
      );
    });

    it("Should give correct values after addBeneficiaries", async function () {
      await this.tokenVesting.addBeneficiaries(addresses, vestings);

      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];

        const vestingFromContract = await this.tokenVesting.getVesting(address);
        const vestingFromTest = vestings[i];

        expect(vestingFromContract.totalClaimed).equal(0);
        expect(await this.tokenVesting.getAvailableAmountToClaim(address)).equal(0);
        expect(vestingFromContract.amountToClaimOnFirstUnlockTime).equal(
          vestingFromTest.amountToClaimOnFirstUnlockTime,
        );
        expect(vestingFromContract.amountToClaimOnSecondUnlockTime).equal(
          vestingFromTest.amountToClaimOnSecondUnlockTime,
        );
        expect(vestingFromContract.amountToClaimOnThirdUnlockTime).equal(
          vestingFromTest.amountToClaimOnThirdUnlockTime,
        );
      }
    });
  });

  describe("Claim check", function () {
    const totalClaimedForTest: BigNumber[] = [];
    before(async function () {
      this.tokenVesting = await getTokenVestingContract(this.signers, this.tokenClinTexNew.address);
    });

    it("Should not be able to claim if caller is not beneficiary", async function () {
      await expect(this.tokenVesting.connect(this.signers.user1).claim()).to.revertedWith(
        "TokenVesting: address is not beneficiary",
      );
    });

    it("Should not be able to claim before first unlock time", async function () {
      // add beneficiaries
      await this.tokenVesting.addBeneficiaries(addresses, vestings);

      await expect(this.tokenVesting.claim()).to.revertedWith("TokenVesting: current time is before first unlock time");
    });

    it("Should not be able to claim if available amount to claim is zero", async function () {
      const thirtyDays = 30 * (60 * 60 * 24);

      //increase time to first unlock time
      await simulateTimePassed(thirtyDays);

      //signers.user1's vesting data written on json as beneficiary[1] (since user1 is address[1])
      await expect(this.tokenVesting.connect(this.signers.user1).claim()).to.revertedWith(
        "TokenVesting: no tokens to claim",
      );
    });

    it("Should give correct values after first unlock time", async function () {
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];

        const availableAmountToClaim = await this.tokenVesting.getAvailableAmountToClaim(address);
        const vestingFromTest = vestings[i];

        const amountToClaim = BigNumber.from(vestingFromTest.amountToClaimOnFirstUnlockTime);
        const claimed = totalClaimedForTest[i] == undefined ? 0 : totalClaimedForTest[i];

        const correctValue = amountToClaim.sub(claimed);

        console.log(
          `Available amount to claim for [${i}]${address}: ${amountToClaim}(amountToClaim) - ${claimed}(claimed) = ${correctValue}`,
        );

        expect(availableAmountToClaim).equal(correctValue);
      }
    });

    it("Should not be able to claim if contract does not have enough balance", async function () {
      await expect(this.tokenVesting.connect(this.signers.user3).claim()).to.revertedWith(
        "TokenVesting: contract balance is not enough to perform claim",
      );
    });

    it("Should give correct values after claim", async function () {
      const amount = vestings[3].amountToClaimOnFirstUnlockTime;
      await this.tokenClinTexNew.mint(this.tokenVesting.address, amount);

      const totalClaimedAmountBefore = 0;
      const availableAmountToClaimBefore = amount;

      const totalClaimedAmountAfterClaim = amount;
      const availableAmountToClaimAfterClaim = 0;

      expect((await this.tokenVesting.getVesting(this.signers.user3.address)).totalClaimed).equal(
        totalClaimedAmountBefore,
      );
      expect(await this.tokenVesting.getAvailableAmountToClaim(this.signers.user3.address)).equal(
        availableAmountToClaimBefore,
      );

      await expect(this.tokenVesting.connect(this.signers.user3).claim())
        .to.emit(this.tokenClinTexNew, "Transfer")
        .withArgs(this.tokenVesting.address, this.signers.user3.address, amount)
        .and.to.emit(this.tokenVesting, "Claimed")
        .withArgs(this.signers.user3.address, amount);

      // increase total claimed for test
      totalClaimedForTest[3] = BigNumber.from(amount);

      expect((await this.tokenVesting.getVesting(this.signers.user3.address)).totalClaimed).equal(
        totalClaimedAmountAfterClaim,
      );
      expect(await this.tokenVesting.getAvailableAmountToClaim(this.signers.user3.address)).equal(
        availableAmountToClaimAfterClaim,
      );
    });

    it("Should give correct values after second unlock time", async function () {
      const thirtyDays = 30 * (60 * 60 * 24);

      //increase time to first unlock time
      await simulateTimePassed(thirtyDays);

      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];

        const availableAmountToClaim = await this.tokenVesting.getAvailableAmountToClaim(address);
        const vestingFromTest = vestings[i];

        const amountToClaim = BigNumber.from(vestingFromTest.amountToClaimOnFirstUnlockTime).add(
          vestingFromTest.amountToClaimOnSecondUnlockTime,
        );
        const claimed = totalClaimedForTest[i] == undefined ? 0 : totalClaimedForTest[i];

        const correctValue = amountToClaim.sub(claimed);

        console.log(
          `Available amount to claim for [${i}]${address}: ${amountToClaim}(amountToClaim) - ${claimed}(claimed) = ${correctValue}`,
        );

        expect(availableAmountToClaim).equal(correctValue);
      }
    });

    it("Should give correct values after third unlock time", async function () {
      const thirtyDays = 30 * (60 * 60 * 24);

      //increase time to first unlock time
      await simulateTimePassed(thirtyDays);

      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];

        const availableAmountToClaim = await this.tokenVesting.getAvailableAmountToClaim(address);
        const vestingFromTest = vestings[i];

        const amountToClaim = BigNumber.from(vestingFromTest.amountToClaimOnFirstUnlockTime)
          .add(vestingFromTest.amountToClaimOnSecondUnlockTime)
          .add(vestingFromTest.amountToClaimOnThirdUnlockTime);
        const claimed = totalClaimedForTest[i] == undefined ? 0 : totalClaimedForTest[i];

        const correctValue = amountToClaim.sub(claimed);

        console.log(
          `Available amount to claim for [${i}]${address}: ${amountToClaim}(amountToClaim) - ${claimed}(claimed) = ${correctValue}`,
        );

        expect(availableAmountToClaim).equal(correctValue);
      }
    });

    it("Should give correct values after third unlock time claim", async function () {
      const amount = BigNumber.from(vestings[0].amountToClaimOnFirstUnlockTime)
        .add(vestings[0].amountToClaimOnSecondUnlockTime)
        .add(vestings[0].amountToClaimOnThirdUnlockTime);
      await this.tokenClinTexNew.mint(this.tokenVesting.address, amount);

      const totalClaimedAmountBefore = 0;
      const availableAmountToClaimBefore = amount;

      const totalClaimedAmountAfterClaim = amount;
      const availableAmountToClaimAfterClaim = 0;

      expect((await this.tokenVesting.getVesting(this.signers.admin.address)).totalClaimed).equal(
        totalClaimedAmountBefore,
      );
      expect(await this.tokenVesting.getAvailableAmountToClaim(this.signers.admin.address)).equal(
        availableAmountToClaimBefore,
      );

      await expect(this.tokenVesting.claim())
        .to.emit(this.tokenClinTexNew, "Transfer")
        .withArgs(this.tokenVesting.address, this.signers.admin.address, amount)
        .and.to.emit(this.tokenVesting, "Claimed")
        .withArgs(this.signers.admin.address, amount);

      // increase total claimed for test
      totalClaimedForTest[0] = BigNumber.from(amount);

      expect((await this.tokenVesting.getVesting(this.signers.admin.address)).totalClaimed).equal(
        totalClaimedAmountAfterClaim,
      );
      expect(await this.tokenVesting.getAvailableAmountToClaim(this.signers.admin.address)).equal(
        availableAmountToClaimAfterClaim,
      );
    });
  });
});

async function getTokenVestingContract(signers: Signers, addressToken: string) {
  const factory = new TokenVesting__factory(signers.admin);
  const currentTime = await getCurrentTime();
  const args = tokenVestingArgs(addressToken, currentTime);
  const contract = await factory.deploy(args[0], args[1], args[2], args[3]);
  await contract.deployed();

  return contract;
}

function tokenVestingArgs(addressToken: string, currentTime: BigNumberish) {
  const thirtyDays = BigNumber.from(30 * (60 * 60 * 24));
  const firstUnlockTime = BigNumber.from(currentTime).add(thirtyDays); //30 days
  const secondUnlockTime = firstUnlockTime.add(thirtyDays); //60 days
  const thirdUnlockTime = secondUnlockTime.add(thirtyDays); //90 days

  return tokenVestingContractArgsArray(addressToken, firstUnlockTime, secondUnlockTime, thirdUnlockTime);
}

function tokenVestingContractArgsArray(
  addressToken: string,
  firstUnlockTime: BigNumberish,
  secondUnlockTime: BigNumberish,
  thirdUnlockTime: BigNumberish,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  return [addressToken, firstUnlockTime, secondUnlockTime, thirdUnlockTime];
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

async function simulateTimePassed(duration: BigNumberish) {
  await ethers.provider.send("evm_increaseTime", [duration]);
  await ethers.provider.send("evm_mine", []);
}

async function getCurrentTime() {
  return BigNumber.from((await ethers.provider.getBlock("latest"))["timestamp"]);
}

function getAddresses(signers: SignerWithAddress[], length: number) {
  return signers.slice(0, length);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getVestings(json: any, length: number) {
  const vestings: TokenVesting.VestingStruct[] = [];
  for (let i = 0; i < json.vestings.length; i++) {
    vestings[i] = {
      amountToClaimOnFirstUnlockTime: json.vestings[i].amountToClaimOnFirstUnlockTime,
      amountToClaimOnSecondUnlockTime: json.vestings[i].amountToClaimOnSecondUnlockTime,
      amountToClaimOnThirdUnlockTime: json.vestings[i].amountToClaimOnThirdUnlockTime,
      totalClaimed: 0,
    };
  }
  return vestings.slice(0, length);
}
