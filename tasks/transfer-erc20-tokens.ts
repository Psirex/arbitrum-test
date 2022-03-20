import { task, types } from "hardhat/config";
import { logParams } from "../utils/log";
import { TaskEnvironment } from "../utils/task-environment";

task("transfer-erc20-tokens", "Transfer ERC20 tokens from Ethereum to Arbitrum")
  .addParam("token", "Address of the transferred token")
  .addParam("amount", "Amount of the tokens transfers", undefined, types.int)
  .addOptionalParam(
    "recipient",
    "Address of recipient on Arbitrum. If not set transfer tokens to sender address."
  )
  .setAction(async (taskArgs) => {
    const env = await TaskEnvironment.init();

    console.log("Approving tokens...");
    const approveTx = await env.bridge.approveToken(
      taskArgs.token,
      taskArgs.amount
    );
    console.log(`Approving tx ${approveTx.hash}`);
    console.log("Approving is completed");

    const destinationAddress = taskArgs.recipient || env.wallets.l1.address;
    console.log(`Transferring tokens to ${destinationAddress} on Arbitrum...`);
    const transferTx = await env.bridge.deposit({
      erc20L1Address: taskArgs.token,
      amount: taskArgs.amount,
      destinationAddress,
    });
    console.log(`Tokens transfer tx ${transferTx.hash}`);
    const transferReceipt = await transferTx.wait();
    console.log(`Transfer initiated on Ethereum side.`);

    await env.waitForL2RetryableTx(transferReceipt);

    const l2ERC20Address = await env.bridge.getERC20L2Address(taskArgs.token);
    const l2Data = await env.bridge.l2Bridge.getL2TokenData(l2ERC20Address);
    const l2WalletTokenBalance = l2Data.balance;

    logParams("Token was successfully transfered", {
      "L2 Token Address": l2ERC20Address,
      "L2 Token Balance": l2WalletTokenBalance,
    });
  });
