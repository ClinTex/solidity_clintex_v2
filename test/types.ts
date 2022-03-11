import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import type { Fixture } from "ethereum-waffle";
import type { ClinTex, TokenSwap, TokenVesting } from "../src/types/";

declare module "mocha" {
  export interface Context {
    tokenClinTexOld: ClinTex;
    tokenClinTexNew: ClinTex;
    tokenSwap: TokenSwap;
    tokenVesting: TokenVesting;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Signers {
  admin: SignerWithAddress;
  user1: SignerWithAddress;
  user2: SignerWithAddress;
  user3: SignerWithAddress;
}
