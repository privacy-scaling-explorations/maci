import type { IDeployedTestContracts, SnarkProof } from "./types";

import { FreeForAllGatekeeper } from "../typechain-types";

import {
  deployVkRegistry,
  deployTopupCredit,
  deployMaci,
  deployMessageProcessor,
  deployTally,
  deployMockVerifier,
  deployFreeForAllSignUpGatekeeper,
  deployConstantInitialVoiceCreditProxy,
} from "./deploy";

const formatProofForVerifierContract = (proof: SnarkProof): string[] =>
  [
    proof.pi_a[0],
    proof.pi_a[1],

    proof.pi_b[0][1],
    proof.pi_b[0][0],
    proof.pi_b[1][1],
    proof.pi_b[1][0],

    proof.pi_c[0],
    proof.pi_c[1],
  ].map((x) => x.toString());

const deployTestContracts = async (
  initialVoiceCreditBalance: number,
  stateTreeDepth: number,
  quiet = false,
  gatekeeper: FreeForAllGatekeeper | undefined = undefined,
): Promise<IDeployedTestContracts> => {
  const mockVerifierContract = await deployMockVerifier(true);

  let gatekeeperContract = gatekeeper;
  if (!gatekeeperContract) {
    gatekeeperContract = await deployFreeForAllSignUpGatekeeper(true);
  }

  const constantIntialVoiceCreditProxyContract = await deployConstantInitialVoiceCreditProxy(
    initialVoiceCreditBalance,
    true,
  );

  // VkRegistry
  const vkRegistryContract = await deployVkRegistry(true);
  const topupCreditContract = await deployTopupCredit(true);
  const [
    gatekeeperContractAddress,
    mockVerifierContractAddress,
    constantIntialVoiceCreditProxyContractAddress,
    vkRegistryContractAddress,
    topupCreditContractAddress,
  ] = await Promise.all([
    gatekeeperContract.getAddress(),
    mockVerifierContract.getAddress(),
    constantIntialVoiceCreditProxyContract.getAddress(),
    vkRegistryContract.getAddress(),
    topupCreditContract.getAddress(),
  ]);

  const { maciContract, stateAqContract, poseidonAddrs } = await deployMaci(
    gatekeeperContractAddress,
    constantIntialVoiceCreditProxyContractAddress,
    mockVerifierContractAddress,
    topupCreditContractAddress,
    stateTreeDepth,
    quiet,
  );
  const mpContract = await deployMessageProcessor(
    mockVerifierContractAddress,
    vkRegistryContractAddress,
    poseidonAddrs[0],
    poseidonAddrs[1],
    poseidonAddrs[2],
    poseidonAddrs[3],
    true,
  );
  const tallyContract = await deployTally(
    mockVerifierContractAddress,
    vkRegistryContractAddress,
    poseidonAddrs[0],
    poseidonAddrs[1],
    poseidonAddrs[2],
    poseidonAddrs[3],
    true,
  );

  return {
    mockVerifierContract,
    gatekeeperContract,
    constantIntialVoiceCreditProxyContract,
    maciContract,
    stateAqContract,
    vkRegistryContract,
    mpContract,
    tallyContract,
  };
};

/**
 * Pause the thread for n milliseconds
 * @param ms - the amount of time to sleep in milliseconds
 */
const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export { type IDeployedTestContracts, deployTestContracts, formatProofForVerifierContract, sleep };
