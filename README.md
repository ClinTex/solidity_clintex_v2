# CLinTex Smart Contracts

This repo is created to store smart contract and related files for ClinTex.

## Installation

### Pre Requisites

Before running any command, you need to create a .env file and set a BIP-39 compatible mnemonic as an environment variable. Follow the example in .env.example. If you don't already have a mnemonic, use this [website](https://iancoleman.io/bip39/) to generate one.

1. Install node and npm
2. Install yarn

```bash
npm install --global yarn
```

Check that Yarn is installed by running:

```bash
yarn --version
```

Then, proceed with installing dependencies:

```bash
yarn install
```

## Usage/Examples

### Compile

Compile the smart contracts with Hardhat:

```bash
yarn compile
```

### TypeChain

Compile the smart contracts and generate TypeChain artifacts:

```bash
yarn typechain
```

### Lint Solidity and TypeScript

Lint the Solidity and TypeScript code (then check with prettier):

```bash
yarn lint
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```bash
yarn clean
```

### Available Tasks

To see available tasks from Hardhat:

```bash
npx hardhat
```

## Running Tests

### Test

To run tests, run the following command:

```bash
yarn test
```

### Test with gas reportage

To report gas after test, set `REPORT_GAS="true"` on `.env` file. Then run test.

### Coverage

Generate the code coverage report:

```bash
yarn coverage
```

## Deployment

### Deployment

To deploy this project first change those fields on your `.env` file:

`MNEMONIC="your mnemomic"` that should be your REAL mnemonic that you use on chain.

`RUN_OPTIMIZER="true"` that is recommended for gas fees optimization.

Then set your infura or alchemy api key (depending on chain you want to deploy):

`INFURA_API_KEY="infura_api_key"` for eth and bsc chain.

`ALCHEMY_API_KEY="alchemy_api_key"` for polygon.

**For ClinTex Contract:**

You have to create `deployClinTexArgs.json` file, using example: `deployClinTexArgs.example.json`.
In this file you have to write contract arguments for `ClinTex` contract.

**For TokenSwap Contract:**

You have to create `deployTokenSwapArgs.json` file, using example: `deployTokenSwapArgs.example.json`.
In this file you have to write contract arguments for `TokenSwap` contract.

**For TokenVesting Contract:**

You have to create `deployTokenVestingArgs.json` file, using example: `deployTokenVestingArgs.example.json`.
In this file you have to write contract arguments for `TokenVesting` contract.

Then it is ready to deploy. You can deploy using the command:

```bash
yarn deploy:clintex --network ${networkToDeploy}
yarn deploy:tokenswap --network ${networkToDeploy}
yarn deploy:tokenvesting --network ${networkToDeploy}
```

Example:

```bash
yarn deploy:clintex --network rinkeby
yarn deploy:tokenswap --network rinkeby
yarn deploy:tokenvesting --network rinkeby
```

### Verification

To verify the contract first change block explorer api key on your `.env` file, depending on your network.
For example, for ethereum network:
`ETHERSCAN_API_KEY="etherscan_api_key"`.

Then it is ready for verification. You can deploy using the command:

```bash
yarn verify:clintex --address ${deployed_contract_address} --network ${network}
yarn verify:tokenswap --address ${deployed_contract_address} --network ${network}
yarn verify:tokenvesting --address ${deployed_contract_address} --network ${network}
```

Example:

```bash
yarn verify:clintex --address ${deployed_contract_address} --network rinkeby
yarn verify:tokenswap --address ${deployed_contract_address} --network rinkeby
yarn verify:tokenvesting --address ${deployed_contract_address} --network rinkeby
```

## Contributing

For git linting [commitlint](https://github.com/conventional-changelog/commitlint) is being used. [This website](https://commitlint.io/) can be helpful to write commit messages.
