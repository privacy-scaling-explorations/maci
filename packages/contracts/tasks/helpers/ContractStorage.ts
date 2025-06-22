/* eslint-disable import/no-extraneous-dependencies, no-console */
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import LocalStorageSync from "lowdb/adapters/LocalStorage";

import path from "path";

import type { EContracts, IRegisterContract, IStorageInstanceEntry, IStorageNamedEntry } from "./types";

import { logMagenta } from "../../ts/logger";

/**
 * Internal storage structure type.
 * named: contracts can be queried by name
 * instance: contract can be queried by address
 * verified: mark contracts which are already verified
 */
type TStorage = Record<string, TValue>;

type TValue = Partial<{
  named: Record<string, IStorageNamedEntry | Record<string, IStorageNamedEntry>>;
  instance: Record<string, IStorageInstanceEntry>;
  verified: Record<string, boolean>;
}>;

/**
 * @notice Contract storage keeps all deployed contracts with addresses, arguments in the json file.
 * This class is using for incremental deployment and verification.
 */
export class ContractStorage {
  /**
   * Singleton instance for class
   */
  private static INSTANCE?: ContractStorage;

  /**
   * Json file database instance
   */
  private db: low.LowdbSync<TStorage>;

  /**
   * Initialize class properties only once
   */
  private constructor(storagePath?: string) {
    this.db = low(
      typeof window !== "undefined"
        ? new LocalStorageSync<TStorage>("deployed-contracts")
        : new FileSync<TStorage>(storagePath ?? path.resolve(process.cwd(), "./deployed-contracts.json")),
    );
  }

  /**
   * Get singleton object
   *
   * @param storagePath - path to the storage file
   * @returns {ContractStorage} singleton object
   */
  static getInstance(storagePath?: string): ContractStorage {
    if (!ContractStorage.INSTANCE) {
      ContractStorage.INSTANCE = new ContractStorage(storagePath);
    }

    return ContractStorage.INSTANCE;
  }

  /**
   * Register contract and save contract address, constructor args in the json file
   *
   * @param {IRegisterContract} args - register arguments
   */
  async register<ID = EContracts>({
    id,
    key,
    contract,
    network,
    args,
    name,
    implementation,
    libraries,
  }: IRegisterContract<ID>): Promise<void> {
    const contractAddress = await contract.getAddress();

    const deploymentTx = contract.deploymentTransaction();
    const contractId = String(id);

    logMagenta({ text: `*** ${contractId} ***\n` });
    logMagenta({ text: `Network: ${network}` });
    logMagenta({ text: `contract address: ${contractAddress}` });

    if (deploymentTx) {
      logMagenta({ text: `tx: ${deploymentTx.hash}` });
      logMagenta({ text: `deployer address: ${deploymentTx.from}` });
      logMagenta({ text: `gas price: ${deploymentTx.gasPrice}` });
      logMagenta({ text: `gas used: ${deploymentTx.gasLimit}` });
    }

    logMagenta({ text: `\n******\n` });

    const logEntry: IStorageInstanceEntry = {
      id: contractId,
      deploymentTxHash: deploymentTx?.hash,
    };

    if (args !== undefined) {
      logEntry.verify = {
        name,
        impl: implementation,
        args: JSON.stringify(args),
        libraries: libraries ? JSON.stringify(libraries) : undefined,
      };
    }

    this.db.set(`${network}.instance.${contractAddress}`, logEntry).write();

    const namedEntry = this.db.get(`${network}.named.${contractId}${key !== undefined ? `.${key}` : ""}`).value() as
      | IStorageNamedEntry
      | undefined;
    const count = namedEntry?.count ?? 0;
    this.db
      .set(`${network}.named.${contractId}${key !== undefined ? `.${key}` : ""}`, {
        address: contractAddress,
        count: count + 1,
      })
      .write();
  }

  /**
   * Get contract instances from the json file
   *
   * @param network - selected network
   * @returns {[string, IStorageInstanceEntry][]} storage instance entries
   */
  getInstances(network: string): [string, IStorageInstanceEntry][] {
    const collection = this.db.get(`${network}.instance`);
    const value = collection.value() as IStorageInstanceEntry[] | undefined;

    return Object.entries<IStorageInstanceEntry>(value || []);
  }

  /**
   * Check if contract is verified or not locally
   *
   * @param address - contract address
   * @param network - selected network
   * @returns contract verified or not
   */
  getVerified(address: string, network: string): boolean {
    return this.db.get(`${network}.verified.${address}`).value() as unknown as boolean;
  }

  /**
   * Set contract verification in the json file
   *
   * @param address - contract address
   * @param network - selected network
   * @param verified - verified or not
   */
  setVerified = (address: string, network: string, verified: boolean): void => {
    this.db.set(`${network}.verified.${address}`, verified).write();
  };

  /**
   * Get deployment arguments from the json file
   *
   * @param id - contract name
   * @param network - selected network
   * @param key - contract key
   * @returns deployment arguments
   */
  getContractArgs<ID extends string = EContracts>(id: ID, network: string, key?: string): string[] | undefined {
    const address = this.getAddress(id, network, key);

    const collection = this.db.get(`${network}.instance.${address}`);
    const instanceEntry = collection.value() as IStorageInstanceEntry | undefined;

    if (!instanceEntry?.verify?.args) {
      return undefined;
    }

    return JSON.parse(instanceEntry.verify.args) as string[];
  }

  /**
   * Get contract address by name from the json file
   *
   * @param id - contract name
   * @param network - selected network
   * @returns contract address
   */
  getAddress<ID extends string = EContracts>(id: ID, network: string, key?: string): string | undefined {
    const collection = this.db.get(`${network}.named.${id}${key !== undefined ? `.${key}` : ""}`);
    const namedEntry = collection.value() as IStorageNamedEntry | undefined;

    return namedEntry?.address;
  }

  /**
   * Get contract addresses by names from the json file
   *
   * @param ids - contract names
   * @param network - selected network
   * @returns contract address
   */
  getAddresses<ID extends string = EContracts>(
    ids: ID[],
    network: string,
    keys: string[] = [],
  ): (string | undefined)[] {
    return ids
      .map((id, index) => {
        const entry = this.db.get(`${network}.named.${id}`).value() as
          | IStorageNamedEntry
          | Record<string, IStorageNamedEntry>
          | undefined;

        if (entry && keys[index] in entry) {
          return (entry as Record<string, IStorageNamedEntry>)[keys[index]];
        }

        return entry as IStorageNamedEntry | undefined;
      })
      .map((entity) => entity?.address);
  }

  /**
   * Get contract address by name from the json file
   *
   * @param id - contract name
   * @param network - selected network
   * @throws {Error} if there is no address the error will be thrown
   * @returns contract address
   */
  mustGetAddress<ID extends string = EContracts>(id: ID, network: string, key?: string): string {
    const address = this.getAddress(id, network, key);

    if (!address) {
      throw new Error(`Contract ${id} is not saved`);
    }

    return address;
  }

  /**
   * Get Contract Deployment Transaction Hash
   */
  getDeploymentTxHash<ID extends string = EContracts>(id: ID, network: string, address: string): string | undefined {
    const collection = this.db.get(`${network}.instance.${address}`);
    const instanceEntry = collection.value() as IStorageInstanceEntry | undefined;

    if (instanceEntry?.id !== id) {
      throw new Error(`Contract ${id} with address ${address} and network ${network} not found.`);
    }

    return instanceEntry.deploymentTxHash;
  }

  /**
   * Get contract from the json file with sizes and multi count
   *
   * @param deployer - deployer address
   * @param network - selected network
   * @returns {[entries: Map<string, string>, length: number, multiCount: number]}
   */
  printContracts(deployer: string, network: string): [Map<string, string>, number, number] {
    logMagenta({ text: `Contracts deployed at ${network} by ${deployer}` });
    logMagenta({ text: "---------------------------------" });

    const entryMap = new Map<string, string>();
    const data = this.db.get(network).value() as TValue | undefined;
    const { named, instance } = data || {};
    const namedEntries = Object.entries<IStorageNamedEntry | Record<string, IStorageNamedEntry>>(named || {});
    const instanceEntries = Object.entries<IStorageInstanceEntry>(instance || {});

    let multiCount = 0;

    namedEntries.forEach(([key, value]) => {
      if (key.startsWith("~")) {
        return;
      }

      if (typeof value.count === "number" && typeof value.address === "string") {
        if (value.count > 1) {
          logMagenta({ text: `\t${key}: N=${value.count}` });
          multiCount += 1;
        } else {
          logMagenta({ text: `\t${key}: ${value.address}` });
          entryMap.set(key, value.address);
        }
      } else {
        const entries = Object.entries<IStorageNamedEntry>(value as Record<string, IStorageNamedEntry>);

        entries.forEach(([id, nested]) => {
          if (typeof nested.count === "number" && typeof nested.address === "string") {
            if (nested.count > 1) {
              logMagenta({ text: `\t${key}-${id}: N=${nested.count}` });
              multiCount += 1;
            } else {
              logMagenta({ text: `\t${key}-${id}: ${nested.address}` });
              entryMap.set(key, nested.address);
            }
          } else {
            const nestedEntries = Object.entries<IStorageNamedEntry>(
              nested as unknown as Record<string, IStorageNamedEntry>,
            );
            nestedEntries.forEach(([subId, subNested]) => {
              if (subNested.count > 1) {
                logMagenta({ text: `\t${key}-${id}-${subId}: N=${subNested.count}` });
                multiCount += 1;
              } else {
                logMagenta({ text: `\t${key}-${id}-${subId}: ${subNested.address}` });
                entryMap.set(`${key}-${id}-${subId}`, subNested.address);
              }
            });
          }
        });
      }
    });

    logMagenta({ text: "---------------------------------" });
    logMagenta({ text: `N# Contracts: ${entryMap.size + multiCount} / ${instanceEntries.length}` });

    return [entryMap, instanceEntries.length, multiCount];
  }

  /**
   * Clean json file for selected network
   *
   * @param network - selected network
   */
  cleanup(network: string): void {
    this.db.set(network, {}).write();
  }
}
