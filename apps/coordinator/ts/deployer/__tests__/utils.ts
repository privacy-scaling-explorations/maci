import { Keypair } from "maci-domainobjs";
import { EGatekeepers, EInitialVoiceCreditProxies } from "maci-sdk";

import { IDeployMaciConfig, IDeployPollConfig } from "../types";

export const MSG_BATCH_SIZE = 20;

/**
 * MACI deployment configuration for testing
 */
export const testMaciDeploymentConfig: IDeployMaciConfig = {
  gatekeeper: {
    type: EGatekeepers.FreeForAll,
  },
  MACI: {
    gatekeeper: EGatekeepers.FreeForAll,
    stateTreeDepth: 10,
  },
  VkRegistry: {
    args: {
      stateTreeDepth: 10n,
      messageBatchSize: MSG_BATCH_SIZE,
      voteOptionTreeDepth: 2n,
      intStateTreeDepth: 1n,
    },
  },
  Poseidon: {
    // poseidon contracts on optimism sepolia
    poseidonT3: "0x07490eba00dc4ACA6721D052Fa4C5002Aa077233",
    poseidonT4: "0xbb0e724CE02e5E7eDd31e632dc6e59F229a1126d",
    poseidonT5: "0xE0398F7DFAC494c530F6404AfEaC8669ABeD2679",
    poseidonT6: "0xfD77833F10a29c76A6a0ede235Eb651D744d0E2F",
  },
};

/**
 * Poll deployment configuration for testing
 */
export const testPollDeploymentConfig: IDeployPollConfig = {
  startDate: 100,
  endDate: 200,
  useQuadraticVoting: false,
  coordinatorPubkey: new Keypair().pubKey.serialize(),
  intStateTreeDepth: 1,
  messageBatchSize: MSG_BATCH_SIZE,
  voteOptionTreeDepth: 2,
  gatekeeper: {
    type: EGatekeepers.FreeForAll,
  },
  initialVoiceCreditsProxy: {
    type: EInitialVoiceCreditProxies.Constant,
    args: {
      amount: "100",
    },
  },
  voteOptions: 2n,
};
