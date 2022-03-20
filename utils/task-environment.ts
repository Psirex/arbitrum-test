import { Bridge } from "arb-ts";
import { ContractReceipt, ethers, providers, Wallet } from "ethers";
import { loadEnvVariables } from "./env";
import { logParams } from "./log";

interface LayersPair<L1, L2 = L1> {
  l1: L1;
  l2: L2;
}

type LayersProviders = LayersPair<providers.JsonRpcProvider>;
type LayersWallets = LayersPair<Wallet>;

export class TaskEnvironment {
  public readonly bridge: Bridge;
  public readonly providers: LayersProviders;
  public readonly wallets: LayersWallets;

  private constructor(
    bridge: Bridge,
    providers: LayersProviders,
    wallets: LayersWallets
  ) {
    this.bridge = bridge;
    this.wallets = wallets;
    this.providers = providers;
  }

  static async init() {
    const { PRIVATE_KEY, L1RPC, L2RPC } = loadEnvVariables([
      "L1RPC",
      "L2RPC",
      "PRIVATE_KEY",
    ]);
    const l1Provider = new providers.JsonRpcProvider(L1RPC);
    const l2Provider = new providers.JsonRpcProvider(L2RPC);
    const l1Wallet = new Wallet(PRIVATE_KEY, l1Provider);
    const l2Wallet = new Wallet(PRIVATE_KEY, l2Provider);
    const bridge = await Bridge.init(l1Wallet, l2Wallet);

    const [l1Network, l2Network] = await Promise.all([
      l1Provider.getNetwork(),
      l2Provider.getNetwork(),
    ]);
    logParams("Current Environment", {
      "L1 Provider": l1Network.name,
      "L2 Provider": l2Network.name,
      "Connected Account": l1Wallet.address,
    });

    return new TaskEnvironment(
      bridge,
      { l1: l1Provider, l2: l2Provider },
      { l1: l1Wallet, l2: l2Wallet }
    );
  }

  async waitForL2RetryableTx(l1Receipt: ContractReceipt) {
    const [seqNum] = await this.bridge
      .getInboxSeqNumFromContractTransaction(l1Receipt)
      .then((seqNums) => seqNums || []);
    const l2TxHash = await this.bridge.calculateL2RetryableTransactionHash(
      seqNum
    );

    console.log(
      `Waiting for L2 tx ${l2TxHash} (takes < 10 minutes; current time: ${new Date().toTimeString()})`
    );
    // wait for the L2 tx to go through
    const l2Receipt = await this.bridge.l2Provider.waitForTransaction(
      l2TxHash,
      undefined,
      12 * 60 * 1000
    );
    console.log(`Tx is finished`);

    return l2Receipt;
  }
}
