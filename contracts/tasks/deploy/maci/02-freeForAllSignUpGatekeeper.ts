import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, IDeployParams } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

deployment
  .deployTask("full:deploy-free-for-all-signup-gatekeeper", "Deploy constant initial voice credit proxy")
  .setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const freeForAllGatekeeperContractAddress = storage.getAddress(EContracts.FreeForAllGatekeeper, hre.network.name);

    if (incremental && freeForAllGatekeeperContractAddress) {
      return;
    }

    const freeForAllGatekeeperContract = await deployment.deployContract(EContracts.FreeForAllGatekeeper, deployer);

    await storage.register({
      id: EContracts.FreeForAllGatekeeper,
      contract: freeForAllGatekeeperContract,
      args: [],
      network: hre.network.name,
    });
  });
