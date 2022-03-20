import { networks } from "arb-ts";
import { task } from "hardhat/config";
import { CustomL1Token__factory, CustomL2Token__factory } from "../typechain";
import { TaskEnvironment } from "../utils/task-environment";

task(
  "deploy-custom-erc20-token",
  "Deploys custom ERC20 token for Ethereum and Arbitrum chains and register it in Arbitrum's gateway"
).setAction(async () => {
  const env = await TaskEnvironment.init();

  const l1ChainId = await env.wallets.l1.getChainId();
  const l1Network = networks[l1ChainId];
  const l1Gateway = l1Network.tokenBridge.l1CustomGateway;
  const l1Router = l1Network.tokenBridge.l1GatewayRouter;

  console.log("Deploying the custom token to L1");
  const customL1Token = await new CustomL1Token__factory(env.wallets.l1).deploy(
    "Custom L1 Token",
    "C1TKN",
    2,
    1_000_000_00,
    l1Gateway,
    l1Router
  );
  console.log(`Custom token is deployed to L1 at ${customL1Token.address}`);

  const l2ChainId = await env.wallets.l2.getChainId();
  const l2Network = networks[l2ChainId];
  const l2Gateway = l2Network.tokenBridge.l2CustomGateway;
  console.log("Deploying the custom token to L2");
  const customL2Token = await new CustomL2Token__factory(env.wallets.l2).deploy(
    l2Gateway,
    customL1Token.address,
    "Custom L2 Token",
    "C2TKN",
    2
  );
  console.log(`Custom token is deployed to L2 at ${customL2Token.address}`);

  // set how many bytes of calldata is needed to create retrayable ticket on L2
  const customBridgeCalldataSize = 1000;
  const routerCalldataSize = 1000;

  const [_submissionPriceWeiForCustomBridge] =
    await env.bridge.l2Bridge.getTxnSubmissionPrice(customBridgeCalldataSize);
  const [_submissionPriceWeiForRouter] =
    await env.bridge.l2Bridge.getTxnSubmissionPrice(routerCalldataSize);
  console.log(
    `Current retryable base submission prices for custom bridge and raouter are: ${
      (_submissionPriceWeiForCustomBridge.toString(),
      _submissionPriceWeiForRouter.toString())
    }`
  );

  const gasPrice = await env.bridge.l2Provider.getGasPrice();
  console.log(`L2 gas price: ${gasPrice.toString()}`);

  const maxGasCustomBridge = 10000000;
  const maxGasRouter = 10000000;

  const valueForGateway = _submissionPriceWeiForCustomBridge.add(
    gasPrice.mul(maxGasCustomBridge)
  );
  const valueForRouter = _submissionPriceWeiForRouter.add(
    gasPrice.mul(maxGasRouter)
  );
  const callValue = valueForGateway.add(valueForRouter);

  console.log(
    `Registering the custom token on L2 with ${callValue.toString()} callValue for L2 fees:`
  );

  const registerTokenTx = await customL1Token.registerTokenOnL2(
    customL2Token.address,
    _submissionPriceWeiForCustomBridge,
    _submissionPriceWeiForRouter,
    maxGasCustomBridge,
    maxGasRouter,
    gasPrice,
    valueForGateway,
    valueForRouter,
    env.wallets.l2.address,
    {
      value: callValue,
    }
  );

  const registerTokenRec = await registerTokenTx.wait();
  console.log(
    `Registering token txn confirmed on L1 ${registerTokenRec.transactionHash}`
  );

  // In principle, a single L1 txn can trigger any number of L1-to-L2 messages (each with its own sequencer number).
  // In this case, the registerTokenOnL2 method created 2 L1-to-L2 messages; (1) one to set the L1 token to the Custom Gateway via the Router, and (2) another to set the L1 token to its L2 token address via the Generic-Custom Gateway
  const inboxSeqNums = await env.bridge.getInboxSeqNumFromContractTransaction(
    registerTokenRec
  );

  if (!inboxSeqNums || inboxSeqNums.length !== 2) {
    throw new Error("Inbox triggered incorrectly");
  }

  const [customBridgeSeqNum, routerSeqNum] = inboxSeqNums;

  const customBridgeL2Tx = await env.bridge.calculateL2RetryableTransactionHash(
    customBridgeSeqNum
  );
  const routerL2Tx = await env.bridge.calculateL2RetryableTransactionHash(
    routerSeqNum
  );

  // Now we wait for the Sequencer to include both messages in its off chain inbox.
  console.log(
    `waiting for L2 tx 🕐... (should take < 10 minutes, current time: ${new Date().toTimeString()}`
  );

  const customBridgeL2Rec = await env.providers.l2.waitForTransaction(
    customBridgeL2Tx
  );
  const routerL2Rec = await env.providers.l2.waitForTransaction(routerL2Tx);

  console.log(
    `L2 retryable txn executed 🥳 ${customBridgeL2Rec.transactionHash}, ${routerL2Rec.transactionHash}`
  );
});
