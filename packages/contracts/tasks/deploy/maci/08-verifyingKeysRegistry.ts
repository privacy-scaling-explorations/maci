import { EMode } from "@maci-protocol/core";
import { type IVerifyingKeyObjectParams, VerifyingKey } from "@maci-protocol/domainobjs";

import type { IVerifyingKeyStruct } from "../../../ts/types";
import type { VerifyingKeysRegistry } from "../../../typechain-types";

import { info, logGreen } from "../../../ts/logger";
import { extractVerifyingKey } from "../../../ts/proofs";
import { EDeploySteps } from "../../helpers/constants";
import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, type IDeployParams } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment.deployTask(EDeploySteps.VerifyingKeysRegistry, "Deploy verifying key Registry and set keys").then((task) =>
  task.setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const verifyingKeysRegistryContractAddress = storage.getAddress(EContracts.VerifyingKeysRegistry, hre.network.name);

    if (incremental && verifyingKeysRegistryContractAddress) {
      // eslint-disable-next-line no-console
      logGreen({ text: info(`Skipping deployment of the ${EContracts.VerifyingKeysRegistry} contract`) });
      return;
    }

    const stateTreeDepth = deployment.getDeployConfigField<number>(EContracts.VerifyingKeysRegistry, "stateTreeDepth");
    const pollStateTreeDepth =
      deployment.getDeployConfigField<number>(EContracts.Poll, "stateTreeDepth") || stateTreeDepth;
    const tallyProcessingStateTreeDepth = deployment.getDeployConfigField<number>(
      EContracts.VerifyingKeysRegistry,
      "tallyProcessingStateTreeDepth",
    );
    const messageBatchSize = deployment.getDeployConfigField<number>(
      EContracts.VerifyingKeysRegistry,
      "messageBatchSize",
    );
    const voteOptionTreeDepth = deployment.getDeployConfigField<number>(
      EContracts.VerifyingKeysRegistry,
      "voteOptionTreeDepth",
    );
    const pollJoiningZkeyPath = deployment.getDeployConfigField<string>(
      EContracts.VerifyingKeysRegistry,
      "zkeys.pollJoiningZkey.zkey",
    );
    const pollJoinedZkeyPath = deployment.getDeployConfigField<string>(
      EContracts.VerifyingKeysRegistry,
      "zkeys.pollJoinedZkey.zkey",
    );
    const messageProcessorZkeyPathQv = deployment.getDeployConfigField<string>(
      EContracts.VerifyingKeysRegistry,
      "zkeys.qv.messageProcessorZkey",
    );
    const messageProcessorZkeyPathNonQv = deployment.getDeployConfigField<string>(
      EContracts.VerifyingKeysRegistry,
      "zkeys.nonQv.messageProcessorZkey",
    );
    const voteTallyZkeyPathQv = deployment.getDeployConfigField<string>(
      EContracts.VerifyingKeysRegistry,
      "zkeys.qv.voteTallyZkey",
    );
    const voteTallyZkeyPathNonQv = deployment.getDeployConfigField<string>(
      EContracts.VerifyingKeysRegistry,
      "zkeys.nonQv.voteTallyZkey",
    );
    const tallyVotesZkeyPathFull = deployment.getDeployConfigField<string>(
      EContracts.VerifyingKeysRegistry,
      "zkeys.full.voteTallyZkey",
    );
    const messageProcessorZkeyPathFull = deployment.getDeployConfigField<string>(
      EContracts.VerifyingKeysRegistry,
      "zkeys.full.messageProcessorZkey",
    );
    const mode = deployment.getDeployConfigField<EMode | null>(EContracts.Poll, "mode") ?? EMode.QV;

    if (mode === EMode.QV && (!voteTallyZkeyPathQv || !messageProcessorZkeyPathQv)) {
      throw new Error("QV zkeys are not set");
    }

    if (mode === EMode.NON_QV && (!voteTallyZkeyPathNonQv || !messageProcessorZkeyPathNonQv)) {
      throw new Error("Non-QV zkeys are not set");
    }

    if (mode === EMode.FULL && (!tallyVotesZkeyPathFull || !messageProcessorZkeyPathFull)) {
      throw new Error("Full zkeys are not set");
    }

    if (!pollJoiningZkeyPath) {
      throw new Error("Poll zkeys are not set");
    }

    const [
      qvProcessVerifyingKey,
      qvTallyVerifyingKey,
      nonQvProcessVerifyingKey,
      nonQvTallyQv,
      fullProcessVerifyingKey,
      pollJoiningVerifyingKey,
      pollJoinedVerifyingKey,
    ] = await Promise.all([
      messageProcessorZkeyPathQv && extractVerifyingKey(messageProcessorZkeyPathQv),
      voteTallyZkeyPathQv && extractVerifyingKey(voteTallyZkeyPathQv),
      messageProcessorZkeyPathNonQv && extractVerifyingKey(messageProcessorZkeyPathNonQv),
      voteTallyZkeyPathNonQv && extractVerifyingKey(voteTallyZkeyPathNonQv),
      messageProcessorZkeyPathFull && extractVerifyingKey(messageProcessorZkeyPathFull),
      pollJoiningZkeyPath && extractVerifyingKey(pollJoiningZkeyPath),
      pollJoinedZkeyPath && extractVerifyingKey(pollJoinedZkeyPath),
    ]).then((verifyingKeys) =>
      verifyingKeys.map(
        (verifyingKey: IVerifyingKeyObjectParams | "" | undefined) =>
          verifyingKey && (VerifyingKey.fromObj(verifyingKey).asContractParam() as IVerifyingKeyStruct),
      ),
    );

    const initialOwner = await deployer.getAddress();

    const verifyingKeysRegistryContract = await deployment.deployContract<VerifyingKeysRegistry>(
      {
        name: EContracts.VerifyingKeysRegistry,
        signer: deployer,
      },
      initialOwner,
    );

    const processZkeys = [qvProcessVerifyingKey, nonQvProcessVerifyingKey, fullProcessVerifyingKey].filter(
      Boolean,
    ) as IVerifyingKeyStruct[];
    const tallyZkeys = [qvTallyVerifyingKey, nonQvTallyQv, nonQvTallyQv].filter(Boolean) as IVerifyingKeyStruct[];
    const modes: EMode[] = [];

    if (qvProcessVerifyingKey && qvTallyVerifyingKey) {
      modes.push(EMode.QV);
    }

    if (nonQvProcessVerifyingKey && nonQvTallyQv) {
      modes.push(EMode.NON_QV);
    }

    if (fullProcessVerifyingKey && nonQvTallyQv) {
      modes.push(EMode.FULL);
    }

    await verifyingKeysRegistryContract
      .setVerifyingKeysBatch({
        stateTreeDepth,
        pollStateTreeDepth,
        tallyProcessingStateTreeDepth,
        voteOptionTreeDepth,
        messageBatchSize,
        modes,
        pollJoiningVerifyingKey: pollJoiningVerifyingKey as IVerifyingKeyStruct,
        pollJoinedVerifyingKey: pollJoinedVerifyingKey as IVerifyingKeyStruct,
        processVerifyingKeys: processZkeys,
        tallyVerifyingKeys: tallyZkeys,
      })
      .then((tx) => tx.wait());

    await storage.register({
      id: EContracts.VerifyingKeysRegistry,
      contract: verifyingKeysRegistryContract,
      args: [initialOwner],
      network: hre.network.name,
    });
  }),
);
