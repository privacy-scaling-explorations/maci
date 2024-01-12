import type { SnarkProof } from "maci-contracts";
import type { CircuitInputs } from "maci-core";
import type { Groth16Proof, PublicSignals } from "snarkjs";

export interface DeployedContracts {
  maciAddress: string;
  stateAqAddress: string;
  pollFactoryAddress: string;
  topupCreditAddress: string;
  poseidonT3Address: string;
  poseidonT4Address: string;
  poseidonT5Address: string;
  poseidonT6Address: string;
  initialVoiceCreditProxyAddress: string;
  signUpGatekeeperAddress: string;
  verifierAddress: string;
}

export interface PollContracts {
  poll: string;
  messageProcessor: string;
  tally: string;
  subsidy?: string;
}

/**
 * Interface for the tally file data.
 */
export interface TallyData {
  /**
   * The MACI address.
   */
  maci: string;

  /**
   * The ID of the poll.
   */
  pollId: number;

  /**
   * The new tally commitment.
   */
  newTallyCommitment: string;

  /**
   * The results of the poll.
   */
  results: {
    /**
     * The tally of the results.
     */
    tally: string[];

    /**
     * The salt of the results.
     */
    salt: string;

    /**
     * The commitment of the results.
     */
    commitment: string;
  };

  /**
   * The total spent voice credits.
   */
  totalSpentVoiceCredits: {
    /**
     * The spent voice credits.
     */
    spent: string;

    /**
     * The salt of the spent voice credits.
     */
    salt: string;

    /**
     * The commitment of the spent voice credits.
     */
    commitment: string;
  };

  /**
   * The per VO spent voice credits.
   */
  perVOSpentVoiceCredits: {
    /**
     * The tally of the per VO spent voice credits.
     */
    tally: string[];

    /**
     * The salt of the per VO spent voice credits.
     */
    salt: string;

    /**
     * The commitment of the per VO spent voice credits.
     */
    commitment: string;
  };
}

/**
 * A util interface that represents a subsidy file
 */
export interface SubsidyData {
  provider: string;
  maci: string;
  pollId: number;
  newSubsidyCommitment: string;
  results: {
    subsidy: string[];
    salt: string;
  };
}

/**
 * Proof interface for cli commands
 */
export interface Proof {
  proof: SnarkProof | Groth16Proof;
  circuitInputs: CircuitInputs;
  publicInputs: PublicSignals;
}

// snark js related interfaces
export type BigNumberish = number | string | bigint;

export interface ISnarkJSVerificationKey {
  protocol: BigNumberish;
  curve: BigNumberish;
  nPublic: BigNumberish;
  vk_alpha_1: BigNumberish[];
  vk_beta_2: BigNumberish[][];
  vk_gamma_2: BigNumberish[][];
  vk_delta_2: BigNumberish[][];
  vk_alphabeta_12: BigNumberish[][][];
  IC: BigNumberish[][];
}
