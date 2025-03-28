import { hexToBigInt, uuidToBigInt } from "@pcd/util";

import { info, logGreen } from "../../../ts/logger";
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
deployment.deployTask(EDeploySteps.Policies, "Deploy policies").then((task) =>
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

    const freeForAllPolicyContractAddress = storage.getAddress(EContracts.FreeForAllPolicy, hre.network.name);
    const easPolicyContractAddress = storage.getAddress(EContracts.EASPolicy, hre.network.name);
    const hatsPolicyContractAddress = storage.getAddress(EContracts.HatsPolicy, hre.network.name);
    const gitcoinPolicyContractAddress = storage.getAddress(EContracts.GitcoinPassportPolicy, hre.network.name);
    const zupassPolicyContractAddress = storage.getAddress(EContracts.ZupassPolicy, hre.network.name);
    const semaphorePolicyContractAddress = storage.getAddress(EContracts.SemaphorePolicy, hre.network.name);
    const merkleProofPolicyContractAddress = storage.getAddress(EContracts.MerkleProofPolicy, hre.network.name);
    const deployFreeForAllPolicy = deployment.getDeployConfigField(EContracts.FreeForAllPolicy, "deploy");
    const deployEASPolicy = deployment.getDeployConfigField(EContracts.EASPolicy, "deploy");
    const deployGitcoinPolicy = deployment.getDeployConfigField(EContracts.GitcoinPassportPolicy, "deploy");
    const deployZupassPolicy = deployment.getDeployConfigField(EContracts.ZupassPolicy, "deploy");
    const deploySemaphorePolicy = deployment.getDeployConfigField(EContracts.SemaphorePolicy, "deploy");
    const deployHatsSinglePolicy = deployment.getDeployConfigField(EContracts.HatsPolicy, "deploy");
    const deployMerkleGateekeper = deployment.getDeployConfigField(EContracts.MerkleProofPolicy, "deploy");

    const skipDeployFreeForAllPolicy = deployFreeForAllPolicy !== true;
    const skipDeployEASPolicy = deployEASPolicy !== true;
    const skipDeployGitcoinPolicy = deployGitcoinPolicy !== true;
    const skipDeployZupassPolicy = deployZupassPolicy !== true;
    const skipDeploySemaphorePolicy = deploySemaphorePolicy !== true;
    const skipDeployHatsPolicy = deployHatsSinglePolicy !== true;
    const skipDeployMerkleProofPolicy = deployMerkleGateekeper !== true;

    const canSkipDeploy =
      incremental &&
      (freeForAllPolicyContractAddress || skipDeployFreeForAllPolicy) &&
      (easPolicyContractAddress || skipDeployEASPolicy) &&
      (gitcoinPolicyContractAddress || skipDeployGitcoinPolicy) &&
      (zupassPolicyContractAddress || skipDeployZupassPolicy) &&
      (semaphorePolicyContractAddress || skipDeploySemaphorePolicy) &&
      (hatsPolicyContractAddress || skipDeployHatsPolicy) &&
      (merkleProofPolicyContractAddress || skipDeployMerkleProofPolicy) &&
      (!skipDeployFreeForAllPolicy ||
        !skipDeployEASPolicy ||
        !skipDeployGitcoinPolicy ||
        !skipDeployZupassPolicy ||
        !skipDeploySemaphorePolicy ||
        !skipDeployHatsPolicy ||
        !skipDeployMerkleProofPolicy);

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

      await Promise.all([
        storage.register({
          id: EPolicies.FreeForAll,
          contract: freeForAllPolicyContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.FreeForAll,
          contract: freeForAllCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EPolicyFactories.FreeForAll,
          contract: freeForAllPolicyFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.FreeForAll,
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

      await Promise.all([
        storage.register({
          id: EPolicies.EAS,
          contract: easPolicyContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.EAS,
          contract: easCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EPolicyFactories.EAS,
          contract: easPolicyFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.EAS,
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

      await Promise.all([
        storage.register({
          id: EPolicies.GitcoinPassport,
          contract: gitcoinPolicyContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.GitcoinPassport,
          contract: gitcoinCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EPolicyFactories.GitcoinPassport,
          contract: gitcoinPolicyFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.GitcoinPassport,
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

      await Promise.all([
        storage.register({
          id: ECheckers.Zupass,
          contract: zupassCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EPolicies.Zupass,
          contract: zupassPolicyContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.Zupass,
          contract: zupassCheckerFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EPolicyFactories.Zupass,
          contract: zupassPolicyFactoryContract,
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

      await Promise.all([
        storage.register({
          id: EPolicies.Semaphore,
          contract: semaphorePolicyContract,
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
          id: EPolicyFactories.Semaphore,
          contract: semaphorePolicyFactoryContract,
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

      await Promise.all([
        storage.register({
          id: EPolicies.Hats,
          contract: hatsPolicyContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckers.Hats,
          contract: hatsCheckerContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EPolicyFactories.Hats,
          contract: hatsPolicyFactoryContract,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: ECheckerFactories.Hats,
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

      await Promise.all([
        storage.register({
          id: EPolicies.MerkleProof,
          contract: merkleProofPolicyContract,
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
          id: EPolicyFactories.MerkleProof,
          contract: merkleProofPolicyFactoryContract,
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
