import { MACI } from "../../../typechain-types";
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
deployment.deployTask(EDeploySteps.InitialVoiceCredit, "Deploy initial voice credit contracts").then((task) =>
  task.setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const maciContract = await deployment.getContract<MACI>({ name: EContracts.MACI });
    const pollId = await maciContract.nextPollId();

    const voicecreditToUseInPoll =
      deployment.getDeployConfigField<EContracts | null>(EContracts.Poll, "voicecredit") ||
      EContracts.ConstantInitialVoiceCreditProxy;

    const needDeployConstantVoiceCredit = deployment.getDeployConfigField(
      EContracts.ConstantInitialVoiceCreditProxy,
      "deploy",
    );
    if (needDeployConstantVoiceCredit) {
      const constantInitialVoiceCreditProxyContractAddress = storage.getAddress(
        EContracts.ConstantInitialVoiceCreditProxy,
        hre.network.name,
        `poll-${pollId}`,
      );
      if (incremental && constantInitialVoiceCreditProxyContractAddress) {
        // eslint-disable-next-line no-console
        console.log(`Skipping deployment of the ${EContracts.ConstantInitialVoiceCreditProxy} contract`);
      } else {
        const amount =
          deployment.getDeployConfigField<number | null>(EContracts.ConstantInitialVoiceCreditProxy, "amount") ??
          DEFAULT_INITIAL_VOICE_CREDITS;
        const constantInitialVoiceCreditProxyContract = await deployment.deployContract(
          { name: EContracts.ConstantInitialVoiceCreditProxy, signer: deployer },
          amount.toString(),
        );
        await storage.register({
          id: EContracts.ConstantInitialVoiceCreditProxy,
          key: voicecreditToUseInPoll === EContracts.ConstantInitialVoiceCreditProxy ? `poll-${pollId}` : undefined,
          contract: constantInitialVoiceCreditProxyContract,
          args: [amount.toString()],
          network: hre.network.name,
        });
      }
    }

    const needDeployPerTokenVoiceCredit = deployment.getDeployConfigField(
      EContracts.PerTokenVoiceCreditProxy,
      "deploy",
    );
    if (needDeployPerTokenVoiceCredit) {
      const perTokenVoiceCreditProxyContractAddress = storage.getAddress(
        EContracts.PerTokenVoiceCreditProxy,
        hre.network.name,
        `poll-${pollId}`,
      );
      if (incremental && perTokenVoiceCreditProxyContractAddress) {
        // eslint-disable-next-line no-console
        console.log(`Skipping deployment of the ${EContracts.PerTokenVoiceCreditProxy} contract`);
      } else {
        const receiverAddress = deployment.getDeployConfigField<string>(
          EContracts.PerTokenVoiceCreditProxy,
          "receiver",
        );
        const tokenAddress = deployment.getDeployConfigField<string>(EContracts.PerTokenVoiceCreditProxy, "token");
        const conversionRate = deployment.getDeployConfigField<number>(
          EContracts.PerTokenVoiceCreditProxy,
          "conversionRate",
        );

        const perTokenVoiceCreditProxyContract = await deployment.deployContract(
          { name: EContracts.PerTokenVoiceCreditProxy, signer: deployer },
          receiverAddress,
          tokenAddress,
          conversionRate,
        );
        await storage.register({
          id: EContracts.PerTokenVoiceCreditProxy,
          key: voicecreditToUseInPoll === EContracts.PerTokenVoiceCreditProxy ? `poll-${pollId}` : undefined,
          contract: perTokenVoiceCreditProxyContract,
          args: [receiverAddress, tokenAddress, conversionRate],
          network: hre.network.name,
        });
      }
    }
  }),
);
