import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, IDeployParams } from "../../helpers/types";

const DEFAULT_INITIAL_VOICE_CREDITS = 99;

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment
  .deployTask("full:deploy-constant-initial-voice-credit-proxy", "Deploy constant initial voice credit proxy")
  .setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const needDeploy = deployment.getDeployConfigField(EContracts.ConstantInitialVoiceCreditProxy, "deploy");

    if (needDeploy === false) {
      return;
    }

    const constantInitialVoiceCreditProxyContractAddress = storage.getAddress(
      EContracts.ConstantInitialVoiceCreditProxy,
      hre.network.name,
    );

    if (incremental && constantInitialVoiceCreditProxyContractAddress) {
      return;
    }

    const amount =
      deployment.getDeployConfigField<number | null>(EContracts.ConstantInitialVoiceCreditProxy, "amount") ??
      DEFAULT_INITIAL_VOICE_CREDITS;

    const constantInitialVoiceCreditProxyContract = await deployment.deployContract(
      EContracts.ConstantInitialVoiceCreditProxy,
      deployer,
      amount.toString(),
    );

    await storage.register({
      id: EContracts.ConstantInitialVoiceCreditProxy,
      contract: constantInitialVoiceCreditProxyContract,
      args: [amount.toString()],
      network: hre.network.name,
    });
  });
