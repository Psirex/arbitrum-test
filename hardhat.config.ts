import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

const LOAD_TASKS = process.env.LOAD_TASKS !== "false";

if (LOAD_TASKS) {
  require("./tasks/outbox-execute");
  require("./tasks/deposit-erc20-tokens");
  require("./tasks/withdraw-erc20-tokens");
  require("./tasks/deploy-dummy-erc20-token");
  require("./tasks/deploy-custom-erc20-token");
  require("./tasks/deploy-custom-tokens-gateway");
  require("./tasks/transfer-tokens-custom-gateway");
}

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.12",
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

export default config;
