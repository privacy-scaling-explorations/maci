import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, IDeployParams } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment
  .deployTask("full:deploy-topup-credit", "Deploy topup credit")
  .setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const topupCreditContractAddress = storage.getAddress(EContracts.TopupCredit, hre.network.name);

    if (incremental && topupCreditContractAddress) {
      return;
    }

    const topupCreditContract = await deployment.deployContract(EContracts.TopupCredit, deployer);

    await storage.register({
      id: EContracts.TopupCredit,
      contract: topupCreditContract,
      args: [],
      network: hre.network.name,
    });
  });
