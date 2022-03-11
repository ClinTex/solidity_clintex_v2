import { BigNumber } from "ethers";
import fs from "fs-extra";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

task("verify:clintex", "Verifies the ClinTex contract")
  .addParam("address", "The contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const json = fs.readJSONSync("./deployClinTexArgs.json");
    await hre.run("verify:verify", {
      address: taskArguments.address,
      constructorArguments: [json.name, json.symbol, BigNumber.from(json.cap)],
    });
  });
