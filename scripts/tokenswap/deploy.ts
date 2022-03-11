import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import fs from "fs-extra";
import { ethers } from "hardhat";
import { TokenSwap__factory } from "../../src/types";

async function main() {
  const [owner] = await ethers.getSigners();
  const args = tokenSwapContractArgs();
  const tokenSwap = await getTokenSwapContract(owner, args);
  console.log("TokenSwap deployed to: ", tokenSwap.address);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function getTokenSwapContract(owner: SignerWithAddress, args: string[]) {
  const factory = new TokenSwap__factory(owner);
  const contract = await factory.deploy(args[0], args[1]);
  await contract.deployed();

  return contract;
}

function tokenSwapContractArgs() {
  const json = fs.readJSONSync("./deployTokenSwapArgs.json");

  const addressTokenSwapFrom = json.addressTokenSwapFrom;
  const addressTokenSwapTo = json.addressTokenSwapTo;
  return tokenSwapContractArgsArray(addressTokenSwapFrom, addressTokenSwapTo);
}

function tokenSwapContractArgsArray(addressTokenSwapFrom: string, addressTokenSwapTo: string) {
  return [addressTokenSwapFrom, addressTokenSwapTo];
}
