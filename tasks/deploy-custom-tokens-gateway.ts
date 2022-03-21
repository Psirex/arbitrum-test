import { task } from "hardhat/config";
import {
  DummyERC20Token__factory,
  L1TokensGateway__factory,
  L2TokensGateway__factory,
} from "../typechain";
import { TaskEnvironment } from "../utils/task-environment";

task(
  "deploy-custom-tokens-gateway",
  "Deploys custom gateway to transfer tokens from Ethereum to Arbitrum and vice versa"
).setAction(async () => {
  const env = await TaskEnvironment.init();

  console.log("Deploying the dummy token to L1");
  const l1DummyToken = await new DummyERC20Token__factory(
    env.wallets.l1
  ).deploy("Dummy L1 Token", "D1TKN", 2, 1_000_000_00);
  console.log(`Dummy token is deployed to L1 at ${l1DummyToken.address}`);

  console.log("Deploying the dummy token to L2");
  const l2MintableToken = await new DummyERC20Token__factory(
    env.wallets.l2
  ).deploy("Mintable L2 Token", "M2TKN", 2, 0);
  console.log(`Dummy token is deployed to L2 at ${l2MintableToken.address}`);

  console.log("Deploying the L2TokensGateway");
  const l2TokensGateway = await new L2TokensGateway__factory(
    env.wallets.l2
  ).deploy(l2MintableToken.address);
  console.log(
    `L2TokensGateway is deployed to L2 at ${l2TokensGateway.address}`
  );

  console.log("Set L2TokensGateway as minter for Mintable L2 token");
  const tx = await l2MintableToken.setMinter(l2TokensGateway.address);
  await tx.wait();
  console.log("Minter for L2TokensGateway set");

  console.log("Deploying the L1TokensGateway");
  const l1TokensGateway = await new L1TokensGateway__factory(
    env.wallets.l1
  ).deploy(
    env.variables.INBOX_ADDRESS,
    l1DummyToken.address,
    l2TokensGateway.address
  );
  console.log(
    `L1TokensGateway is deployed to L1 at ${l1TokensGateway.address}`
  );

  console.log("Set L1TokensGateway in L2TokensGateway");
  await l2TokensGateway.setL1TokensGateway(l1TokensGateway.address);
  console.log("L1TokensGateway was set");
});
