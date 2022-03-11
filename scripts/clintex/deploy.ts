import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, BigNumberish } from "ethers";
import fs from "fs-extra";
import { ethers } from "hardhat";
import { ClinTex__factory } from "../../src/types";

async function main() {
  const [owner] = await ethers.getSigners();
  const args = clinTexContractArgs();
  const clinTex = await getClinTexContract(owner, args);
  console.log("ClinTex deployed to: ", clinTex.address);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function getClinTexContract(owner: SignerWithAddress, args: any[]) {
  const factory = new ClinTex__factory(owner);
  const contract = await factory.deploy(args[0], args[1], args[2]);
  await contract.deployed();

  return contract;
}

function clinTexContractArgs() {
  const json = fs.readJSONSync("./deployClinTexArgs.json");

  const tokenName = json.name;
  const tokenSymbol = json.symbol;
  const tokenCap = BigNumber.from(json.cap);

  return clinTexContractArgsArray(tokenName, tokenSymbol, tokenCap);
}

function clinTexContractArgsArray(tokenName: string, tokenSymbol: string, tokenCap: BigNumberish): any[] {
  return [tokenName, tokenSymbol, tokenCap];
}
