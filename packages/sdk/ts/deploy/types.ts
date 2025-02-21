import { EMode } from "maci-contracts";
import { PubKey } from "maci-domainobjs";
import { Signer, type ContractFactory } from "ethers";

/**
 * The arguments for the deploy poll command
 */
export interface IDeployPollArgs {
  /**
   * The address of the MACI contract
   */
  maciContractAddress: string;
  /**
   * The start timestamp of the poll
   */
  pollStartTimestamp: number;
  /**
   * The end timestamp of the poll
   */
  pollEndTimestamp: number;
  /**
   * The depth of the integer state tree
   */
  intStateTreeDepth: number;
  /**
   * The depth of the vote option tree
   */
  voteOptionTreeDepth: number;
  /**
   * The batch size of the messages
   */
  messageBatchSize: number;
  /**
   * The coordinator public key
   */
  coordinatorPubKey: PubKey;
  /**
   * The address of the verifier contract
   */
  verifierContractAddress: string;
  /**
   * The address of the VK registry contract
   */
  vkRegistryContractAddress: string;
  /**
   * The mode of the poll
   */
  mode: EMode;
  /**
   * The address of the gatekeeper contract
   */
  gatekeeperContractAddress: string;
  /**
   * The address of the initial voice credit proxy contract
   */
  initialVoiceCreditProxyContractAddress: string;
  /**
   * The addresses of the relayers
   */
  relayers: string[];
  /**
   * The number of vote options
   */
  voteOptions: number;
  /**
   * The signer
   */
  signer: Signer;
}

/**
 * The addresses of the deployed poll contracts
 */
export interface IPollContracts {
  /**
   * The address of the poll contract
   */
  pollContractAddress: string;
  /**
   * The address of the message processor contract
   */
  messageProcessorContractAddress: string;
  /**
   * The address of the tally contract
   */
  tallyContractAddress: string;
}

export interface IDeployMaciArgs {
  /**
   * The depth of the integer state tree
   */
  stateTreeDepth: number;
  /**
   * The address of the signup gatekeeper contract
   */
  signupGatekeeperAddress: string;
  /**
   * The MACI contract factory
   */
  contractFactory: ContractFactory;
  /**
   * The address of the poll factory contract
   */
  pollFactoryContractAddress: string;
  /**
   * The address of the message processor factory contract
   */
  messageProcessorFactoryContractAddress: string;
  /**
   * The address of the tally factory contract
   */
  tallyFactoryContractAddress: string;
}
