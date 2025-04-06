import { info, logGreen } from "../../../ts/logger";
import { EDeploySteps } from "../../helpers/constants";
import { ContractStorage } from "../../helpers/ContractStorage";
import { Deployment } from "../../helpers/Deployment";
import {
  EContracts,
  EInitialVoiceCreditProxies,
  EInitialVoiceCreditProxiesFactories,
  IDeployParams,
} from "../../helpers/types";

const DEFAULT_INITIAL_VOICE_CREDITS = 99;

const deployment = Deployment.getInstance();
const storage = ContractStorage.getInstance();

/**
 * Deploy step registration and task itself
 */
deployment
  .deployTask(EDeploySteps.ConstantInitialVoiceCreditProxy, "Deploy constant initial voice credit proxy")
  .then((task) =>
    task.setAction(async ({ incremental }: IDeployParams, hre) => {
      deployment.setHre(hre);
      const deployer = await deployment.getDeployer();

      const { deployConstantInitialVoiceCreditProxy } = await import("../../../ts/deploy");
      const { ConstantInitialVoiceCreditProxyFactory__factory: ConstantInitialVoiceCreditProxyFactoryFactory } =
        await import("../../../typechain-types");

      const needDeploy = deployment.getDeployConfigField(EContracts.ConstantInitialVoiceCreditProxy, "deploy");

      if (needDeploy === false) {
        return;
      }

      const constantInitialVoiceCreditProxyContractAddress = storage.getAddress(
        EContracts.ConstantInitialVoiceCreditProxy,
        hre.network.name,
      );

      if (incremental && constantInitialVoiceCreditProxyContractAddress) {
        // eslint-disable-next-line no-console
        logGreen({ text: info(`Skipping deployment of the ${EContracts.ConstantInitialVoiceCreditProxy} contract`) });
        return;
      }

      const amount =
        deployment.getDeployConfigField<number | null>(EContracts.ConstantInitialVoiceCreditProxy, "amount") ??
        DEFAULT_INITIAL_VOICE_CREDITS;

      const proxyFactoryAddress = storage.getAddress(EInitialVoiceCreditProxiesFactories.Constant, hre.network.name);
      const proxyFactory = proxyFactoryAddress
        ? ConstantInitialVoiceCreditProxyFactoryFactory.connect(proxyFactoryAddress, deployer)
        : undefined;

      const [constantInitialVoiceCreditProxyContract, constantInitialVoiceCreditProxyContractFactory] =
        await deployConstantInitialVoiceCreditProxy({ amount }, deployer, proxyFactory, true);

      const implementation = await constantInitialVoiceCreditProxyContractFactory.IMPLEMENTATION();

      await Promise.all([
        storage.register({
          id: EInitialVoiceCreditProxies.Constant,
          contract: constantInitialVoiceCreditProxyContract,
          implementation,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EInitialVoiceCreditProxiesFactories.Constant,
          contract: constantInitialVoiceCreditProxyContractFactory,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }),
  );
