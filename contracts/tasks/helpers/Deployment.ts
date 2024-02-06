/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { BaseContract, ContractFactory, Signer } from "ethers";
import { task } from "hardhat/config";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

import { exit } from "process";

import type { EContracts, IDeployParams, IDeployStep, IDeployStepCatalog } from "./types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { ConfigurableTaskDefinition, HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";

import { ContractStorage } from "./ContractStorage";

/**
 * Internal deploy config structure type.
 */
type TConfig = Record<string, Record<string, string | number | boolean>>;

/**
 * @notice Deployment helper class to run sequential deploy using steps and deploy contracts.
 */
export class Deployment {
  /**
   * Singleton instance for class
   */
  private static INSTANCE?: Deployment;

  /**
   * Hardhat runtime environment
   */
  private hre?: HardhatRuntimeEnvironment;

  /**
   * Step catalog to create sequential tasks
   */
  private stepCatalog: Map<string, IDeployStepCatalog[]>;

  /**
   * Json file database instance
   */
  private config: low.LowdbSync<TConfig>;

  /**
   * Contract storage
   */
  private storage: ContractStorage;

  /**
   * Initialize class properties only once
   */
  private constructor(hre?: HardhatRuntimeEnvironment) {
    this.stepCatalog = new Map([
      ["full", []],
      ["poll", []],
    ]);
    this.hre = hre;
    this.config = low(new FileSync<TConfig>("./deploy-config.json"));
    this.storage = ContractStorage.getInstance();
  }

  /**
   * Get singleton object
   *
   * @returns {ContractStorage} singleton object
   */
  static getInstance(hre?: HardhatRuntimeEnvironment): Deployment {
    if (!Deployment.INSTANCE) {
      Deployment.INSTANCE = new Deployment(hre);
    }

    return Deployment.INSTANCE;
  }

  /**
   * Start deploy with console log information
   *
   * @param catalog - deploy steps catalog
   * @param {IDeployParams} params - deploy params
   * @returns deploy steps for selected catalog
   */
  async start(catolog: string, { incremental, verify }: IDeployParams): Promise<IDeployStep[]> {
    const deployer = await this.getDeployer();
    const deployerAddress = await deployer.getAddress();
    const startBalance = await deployer.provider.getBalance(deployer);

    console.log("Deployer address:", deployerAddress);
    console.log("Deployer start balance: ", Number(startBalance / 10n ** 12n) / 1e6);

    if (incremental) {
      console.log("======================================================================");
      console.log("======================================================================");
      console.log("====================    ATTENTION! INCREMENTAL MODE    ===============");
      console.log("======================================================================");
      console.log("=========== Delete 'deployed-contracts.json' to start a new ==========");
      console.log("======================================================================");
      console.log("======================================================================");
    } else {
      this.storage.cleanup(this.hre!.network.name);
    }

    console.log("Deployment started\n");

    return this.getDeploySteps(catolog, {
      incremental,
      verify,
    });
  }

  /**
   * Run deploy steps
   *
   * @param steps - deploy steps
   * @param skip - skip steps with less or equal index
   */
  async runSteps(steps: IDeployStep[], skip: number): Promise<void> {
    // eslint-disable-next-line no-restricted-syntax
    for (const step of steps) {
      const stepId = `0${step.id}`;
      console.log("\n======================================================================");
      console.log(stepId.slice(stepId.length - 2), step.name);
      console.log("======================================================================\n");

      if (step.id <= skip) {
        console.log(`STEP ${step.id} WAS SKIPPED`);
      } else {
        // eslint-disable-next-line no-await-in-loop
        await this.hre!.run(step.taskName, step.args);
      }
    }
  }

  /**
   * Print deployment results and check warnings
   *
   * @param strict - fail on warnings is enabled
   * @throws error if strict is enabled and warning is found
   */
  async checkResults(strict?: boolean): Promise<void> {
    const deployer = await this.getDeployer();
    const deployerAddress = await deployer.getAddress();
    const [entryMap, instanceCount, multiCount] = this.storage.printContracts(deployerAddress, this.hre!.network.name);
    let hasWarn = false;

    if (multiCount > 0) {
      console.warn("WARNING: multi-deployed contract(s) detected");
      hasWarn = true;
    } else if (entryMap.size !== instanceCount) {
      console.warn("WARNING: unknown contract(s) detected");
      hasWarn = true;
    }

    entryMap.forEach((_, key) => {
      if (key.startsWith("Mock")) {
        console.warn("WARNING: mock contract detected:", key);
        hasWarn = true;
      }
    });

    if (hasWarn && strict) {
      throw new Error("Warnings are present");
    }
  }

  /**
   * Finish deployment with console log information
   *
   * @param startBalance - start deployer balance
   * @param success - success or not
   */
  async finish(startBalance: bigint, success: boolean): Promise<void> {
    const deployer = await this.getDeployer();
    const { gasPrice } = this.hre!.network.config;
    const endBalance = await deployer.provider.getBalance(deployer);

    console.log("======================================================================");
    console.log("Deployer end balance: ", Number(endBalance / 10n ** 12n) / 1e6);
    console.log("Deploy expenses: ", Number((startBalance - endBalance) / 10n ** 12n) / 1e6);

    if (gasPrice !== "auto") {
      console.log("Deploy gas: ", Number(startBalance - endBalance) / gasPrice, "@", gasPrice / 1e9, " gwei");
    }

    console.log("======================================================================");

    if (!success) {
      console.log("\nDeployment has failed");
      exit(1);
    }

    console.log("\nDeployment has finished");
  }

  /**
   * Get deployer (first signer) from hardhat runtime environment
   *
   * @returns {Promise<HardhatEthersSigner>} - signer
   */
  async getDeployer(): Promise<HardhatEthersSigner> {
    this.checkHre();

    const [deployer] = await this.hre!.ethers.getSigners();

    return deployer;
  }

  /**
   * Set hardhat runtime environment
   *
   * @param hre - hardhat runtime environment
   */
  setHre(hre: HardhatRuntimeEnvironment): void {
    this.hre = hre;
  }

  /**
   * Check if hardhat runtime environment is set
   *
   * @throws {Error} error if there is no hardhat runtime environment set
   */
  private checkHre(): void {
    if (!this.hre) {
      throw new Error("Hardhat Runtime Environment is not set");
    }
  }

  /**
   * Register deploy task by updating step catalog and return task definition
   *
   * @param taskName - unique task name
   * @param stepName - task description
   * @param paramsFn - optional function to override default task arguments
   * @returns {ConfigurableTaskDefinition} hardhat task definition
   */
  deployTask(
    taskName: string,
    stepName: string,
    paramsFn?: (params: IDeployParams) => Promise<TaskArguments>,
  ): ConfigurableTaskDefinition {
    const deployType = taskName.substring(0, taskName.indexOf(":"));
    this.addStep(deployType, { name: stepName, taskName, paramsFn: paramsFn || this.getDefaultParams });

    return task(taskName, stepName);
  }

  /**
   * Register deployment step
   *
   * @param deployType - deploy type
   * @param {IDeployStepCatalog} - deploy step catalog name, description and param mapper
   */
  private addStep(deployType: string, { name, taskName, paramsFn }: IDeployStepCatalog): void {
    const steps = this.stepCatalog.get(deployType);

    if (!steps) {
      throw new Error(`Unknown deploy type: ${deployType}`);
    }

    steps.push({ name, taskName, paramsFn });
  }

  /**
   * Get default params from hardhat task
   *
   * @param {IDeployParams} params - hardhat task arguments
   * @returns {Promise<TaskArguments>} params for deploy workflow
   */
  private getDefaultParams = ({ verify, incremental }: IDeployParams): Promise<TaskArguments> =>
    Promise.resolve({ verify, incremental });

  /**
   * Get deploy step sequence
   *
   * @param deployType - deploy type
   * @param {IDeployParams} params - deploy params
   * @returns {Promise<IDeployStep[]>} deploy steps
   */
  private async getDeploySteps(deployType: string, params: IDeployParams): Promise<IDeployStep[]> {
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
  }

  /**
   * Deploy contract and return it
   *
   * @param contractName - contract name
   * @param signer - signer
   * @param args - constructor arguments
   * @returns deployed contract
   */
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

  /**
   * Deploy contract with linked libraries using contract factory
   *
   * @param contractFactory - ethers contract factory
   * @param args - constructor arguments
   * @returns deployed contract
   */
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

  /**
   *  Link poseidon libraries with contract factory and return it
   *
   * @param name - contract name
   * @param poseidonT3Address - PoseidonT3 contract address
   * @param poseidonT4Address - PoseidonT4 contract address
   * @param poseidonT5Address - PoseidonT5 contract address
   * @param poseidonT6Address - PoseidonT6 contract address
   * @param signer - signer
   * @returns contract factory with linked libraries
   */
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

  /**
   * Get deploy config field (see deploy-config.json)
   *
   * @param id - contract name
   * @param field - config field key
   * @returns config field value or null
   */
  getDeployConfigField<T = string | number | boolean>(id: EContracts, field: string, mustGet = false): T {
    this.checkHre();

    const value = this.config.get(`${this.hre!.network.name}.${id}.${field}`).value() as T;

    if (mustGet && (value === null || value === undefined)) {
      throw new Error(`Can't find ${this.hre!.network.name}.${id}.${field}`);
    }

    return value;
  }
}
