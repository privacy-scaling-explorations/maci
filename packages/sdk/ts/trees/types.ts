import type { LeanIMT } from "@zk-kit/lean-imt";
import type { Provider } from "ethers";
import type { PubKey } from "maci-domainobjs";

/**
 * An interface that represents arguments of generation sign up tree and state leaves
 */
export interface IGenerateSignUpTreeArgs {
  /**
   * The etherum provider
   */
  provider: Provider;

  /**
   * The address of MACI contract
   */
  address: string;

  /**
   * The block number from which to start fetching events
   */
  fromBlock?: number;

  /**
   * The number of blocks to fetch in each request
   */
  blocksPerRequest?: number;

  /**
   * The block number at which to stop fetching events
   */
  endBlock?: number;

  /**
   * The amount of time to sleep between each request
   */
  sleepAmount?: number;
}

/**
 * An interface that represents sign up tree and state leaves
 */
export interface IGenerateSignUpTree {
  /**
   * Sign up tree
   */
  signUpTree: LeanIMT;

  /**
   * State leaves
   */
  pubKeys: PubKey[];
}
