import { BaseContract, ContractFactory, Signer } from "ethers";
import { task } from "hardhat/config";

import type { EContracts, IDeployParams, IDeployStep, IDeployStepCatalog } from "./types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { ConfigurableTaskDefinition, HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";

export class Deployment {
  private static INSTANCE?: Deployment;

  private hre?: HardhatRuntimeEnvironment;

  private stepCatalog: Map<string, IDeployStepCatalog[]>;

  private constructor(hre?: HardhatRuntimeEnvironment) {
    this.stepCatalog = new Map([["full", []]]);
    this.hre = hre;
  }

  static getInstance(hre?: HardhatRuntimeEnvironment): Deployment {
    if (!Deployment.INSTANCE) {
      Deployment.INSTANCE = new Deployment(hre);
    }

    return Deployment.INSTANCE;
  }

  async getDeployer(): Promise<HardhatEthersSigner> {
    this.checkHre();

    const [deployer] = await this.hre!.ethers.getSigners();

    return deployer;
  }

  setHre(hre: HardhatRuntimeEnvironment): void {
    this.hre = hre;
  }

  private checkHre(): void {
    if (!this.hre) {
      throw new Error("Hardhat Runtime Environment is not set");
    }
  }

  deployTask(
    taskName: string,
    stepName: string,
    paramsFn?: (params: IDeployParams) => Promise<TaskArguments>,
  ): ConfigurableTaskDefinition {
    const deployType = taskName.substring(0, taskName.indexOf(":"));
    this.addStep(deployType, { name: stepName, taskName, paramsFn: paramsFn || this.getDefaultParams });

    return task(taskName, stepName);
  }

  private addStep(deployType: string, { name, taskName, paramsFn }: IDeployStepCatalog): void {
    const steps = this.stepCatalog.get(deployType);

    if (!steps) {
      throw new Error(`Unknown deploy type: ${deployType}`);
    }

    steps.push({ name, taskName, paramsFn });
  }

  private getDefaultParams = ({ verify, incremental, amount, stateTreeDepth }: IDeployParams): Promise<TaskArguments> =>
    Promise.resolve({ verify, incremental, amount, stateTreeDepth });

  getDeploySteps = async (deployType: string, params: IDeployParams): Promise<IDeployStep[]> => {
    const stepList = this.stepCatalog.get(deployType);

    if (!stepList) {
      throw new Error(`Unknown deploy type: ${deployType}`);
    }

    return Promise.all(stepList.map(({ paramsFn }) => paramsFn(params))).then((stepArgs) =>
      stepArgs.map((args, index) => ({
        id: index + 1,
        name: stepList[index].name,
        taskName: stepList[index].taskName,
        args: args as unknown,
      })),
    );
  };

  async deployContract<T extends BaseContract>(
    contractName: EContracts,
    signer?: Signer,
    ...args: unknown[]
  ): Promise<T> {
    const { ethers } = await import("hardhat");

    const deployer = signer || (await this.getDeployer());
    const contractFactory = await ethers.getContractFactory(contractName, deployer);
    const feeData = await deployer.provider?.getFeeData();

    const contract = await contractFactory.deploy(...args, {
      maxFeePerGas: feeData?.maxFeePerGas,
      maxPriorityFeePerGas: feeData?.maxPriorityFeePerGas,
    });
    await contract.deploymentTransaction()!.wait();

    return contract as unknown as T;
  }

  async deployContractWithLinkedLibraries<T extends BaseContract>(
    contractFactory: ContractFactory,
    ...args: unknown[]
  ): Promise<T> {
    const deployer = await this.getDeployer();
    const feeData = await deployer.provider.getFeeData();

    const contract = await contractFactory.deploy(...args, {
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    });
    await contract.deploymentTransaction()!.wait();

    return contract as T;
  }

  async linkPoseidonLibraries(
    name: EContracts,
    poseidonT3Address: string,
    poseidonT4Address: string,
    poseidonT5Address: string,
    poseidonT6Address: string,
    signer?: Signer,
  ): Promise<ContractFactory> {
    const { ethers } = await import("hardhat");

    const contractFactory = await ethers.getContractFactory(name, {
      signer: signer || (await this.getDeployer()),
      libraries: {
        PoseidonT3: poseidonT3Address,
        PoseidonT4: poseidonT4Address,
        PoseidonT5: poseidonT5Address,
        PoseidonT6: poseidonT6Address,
      },
    });

    return contractFactory;
  }
}
