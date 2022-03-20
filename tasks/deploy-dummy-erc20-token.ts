import { task, types } from "hardhat/config";
import { DummyERC20Token__factory } from "../typechain";
import { loadScriptEnvironment } from "../utils/scripts";
import { logParams } from "../utils/log";

task("deploy-dummy-erc20-token", "Deploys dummy ERC20 token implementation")
  .addParam("name", "Name of the token", "Dummy ERC20 Token")
  .addParam("symbol", "Symbol of the token", "DummyERC20")
  .addParam("decimals", "Decimals of the token", 2, types.int)
  .addParam(
    "premint",
    "Initial amount of tokens to mint to the deployer",
    0,
    types.int
  )
  .setAction(async (taskArguments, hre) => {
    const { wallets } = await loadScriptEnvironment();
    logParams("Deploying DummyERC20 Token with next params:", taskArguments);
    const token = await new DummyERC20Token__factory(wallets.l1).deploy(
      taskArguments.name,
      taskArguments.symbol,
      taskArguments.decimals,
      taskArguments.premint
    );
    console.log("Waiting for tx:", token.deployTransaction.hash);
    await token.deployed();
    console.log(
      `Dummy ERC20 token was successfully deployed at address ${token.address}`
    );
  });
