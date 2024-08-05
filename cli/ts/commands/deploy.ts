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

  const poseidonT3 = poseidonT3Address || (await readContractAddress("PoseidonT3", network?.name));
  const poseidonT4 = poseidonT4Address || (await readContractAddress("PoseidonT4", network?.name));
  const poseidonT5 = poseidonT5Address || (await readContractAddress("PoseidonT5", network?.name));
  const poseidonT6 = poseidonT6Address || (await readContractAddress("PoseidonT6", network?.name));

  // if we did not deploy it before, then deploy it now
  let initialVoiceCreditProxyContractAddress: string | undefined =
    initialVoiceCreditsProxyAddress || (await readContractAddress("InitialVoiceCreditProxy", network?.name));

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
    signupGatekeeperAddress || (await readContractAddress("SignUpGatekeeper", network?.name));

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
  await storeContractAddress("InitialVoiceCreditProxy", initialVoiceCreditProxyContractAddress, network?.name);
  await storeContractAddress("SignUpGatekeeper", signupGatekeeperContractAddress, network?.name);
  await storeContractAddress("Verifier", verifierContractAddress, network?.name);
  await storeContractAddress("MACI", maciContractAddress, network?.name);
  await storeContractAddress("PollFactory", pollFactoryContractAddress, network?.name);
  await storeContractAddress("PoseidonT3", poseidonAddrs.poseidonT3, network?.name);
  await storeContractAddress("PoseidonT4", poseidonAddrs.poseidonT4, network?.name);
  await storeContractAddress("PoseidonT5", poseidonAddrs.poseidonT5, network?.name);
  await storeContractAddress("PoseidonT6", poseidonAddrs.poseidonT6, network?.name);

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
