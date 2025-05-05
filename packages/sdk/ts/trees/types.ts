import type { PublicKey } from "@maci-protocol/domainobjs";
import type { LeanIMT } from "@zk-kit/lean-imt";
import type { Provider } from "ethers";

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
 * An interface that represents arguments of generation sign up tree which stops fetching at a given public key
 */
export interface IGenerateSignUpTreeWithEndKeyArgs extends IGenerateSignUpTreeArgs {
  /**
   * The public key of the user
   */
  userPublicKey: PublicKey;
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
  publicKeys: PublicKey[];
}
