/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { BaseContract, ContractFactory, Signer } from "ethers";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import LocalStorageSync from "lowdb/adapters/LocalStorage";

import path from "path";

import type { TAbi } from "./types";
import type { AASigner } from "../../ts/types";
import type { ConfigurableTaskDefinition, HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";

import { error, info, success, warning, logGreen, logMagenta, logRed, logYellow } from "../../ts/logger";
import { getDeployedContractAddressFromContractReceipt } from "../../ts/utils";

import { ContractStorage } from "./ContractStorage";
import {
  EContracts,
  IDeployContractParams,
  IDeployContractWithLinkedLibrariesParams,
  IDeployParams,
  IDeployStep,
  IDeployStepCatalog,
  IGetContractParams,
} from "./types";

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
  private stepCatalog: Map<string, Record<string, IDeployStepCatalog>>;

  /**
   * Json file database instance
   */
  private config: low.LowdbSync<TConfig>;

  /**
   * Contract storage
   */
  private storage: ContractStorage;

  /**
   * Contracts name mapping
   */
  private contractNames: Record<EContracts, string>;

  /**
   * Initialize class properties only once
   */
  private constructor(contractNames: Record<EContracts, string>, hre?: HardhatRuntimeEnvironment) {
    this.stepCatalog = new Map([
      ["full", {}],
      ["poll", {}],
    ]);
    this.hre = hre;
    this.contractNames = contractNames;
    this.config = low(
      typeof window !== "undefined"
        ? new LocalStorageSync<TConfig>("deploy-config")
        : new FileSync<TConfig>(path.resolve(process.cwd(), "./deploy-config.json")),
    );
    this.storage = ContractStorage.getInstance();
  }

  /**
   * Get singleton object
   *
   * @returns {ContractStorage} singleton object
   */
  static getInstance({
    contractNames = EContracts,
    hre = undefined,
  }: { contractNames?: Record<EContracts, string>; hre?: HardhatRuntimeEnvironment } = {}): Deployment {
    if (!Deployment.INSTANCE) {
      Deployment.INSTANCE = new Deployment(contractNames, hre);
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
    const startBalance = await deployer.provider!.getBalance(deployer);

    logMagenta({ text: `Deployer address: ${deployerAddress}` });
    logMagenta({ text: `Deployer start balance: ${Number(startBalance / 10n ** 12n) / 1e6}` });

    if (incremental) {
      logMagenta({ text: "======================================================================" });
      logMagenta({ text: "======================================================================" });
      logMagenta({ text: "====================    ATTENTION! INCREMENTAL MODE    ===============" });
      logMagenta({ text: "======================================================================" });
      logMagenta({ text: "====== Delete 'deployed-contracts.json' to start a new deployment ====" });
      logMagenta({ text: "======================================================================" });
      logMagenta({ text: "======================================================================" });
    } else {
      this.storage.cleanup(this.hre!.network.name);
    }

    logMagenta({ text: info("Deployment started\n") });

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
      logMagenta({ text: "\n======================================================================" });
      logMagenta({ text: `${stepId.slice(stepId.length - 2)} ${step.name}` });
      logMagenta({ text: "======================================================================\n" });

      if (step.id <= skip) {
        logYellow({ text: warning(`STEP ${step.id} WAS SKIPPED`) });
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
      logYellow({ text: warning("WARNING: multi-deployed contract(s) detected") });
      hasWarn = true;
    } else if (entryMap.size !== instanceCount) {
      logYellow({ text: warning("WARNING: unknown contract(s) detected") });
      hasWarn = true;
    }

    entryMap.forEach((_, key) => {
      if (key.startsWith("Mock")) {
        logYellow({ text: warning(`WARNING: mock contract detected: ${key}`) });
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
   * @param isSuccess - success or not
   */
  async finish(startBalance: bigint, isSuccess: boolean): Promise<void> {
    const deployer = await this.getDeployer();
    const { gasPrice } = this.hre!.network.config;
    const endBalance = await deployer.provider!.getBalance(deployer);

    logMagenta({ text: "======================================================================" });
    logMagenta({ text: `Deployer end balance: ${Number(endBalance / 10n ** 12n) / 1e6}` });
    logMagenta({ text: `Deploy expenses: ${Number((startBalance - endBalance) / 10n ** 12n) / 1e6}` });

    if (gasPrice !== "auto") {
      logMagenta({ text: `Deploy gas: ${(Number(startBalance - endBalance) / gasPrice, "@", gasPrice / 1e9)} gwei` });
    }

    logMagenta({ text: "======================================================================" });

    if (!isSuccess) {
      logRed({ text: error("\nDeployment has failed") });
      await import("process").then((m) => m.exit(1));
    }

    logGreen({ text: success("\nDeployment has finished") });
  }

  /**
   * Get deployer (first signer) from hardhat runtime environment
   *
   * @returns {Promise<Signer>} - signer
   */
  async getDeployer(): Promise<Signer> {
    this.checkHre();

    const [deployer] = await this.hre!.ethers.getSigners();

    return deployer as unknown as Signer;
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
   * Set contract names
   *
   * @param contractNames - contract names
   */
  setContractNames(contractNames: Record<EContracts, string>): void {
    this.contractNames = contractNames;
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
   * @returns {Promise<ConfigurableTaskDefinition>} hardhat task definition
   */
  async deployTask(
    taskName: string,
    stepName: string,
    paramsFn?: (params: IDeployParams) => Promise<TaskArguments>,
  ): Promise<ConfigurableTaskDefinition> {
    const deployType = taskName.substring(0, taskName.indexOf(":"));
    this.addStep(deployType, { name: stepName, taskName, paramsFn: paramsFn || this.getDefaultParams });

    return import("hardhat/config").then(({ task }) => task(taskName, stepName));
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

    steps[taskName] = { name, taskName, paramsFn };
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

    const steps = Object.values(stepList);

    return Promise.all(steps.map(({ paramsFn }) => paramsFn(params))).then((stepArgs) =>
      stepArgs.map((args, index) => ({
        id: index + 1,
        name: steps[index].name,
        taskName: steps[index].taskName,
        args: args as unknown,
      })),
    );
  }

  /**
   * Deploy contract and return it
   *
   * @param {IDeployContractParams} params - parameters of deploy contract
   * @param args - constructor arguments
   * @returns deployed contract
   */
  async deployContract<T extends BaseContract, ID = EContracts>(
    { name, abi, bytecode, signer }: IDeployContractParams<ID>,
    ...args: unknown[]
  ): Promise<T> {
    const deployer = signer || (await this.getDeployer());
    const contractFactory =
      abi && bytecode
        ? new ContractFactory(abi, bytecode, deployer)
        : await import("hardhat").then(({ ethers }) =>
            ethers.getContractFactory(this.contractNames[name as EContracts] || (name as EContracts), deployer),
          );
    const [feeData, nonce] = await Promise.all([
      deployer.provider?.getFeeData(),
      deployer.provider?.getTransactionCount(deployer),
    ]);

    const contract = await contractFactory.deploy(...args, {
      gasPrice: feeData?.gasPrice && !feeData.maxFeePerGas ? feeData.gasPrice : undefined,
      maxFeePerGas: feeData?.maxFeePerGas,
      maxPriorityFeePerGas: feeData?.maxPriorityFeePerGas,
      nonce,
    });
    await contract.deploymentTransaction()!.wait();

    if (signer && (signer as AASigner).isAA) {
      const { hash } = contract.deploymentTransaction()!;
      const receipt = await signer.provider?.getTransactionReceipt(hash);
      const address = getDeployedContractAddressFromContractReceipt(receipt);

      if (address) {
        // this contract does not have .deploymentTransaction()
        const realContract = contractFactory.attach(address);
        return realContract as unknown as T;
      }
    }

    return contract as unknown as T;
  }

  /**
   * Deploy contract with linked libraries using contract factory
   *
   * @param {IDeployContractWithLinkedLibrariesParams} params - parameters of deploy contract with linked libraries
   * @param args - constructor arguments
   * @returns deployed contract
   */
  async deployContractWithLinkedLibraries<T extends BaseContract>(
    { contractFactory, signer }: IDeployContractWithLinkedLibrariesParams,
    ...args: unknown[]
  ): Promise<T> {
    const deployer = signer || (await this.getDeployer());
    const feeData = await deployer.provider?.getFeeData();

    const contract = await contractFactory.deploy(...args, {
      maxFeePerGas: feeData?.maxFeePerGas,
      maxPriorityFeePerGas: feeData?.maxPriorityFeePerGas,
    });
    await contract.deploymentTransaction()!.wait();

    if (signer && (signer as AASigner).isAA) {
      const { hash } = contract.deploymentTransaction()!;
      const receipt = await signer.provider?.getTransactionReceipt(hash);
      const address = getDeployedContractAddressFromContractReceipt(receipt);

      if (address) {
        // this contract does not have .deploymentTransaction()
        const realContract = contractFactory.attach(address);
        return realContract as T;
      }
    }

    return contract as T;
  }

  /**
   * Creates contract factory from abi and bytecode
   *
   * @param name - contract name
   * @param abi - Contract abi
   * @param bytecode - Contract linked bytecode
   * @param signer - signer
   * @returns contract factory with linked libraries
   */
  async createContractFactory(abi: TAbi, bytecode: string, signer?: Signer): Promise<ContractFactory> {
    const deployer = signer || (await this.getDeployer());

    return new ContractFactory(abi, bytecode, deployer);
  }

  /**
   * Get deploy config field (see deploy-config.json)
   *
   * @param id - contract name
   * @param field - config field key
   * @returns config field value or null
   */
  getDeployConfigField<T = string | number | boolean, ID extends string = EContracts>(
    id: ID,
    field: string,
    mustGet = false,
  ): T {
    this.checkHre();

    const value = this.config
      .get(`${this.hre!.network.name}.${this.contractNames[id as EContracts]}.${field}`)
      .value() as T;

    if (mustGet && (value === null || value === undefined)) {
      throw new Error(`Can't find ${this.hre!.network.name}.${id}.${field}`);
    }

    return value;
  }

  /**
   * Update deploy config field (see deploy-config.json)
   * @param id - contract name
   * @param field - config field key
   * @param value - config field value
   */
  updateDeployConfig<T = string | number | boolean, ID extends string = EContracts>(
    id: ID,
    field: string,
    value: T,
  ): void {
    this.checkHre();

    this.config.set(`${this.hre!.network.name}.${this.contractNames[id as EContracts]}.${field}`, value).write();
  }

  /**
   * Get contract by name and group key
   *
   * @param {IGetContractParams} params - params
   * @returns contract wrapper
   */
  async getContract<T extends BaseContract>({ name, key, address, abi, signer }: IGetContractParams): Promise<T> {
    const deployer = signer || (await this.getDeployer());
    const contractAddress = address || this.storage.mustGetAddress(name, this.hre!.network.name, key);

    if (abi) {
      return new BaseContract(contractAddress, abi, deployer) as unknown as T;
    }

    const factory = await this.hre?.ethers.getContractAt(name.toString(), contractAddress, deployer);

    if (!factory) {
      throw new Error(`Contract ${name} not found`);
    }

    return factory.connect(deployer) as unknown as T;
  }
}
