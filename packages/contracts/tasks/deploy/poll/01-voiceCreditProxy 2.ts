import type {
  ConstantInitialVoiceCreditProxyFactory,
  ERC20VotesInitialVoiceCreditProxyFactory,
} from "../../../typechain-types";

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
deployment.deployTask(EDeploySteps.InitialVoiceCreditProxy, "Deploy initial voice credit proxy").then((task) =>
  task.setAction(async ({ incremental }: IDeployParams, hre) => {
    deployment.setHre(hre);
    const deployer = await deployment.getDeployer();

    const { deployConstantInitialVoiceCreditProxy, deployERC20VotesInitialVoiceCreditProxy } = await import(
      "../../../ts/deploy"
    );

    const voiceCreditProxyType = deployment.getDeployConfigField(EContracts.Poll, "initialVoiceCreditProxy");

    const needDeploy = deployment.getDeployConfigField(voiceCreditProxyType as EInitialVoiceCreditProxies, "deploy");

    if (needDeploy === false) {
      return;
    }

    const skipDeployConstantInitialVoiceCreditProxy = voiceCreditProxyType !== EInitialVoiceCreditProxies.Constant;
    const skipDeployERC20VotesInitialVoiceCreditProxy = voiceCreditProxyType !== EInitialVoiceCreditProxies.ERC20Votes;

    if (!skipDeployConstantInitialVoiceCreditProxy) {
      const constantInitialVoiceCreditProxyContractAddress = storage.getAddress(
        EInitialVoiceCreditProxies.Constant,
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

      const constantProxyFactoryAddress = storage.getAddress(
        EInitialVoiceCreditProxiesFactories.Constant,
        hre.network.name,
      );
      const constantProxyFactory = constantProxyFactoryAddress
        ? await deployment.getContract<ConstantInitialVoiceCreditProxyFactory>({
            name: EContracts.ConstantInitialVoiceCreditProxyFactory,
            address: constantProxyFactoryAddress,
            signer: deployer,
          })
        : undefined;

      const [constantInitialVoiceCreditProxyContract, constantInitialVoiceCreditProxyContractFactory] =
        await deployConstantInitialVoiceCreditProxy({ amount }, deployer, constantProxyFactory, true);

      const constantImplementation = await constantInitialVoiceCreditProxyContractFactory.IMPLEMENTATION();

      await Promise.all([
        storage.register({
          id: EInitialVoiceCreditProxies.Constant,
          contract: constantInitialVoiceCreditProxyContract,
          implementation: constantImplementation,
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
    }

    if (!skipDeployERC20VotesInitialVoiceCreditProxy) {
      const erc20VotesInitialVoiceCreditProxyContractAddress = storage.getAddress(
        EInitialVoiceCreditProxies.ERC20Votes,
        hre.network.name,
      );

      if (incremental && erc20VotesInitialVoiceCreditProxyContractAddress) {
        // eslint-disable-next-line no-console
        logGreen({ text: info(`Skipping deployment of the ${EInitialVoiceCreditProxies.ERC20Votes} contract`) });
        return;
      }

      // get args
      const tokenAddress = deployment.getDeployConfigField<string>(
        EContracts.ERC20VotesInitialVoiceCreditProxy,
        "token",
      );
      const snapshotBlock = deployment.getDeployConfigField<number>(
        EContracts.ERC20VotesInitialVoiceCreditProxy,
        "snapshotBlock",
      );
      const factor = deployment.getDeployConfigField<number>(EContracts.ERC20VotesInitialVoiceCreditProxy, "factor");

      const erc20VotesProxyFactoryAddress = storage.getAddress(
        EInitialVoiceCreditProxiesFactories.ERC20Votes,
        hre.network.name,
      );
      const erc20VotesProxyFactory = erc20VotesProxyFactoryAddress
        ? await deployment.getContract<ERC20VotesInitialVoiceCreditProxyFactory>({
            name: EContracts.ERC20VotesInitialVoiceCreditProxyFactory,
            address: erc20VotesProxyFactoryAddress,
            signer: deployer,
          })
        : undefined;

      const [erc20VotesInitialVoiceCreditProxyContract, erc20VotesInitialVoiceCreditProxyContractFactory] =
        await deployERC20VotesInitialVoiceCreditProxy(
          {
            token: tokenAddress,
            snapshotBlock: BigInt(snapshotBlock),
            factor: BigInt(factor),
          },
          deployer,
          erc20VotesProxyFactory,
          true,
        );

      const erc20VotesImplementation = await erc20VotesInitialVoiceCreditProxyContractFactory.IMPLEMENTATION();

      await Promise.all([
        storage.register({
          id: EInitialVoiceCreditProxies.ERC20Votes,
          contract: erc20VotesInitialVoiceCreditProxyContract,
          implementation: erc20VotesImplementation,
          args: [],
          network: hre.network.name,
        }),
        storage.register({
          id: EInitialVoiceCreditProxiesFactories.ERC20Votes,
          contract: erc20VotesInitialVoiceCreditProxyContractFactory,
          args: [],
          network: hre.network.name,
        }),
      ]);
    }
  }),
);
