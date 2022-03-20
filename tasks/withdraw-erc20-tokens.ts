import { task, types } from "hardhat/config";
import { logParams } from "../utils/log";
import { TaskEnvironment } from "../utils/task-environment";

task("withdraw-erc20-tokens", "Withdraws ERC20 tokens from Arbitrum to L2")
  .addParam("token", "Token to withdraw from Arbitrum on Ethereum chain")
  .addParam("amount", "Amount of tokens to withdraw", undefined, types.int)
  .addOptionalParam(
    "recipient",
    "Address of recipient of the tokens on Ethereum side. If not set transfer tokens to sender address."
  )
  .setAction(async (taskArgs) => {
    const env = await TaskEnvironment.init();

    const withdrawTx = await env.bridge.withdrawERC20(
      taskArgs.token,
      taskArgs.amount,
      taskArgs.recipient
    );
    const withdrawReceipt = await withdrawTx.wait();

    const [withdrawEventData] = await env.bridge.getWithdrawalsInL2Transaction(
      withdrawReceipt
    );

    console.log(
      `Token withdrawal initiated ${withdrawReceipt.transactionHash}`
    );
    logParams(`Withdrawal data`, withdrawEventData);

    console.log(
      `To claim funds (after dispute period), use outbox-execute task`
    );
  });
