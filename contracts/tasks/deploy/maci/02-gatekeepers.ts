import { ESupportedChains } from "../../helpers/constants";
import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { uuidToBigInt } from "../../helpers/numericParser";
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
    const zupassGatekeeperContractAddress = storage.getAddress(EContracts.ZupassGatekeeper, hre.network.name);
    const deployFreeForAllGatekeeper = deployment.getDeployConfigField(EContracts.FreeForAllGatekeeper, "deploy");
    const deployEASGatekeeper = deployment.getDeployConfigField(EContracts.EASGatekeeper, "deploy");
    const deployZupassGatekeeper = deployment.getDeployConfigField(EContracts.ZupassGatekeeper, "deploy");

    const skipDeployFreeForAllGatekeeper = deployFreeForAllGatekeeper === false;
    const skipDeployEASGatekeeper = deployEASGatekeeper === false;
    const skipDeployZupassGatekeeper = deployZupassGatekeeper !== true;

    const canSkipDeploy =
      incremental &&
      (freeForAllGatekeeperContractAddress || skipDeployFreeForAllGatekeeper) &&
      (easGatekeeperContractAddress || skipDeployEASGatekeeper) &&
      (zupassGatekeeperContractAddress || skipDeployZupassGatekeeper) &&
      (!skipDeployFreeForAllGatekeeper || !skipDeployEASGatekeeper || !skipDeployZupassGatekeeper);

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

    const isSupportedNetwork = ![ESupportedChains.Hardhat, ESupportedChains.Coverage].includes(
      hre.network.name as ESupportedChains,
    );

    if (!skipDeployEASGatekeeper && isSupportedNetwork) {
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
  }),
);
