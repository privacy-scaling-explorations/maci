import { Signer } from "ethers";

/**
 * Interface for the arguments to the TimeTravel command
 */
export interface TimeTravelArgs {
  /**
   * The number of seconds to time travel
   */
  seconds: number;

  /**
   * A signer object
   */
  signer: Signer;
}

/**
 * Interface for the MACI contracts
 */
export interface IMaciContracts {
  /**
   * The address of the MACI contract
   */
  maciAddress: string;
  /**
   * The address of the voice credit proxy
   */
  voiceCreditProxy: string;
  /**
   * The address of the signup gatekeeper
   */
  signupGatekeeper: string;
}
