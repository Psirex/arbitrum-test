import { task } from "hardhat/config";
import { OutgoingMessageState } from "arb-ts";
import { TaskEnvironment } from "../utils/task-environment";

task("outbox-execute", "Executes transaction send from Arbitrum to Ethereum")
  .addPositionalParam("hash", "Hash of Arbitrum transaction to execute")
  .setAction(async ({ hash }) => {
    const env = await TaskEnvironment.init();
    const initiatingTxnReceipt =
      await env.bridge.l2Provider.getTransactionReceipt(hash);

    if (!initiatingTxnReceipt) {
      throw new Error(
        `No Arbitrum transaction found with provided txn hash: ${hash}`
      );
    }

    // In order to trigger the outbox message, we'll first need the outgoing
    // messages batch number and index; together these two things uniquely
    // identify an outgoing message. To get this data, we'll use getWithdrawalsInL2Transaction,
    // which retrieves this data from the L2 events logs
    const outGoingMessagesFromTxn =
      await env.bridge.getWithdrawalsInL2Transaction(initiatingTxnReceipt);

    if (outGoingMessagesFromTxn.length === 0) {
      throw new Error(`Txn ${hash} did not initiate an outgoing messages`);
    }

    // execute only first outgoing message in tx
    const { batchNumber, indexInBatch } = outGoingMessagesFromTxn[0];

    const outgoingMessageState = await env.bridge.getOutGoingMessageState(
      batchNumber,
      indexInBatch
    );

    console.log(
      `Waiting for message to be confirmed: Batchnumber: ${batchNumber}, IndexInBatch ${indexInBatch}`
    );
    console.log(
      `Outgoing message state: ${OutgoingMessageState[outgoingMessageState]}`
    );

    const timeToWaitMs = 1000 * 60;
    while (outgoingMessageState !== OutgoingMessageState.CONFIRMED) {
      console.log(
        `Message not yet confirmed; we'll wait ${
          timeToWaitMs / 1000
        } seconds and try again`
      );
      await wait(timeToWaitMs);
      const outgoingMessageState = await env.bridge.getOutGoingMessageState(
        batchNumber,
        indexInBatch
      );

      switch (outgoingMessageState) {
        case OutgoingMessageState.NOT_FOUND: {
          throw new Error(
            "Message not found; something strange and bad happened"
          );
        }
        case OutgoingMessageState.EXECUTED: {
          throw new Error("Message already executed! Nothing else to do here");
        }
        case OutgoingMessageState.UNCONFIRMED: {
          break;
        }

        default:
          break;
      }
    }

    const res = await env.bridge.triggerL2ToL1Transaction(
      batchNumber,
      indexInBatch
    );
    const rec = await res.wait();

    console.log("Done! Your transaction is executed", rec);
  });

const wait = (ms = 0) => {
  return new Promise((resolve) => setTimeout(resolve, ms || 10000));
};
