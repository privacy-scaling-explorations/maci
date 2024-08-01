import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, IDeployParams } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment.deployTask("full:deploy-verifier", "Deploy verifier").then((task) =>
  task.setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const verifierContractAddress = storage.getAddress(EContracts.Verifier, hre.network.name);

    if (incremental && verifierContractAddress) {
      return;
    }

    const verifierContract = await deployment.deployContract({ name: EContracts.Verifier, signer: deployer });

    await storage.register({
      id: EContracts.Verifier,
      contract: verifierContract,
      args: [],
      network: hre.network.name,
    });
  }),
);
