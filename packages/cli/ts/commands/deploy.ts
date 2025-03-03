import {
  deployConstantInitialVoiceCreditProxy,
  deployFreeForAllSignUpGatekeeper,
  deployVerifier,
  deployMaci,
  logGreen,
  success,
  genEmptyBallotRoots,
  EContracts,
  EGatekeepers,
} from "maci-sdk";

import {
  banner,
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
  signupGatekeeperContractName = EGatekeepers.FreeForAll,
  quiet = true,
}: DeployArgs): Promise<DeployedContracts> => {
  banner(quiet);

  if (initialVoiceCreditsProxyAddress && initialVoiceCredits) {
    throw new Error("Please provide either an initialVoiceCreditProxyAddress or initialVoiceCredits, not both");
  }

  const voiceCreditsAmount = initialVoiceCredits || DEFAULT_INITIAL_VOICE_CREDITS;
  const network = await signer.provider?.getNetwork();

  const [poseidonT3, poseidonT4, poseidonT5, poseidonT6] = readContractAddresses({
    contractNames: [EContracts.PoseidonT3, EContracts.PoseidonT4, EContracts.PoseidonT5, EContracts.PoseidonT6],
    network: network?.name,
    defaultAddresses: [poseidonT3Address, poseidonT4Address, poseidonT5Address, poseidonT6Address],
  });

  const [initialVoiceCreditProxyContractAddress, signupGatekeeperContractAddress] = readContractAddresses({
    contractNames: [EContracts.ConstantInitialVoiceCreditProxy, signupGatekeeperContractName.toString() as EContracts],
    network: network?.name,
    defaultAddresses: [initialVoiceCreditsProxyAddress, signupGatekeeperAddress],
  });

  let initialVoiceCreditsProxyContractAddress = initialVoiceCreditProxyContractAddress;

  if (!initialVoiceCreditsProxyContractAddress) {
    const contract = await deployConstantInitialVoiceCreditProxy(voiceCreditsAmount, signer, true);

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
  const { maciContract, pollFactoryContract, messageProcessorFactoryContract, tallyFactoryContract, poseidonAddrs } =
    await deployMaci({
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

  const [
    maciContractAddress,
    pollFactoryContractAddress,
    messageProcessorFactoryContractAddress,
    tallyFactoryContractAddress,
  ] = await Promise.all([
    maciContract.getAddress(),
    pollFactoryContract.getAddress(),
    messageProcessorFactoryContract.getAddress(),
    tallyFactoryContract.getAddress(),
  ]);

  const emptyBallotRoots = genEmptyBallotRoots(stateTreeDepth);

  // save to the JSON File
  await storeContractAddresses({
    data: {
      [EContracts.ConstantInitialVoiceCreditProxy]: {
        address: initialVoiceCreditsProxyContractAddress,
        args: [voiceCreditsAmount.toString()],
      },
      [signupGatekeeperContractName]: { address: gatekeeperContractAddress, args: [] },
      [EContracts.Verifier]: { address: verifierContractAddress, args: [] },
      [EContracts.MACI]: {
        address: maciContractAddress,
        args: [
          pollFactoryContractAddress,
          messageProcessorFactoryContractAddress,
          tallyFactoryContractAddress,
          gatekeeperContractAddress,
          stateTreeDepth,
          emptyBallotRoots.map((root) => root.toString()),
        ],
      },
      [EContracts.MessageProcessorFactory]: { address: messageProcessorFactoryContractAddress, args: [] },
      [EContracts.TallyFactory]: { address: tallyFactoryContractAddress, args: [] },
      [EContracts.PollFactory]: { address: pollFactoryContractAddress, args: [] },
      [EContracts.PoseidonT3]: { address: poseidonAddrs.poseidonT3, args: [] },
      [EContracts.PoseidonT4]: { address: poseidonAddrs.poseidonT4, args: [] },
      [EContracts.PoseidonT5]: { address: poseidonAddrs.poseidonT5, args: [] },
      [EContracts.PoseidonT6]: { address: poseidonAddrs.poseidonT6, args: [] },
    },
    signer,
  });

  logGreen({ quiet, text: success(`MACI deployed at:  ${maciContractAddress}`) });

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
