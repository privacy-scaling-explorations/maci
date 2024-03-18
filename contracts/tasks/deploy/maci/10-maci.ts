import type { EASGatekeeper, MACI } from "../../../typechain-types";

import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import { EContracts, IDeployParams } from "../../helpers/types";

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

const DEFAULT_STATE_TREE_DEPTH = 10;
const STATE_TREE_SUBDEPTH = 2;

/**
 * Deploy step registration and task itself
 */
deployment
  .deployTask("full:deploy-maci", "Deploy MACI contract")
  .setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const maciContractAddress = storage.getAddress(EContracts.MACI, hre.network.name);

    if (incremental && maciContractAddress) {
      return;
    }

    const poseidonT3ContractAddress = storage.mustGetAddress(EContracts.PoseidonT3, hre.network.name);
    const poseidonT4ContractAddress = storage.mustGetAddress(EContracts.PoseidonT4, hre.network.name);
    const poseidonT5ContractAddress = storage.mustGetAddress(EContracts.PoseidonT5, hre.network.name);
    const poseidonT6ContractAddress = storage.mustGetAddress(EContracts.PoseidonT6, hre.network.name);

    const maciContractFactory = await deployment.linkPoseidonLibraries(
      EContracts.MACI,
      poseidonT3ContractAddress,
      poseidonT4ContractAddress,
      poseidonT5ContractAddress,
      poseidonT6ContractAddress,
      deployer,
    );

    const constantInitialVoiceCreditProxyContractAddress = storage.mustGetAddress(
      EContracts.ConstantInitialVoiceCreditProxy,
      hre.network.name,
    );
    const gatekeeper =
      deployment.getDeployConfigField<EContracts | null>(EContracts.MACI, "gatekeeper") ||
      EContracts.FreeForAllGatekeeper;
    const gatekeeperContractAddress = storage.mustGetAddress(gatekeeper, hre.network.name);
    const topupCreditContractAddress = storage.mustGetAddress(EContracts.TopupCredit, hre.network.name);
    const pollFactoryContractAddress = storage.mustGetAddress(EContracts.PollFactory, hre.network.name);
    const messageProcessorFactoryContractAddress = storage.mustGetAddress(
      EContracts.MessageProcessorFactory,
      hre.network.name,
    );
    const tallyFactoryContractAddress = storage.mustGetAddress(EContracts.TallyFactory, hre.network.name);
    const subsidyFactoryContractAddress = storage.mustGetAddress(EContracts.SubsidyFactory, hre.network.name);
    const stateTreeDepth =
      deployment.getDeployConfigField<number | null>(EContracts.MACI, "stateTreeDepth") ?? DEFAULT_STATE_TREE_DEPTH;

    const maciContract = await deployment.deployContractWithLinkedLibraries<MACI>(
      maciContractFactory,
      pollFactoryContractAddress,
      messageProcessorFactoryContractAddress,
      tallyFactoryContractAddress,
      subsidyFactoryContractAddress,
      gatekeeperContractAddress,
      constantInitialVoiceCreditProxyContractAddress,
      topupCreditContractAddress,
      stateTreeDepth,
    );

    if (gatekeeper === EContracts.EASGatekeeper) {
      const gatekeeperContract = await deployment.getContract<EASGatekeeper>({
        name: EContracts.EASGatekeeper,
        address: gatekeeperContractAddress,
      });
      const maciInstanceAddress = await maciContract.getAddress();

      await gatekeeperContract.setMaciInstance(maciInstanceAddress).then((tx) => tx.wait());
    }

    await storage.register({
      id: EContracts.MACI,
      contract: maciContract,
      args: [
        pollFactoryContractAddress,
        messageProcessorFactoryContractAddress,
        tallyFactoryContractAddress,
        subsidyFactoryContractAddress,
        gatekeeperContractAddress,
        constantInitialVoiceCreditProxyContractAddress,
        topupCreditContractAddress,
        stateTreeDepth,
      ],
      network: hre.network.name,
    });

    const accQueueAddress = await maciContract.stateAq();
    const accQueue = await deployment.getContract({
      name: EContracts.AccQueueQuinaryBlankSl,
      address: accQueueAddress,
    });

    await storage.register({
      id: EContracts.AccQueueQuinaryBlankSl,
      name: "contracts/trees/AccQueueQuinaryBlankSl.sol:AccQueueQuinaryBlankSl",
      contract: accQueue,
      args: [STATE_TREE_SUBDEPTH],
      network: hre.network.name,
    });
  });
