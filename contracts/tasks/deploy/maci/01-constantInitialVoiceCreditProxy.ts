import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, IDeployParams } from "../../helpers/types";

const DEFAULT_INITIAL_VOICE_CREDITS = 99;

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

deployment
  .deployTask("full:deploy-constant-initial-voice-credit-proxy", "Deploy constant initial voice credit proxy")
  .setAction(
    async ({ amount = DEFAULT_INITIAL_VOICE_CREDITS, incremental }: IDeployParams & { amount: number }, hre) => {
      deployment.setHre(hre);
      const deployer = await deployment.getDeployer();

      const constantInitialVoiceCreditProxyContractAddress = storage.getAddress(
        EContracts.ConstantInitialVoiceCreditProxy,
        hre.network.name,
      );

      if (incremental && constantInitialVoiceCreditProxyContractAddress) {
        return;
      }

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
    },
  );
