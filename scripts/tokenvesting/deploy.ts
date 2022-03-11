import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, BigNumberish } from "ethers";
import fs from "fs-extra";
import { ethers } from "hardhat";
import { TokenVesting__factory } from "../../src/types";

async function main() {
  const [owner] = await ethers.getSigners();
  const args = tokenVestingArgs();
  const tokenVesting = await getTokenVestingContract(owner, args);
  console.log("TokenVesting deployed to: ", tokenVesting.address);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function getTokenVestingContract(owner: SignerWithAddress, args: any[]) {
  const factory = new TokenVesting__factory(owner);
  const contract = await factory.deploy(args[0], args[1], args[2], args[3]);
  await contract.deployed();

  return contract;
}

function tokenVestingArgs() {
  const json = fs.readJSONSync("./deployTokenVestingArgs.json");

  const addressToken = json.addressToken;
  const firstUnlockTime = BigNumber.from(json._firstUnlockTime);
  const secondUnlockTime = BigNumber.from(json._secondUnlockTime);
  const thirdUnlockTime = BigNumber.from(json._thirdUnlockTime);

  return tokenVestingContractArgsArray(addressToken, firstUnlockTime, secondUnlockTime, thirdUnlockTime);
}

function tokenVestingContractArgsArray(
  addressToken: string,
  firstUnlockTime: BigNumberish,
  secondUnlockTime: BigNumberish,
  thirdUnlockTime: BigNumberish,
): any[] {
  return [addressToken, firstUnlockTime, secondUnlockTime, thirdUnlockTime];
}
