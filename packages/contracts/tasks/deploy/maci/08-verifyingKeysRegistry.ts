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
    const processMessagesZkeyPathQv = deployment.getDeployConfigField<string>(
      EContracts.VerifyingKeysRegistry,
      "zkeys.qv.processMessagesZkey",
    );
    const processMessagesZkeyPathNonQv = deployment.getDeployConfigField<string>(
      EContracts.VerifyingKeysRegistry,
      "zkeys.nonQv.processMessagesZkey",
    );
    const tallyVotesZkeyPathQv = deployment.getDeployConfigField<string>(
      EContracts.VerifyingKeysRegistry,
      "zkeys.qv.tallyVotesZkey",
    );
    const tallyVotesZkeyPathNonQv = deployment.getDeployConfigField<string>(
      EContracts.VerifyingKeysRegistry,
      "zkeys.nonQv.tallyVotesZkey",
    );
    const tallyVotesZkeyPathFull = deployment.getDeployConfigField<string>(
      EContracts.VerifyingKeysRegistry,
      "zkeys.full.tallyVotesZkey",
    );
    const processMessagesZkeyPathFull = deployment.getDeployConfigField<string>(
      EContracts.VerifyingKeysRegistry,
      "zkeys.full.processMessagesZkey",
    );
    const mode = deployment.getDeployConfigField<EMode | null>(EContracts.Poll, "mode") ?? EMode.NON_QV;

    if (mode === EMode.QV && (!tallyVotesZkeyPathQv || !processMessagesZkeyPathQv)) {
      throw new Error("QV zkeys are not set");
    }

    if (mode === EMode.NON_QV && (!tallyVotesZkeyPathNonQv || !processMessagesZkeyPathNonQv)) {
      throw new Error("Non-QV zkeys are not set");
    }

    if (mode === EMode.FULL && (!tallyVotesZkeyPathFull || !processMessagesZkeyPathFull)) {
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
      pollJoiningVerifyingKey,
      pollJoinedVerifyingKey,
    ] = await Promise.all([
      processMessagesZkeyPathQv && extractVerifyingKey(processMessagesZkeyPathQv),
      tallyVotesZkeyPathQv && extractVerifyingKey(tallyVotesZkeyPathQv),
      processMessagesZkeyPathNonQv && extractVerifyingKey(processMessagesZkeyPathNonQv),
      tallyVotesZkeyPathNonQv && extractVerifyingKey(tallyVotesZkeyPathNonQv),
      pollJoiningZkeyPath && extractVerifyingKey(pollJoiningZkeyPath),
      pollJoinedZkeyPath && extractVerifyingKey(pollJoinedZkeyPath),
    ]).then((verifyingKeys) =>
      verifyingKeys.map(
        (verifyingKey: IVerifyingKeyObjectParams | "" | undefined) =>
          verifyingKey && (VerifyingKey.fromObj(verifyingKey).asContractParam() as IVerifyingKeyStruct),
      ),
    );

    const verifyingKeysRegistryContract = await deployment.deployContract<VerifyingKeysRegistry>(
      {
        name: EContracts.VerifyingKeysRegistry,
        signer: deployer,
      },
      await deployer.getAddress(),
    );

    const processZkeys = [qvProcessVerifyingKey, nonQvProcessVerifyingKey].filter(Boolean) as IVerifyingKeyStruct[];
    const tallyZkeys = [qvTallyVerifyingKey, nonQvTallyQv].filter(Boolean) as IVerifyingKeyStruct[];
    const modes: EMode[] = [];

    if (qvProcessVerifyingKey && qvTallyVerifyingKey) {
      modes.push(EMode.QV);
    }

    if (nonQvProcessVerifyingKey && nonQvTallyQv) {
      modes.push(EMode.NON_QV);
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
      args: [],
      network: hre.network.name,
    });
  }),
);
