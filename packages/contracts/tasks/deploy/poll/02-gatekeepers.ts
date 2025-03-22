import { hexToBigInt, uuidToBigInt } from "@pcd/util";

import { info, logGreen } from "../../../ts/logger";
import { HatsGatekeeperBase, MACI } from "../../../typechain-types";
import { EDeploySteps, ESupportedChains } from "../../helpers/constants";
import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import {
  ECheckerFactories,
  ECheckers,
  EContracts,
  EGatekeeperFactories,
  EGatekeepers,
  IDeployParams,
} from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment.deployTask(EDeploySteps.PollGatekeeper, "Deploy Poll gatekeepers").then((task) =>
  task.setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const {
      deployFreeForAllSignUpGatekeeper,
      deployZupassSignUpGatekeeper,
      deployEASSignUpGatekeeper,
      deployGitcoinPassportGatekeeper,
      deployMerkleProofGatekeeper,
      deploySemaphoreSignupGatekeeper,
    } = await import("../../../ts/deploy");

    const maciContract = await deployment.getContract<MACI>({ name: EContracts.MACI });
    const pollId = await maciContract.nextPollId();

    const freeForAllGatekeeperContractAddress = storage.getAddress(
      EContracts.FreeForAllGatekeeper,
      hre.network.name,
      `poll-${pollId}`,
    );
    const easGatekeeperContractAddress = storage.getAddress(
      EContracts.EASGatekeeper,
      hre.network.name,
      `poll-${pollId}`,
    );
    const hatsGatekeeperContractAddress = storage.getAddress(
      EContracts.HatsGatekeeper,
      hre.network.name,
      `poll-${pollId}`,
    );
    const gitcoinGatekeeperContractAddress = storage.getAddress(
      EContracts.GitcoinPassportGatekeeper,
      hre.network.name,
      `poll-${pollId}`,
    );
    const zupassGatekeeperContractAddress = storage.getAddress(
      EContracts.ZupassGatekeeper,
      hre.network.name,
      `poll-${pollId}`,
    );
    const semaphoreGatekeeperContractAddress = storage.getAddress(
      EContracts.SemaphoreGatekeeper,
      hre.network.name,
      `poll-${pollId}`,
    );
    const merkleProofGatekeeperContractAddress = storage.getAddress(
      EContracts.MerkleProofGatekeeper,
      hre.network.name,
      `poll-${pollId}`,
    );

    const gatekeeperToDeploy =
      deployment.getDeployConfigField<EContracts | null>(EContracts.Poll, "gatekeeper") ||
      EContracts.FreeForAllGatekeeper;

    const skipDeployFreeForAllGatekeeper = gatekeeperToDeploy !== EContracts.FreeForAllGatekeeper;
    const skipDeployEASGatekeeper = gatekeeperToDeploy !== EContracts.EASGatekeeper;
    const skipDeployGitcoinGatekeeper = gatekeeperToDeploy !== EContracts.GitcoinPassportGatekeeper;
    const skipDeployZupassGatekeeper = gatekeeperToDeploy !== EContracts.ZupassGatekeeper;
    const skipDeploySemaphoreGatekeeper = gatekeeperToDeploy !== EContracts.SemaphoreGatekeeper;
    const skipDeployHatsGatekeeper = gatekeeperToDeploy !== EContracts.HatsGatekeeper;
    const skipDeployMerkleProofGatekeeper = gatekeeperToDeploy !== EContracts.MerkleProofGatekeeper;

    const hasGatekeeperAddress = [
      freeForAllGatekeeperContractAddress,
      easGatekeeperContractAddress,
      gitcoinGatekeeperContractAddress,
      zupassGatekeeperContractAddress,
      semaphoreGatekeeperContractAddress,
      hatsGatekeeperContractAddress,
      merkleProofGatekeeperContractAddress,
    ].some(Boolean);

    const isSkipable = [
      skipDeployFreeForAllGatekeeper,
      skipDeployEASGatekeeper,
      skipDeployGitcoinGatekeeper,
      skipDeployZupassGatekeeper,
      skipDeploySemaphoreGatekeeper,
      skipDeployHatsGatekeeper,
      skipDeployMerkleProofGatekeeper,
    ].some((skip) => !skip);

    const canSkipDeploy = incremental && hasGatekeeperAddress && isSkipable;

    if (canSkipDeploy) {
      // eslint-disable-next-line no-console
      logGreen({ text: info(`Skipping deployment of the Gatekeeper contract`) });
      return;
    }

    if (!skipDeployFreeForAllGatekeeper) {
      const [
        freeForAllGatekeeperContract,
        freeForAllCheckerContract,
        freeForAllGatekeeperFactoryContract,
        freeForAllCheckerFactoryContract,
      ] = await deployFreeForAllSignUpGatekeeper(deployer);

      await Promise.all([
        storage.register({
          id: EContracts.FreeForAllGatekeeper,
          key: `poll-${pollId}`,
          contract: freeForAllGatekeeperContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.FreeForAll,
          key: `poll-${pollId}`,
          contract: freeForAllCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EGatekeeperFactories.FreeForAll,
          key: `poll-${pollId}`,
          contract: freeForAllGatekeeperFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.FreeForAll,
          key: `poll-${pollId}`,
          contract: freeForAllCheckerFactoryContract,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }

    const isSupportedEASGatekeeperNetwork = ![ESupportedChains.Hardhat, ESupportedChains.Coverage].includes(
      hre.network.name as ESupportedChains,
    );

    if (!skipDeployEASGatekeeper && isSupportedEASGatekeeperNetwork) {
      const easAddress = deployment.getDeployConfigField<string>(EContracts.EASGatekeeper, "easAddress", true);
      const encodedSchema = deployment.getDeployConfigField<string>(EContracts.EASGatekeeper, "schema", true);
      const attester = deployment.getDeployConfigField<string>(EContracts.EASGatekeeper, "attester", true);

      const [easGatekeeperContract, easCheckerContract, easGatekeeperFactoryContract, easCheckerFactoryContract] =
        await deployEASSignUpGatekeeper(
          {
            eas: easAddress,
            attester,
            schema: encodedSchema,
          },
          deployer,
          true,
        );

      await Promise.all([
        storage.register({
          id: EGatekeepers.EAS,
          key: `poll-${pollId}`,
          contract: easGatekeeperContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.EAS,
          key: `poll-${pollId}`,
          contract: easCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EGatekeeperFactories.EAS,
          key: `poll-${pollId}`,
          contract: easGatekeeperFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.EAS,
          key: `poll-${pollId}`,
          contract: easCheckerFactoryContract,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }

    const isSupportedGitcoinGatekeeperNetwork = ![
      ESupportedChains.Hardhat,
      ESupportedChains.Coverage,
      ESupportedChains.Sepolia,
    ].includes(hre.network.name as ESupportedChains);

    if (!skipDeployGitcoinGatekeeper && isSupportedGitcoinGatekeeperNetwork) {
      const gitcoinGatekeeperDecoderAddress = deployment.getDeployConfigField<string>(
        EContracts.GitcoinPassportGatekeeper,
        "decoderAddress",
        true,
      );
      const gitcoinGatekeeperPassingScore = deployment.getDeployConfigField<number>(
        EContracts.GitcoinPassportGatekeeper,
        "passingScore",
        true,
      );

      const [
        gitcoinGatekeeperContract,
        gitcoinCheckerContract,
        gitcoinGatekeeperFactoryContract,
        gitcoinCheckerFactoryContract,
      ] = await deployGitcoinPassportGatekeeper(
        {
          decoderAddress: gitcoinGatekeeperDecoderAddress,
          minimumScore: gitcoinGatekeeperPassingScore,
        },
        deployer,
        true,
      );

      await Promise.all([
        storage.register({
          id: EGatekeepers.GitcoinPassport,
          key: `poll-${pollId}`,
          contract: gitcoinGatekeeperContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.GitcoinPassport,
          key: `poll-${pollId}`,
          contract: gitcoinCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EGatekeeperFactories.GitcoinPassport,
          key: `poll-${pollId}`,
          contract: gitcoinGatekeeperFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.GitcoinPassport,
          key: `poll-${pollId}`,
          contract: gitcoinCheckerFactoryContract,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }

    if (!skipDeployZupassGatekeeper) {
      const eventId = deployment.getDeployConfigField<string>(EContracts.ZupassGatekeeper, "eventId", true);
      const validEventId = uuidToBigInt(eventId);
      const signer1 = deployment.getDeployConfigField<string>(EContracts.ZupassGatekeeper, "signer1", true);
      const validSigner1 = hexToBigInt(signer1);
      const signer2 = deployment.getDeployConfigField<string>(EContracts.ZupassGatekeeper, "signer2", true);
      const validSigner2 = hexToBigInt(signer2);
      let verifier = deployment.getDeployConfigField<string | undefined>(EContracts.ZupassGatekeeper, "zupassVerifier");

      if (!verifier) {
        const verifierContract = await deployment.deployContract({
          name: EContracts.ZupassGroth16Verifier,
          signer: deployer,
        });
        verifier = await verifierContract.getAddress();
      }

      const [
        zupassGatekeeperContract,
        zupassCheckerContract,
        zupassGatekeeperFactoryContract,
        zupassCheckerFactoryContract,
      ] = await deployZupassSignUpGatekeeper(
        { eventId: validEventId, signer1: validSigner1, signer2: validSigner2, verifier },
        deployer,
      );

      await Promise.all([
        storage.register({
          id: EGatekeepers.Zupass,
          key: `poll-${pollId}`,
          contract: zupassGatekeeperContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.Zupass,
          key: `poll-${pollId}`,
          contract: zupassCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EGatekeeperFactories.Zupass,
          key: `poll-${pollId}`,
          contract: zupassGatekeeperFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.Zupass,
          key: `poll-${pollId}`,
          contract: zupassCheckerFactoryContract,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }

    if (!skipDeploySemaphoreGatekeeper) {
      const semaphoreContractAddress = deployment.getDeployConfigField<string>(
        EContracts.SemaphoreGatekeeper,
        "semaphoreContract",
        true,
      );
      const groupId = deployment.getDeployConfigField<number>(EContracts.SemaphoreGatekeeper, "groupId", true);

      const [
        semaphoreGatekeeperContract,
        semaphoreCheckerContract,
        semaphoreGatekeeperFactoryContract,
        semaphoreCheckerFactoryContract,
      ] = await deploySemaphoreSignupGatekeeper({ semaphore: semaphoreContractAddress, groupId }, deployer, true);

      await Promise.all([
        storage.register({
          id: EGatekeepers.Semaphore,
          contract: semaphoreGatekeeperContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.Semaphore,
          contract: semaphoreCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EGatekeeperFactories.Semaphore,
          contract: semaphoreGatekeeperFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.Semaphore,
          contract: semaphoreCheckerFactoryContract,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }

    if (!skipDeployHatsGatekeeper) {
      // get args
      const criterionHats = deployment.getDeployConfigField<string[]>(EContracts.HatsGatekeeper, "criterionHats", true);
      const hatsProtocolAddress = deployment.getDeployConfigField<string>(
        EContracts.HatsGatekeeper,
        "hatsProtocolAddress",
        true,
      );

      let hatsGatekeeperContract: HatsGatekeeperBase;
      // if we have one we use the single gatekeeper
      if (criterionHats.length === 1) {
        hatsGatekeeperContract = await deployment.deployContract(
          {
            name: EContracts.HatsGatekeeperSingle,
            signer: deployer,
          },
          hatsProtocolAddress,
          criterionHats[0],
        );
      } else {
        hatsGatekeeperContract = await deployment.deployContract(
          {
            name: EContracts.HatsGatekeeperMultiple,
            signer: deployer,
          },
          hatsProtocolAddress,
          criterionHats,
        );
      }

      await storage.register({
        id: EContracts.HatsGatekeeper,
        key: `poll-${pollId}`,
        contract: hatsGatekeeperContract,
        args: [hatsProtocolAddress, criterionHats.length === 1 ? criterionHats[0] : criterionHats],
        network: hre.network.name,
      });
    }

    if (!skipDeployMerkleProofGatekeeper) {
      const root = deployment.getDeployConfigField<string>(EContracts.MerkleProofGatekeeper, "root", true);

      const [
        merkleProofGatekeeperContract,
        merkleProofCheckerContract,
        merkleProofGatekeeperFactoryContract,
        merkleProofCheckerFactoryContract,
      ] = await deployMerkleProofGatekeeper({ root }, deployer, true);

      await Promise.all([
        storage.register({
          id: EGatekeepers.MerkleProof,
          contract: merkleProofGatekeeperContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.MerkleProof,
          contract: merkleProofCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EGatekeeperFactories.MerkleProof,
          contract: merkleProofGatekeeperFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.MerkleProof,
          contract: merkleProofCheckerFactoryContract,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }
  }),
);
