import { IERC20__factory } from "arb-ts/dist/lib/abi";
import { BigNumber, ethers } from "ethers";
import { hexDataLength } from "ethers/lib/utils";
import { task, types } from "hardhat/config";
import { L1TokensGateway__factory } from "../typechain";
import { TaskEnvironment } from "../utils/task-environment";

task("transfer-tokens-custom-gateway")
  .addParam("l1TokensGateway", "L1TokensGateway contract address")
  .addParam("amount", "Amount of tokens to transfer", undefined, types.int)
  .setAction(async (taskArgs) => {
    const env = await TaskEnvironment.init();
    const l1TokensGateway = L1TokensGateway__factory.connect(
      taskArgs.l1TokensGateway,
      env.wallets.l1
    );
    const l1DummyToken = IERC20__factory.connect(
      await l1TokensGateway.L1TOKEN(),
      env.wallets.l1
    );
    console.log(
      `Approving L1 Token to use with gateway ${l1TokensGateway.address}`
    );
    const approveTx = await l1DummyToken.approve(
      l1TokensGateway.address,
      taskArgs.amount
    );
    await approveTx.wait();
    console.log("Tokens spending approved");

    const sendTokensBytes = ethers.utils.defaultAbiCoder.encode(
      ["address", "uint256"],
      [env.wallets.l1.address, BigNumber.from(taskArgs.amount)]
    );
    const sendTokensBytesLength = hexDataLength(sendTokensBytes) + 4;

    // Now we can query the submission price using a helper method; the first value returned tells us the best cost of our transaction; that's what we'll be using.
    // The second value (nextUpdateTimestamp) tells us when the base cost will next update (base cost changes over time with chain congestion; the value updates every 24 hours). We won't actually use it here, but generally it's useful info to have.
    const [_submissionPriceWei, nextUpdateTimestamp] =
      await env.bridge.l2Bridge.getTxnSubmissionPrice(sendTokensBytesLength);
    console.log(
      `Current retryable base submission price: ${_submissionPriceWei.toString()}`
    );

    const timeNow = Math.floor(new Date().getTime() / 1000);
    console.log(
      `time in seconds till price update: ${
        nextUpdateTimestamp.toNumber() - timeNow
      }`
    );

    // ...Okay, but on the off chance we end up underpaying, our retryable ticket simply fails.
    // This is highly unlikely, but just to be safe, let's increase the amount we'll be paying (the difference between the actual cost and the amount we pay gets refunded to our address on L2 anyway)
    // (Note that in future releases, the a max cost increase per 24 hour window of 150% will be enforced, so this will be less of a concern.)
    const submissionPriceWei = _submissionPriceWei.mul(5);

    // Now we'll figure out the gas we need to send for L2 execution; this requires the L2 gas price and gas limit for our L2 transaction
    // For the L2 gas price, we simply query it from the L2 provider, as we would when using L1
    const gasPriceBid = await env.bridge.l2Provider.getGasPrice();
    console.log(`L2 gas price: ${gasPriceBid.toString()}`);

    // For the gas limit, we'll simply use a hard-coded value (for more precise / dynamic estimates, see the estimateRetryableTicket method in the NodeInterface L2 "precompile")
    const maxGas = 100000;

    // With these three values, we can calculate the total callvalue we'll need our L1 transaction to send to L2
    const callValue = submissionPriceWei.add(gasPriceBid.mul(maxGas));

    console.log(
      `Sending tokens to L2 with ${callValue.toString()} callValue for L2 fees:`
    );

    const sendTokensTx = await l1TokensGateway.sendToL2(
      taskArgs.amount,
      submissionPriceWei,
      maxGas,
      gasPriceBid,
      {
        value: callValue,
      }
    );

    const setGreetingRec = await sendTokensTx.wait();

    console.log(
      `Greeting txn confirmed on L1! 🙌 ${setGreetingRec.transactionHash}`
    );

    await env.waitForL2RetryableTx(setGreetingRec);
  });
