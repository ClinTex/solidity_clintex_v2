import fs from "fs-extra";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

task("verify:tokenswap", "Verifies the TokenSwap contract")
  .addParam("address", "The contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const json = fs.readJSONSync("./deployTokenSwapArgs.json");
    await hre.run("verify:verify", {
      address: taskArguments.address,
      constructorArguments: [json.addressTokenSwapFrom, json.addressTokenSwapTo],
    });
  });
