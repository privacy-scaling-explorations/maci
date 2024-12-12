import { EDeploySteps } from "../../helpers/constants";
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
  .deployTask(EDeploySteps.ConstantInitialVoiceCreditProxy, "Deploy constant initial voice credit proxy")
  .then((task) =>
    task.setAction(async ({ incremental }: IDeployParams, hre) => {
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
        // eslint-disable-next-line no-console
        console.log(`Skipping deployment of the ${EContracts.ConstantInitialVoiceCreditProxy} contract`);
        return;
      }

      const amount =
        deployment.getDeployConfigField<number | null>(EContracts.ConstantInitialVoiceCreditProxy, "amount") ??
        DEFAULT_INITIAL_VOICE_CREDITS;

      const constantInitialVoiceCreditProxyContract = await deployment.deployContract(
        { name: EContracts.ConstantInitialVoiceCreditProxy, signer: deployer },
        amount.toString(),
      );

      await storage.register({
        id: EContracts.ConstantInitialVoiceCreditProxy,
        contract: constantInitialVoiceCreditProxyContract,
        args: [amount.toString()],
        network: hre.network.name,
      });
    }),
  );
