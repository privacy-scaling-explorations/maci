import {
  deployConstantInitialVoiceCreditProxy,
  deployFreeForAllSignUpGatekeeper,
  deployVerifier,
  deployMaci,
} from "maci-contracts";

import {
  banner,
  logError,
  logGreen,
  success,
  readContractAddress,
  storeContractAddress,
  DEFAULT_INITIAL_VOICE_CREDITS,
  type DeployedContracts,
  type DeployArgs,
} from "../utils";
import { storeSubgraphNetworks } from "../utils/storage";

/**
 * Deploy MACI and related contracts
 * @param DeployArgs - The arguments for the deploy command
 * @returns The addresses of the deployed contracts
 */
export const deploy = async ({
  stateTreeDepth,
  initialVoiceCredits,
  initialVoiceCreditsProxyAddress,
  signupGatekeeperAddress,
  poseidonT3Address,
  poseidonT4Address,
  poseidonT5Address,
  poseidonT6Address,
  signer,
  quiet = true,
}: DeployArgs): Promise<DeployedContracts> => {
  banner(quiet);

  if (initialVoiceCreditsProxyAddress && initialVoiceCredits) {
    logError("Please provide either an initialVoiceCreditProxyAddress or initialVoiceCredits, not both");
  }

  const network = await signer.provider?.getNetwork();

  const poseidonT3 = poseidonT3Address || readContractAddress("PoseidonT3", network?.name);
  const poseidonT4 = poseidonT4Address || readContractAddress("PoseidonT4", network?.name);
  const poseidonT5 = poseidonT5Address || readContractAddress("PoseidonT5", network?.name);
  const poseidonT6 = poseidonT6Address || readContractAddress("PoseidonT6", network?.name);

  // if we did not deploy it before, then deploy it now
  let initialVoiceCreditProxyContractAddress: string | undefined =
    initialVoiceCreditsProxyAddress || readContractAddress("InitialVoiceCreditProxy", network?.name);

  if (!initialVoiceCreditsProxyAddress) {
    const contract = await deployConstantInitialVoiceCreditProxy(
      initialVoiceCredits || DEFAULT_INITIAL_VOICE_CREDITS,
      signer,
      true,
    );

    initialVoiceCreditProxyContractAddress = await contract.getAddress();
  }

  // check if we have a signupGatekeeper already deployed or passed as arg
  let signupGatekeeperContractAddress =
    signupGatekeeperAddress || readContractAddress("SignUpGatekeeper", network?.name);

  if (!signupGatekeeperContractAddress) {
    const contract = await deployFreeForAllSignUpGatekeeper(signer, true);
    signupGatekeeperContractAddress = await contract.getAddress();
  }

  // deploy a verifier contract
  const verifierContract = await deployVerifier(signer, true);

  const verifierContractAddress = await verifierContract.getAddress();

  // deploy MACI, stateAq, PollFactory and poseidon
  const { maciContract, pollFactoryContract, poseidonAddrs } = await deployMaci({
    signUpTokenGatekeeperContractAddress: signupGatekeeperContractAddress,
    initialVoiceCreditBalanceAddress: initialVoiceCreditProxyContractAddress,
    poseidonAddresses: {
      poseidonT3,
      poseidonT4,
      poseidonT5,
      poseidonT6,
    },
    signer,
    stateTreeDepth,
    quiet: true,
  });

  const [maciContractAddress, pollFactoryContractAddress] = await Promise.all([
    maciContract.getAddress(),
    pollFactoryContract.getAddress(),
  ]);

  // save to the JSON File
  storeContractAddress("InitialVoiceCreditProxy", initialVoiceCreditProxyContractAddress, network?.name);
  storeContractAddress("SignUpGatekeeper", signupGatekeeperContractAddress, network?.name);
  storeContractAddress("Verifier", verifierContractAddress, network?.name);
  storeContractAddress("MACI", maciContractAddress, network?.name);
  storeContractAddress("PollFactory", pollFactoryContractAddress, network?.name);
  storeContractAddress("PoseidonT3", poseidonAddrs.poseidonT3, network?.name);
  storeContractAddress("PoseidonT4", poseidonAddrs.poseidonT4, network?.name);
  storeContractAddress("PoseidonT5", poseidonAddrs.poseidonT5, network?.name);
  storeContractAddress("PoseidonT6", poseidonAddrs.poseidonT6, network?.name);

  // save to the subgraph networks.json file
  await maciContract.waitForDeployment();
  const txn = maciContract.deploymentTransaction();
  storeSubgraphNetworks("MACI", maciContractAddress, txn?.blockNumber ?? 0, network?.name);

  logGreen(quiet, success(`MACI deployed at:  ${maciContractAddress}`));

  // return all addresses
  return {
    maciAddress: maciContractAddress,
    pollFactoryAddress: pollFactoryContractAddress,
    verifierAddress: verifierContractAddress,
    poseidonT3Address: poseidonAddrs.poseidonT3,
    poseidonT4Address: poseidonAddrs.poseidonT4,
    poseidonT5Address: poseidonAddrs.poseidonT5,
    poseidonT6Address: poseidonAddrs.poseidonT6,
    signUpGatekeeperAddress: signupGatekeeperContractAddress,
    initialVoiceCreditProxyAddress: initialVoiceCreditProxyContractAddress,
  };
};
