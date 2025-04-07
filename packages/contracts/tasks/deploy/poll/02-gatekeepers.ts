import { hexToBigInt, uuidToBigInt } from "@pcd/util";

import { info, logGreen } from "../../../ts/logger";
import { MACI } from "../../../typechain-types";
import { EDeploySteps, ESupportedChains } from "../../helpers/constants";
import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import {
  ECheckerFactories,
  ECheckers,
  EContracts,
  EPolicyFactories,
  EPolicies,
  IDeployParams,
} from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment.deployTask(EDeploySteps.PollPolicy, "Deploy Poll policies").then((task) =>
  task.setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const {
      deployFreeForAllSignUpPolicy,
      deployZupassSignUpPolicy,
      deployEASSignUpPolicy,
      deployGitcoinPassportPolicy,
      deployMerkleProofPolicy,
      deploySemaphoreSignupPolicy,
      deployHatsSignupPolicy,
    } = await import("../../../ts/deploy");

    const maciContract = await deployment.getContract<MACI>({ name: EContracts.MACI });
    const pollId = await maciContract.nextPollId();

    const freeForAllPolicyContractAddress = storage.getAddress(
      EContracts.FreeForAllPolicy,
      hre.network.name,
      `poll-${pollId}`,
    );
    const easPolicyContractAddress = storage.getAddress(EContracts.EASPolicy, hre.network.name, `poll-${pollId}`);
    const hatsPolicyContractAddress = storage.getAddress(EContracts.HatsPolicy, hre.network.name, `poll-${pollId}`);
    const gitcoinPolicyContractAddress = storage.getAddress(
      EContracts.GitcoinPassportPolicy,
      hre.network.name,
      `poll-${pollId}`,
    );
    const zupassPolicyContractAddress = storage.getAddress(EContracts.ZupassPolicy, hre.network.name, `poll-${pollId}`);
    const semaphorePolicyContractAddress = storage.getAddress(
      EContracts.SemaphorePolicy,
      hre.network.name,
      `poll-${pollId}`,
    );
    const merkleProofPolicyContractAddress = storage.getAddress(
      EContracts.MerkleProofPolicy,
      hre.network.name,
      `poll-${pollId}`,
    );

    const policyToDeploy =
      deployment.getDeployConfigField<EContracts | null>(EContracts.Poll, "policy") || EContracts.FreeForAllPolicy;

    const skipDeployFreeForAllPolicy = policyToDeploy !== EContracts.FreeForAllPolicy;
    const skipDeployEASPolicy = policyToDeploy !== EContracts.EASPolicy;
    const skipDeployGitcoinPolicy = policyToDeploy !== EContracts.GitcoinPassportPolicy;
    const skipDeployZupassPolicy = policyToDeploy !== EContracts.ZupassPolicy;
    const skipDeploySemaphorePolicy = policyToDeploy !== EContracts.SemaphorePolicy;
    const skipDeployHatsPolicy = policyToDeploy !== EContracts.HatsPolicy;
    const skipDeployMerkleProofPolicy = policyToDeploy !== EContracts.MerkleProofPolicy;

    const hasPolicyAddress = [
      freeForAllPolicyContractAddress,
      easPolicyContractAddress,
      gitcoinPolicyContractAddress,
      zupassPolicyContractAddress,
      semaphorePolicyContractAddress,
      hatsPolicyContractAddress,
      merkleProofPolicyContractAddress,
    ].some(Boolean);

    const isSkipable = [
      skipDeployFreeForAllPolicy,
      skipDeployEASPolicy,
      skipDeployGitcoinPolicy,
      skipDeployZupassPolicy,
      skipDeploySemaphorePolicy,
      skipDeployHatsPolicy,
      skipDeployMerkleProofPolicy,
    ].some((skip) => !skip);

    const canSkipDeploy = incremental && hasPolicyAddress && isSkipable;

    if (canSkipDeploy) {
      // eslint-disable-next-line no-console
      logGreen({ text: info(`Skipping deployment of the Policy contract`) });
      return;
    }

    if (!skipDeployFreeForAllPolicy) {
      const [
        freeForAllPolicyContract,
        freeForAllCheckerContract,
        freeForAllPolicyFactoryContract,
        freeForAllCheckerFactoryContract,
      ] = await deployFreeForAllSignUpPolicy(deployer);

      const [policyContractImplementation, checkerContractImplementation] = await Promise.all([
        freeForAllPolicyFactoryContract.IMPLEMENTATION(),
        freeForAllCheckerFactoryContract.IMPLEMENTATION(),
      ]);

      await Promise.all([
        storage.register({
          id: EPolicies.FreeForAll,
          key: `poll-${pollId}`,
          name: EPolicies.FreeForAll,
          implementation: policyContractImplementation,
          contract: freeForAllPolicyContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.FreeForAll,
          name: ECheckers.FreeForAll,
          key: `poll-${pollId}`,
          implementation: checkerContractImplementation,
          contract: freeForAllCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EPolicyFactories.FreeForAll,
          name: EPolicyFactories.FreeForAll,
          key: `poll-${pollId}`,
          contract: freeForAllPolicyFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.FreeForAll,
          name: ECheckerFactories.FreeForAll,
          key: `poll-${pollId}`,
          contract: freeForAllCheckerFactoryContract,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }

    const isSupportedEASPolicyNetwork = ![ESupportedChains.Hardhat, ESupportedChains.Coverage].includes(
      hre.network.name as ESupportedChains,
    );

    if (!skipDeployEASPolicy && isSupportedEASPolicyNetwork) {
      const easAddress = deployment.getDeployConfigField<string>(EContracts.EASPolicy, "easAddress", true);
      const encodedSchema = deployment.getDeployConfigField<string>(EContracts.EASPolicy, "schema", true);
      const attester = deployment.getDeployConfigField<string>(EContracts.EASPolicy, "attester", true);

      const [easPolicyContract, easCheckerContract, easPolicyFactoryContract, easCheckerFactoryContract] =
        await deployEASSignUpPolicy(
          {
            eas: easAddress,
            attester,
            schema: encodedSchema,
          },
          deployer,
          true,
        );

      const [policyContractImplementation, checkerContractImplementation] = await Promise.all([
        easPolicyFactoryContract.IMPLEMENTATION(),
        easCheckerFactoryContract.IMPLEMENTATION(),
      ]);

      await Promise.all([
        storage.register({
          id: EPolicies.EAS,
          name: EPolicies.EAS,
          key: `poll-${pollId}`,
          implementation: policyContractImplementation,
          contract: easPolicyContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.EAS,
          name: ECheckers.EAS,
          key: `poll-${pollId}`,
          implementation: checkerContractImplementation,
          contract: easCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EPolicyFactories.EAS,
          name: EPolicyFactories.EAS,
          key: `poll-${pollId}`,
          contract: easPolicyFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.EAS,
          name: ECheckerFactories.EAS,
          key: `poll-${pollId}`,
          contract: easCheckerFactoryContract,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }

    const isSupportedGitcoinPolicyNetwork = ![
      ESupportedChains.Hardhat,
      ESupportedChains.Coverage,
      ESupportedChains.Sepolia,
    ].includes(hre.network.name as ESupportedChains);

    if (!skipDeployGitcoinPolicy && isSupportedGitcoinPolicyNetwork) {
      const gitcoinPolicyDecoderAddress = deployment.getDeployConfigField<string>(
        EContracts.GitcoinPassportPolicy,
        "decoderAddress",
        true,
      );
      const gitcoinPolicyPassingScore = deployment.getDeployConfigField<number>(
        EContracts.GitcoinPassportPolicy,
        "passingScore",
        true,
      );

      const [
        gitcoinPolicyContract,
        gitcoinCheckerContract,
        gitcoinPolicyFactoryContract,
        gitcoinCheckerFactoryContract,
      ] = await deployGitcoinPassportPolicy(
        {
          decoderAddress: gitcoinPolicyDecoderAddress,
          minimumScore: gitcoinPolicyPassingScore,
        },
        deployer,
        true,
      );

      const [policyContractImplementation, checkerContractImplementation] = await Promise.all([
        gitcoinPolicyFactoryContract.IMPLEMENTATION(),
        gitcoinCheckerFactoryContract.IMPLEMENTATION(),
      ]);

      await Promise.all([
        storage.register({
          id: EPolicies.GitcoinPassport,
          name: EPolicies.GitcoinPassport,
          key: `poll-${pollId}`,
          implementation: policyContractImplementation,
          contract: gitcoinPolicyContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.GitcoinPassport,
          name: ECheckers.GitcoinPassport,
          key: `poll-${pollId}`,
          implementation: checkerContractImplementation,
          contract: gitcoinCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EPolicyFactories.GitcoinPassport,
          name: EPolicyFactories.GitcoinPassport,
          key: `poll-${pollId}`,
          contract: gitcoinPolicyFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.GitcoinPassport,
          name: ECheckerFactories.GitcoinPassport,
          key: `poll-${pollId}`,
          contract: gitcoinCheckerFactoryContract,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }

    if (!skipDeployZupassPolicy) {
      const eventId = deployment.getDeployConfigField<string>(EContracts.ZupassPolicy, "eventId", true);
      const validEventId = uuidToBigInt(eventId);
      const signer1 = deployment.getDeployConfigField<string>(EContracts.ZupassPolicy, "signer1", true);
      const validSigner1 = hexToBigInt(signer1);
      const signer2 = deployment.getDeployConfigField<string>(EContracts.ZupassPolicy, "signer2", true);
      const validSigner2 = hexToBigInt(signer2);
      let verifier = deployment.getDeployConfigField<string | undefined>(EContracts.ZupassPolicy, "zupassVerifier");

      if (!verifier) {
        const verifierContract = await deployment.deployContract({
          name: EContracts.ZupassGroth16Verifier,
          signer: deployer,
        });
        verifier = await verifierContract.getAddress();
      }

      const [zupassPolicyContract, zupassCheckerContract, zupassPolicyFactoryContract, zupassCheckerFactoryContract] =
        await deployZupassSignUpPolicy(
          { eventId: validEventId, signer1: validSigner1, signer2: validSigner2, verifier },
          deployer,
        );

      const [policyContractImplementation, checkerContractImplementation] = await Promise.all([
        zupassPolicyFactoryContract.IMPLEMENTATION(),
        zupassCheckerFactoryContract.IMPLEMENTATION(),
      ]);

      await Promise.all([
        storage.register({
          id: EPolicies.Zupass,
          name: EPolicies.Zupass,
          key: `poll-${pollId}`,
          implementation: policyContractImplementation,
          contract: zupassPolicyContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.Zupass,
          name: ECheckers.Zupass,
          key: `poll-${pollId}`,
          implementation: checkerContractImplementation,
          contract: zupassCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EPolicyFactories.Zupass,
          name: EPolicyFactories.Zupass,
          key: `poll-${pollId}`,
          contract: zupassPolicyFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.Zupass,
          name: ECheckerFactories.Zupass,
          key: `poll-${pollId}`,
          contract: zupassCheckerFactoryContract,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }

    if (!skipDeploySemaphorePolicy) {
      const semaphoreContractAddress = deployment.getDeployConfigField<string>(
        EContracts.SemaphorePolicy,
        "semaphoreContract",
        true,
      );
      const groupId = deployment.getDeployConfigField<number>(EContracts.SemaphorePolicy, "groupId", true);

      const [
        semaphorePolicyContract,
        semaphoreCheckerContract,
        semaphorePolicyFactoryContract,
        semaphoreCheckerFactoryContract,
      ] = await deploySemaphoreSignupPolicy({ semaphore: semaphoreContractAddress, groupId }, deployer, true);

      const [policyContractImplementation, checkerContractImplementation] = await Promise.all([
        semaphorePolicyFactoryContract.IMPLEMENTATION(),
        semaphoreCheckerFactoryContract.IMPLEMENTATION(),
      ]);

      await Promise.all([
        storage.register({
          id: EPolicies.Semaphore,
          name: EPolicies.Semaphore,
          key: `poll-${pollId}`,
          implementation: policyContractImplementation,
          contract: semaphorePolicyContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.Semaphore,
          name: ECheckers.Semaphore,
          key: `poll-${pollId}`,
          implementation: checkerContractImplementation,
          contract: semaphoreCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EPolicyFactories.Semaphore,
          name: EPolicyFactories.Semaphore,
          key: `poll-${pollId}`,
          contract: semaphorePolicyFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.Semaphore,
          name: ECheckerFactories.Semaphore,
          key: `poll-${pollId}`,
          contract: semaphoreCheckerFactoryContract,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }

    if (!skipDeployHatsPolicy) {
      // get args
      const criterionHats = deployment.getDeployConfigField<string[]>(EContracts.HatsPolicy, "criterionHats", true);
      const hatsProtocolAddress = deployment.getDeployConfigField<string>(
        EContracts.HatsPolicy,
        "hatsProtocolAddress",
        true,
      );

      const [hatsPolicyContract, hatsCheckerContract, hatsPolicyFactoryContract, hatsCheckerFactoryContract] =
        await deployHatsSignupPolicy({ hats: hatsProtocolAddress, criterionHats }, deployer, true);

      const [policyContractImplementation, checkerContractImplementation] = await Promise.all([
        hatsPolicyFactoryContract.IMPLEMENTATION(),
        hatsCheckerFactoryContract.IMPLEMENTATION(),
      ]);

      await Promise.all([
        storage.register({
          id: EPolicies.Hats,
          name: EPolicies.Hats,
          key: `poll-${pollId}`,
          implementation: policyContractImplementation,
          contract: hatsPolicyContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.Hats,
          name: ECheckers.Hats,
          key: `poll-${pollId}`,
          implementation: checkerContractImplementation,
          contract: hatsCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EPolicyFactories.Hats,
          name: EPolicyFactories.Hats,
          key: `poll-${pollId}`,
          contract: hatsPolicyFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.Hats,
          name: ECheckerFactories.Hats,
          key: `poll-${pollId}`,
          contract: hatsCheckerFactoryContract,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }

    if (!skipDeployMerkleProofPolicy) {
      const root = deployment.getDeployConfigField<string>(EContracts.MerkleProofPolicy, "root", true);

      const [
        merkleProofPolicyContract,
        merkleProofCheckerContract,
        merkleProofPolicyFactoryContract,
        merkleProofCheckerFactoryContract,
      ] = await deployMerkleProofPolicy({ root }, deployer, true);

      const [policyContractImplementation, checkerContractImplementation] = await Promise.all([
        merkleProofPolicyFactoryContract.IMPLEMENTATION(),
        merkleProofCheckerFactoryContract.IMPLEMENTATION(),
      ]);

      await Promise.all([
        storage.register({
          id: EPolicies.MerkleProof,
          name: EPolicies.MerkleProof,
          key: `poll-${pollId}`,
          implementation: policyContractImplementation,
          contract: merkleProofPolicyContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.MerkleProof,
          name: ECheckers.MerkleProof,
          key: `poll-${pollId}`,
          implementation: checkerContractImplementation,
          contract: merkleProofCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EPolicyFactories.MerkleProof,
          name: EPolicyFactories.MerkleProof,
          key: `poll-${pollId}`,
          contract: merkleProofPolicyFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.MerkleProof,
          name: ECheckerFactories.MerkleProof,
          key: `poll-${pollId}`,
          contract: merkleProofCheckerFactoryContract,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }
  }),
);
