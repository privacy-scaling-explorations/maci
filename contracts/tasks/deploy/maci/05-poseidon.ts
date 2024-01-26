import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, IDeployParams } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

deployment
  .deployTask("full:deploy-poseidon", "Deploy poseidon contracts")
  .setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const poseidonT3ContractAddress = storage.getAddress(EContracts.PoseidonT3, hre.network.name);
    const poseidonT4ContractAddress = storage.getAddress(EContracts.PoseidonT4, hre.network.name);
    const poseidonT5ContractAddress = storage.getAddress(EContracts.PoseidonT5, hre.network.name);
    const poseidonT6ContractAddress = storage.getAddress(EContracts.PoseidonT6, hre.network.name);

    if (
      incremental &&
      poseidonT3ContractAddress &&
      poseidonT4ContractAddress &&
      poseidonT5ContractAddress &&
      poseidonT6ContractAddress
    ) {
      return;
    }

    const [PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract] = await Promise.all([
      deployment.deployContract(EContracts.PoseidonT3, deployer),
      deployment.deployContract(EContracts.PoseidonT4, deployer),
      deployment.deployContract(EContracts.PoseidonT5, deployer),
      deployment.deployContract(EContracts.PoseidonT6, deployer),
    ]);

    await Promise.all([
      storage.register({
        id: EContracts.PoseidonT3,
        contract: PoseidonT3Contract,
        args: [],
        network: hre.network.name,
      }),
      storage.register({
        id: EContracts.PoseidonT4,
        contract: PoseidonT4Contract,
        args: [],
        network: hre.network.name,
      }),
      storage.register({
        id: EContracts.PoseidonT5,
        contract: PoseidonT5Contract,
        args: [],
        network: hre.network.name,
      }),
      storage.register({
        id: EContracts.PoseidonT6,
        contract: PoseidonT6Contract,
        args: [],
        network: hre.network.name,
      }),
    ]);
  });
