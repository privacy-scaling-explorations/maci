import {
  deployPoseidonContracts,
  generateEmptyBallotRoots,
  PollFactory__factory as PollFactoryFactory,
  TallyFactory__factory as TallyFactoryFactory,
  MACI__factory as MACIFactory,
  MessageProcessorFactory__factory as MessageProcessorFactoryFactory,
  IBasePolicy__factory as SignUpPolicyFactory,
} from "@maci-protocol/contracts";

import type { IDeployMaciArgs, IMaciContracts } from "./types";

import { deployFactoryWithLinkedLibraries } from "./utils";

/**
 * Deploy the MACI contracts
 * @param args - The arguments for the MACI contracts deployment
 * @returns The deployed MACI contracts
 */
export const deployMaci = async ({
  stateTreeDepth,
  signupPolicyAddress,
  pollFactoryAddress,
  messageProcessorFactoryAddress,
  tallyFactoryAddress,
  signer,
  poseidonAddresses,
}: IDeployMaciArgs): Promise<IMaciContracts> => {
  const emptyBallotRoots = generateEmptyBallotRoots(stateTreeDepth);

  const { PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract } =
    await deployPoseidonContracts(signer, poseidonAddresses, true);

  const poseidonAddrs = await Promise.all([
    PoseidonT3Contract.getAddress(),
    PoseidonT4Contract.getAddress(),
    PoseidonT5Contract.getAddress(),
    PoseidonT6Contract.getAddress(),
  ]).then(([poseidonT3, poseidonT4, poseidonT5, poseidonT6]) => ({
    poseidonT3,
    poseidonT4,
    poseidonT5,
    poseidonT6,
  }));

  const pollFactoryContractAddress = await deployFactoryWithLinkedLibraries({
    address: pollFactoryAddress,
    abi: PollFactoryFactory.abi,
    bytecode: PollFactoryFactory.linkBytecode({
      "contracts/crypto/PoseidonT3.sol:PoseidonT3": poseidonAddrs.poseidonT3,
      "contracts/crypto/PoseidonT4.sol:PoseidonT4": poseidonAddrs.poseidonT4,
      "contracts/crypto/PoseidonT5.sol:PoseidonT5": poseidonAddrs.poseidonT5,
      "contracts/crypto/PoseidonT6.sol:PoseidonT6": poseidonAddrs.poseidonT6,
    }),
    signer,
  });

  const messageProcessorFactoryContractAddress = await deployFactoryWithLinkedLibraries({
    address: messageProcessorFactoryAddress,
    abi: MessageProcessorFactoryFactory.abi,
    bytecode: MessageProcessorFactoryFactory.linkBytecode({
      "contracts/crypto/PoseidonT3.sol:PoseidonT3": poseidonAddrs.poseidonT3,
      "contracts/crypto/PoseidonT4.sol:PoseidonT4": poseidonAddrs.poseidonT4,
      "contracts/crypto/PoseidonT5.sol:PoseidonT5": poseidonAddrs.poseidonT5,
      "contracts/crypto/PoseidonT6.sol:PoseidonT6": poseidonAddrs.poseidonT6,
    }),
    signer,
  });

  const tallyFactoryContractAddress = await deployFactoryWithLinkedLibraries({
    address: tallyFactoryAddress,
    abi: TallyFactoryFactory.abi,
    bytecode: TallyFactoryFactory.linkBytecode({
      "contracts/crypto/PoseidonT3.sol:PoseidonT3": poseidonAddrs.poseidonT3,
      "contracts/crypto/PoseidonT4.sol:PoseidonT4": poseidonAddrs.poseidonT4,
      "contracts/crypto/PoseidonT5.sol:PoseidonT5": poseidonAddrs.poseidonT5,
      "contracts/crypto/PoseidonT6.sol:PoseidonT6": poseidonAddrs.poseidonT6,
    }),
    signer,
  });

  const maciContractAddress = await deployFactoryWithLinkedLibraries({
    abi: MACIFactory.abi,
    bytecode: MACIFactory.linkBytecode({
      "contracts/crypto/PoseidonT3.sol:PoseidonT3": poseidonAddrs.poseidonT3,
      "contracts/crypto/PoseidonT4.sol:PoseidonT4": poseidonAddrs.poseidonT4,
      "contracts/crypto/PoseidonT5.sol:PoseidonT5": poseidonAddrs.poseidonT5,
      "contracts/crypto/PoseidonT6.sol:PoseidonT6": poseidonAddrs.poseidonT6,
    }),
    signer,
    args: [
      pollFactoryContractAddress,
      messageProcessorFactoryContractAddress,
      tallyFactoryContractAddress,
      signupPolicyAddress,
      stateTreeDepth,
      emptyBallotRoots,
    ],
  });

  const policy = SignUpPolicyFactory.connect(signupPolicyAddress, signer);
  await policy.setTarget(maciContractAddress).then((tx) => tx.wait());

  return {
    maciContractAddress,
    pollFactoryContractAddress,
    messageProcessorFactoryContractAddress,
    tallyFactoryContractAddress,
    poseidonAddresses: poseidonAddrs,
  };
};
