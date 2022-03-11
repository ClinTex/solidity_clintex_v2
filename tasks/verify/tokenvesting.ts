import { BigNumber } from "ethers";
import fs from "fs-extra";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

task("verify:tokenvesting", "Verifies the TokenVesting contract")
  .addParam("address", "The contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const json = fs.readJSONSync("./deployTokenVestingArgs.json");
    await hre.run("verify:verify", {
      address: taskArguments.address,
      constructorArguments: [
        json.addressToken,
        BigNumber.from(json._firstUnlockTime),
        BigNumber.from(json._secondUnlockTime),
        BigNumber.from(json._thirdUnlockTime),
      ],
    });
  });
