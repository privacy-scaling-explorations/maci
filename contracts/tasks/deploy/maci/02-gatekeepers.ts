import { ESupportedChains } from "../../helpers/constants";
import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, IDeployParams } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment.deployTask("full:deploy-gatekeepers", "Deploy gatekeepers").then((task) =>
  task.setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const freeForAllGatekeeperContractAddress = storage.getAddress(EContracts.FreeForAllGatekeeper, hre.network.name);
    const easGatekeeperContractAddress = storage.getAddress(EContracts.EASGatekeeper, hre.network.name);
    const gitcoinGatekeeperContractAddress = storage.getAddress(EContracts.GitcoinPassportGatekeeper, hre.network.name);
    const deployFreeForAllGatekeeper = deployment.getDeployConfigField(EContracts.FreeForAllGatekeeper, "deploy");
    const deployEASGatekeeper = deployment.getDeployConfigField(EContracts.EASGatekeeper, "deploy");
    const deployGitcoinGatekeeper = deployment.getDeployConfigField(EContracts.GitcoinPassportGatekeeper, "deploy");

    const skipDeployFreeForAllGatekeeper = deployFreeForAllGatekeeper === false;
    const skipDeployEASGatekeeper = deployEASGatekeeper === false;
    const skipDeployGitcoinGatekeeper = deployGitcoinGatekeeper === false;

    const canSkipDeploy =
      incremental &&
      (freeForAllGatekeeperContractAddress || skipDeployFreeForAllGatekeeper) &&
      (easGatekeeperContractAddress || skipDeployEASGatekeeper) &&
      (gitcoinGatekeeperContractAddress || skipDeployGitcoinGatekeeper) &&
      (!skipDeployFreeForAllGatekeeper || !skipDeployEASGatekeeper || !skipDeployGitcoinGatekeeper);

    if (canSkipDeploy) {
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
  }),
);
