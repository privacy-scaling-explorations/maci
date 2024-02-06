/* eslint-disable import/no-extraneous-dependencies, no-console */
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

import type { EContracts, IRegisterContract, IStorageInstanceEntry, IStorageNamedEntry } from "./types";

/**
 * Internal storage structure type.
 * named: contracts can be queried by name
 * instance: contract can be queried by address
 * verified: mark contracts which are already verified
 */
type TStorage = Record<
  string,
  Partial<{
    named: Record<string, IStorageNamedEntry | Record<string, IStorageNamedEntry>>;
    instance: Record<string, IStorageInstanceEntry>;
    verified: Record<string, boolean>;
  }>
>;

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
  private constructor() {
    this.db = low(new FileSync<TStorage>("./deployed-contracts.json"));
  }

  /**
   * Get singleton object
   *
   * @returns {ContractStorage} singleton object
   */
  static getInstance(): ContractStorage {
    if (!ContractStorage.INSTANCE) {
      ContractStorage.INSTANCE = new ContractStorage();
    }

    return ContractStorage.INSTANCE;
  }

  /**
   * Register contract and save contract address, constructor args in the json file
   *
   * @param {IRegisterContract} args - register arguments
   */
  async register({ id, key, contract, network, args }: IRegisterContract): Promise<void> {
    const contractAddress = await contract.getAddress();

    const deploymentTx = contract.deploymentTransaction();

    console.log(`*** ${id} ***\n`);
    console.log(`Network: ${network}`);
    console.log(`contract address: ${contractAddress}`);

    if (deploymentTx) {
      console.log(`tx: ${deploymentTx.hash}`);
      console.log(`deployer address: ${deploymentTx.from}`);
      console.log(`gas price: ${deploymentTx.gasPrice}`);
      console.log(`gas used: ${deploymentTx.gasLimit}`);
    }

    console.log(`\n******`);
    console.log();

    const logEntry: IStorageInstanceEntry = {
      id,
    };

    if (args !== undefined) {
      logEntry.verify = {
        args: JSON.stringify(args),
      };
    }

    this.db.set(`${network}.instance.${contractAddress}`, logEntry).write();

    const namedEntry = this.db.get(`${network}.named.${id}${key !== undefined ? `.poll-${key}` : ""}`).value() as
      | IStorageNamedEntry
      | undefined;
    const count = namedEntry?.count ?? 0;
    this.db
      .set(`${network}.named.${id}${key !== undefined ? `.poll-${key}` : ""}`, {
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
   * Get contract address by name from the json file
   *
   * @param id - contract name
   * @param network - selected network
   * @returns contract address
   */
  getAddress(id: EContracts, network: string, key?: string): string | undefined {
    const collection = this.db.get(`${network}.named.${id}${key !== undefined ? `.poll-${key}` : ""}`);
    const namedEntry = collection.value() as IStorageNamedEntry | undefined;

    return namedEntry?.address;
  }

  /**
   * Get contract address by name from the json file
   *
   * @param id - contract name
   * @param network - selected network
   * @throws {Error} if there is no address the error will be thrown
   * @returns contract address
   */
  mustGetAddress(id: EContracts, network: string): string {
    const address = this.getAddress(id, network);

    if (!address) {
      throw new Error(`Contract ${id} is not saved`);
    }

    return address;
  }

  /**
   * Get contract from the json file with sizes and multi count
   *
   * @param deployer - deployer address
   * @param network - selected network
   * @returns {[entries: Map<string, string>, length: number, multiCount: number]}
   */
  printContracts(deployer: string, network: string): [Map<string, string>, number, number] {
    console.log("Contracts deployed at", network, "by", deployer);
    console.log("---------------------------------");

    const entryMap = new Map<string, string>();
    const { named, instance } = this.db.get(network).value();
    const namedEntries = Object.entries<IStorageNamedEntry | Record<string, IStorageNamedEntry>>(named || {});
    const instanceEntries = Object.entries<IStorageInstanceEntry>(instance || {});

    let multiCount = 0;

    namedEntries.forEach(([key, value]) => {
      if (key.startsWith("~")) {
        return;
      }

      if (typeof value.count === "number" && typeof value.address === "string") {
        if (value.count > 1) {
          console.log(`\t${key}: N=${value.count}`);
          multiCount += 1;
        } else {
          console.log(`\t${key}: ${value.address}`);
          entryMap.set(key, value.address);
        }
      } else {
        const entries = Object.entries<IStorageNamedEntry>(value as Record<string, IStorageNamedEntry>);

        entries.forEach(([id, nested]) => {
          if (nested.count > 1) {
            console.log(`\t${key}-${id}: N=${nested.count}`);
            multiCount += 1;
          } else {
            console.log(`\t${key}-${id}: ${nested.address}`);
            entryMap.set(id, nested.address);
          }
        });
      }
    });

    console.log("---------------------------------");
    console.log("N# Contracts:", entryMap.size + multiCount, "/", instanceEntries.length);

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
