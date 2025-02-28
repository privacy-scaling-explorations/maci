import {
  deployConstantInitialVoiceCreditProxy,
  deployFreeForAllSignUpGatekeeper,
  deployVerifier,
  deployMaci,
} from "maci-sdk";

import {
  banner,
  logError,
  logGreen,
  success,
  readContractAddresses,
  storeContractAddresses,
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

  const [
    poseidonT3,
    poseidonT4,
    poseidonT5,
    poseidonT6,
    initialVoiceCreditProxyContractAddress,
    signupGatekeeperContractAddress,
  ] = await readContractAddresses(
    ["PoseidonT3", "PoseidonT4", "PoseidonT5", "PoseidonT6", "InitialVoiceCreditProxy", "SignUpGatekeeper"],
    network?.name,
    [
      poseidonT3Address,
      poseidonT4Address,
      poseidonT5Address,
      poseidonT6Address,
      initialVoiceCreditsProxyAddress,
      signupGatekeeperAddress,
    ],
  );

  let initialVoiceCreditsProxyContractAddress = initialVoiceCreditProxyContractAddress;

  if (!initialVoiceCreditsProxyContractAddress) {
    const contract = await deployConstantInitialVoiceCreditProxy(
      initialVoiceCredits || DEFAULT_INITIAL_VOICE_CREDITS,
      signer,
      true,
    );

    initialVoiceCreditsProxyContractAddress = await contract.getAddress();
  }

  let gatekeeperContractAddress = signupGatekeeperContractAddress;

  if (!gatekeeperContractAddress) {
    const contract = await deployFreeForAllSignUpGatekeeper(signer, true);

    gatekeeperContractAddress = await contract.getAddress();
  }

  // deploy a verifier contract
  const verifierContract = await deployVerifier(signer, true);

  const verifierContractAddress = await verifierContract.getAddress();

  // deploy MACI, PollFactory and poseidon
  const { maciContract, pollFactoryContract, poseidonAddrs } = await deployMaci({
    signUpTokenGatekeeperContractAddress: gatekeeperContractAddress,
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
  await storeContractAddresses(
    {
      InitialVoiceCreditProxy: initialVoiceCreditsProxyContractAddress,
      SignUpGatekeeper: gatekeeperContractAddress,
      Verifier: verifierContractAddress,
      MACI: maciContractAddress,
      PollFactory: pollFactoryContractAddress,
      PoseidonT3: poseidonAddrs.poseidonT3,
      PoseidonT4: poseidonAddrs.poseidonT4,
      PoseidonT5: poseidonAddrs.poseidonT5,
      PoseidonT6: poseidonAddrs.poseidonT6,
    },
    network?.name,
  );

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
    signUpGatekeeperAddress: gatekeeperContractAddress,
    initialVoiceCreditProxyAddress: initialVoiceCreditsProxyContractAddress,
  };
};
