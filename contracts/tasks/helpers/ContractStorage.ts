/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

import type { EContracts, IRegisterContract, IStorageInstanceEntry, IStorageNamedEntry } from "./types";

type TStorage = Record<
  string,
  Partial<{
    named: Record<string, IStorageNamedEntry>;
    instance: Record<string, IStorageInstanceEntry>;
    verified: Record<string, boolean>;
  }>
>;

export class ContractStorage {
  private static INSTANCE?: ContractStorage;

  private db: low.LowdbSync<TStorage>;

  private constructor() {
    this.db = low(new FileSync<TStorage>("./deployed-contracts.json"));
  }

  static getInstance(): ContractStorage {
    if (!ContractStorage.INSTANCE) {
      ContractStorage.INSTANCE = new ContractStorage();
    }

    return ContractStorage.INSTANCE;
  }

  async register({ id, contract, network, args }: IRegisterContract): Promise<void> {
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

    const namedEntry = this.db.get(`${network}.named.${id}`).value() as IStorageNamedEntry | undefined;
    const count = namedEntry?.count ?? 0;
    this.db
      .set(`${network}.named.${id}`, {
        address: contractAddress,
        count: count + 1,
      })
      .write();
  }

  getInstances(network: string): [string, IStorageInstanceEntry][] {
    const collection = this.db.get(`${network}.instance`);
    const value = collection.value() as IStorageInstanceEntry[] | undefined;

    return Object.entries<IStorageInstanceEntry>(value || []);
  }

  getVerified(address: string, network: string): boolean {
    return this.db.get(`${network}.verified.${address}`).value() as unknown as boolean;
  }

  setVerified = (address: string, network: string, verified: boolean): void => {
    this.db.set(`${network}.verified.${address}`, verified).write();
  };

  getAddress(id: EContracts, network: string): string | undefined {
    const collection = this.db.get(`${network}.named.${id}`);
    const namedEntry = collection.value() as IStorageNamedEntry | undefined;

    return namedEntry?.address;
  }

  mustGetAddress(id: EContracts, network: string): string {
    const address = this.getAddress(id, network);

    if (!address) {
      throw new Error(`Contract ${id} is not saved`);
    }

    return address;
  }

  printContracts(deployer: string, network: string): [Map<string, string>, number, number] {
    console.log("Contracts deployed at", network, "by", deployer);
    console.log("---------------------------------");

    const entryMap = new Map<string, string>();
    const { named, instance } = this.db.get(network).value();
    const namedEntries = Object.entries<IStorageNamedEntry>(named || {});
    const instanceEntries = Object.entries<IStorageInstanceEntry>(instance || {});

    let multiCount = 0;

    namedEntries.forEach(([key, value]) => {
      if (key.startsWith("~")) {
        return;
      }

      if (value.count > 1) {
        console.log(`\t${key}: N=${value.count}`);
        multiCount += 1;
      } else {
        console.log(`\t${key}: ${value.address}`);
        entryMap.set(key, value.address);
      }
    });

    console.log("---------------------------------");
    console.log("N# Contracts:", entryMap.size + multiCount, "/", instanceEntries.length);

    return [entryMap, instanceEntries.length, multiCount];
  }

  cleanup(network: string): void {
    this.db.set(network, {}).write();
  }
}
