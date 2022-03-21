# Arbitrum Bridging Examples

This repo contains set of tasks to test tokens transfer through Arbitrum's Native Bridge.

## Project Setup

To run tasks from this repo run next commands:

```
npm install
npm run compile
```

Create `.env` file in the root directory of this project and fill it with values from `.env.example` file.

## Tasks Usage

### `deploy-dummy-erc20-token`

Deploys `DummyERC20` contract. To see full list of arguments of the task use `npx hardhat deploy-dummy-erc20-token --help` command.

### `deposit-erc20-tokens`

Transfers ERC20 tokens from Ethereum chain to the Arbitrum chain. To see full list of arguments of the task use `npx hardhat deposit-erc20-tokens --help` command.

### `withdraw-erc20-tokens`

Withdraws ERC20 tokens from Arbitrum chain back to the Ethereum chain. To see full list of arguments of the task use `npx hardhat withdraw-erc20-tokens --help` command.

### `deploy-custom-erc20-token`

Deploys pair of custom tokens on Ethereum and Arbitrum chains, and registers deployed tokens in Arbitrum's GatewayRouter.

### `outbox-execute`

Executes transaction sent from Arbitrum to Ethereum. To see full list of arguments of the task use `npx hardhat outbox-execute --help` command.

### `deploy-custom-tokens-gateway`

Deploys custom gateways on Ethereum and Arbitrum chains to transfer tokens in both directions: L1 -> L2 and L2 -> L1. To see full list of arguments of the task use `npx hardhat deploy-custom-tokens-gateway --help` command.

### `transfer-tokens-custom-gateway`

Transfer tokens via custom gateway deployed via `deploy-custom-tokens-gateway`. To see full list of arguments of the task use `npx hardhat transfer-tokens-custom-gateway --help` command.
