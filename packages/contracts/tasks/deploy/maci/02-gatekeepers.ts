import { HatsGatekeeperBase } from "../../../typechain-types";
import { EDeploySteps, ESupportedChains } from "../../helpers/constants";
import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { uuidToBigInt } from "../../helpers/numericParser";
import { EContracts, IDeployParams } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment.deployTask(EDeploySteps.Gatekeepers, "Deploy gatekeepers").then((task) =>
  task.setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const freeForAllGatekeeperContractAddress = storage.getAddress(EContracts.FreeForAllGatekeeper, hre.network.name);
    const easGatekeeperContractAddress = storage.getAddress(EContracts.EASGatekeeper, hre.network.name);
    const hatsGatekeeperContractAddress = storage.getAddress(EContracts.HatsGatekeeper, hre.network.name);
    const gitcoinGatekeeperContractAddress = storage.getAddress(EContracts.GitcoinPassportGatekeeper, hre.network.name);
    const zupassGatekeeperContractAddress = storage.getAddress(EContracts.ZupassGatekeeper, hre.network.name);
    const semaphoreGatekeeperContractAddress = storage.getAddress(EContracts.SemaphoreGatekeeper, hre.network.name);
    const merkleProofGatekeeperContractAddress = storage.getAddress(EContracts.MerkleProofGatekeeper, hre.network.name);
    const deployFreeForAllGatekeeper = deployment.getDeployConfigField(EContracts.FreeForAllGatekeeper, "deploy");
    const deployEASGatekeeper = deployment.getDeployConfigField(EContracts.EASGatekeeper, "deploy");
    const deployGitcoinGatekeeper = deployment.getDeployConfigField(EContracts.GitcoinPassportGatekeeper, "deploy");
    const deployZupassGatekeeper = deployment.getDeployConfigField(EContracts.ZupassGatekeeper, "deploy");
    const deploySemaphoreGatekeeper = deployment.getDeployConfigField(EContracts.SemaphoreGatekeeper, "deploy");
    const deployHatsSingleGatekeeper = deployment.getDeployConfigField(EContracts.HatsGatekeeper, "deploy");
    const deployMerkleGateekeper = deployment.getDeployConfigField(EContracts.MerkleProofGatekeeper, "deploy");

    const skipDeployFreeForAllGatekeeper = deployFreeForAllGatekeeper !== true;
    const skipDeployEASGatekeeper = deployEASGatekeeper !== true;
    const skipDeployGitcoinGatekeeper = deployGitcoinGatekeeper !== true;
    const skipDeployZupassGatekeeper = deployZupassGatekeeper !== true;
    const skipDeploySemaphoreGatekeeper = deploySemaphoreGatekeeper !== true;
    const skipDeployHatsGatekeeper = deployHatsSingleGatekeeper !== true;
    const skipDeployMerkleProofGatekeeper = deployMerkleGateekeper !== true;

    const canSkipDeploy =
      incremental &&
      (freeForAllGatekeeperContractAddress || skipDeployFreeForAllGatekeeper) &&
      (easGatekeeperContractAddress || skipDeployEASGatekeeper) &&
      (gitcoinGatekeeperContractAddress || skipDeployGitcoinGatekeeper) &&
      (zupassGatekeeperContractAddress || skipDeployZupassGatekeeper) &&
      (semaphoreGatekeeperContractAddress || skipDeploySemaphoreGatekeeper) &&
      (hatsGatekeeperContractAddress || skipDeployHatsGatekeeper) &&
      (merkleProofGatekeeperContractAddress || skipDeployMerkleProofGatekeeper) &&
      (!skipDeployFreeForAllGatekeeper ||
        !skipDeployEASGatekeeper ||
        !skipDeployGitcoinGatekeeper ||
        !skipDeployZupassGatekeeper ||
        !skipDeploySemaphoreGatekeeper ||
        !skipDeployHatsGatekeeper ||
        !skipDeployMerkleProofGatekeeper);

    if (canSkipDeploy) {
      // eslint-disable-next-line no-console
      console.log(`Skipping deployment of the Gatekeeper contract`);
      return;
    }

    if (!skipDeployFreeForAllGatekeeper) {
      const freeForAllGatekeeperContract = await deployment.deployContract({
        name: EContracts.FreeForAllGatekeeper,
        signer: deployer,
      });

      await storage.register({
        id: EContracts.FreeForAllGatekeeper,
        contract: freeForAllGatekeeperContract,
        args: [],
        network: hre.network.name,
      });
    }

    const isSupportedEASGatekeeperNetwork = ![ESupportedChains.Hardhat, ESupportedChains.Coverage].includes(
      hre.network.name as ESupportedChains,
    );

    if (!skipDeployEASGatekeeper && isSupportedEASGatekeeperNetwork) {
      const easAddress = deployment.getDeployConfigField<string>(EContracts.EASGatekeeper, "easAddress", true);
      const encodedSchema = deployment.getDeployConfigField<string>(EContracts.EASGatekeeper, "schema", true);
      const attester = deployment.getDeployConfigField<string>(EContracts.EASGatekeeper, "attester", true);

      const easGatekeeperContract = await deployment.deployContract(
        {
          name: EContracts.EASGatekeeper,
          signer: deployer,
        },
        easAddress,
        attester,
        encodedSchema,
      );

      await storage.register({
        id: EContracts.EASGatekeeper,
        contract: easGatekeeperContract,
        args: [easAddress, attester, encodedSchema],
        network: hre.network.name,
      });
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
      const gitcoinGatekeeperContract = await deployment.deployContract(
        {
          name: EContracts.GitcoinPassportGatekeeper,
          signer: deployer,
        },
        gitcoinGatekeeperDecoderAddress,
        gitcoinGatekeeperPassingScore,
      );

      await storage.register({
        id: EContracts.GitcoinPassportGatekeeper,
        contract: gitcoinGatekeeperContract,
        args: [gitcoinGatekeeperDecoderAddress, gitcoinGatekeeperPassingScore],
        network: hre.network.name,
      });
    }

    if (!skipDeployZupassGatekeeper) {
      const eventId = deployment.getDeployConfigField<string>(EContracts.ZupassGatekeeper, "eventId", true);
      const validEventId = uuidToBigInt(eventId);
      const validSigner1 = deployment.getDeployConfigField<string>(EContracts.ZupassGatekeeper, "signer1", true);
      const validSigner2 = deployment.getDeployConfigField<string>(EContracts.ZupassGatekeeper, "signer2", true);
      let verifier = deployment.getDeployConfigField<string | undefined>(EContracts.ZupassGatekeeper, "zupassVerifier");

      if (!verifier) {
        const verifierContract = await deployment.deployContract({
          name: EContracts.ZupassGroth16Verifier,
          signer: deployer,
        });
        verifier = await verifierContract.getAddress();
      }

      const ZupassGatekeeperContract = await deployment.deployContract(
        {
          name: EContracts.ZupassGatekeeper,
          signer: deployer,
        },
        validEventId,
        validSigner1,
        validSigner2,
        verifier,
      );
      await storage.register({
        id: EContracts.ZupassGatekeeper,
        contract: ZupassGatekeeperContract,
        args: [validEventId.toString(), validSigner1, validSigner2, verifier],
        network: hre.network.name,
      });
    }

    if (!skipDeploySemaphoreGatekeeper) {
      const semaphoreContractAddress = deployment.getDeployConfigField<string>(
        EContracts.SemaphoreGatekeeper,
        "semaphoreContract",
        true,
      );
      const groupId = deployment.getDeployConfigField<number>(EContracts.SemaphoreGatekeeper, "groupId", true);

      const semaphoreGatekeeperContract = await deployment.deployContract(
        {
          name: EContracts.SemaphoreGatekeeper,
          signer: deployer,
        },
        semaphoreContractAddress,
        groupId,
      );

      await storage.register({
        id: EContracts.SemaphoreGatekeeper,
        contract: semaphoreGatekeeperContract,
        args: [semaphoreContractAddress, groupId.toString()],
        network: hre.network.name,
      });
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
        contract: hatsGatekeeperContract,
        args: [hatsProtocolAddress, criterionHats.length === 1 ? criterionHats[0] : criterionHats],
        network: hre.network.name,
      });
    }

    if (!skipDeployMerkleProofGatekeeper) {
      const root = deployment.getDeployConfigField<string>(EContracts.MerkleProofGatekeeper, "root", true);

      const MerkleProofGatekeeperContract = await deployment.deployContract(
        {
          name: EContracts.MerkleProofGatekeeper,
          signer: deployer,
        },
        root,
      );
      await storage.register({
        id: EContracts.MerkleProofGatekeeper,
        contract: MerkleProofGatekeeperContract,
        args: [root],
        network: hre.network.name,
      });
    }
  }),
);
