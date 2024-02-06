import { type Contract, type Signer, ContractFactory, Interface, JsonRpcProvider, Wallet } from "ethers";

import type { TAbi } from "./abi";

/**
 * A class that can deploy smart contracts using a JSON-RPC provider.
 */
export class JSONRPCDeployer {
  provider: JsonRpcProvider;

  signer: Signer;

  /**
   * Generate a new JSONRPCDeployer instance.
   * @param privateKey - the private key of the deployer
   * @param providerUrl - the URL of the JSON-RPC provider
   */
  constructor(privateKey: string, providerUrl: string) {
    this.provider = new JsonRpcProvider(providerUrl);
    this.signer = new Wallet(privateKey, this.provider);
  }

  /**
   * Deploy a new smart contract using the deployer's signer.
   * @param abi - the ABI of the contract
   * @param bytecode - the bytecode of the contract
   * @param args - the constructor arguments of the contract
   * @returns a Contract object
   */
  async deploy(abi: TAbi, bytecode: string, ...args: unknown[]): Promise<Contract> {
    const contractInterface = new Interface(abi);
    const factory = new ContractFactory(contractInterface, bytecode, this.signer);
    const contract = await factory.deploy(...args);

    return contract as Contract;
  }
}

/**
 * Generate a new JSONRPCDeployer instance.
 * @param privateKey - the private key of the deployer
 * @param url - the URL of the JSON-RPC provider
 * @returns the deployer instance
 */
export const genJsonRpcDeployer = (privateKey: string, url: string): JSONRPCDeployer =>
  new JSONRPCDeployer(privateKey, url);
