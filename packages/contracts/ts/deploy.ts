import { type ContractFactory, type Signer, BaseContract, type BigNumberish } from "ethers";

import type {
  IDeployGatekeeperArgs,
  IDeployMaciArgs,
  IDeployedMaci,
  IDeployedPoseidonContracts,
  IFactoryLike,
} from "./types";
import type { TAbi } from "../tasks/helpers/types";

import { Deployment } from "../tasks/helpers/Deployment";
import { ECheckerFactories, EContracts, EGatekeeperFactories } from "../tasks/helpers/types";
import {
  ConstantInitialVoiceCreditProxy,
  FreeForAllGatekeeper,
  PoseidonT3__factory as PoseidonT3Factory,
  PoseidonT4__factory as PoseidonT4Factory,
  PoseidonT5__factory as PoseidonT5Factory,
  PoseidonT6__factory as PoseidonT6Factory,
  MACI,
  MockVerifier,
  PollFactory,
  MessageProcessorFactory,
  TallyFactory,
  PoseidonT3,
  PoseidonT4,
  PoseidonT5,
  PoseidonT6,
  SignUpToken,
  SignUpTokenGatekeeper,
  Verifier,
  VkRegistry,
  PollFactory__factory as PollFactoryFactory,
  MACI__factory as MACIFactory,
  MessageProcessorFactory__factory as MessageProcessorFactoryFactory,
  TallyFactory__factory as TallyFactoryFactory,
  GitcoinPassportGatekeeper,
  SemaphoreGatekeeper,
  AnonAadhaarGatekeeper,
  FreeForAllGatekeeper__factory as FreeForAllGatekeeperFactory,
  FreeForAllChecker__factory as FreeForAllCheckerFactory,
  FreeForAllGatekeeperFactory as FreeForAllGatekeeperFactoryContract,
  FreeForAllCheckerFactory as FreeForAllCheckerFactoryContract,
  ZupassGatekeeper__factory as ZupassGatekeeperFactory,
  ZupassChecker__factory as ZupassCheckerFactory,
  ZupassCheckerFactory as ZupassCheckerFactoryContract,
  ZupassGatekeeperFactory as ZupassGatekeeperFactoryContract,
  AnonAadhaarChecker__factory as AnonAadhaarCheckerFactory,
  AnonAadhaarGatekeeper__factory as AnonAadhaarGatekeeperFactory,
  AnonAadhaarCheckerFactory as AnonAadhaarCheckerFactoryContract,
  AnonAadhaarGatekeeperFactory as AnonAadhaarGatekeeperFactoryContract,
  EASGatekeeperFactory as EASGatekeeperFactoryContract,
  EASCheckerFactory as EASCheckerFactoryContract,
  GitcoinPassportCheckerFactory as GitcoinPassportCheckerFactoryContract,
  GitcoinPassportGatekeeperFactory as GitcoinPassportGatekeeperFactoryContract,
  MerkleProofCheckerFactory as MerkleProofCheckerFactoryContract,
  MerkleProofGatekeeperFactory as MerkleProofGatekeeperFactoryContract,
  SignUpGatekeeper,
  FreeForAllChecker,
  BaseChecker,
  ZupassChecker,
  ZupassGatekeeper,
  AnonAadhaarChecker,
  EASGatekeeper,
  EASChecker,
  EASChecker__factory as EASCheckerFactory,
  EASGatekeeper__factory as EASGatekeeperFactory,
  GitcoinPassportChecker,
  GitcoinPassportChecker__factory as GitcoinPassportCheckerFactory,
  GitcoinPassportGatekeeper__factory as GitcoinPassportGatekeeperFactory,
  MerkleProofGatekeeper,
  MerkleProofChecker,
  MerkleProofChecker__factory as MerkleProofCheckerFactory,
  MerkleProofGatekeeper__factory as MerkleProofGatekeeperFactory,
} from "../typechain-types";

import { genEmptyBallotRoots } from "./genEmptyBallotRoots";
import { logMagenta } from "./logger";
import { getProxyContract } from "./proxy";

/**
 * Creates contract factory from abi and bytecode
 *
 * @param abi - Contract abi
 * @param bytecode - Contract bytecode
 * @param signer - the signer to use to deploy the contract
 * @returns a contract factory with the libraries linked
 */
export const createContractFactory = async (abi: TAbi, bytecode: string, signer?: Signer): Promise<ContractFactory> => {
  const hre = await import("hardhat");
  const deployment = Deployment.getInstance({ hre });
  deployment.setHre(hre);
  const deployer = signer || (await deployment.getDeployer());

  return deployment.createContractFactory(abi, bytecode, deployer);
};

/**
 * Deploy a Smart Contract given a name and some arguments
 * @param contractName - the name of the contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @param args - the constructor arguments of the contract
 */
export const deployContract = async <T extends BaseContract>(
  contractName: string,
  signer?: Signer,
  quiet = false,
  ...args: unknown[]
): Promise<T> => {
  logMagenta({ text: `Deploying ${contractName}`, quiet });
  const hre = await import("hardhat");
  const deployment = Deployment.getInstance({ hre });
  deployment.setHre(hre);

  return deployment.deployContract({ name: contractName as EContracts, signer }, ...args);
};

/**
 * Deploy a VkRegistry contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed VkRegistry contract
 */
export const deployVkRegistry = async (signer?: Signer, quiet = false): Promise<VkRegistry> =>
  deployContract<VkRegistry>("VkRegistry", signer, quiet);

/**
 * Deploy a MockVerifier contract (testing only)
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed MockVerifier contract
 */
export const deployMockVerifier = async (signer?: Signer, quiet = false): Promise<MockVerifier> =>
  deployContract<MockVerifier>("MockVerifier", signer, quiet);

/**
 * Deploy a Verifier contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed Verifier contract
 */
export const deployVerifier = async (signer?: Signer, quiet = false): Promise<Verifier> =>
  deployContract<Verifier>("Verifier", signer, quiet);

/**
 * Deploy a constant initial voice credit proxy contract
 * @param signer - the signer to use to deploy the contract
 * @param amount - the amount of initial voice credit to give to each user
 * @param quiet - whether to suppress console output
 * @returns the deployed ConstantInitialVoiceCreditProxy contract
 */
export const deployConstantInitialVoiceCreditProxy = async (
  amount: number,
  signer?: Signer,
  quiet = false,
): Promise<ConstantInitialVoiceCreditProxy> =>
  deployContract<ConstantInitialVoiceCreditProxy>("ConstantInitialVoiceCreditProxy", signer, quiet, amount.toString());

/**
 * Deploy a SignUpToken contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed SignUpToken contract
 */
export const deploySignupToken = async (signer?: Signer, quiet = false): Promise<SignUpToken> =>
  deployContract<SignUpToken>("SignUpToken", signer, quiet);

/**
 * Deploy gatekeeper and checker contracts.
 *
 * @param args deploy gatekeeper arguments
 * @returns gatekeeper and checker contracts
 */
const deployGatekeeper = async <
  C extends BaseChecker = BaseChecker,
  T extends SignUpGatekeeper = SignUpGatekeeper,
  FC extends BaseContract = BaseContract,
  FG extends BaseContract = BaseContract,
>({
  gatekeeperFactoryName,
  checkerFactoryName,
  gatekeeperFactory,
  checkerFactory,
  signer,
  gatekeeperArgs = [],
  checkerArgs = [],
  quiet = true,
}: IDeployGatekeeperArgs): Promise<{
  checker: C;
  gatekeeper: T;
  checkerProxyFactory: IFactoryLike<typeof checkerArgs> & FC;
  gatekeeperProxyFactory: IFactoryLike<typeof gatekeeperArgs> & FG;
}> => {
  const checkerProxyFactory = await deployContract<IFactoryLike<typeof checkerArgs> & FC>(
    checkerFactoryName,
    signer,
    quiet,
  );

  const checkerReceipt = await checkerProxyFactory.deploy(...checkerArgs).then((tx) => tx.wait());

  const checker = await getProxyContract<C>({
    factory: checkerFactory,
    proxyFactory: checkerProxyFactory,
    receipt: checkerReceipt,
    signer,
  });

  const gatekeeperProxyFactory = await deployContract<IFactoryLike<typeof gatekeeperArgs> & FG>(
    gatekeeperFactoryName,
    signer,
    quiet,
  );

  const gatekeeperReceipt = await gatekeeperProxyFactory
    .deploy(...gatekeeperArgs.concat(await checker.getAddress()))
    .then((tx) => tx.wait());

  const gatekeeper = await getProxyContract<T>({
    factory: gatekeeperFactory,
    proxyFactory: gatekeeperProxyFactory,
    receipt: gatekeeperReceipt,
    signer,
  });

  return {
    checker,
    gatekeeper,
    checkerProxyFactory,
    gatekeeperProxyFactory,
  };
};

/**
 * Deploy a SignUpTokenGatekeeper contract
 * @param signUpTokenAddress - the address of the SignUpToken contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns a SignUpTokenGatekeeper contract
 */
export const deploySignupTokenGatekeeper = async (
  signUpTokenAddress: string,
  signer?: Signer,
  quiet = false,
): Promise<SignUpTokenGatekeeper> =>
  deployContract<SignUpTokenGatekeeper>("SignUpTokenGatekeeper", signer, quiet, signUpTokenAddress);

/**
 * Deploy a FreeForAllGatekeeper contract
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed FreeForAllGatekeeper contracts
 */
export const deployFreeForAllSignUpGatekeeper = async (
  signer?: Signer,
  quiet = false,
): Promise<
  [FreeForAllGatekeeper, FreeForAllChecker, FreeForAllGatekeeperFactoryContract, FreeForAllCheckerFactoryContract]
> => {
  const { gatekeeper, checker, gatekeeperProxyFactory, checkerProxyFactory } = await deployGatekeeper<
    FreeForAllChecker,
    FreeForAllGatekeeper,
    FreeForAllCheckerFactoryContract,
    FreeForAllGatekeeperFactoryContract
  >({
    gatekeeperFactoryName: EGatekeeperFactories.FreeForAll,
    checkerFactoryName: ECheckerFactories.FreeForAll,
    checkerFactory: new FreeForAllCheckerFactory(signer),
    gatekeeperFactory: new FreeForAllGatekeeperFactory(signer),
    signer: signer!,
    quiet,
  });

  return [gatekeeper, checker, gatekeeperProxyFactory, checkerProxyFactory];
};

/**
 * Deploy a EASGatekeeper contract
 * @param args - the arguments to deploy gatekeeper
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed EASGatekeeper contracts
 */
export const deployEASSignUpGatekeeper = async (
  args: {
    eas: string;
    attester: string;
    schema: Uint8Array | string;
  },
  signer?: Signer,
  quiet = false,
): Promise<[EASGatekeeper, EASChecker, EASGatekeeperFactoryContract, EASCheckerFactoryContract]> => {
  const { gatekeeper, checker, gatekeeperProxyFactory, checkerProxyFactory } = await deployGatekeeper<
    EASChecker,
    EASGatekeeper,
    EASCheckerFactoryContract,
    EASGatekeeperFactoryContract
  >({
    gatekeeperFactoryName: EGatekeeperFactories.EAS,
    checkerFactoryName: ECheckerFactories.EAS,
    checkerFactory: new EASCheckerFactory(signer),
    gatekeeperFactory: new EASGatekeeperFactory(signer),
    checkerArgs: [args.eas, args.attester, args.schema],
    signer: signer!,
    quiet,
  });

  return [gatekeeper, checker, gatekeeperProxyFactory, checkerProxyFactory];
};

/**
 * Deploy a ZupassGatekeeper contract
 * @param args - the arguments to deploy gatekeeper
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed ZupassGatekeeper contracts
 */
export const deployZupassSignUpGatekeeper = async (
  args: {
    eventId: BigNumberish;
    signer1: BigNumberish;
    signer2: BigNumberish;
    verifier: string;
  },
  signer?: Signer,
  quiet = false,
): Promise<[ZupassGatekeeper, ZupassChecker, ZupassGatekeeperFactoryContract, ZupassCheckerFactoryContract]> => {
  const { gatekeeper, checker, checkerProxyFactory, gatekeeperProxyFactory } = await deployGatekeeper<
    ZupassChecker,
    ZupassGatekeeper,
    ZupassCheckerFactoryContract,
    ZupassGatekeeperFactoryContract
  >({
    gatekeeperFactoryName: EGatekeeperFactories.Zupass,
    checkerFactoryName: ECheckerFactories.Zupass,
    checkerFactory: new ZupassCheckerFactory(signer),
    gatekeeperFactory: new ZupassGatekeeperFactory(signer),
    signer: signer!,
    checkerArgs: [args.eventId, args.signer1, args.signer2, args.verifier],
    quiet,
  });

  return [gatekeeper, checker, gatekeeperProxyFactory, checkerProxyFactory];
};

/**
 * Deploy a GitcoinPassportGatekeeper contract
 * @param args - the arguments to deploy gatekeeper
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed GitcoinPassportGatekeeper contracts
 */
export const deployGitcoinPassportGatekeeper = async (
  args: { decoderAddress: string; minimumScore: number },
  signer?: Signer,
  quiet = false,
): Promise<
  [
    GitcoinPassportGatekeeper,
    GitcoinPassportChecker,
    GitcoinPassportGatekeeperFactoryContract,
    GitcoinPassportCheckerFactoryContract,
  ]
> => {
  const { gatekeeper, checker, checkerProxyFactory, gatekeeperProxyFactory } = await deployGatekeeper<
    GitcoinPassportChecker,
    GitcoinPassportGatekeeper,
    GitcoinPassportCheckerFactoryContract,
    GitcoinPassportGatekeeperFactoryContract
  >({
    gatekeeperFactoryName: EGatekeeperFactories.GitcoinPassport,
    checkerFactoryName: ECheckerFactories.GitcoinPassport,
    checkerFactory: new GitcoinPassportCheckerFactory(signer),
    gatekeeperFactory: new GitcoinPassportGatekeeperFactory(signer),
    signer: signer!,
    checkerArgs: [args.decoderAddress, args.minimumScore.toString()],
    quiet,
  });

  return [gatekeeper, checker, gatekeeperProxyFactory, checkerProxyFactory];
};

/**
 * Deploy a MerkleProofGatekeeper contract
 * @param args - the arguments to deploy gatekeeper
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed MerkleProofGatekeeper contracts
 */
export const deployMerkleProofGatekeeper = async (
  args: { root: Uint8Array | string },
  signer?: Signer,
  quiet = false,
): Promise<
  [MerkleProofGatekeeper, MerkleProofChecker, MerkleProofGatekeeperFactoryContract, MerkleProofCheckerFactoryContract]
> => {
  const { gatekeeper, checker, checkerProxyFactory, gatekeeperProxyFactory } = await deployGatekeeper<
    MerkleProofChecker,
    MerkleProofGatekeeper,
    MerkleProofCheckerFactoryContract,
    MerkleProofGatekeeperFactoryContract
  >({
    gatekeeperFactoryName: EGatekeeperFactories.MerkleProof,
    checkerFactoryName: ECheckerFactories.MerkleProof,
    checkerFactory: new MerkleProofCheckerFactory(signer),
    gatekeeperFactory: new MerkleProofGatekeeperFactory(signer),
    signer: signer!,
    checkerArgs: [args.root],
    quiet,
  });

  return [gatekeeper, checker, gatekeeperProxyFactory, checkerProxyFactory];
};

/**
 * Deploy a SemaphoreGatekeeper contract
 * @param semaphoreAddress - the address of the Semaphore contract
 * @param groupId - The group id of the semaphore group
 * @param signer - the signer to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed SemaphoreGatekeeper contract
 */
export const deploySemaphoreGatekeeper = async (
  semaphoreAddress: string,
  groupId: bigint,
  signer?: Signer,
  quiet = false,
): Promise<SemaphoreGatekeeper> =>
  deployContract<SemaphoreGatekeeper>("SemaphoreGatekeeper", signer, quiet, semaphoreAddress, groupId.toString());

/**
 * Deploy an AnonAadhaarGatekeeper contract
 * @param args - the arguments to deploy gatekeepert
 * @returns the deployed AnonAadhaarGatekeeper contracts
 */
export const deployAnonAadhaarGatekeeper = async (
  args: {
    verifierAddress: string;
    nullifierSeed: string;
  },
  signer?: Signer,
  quiet = false,
): Promise<
  [AnonAadhaarGatekeeper, AnonAadhaarChecker, AnonAadhaarGatekeeperFactoryContract, AnonAadhaarCheckerFactoryContract]
> => {
  const { gatekeeper, checker, gatekeeperProxyFactory, checkerProxyFactory } = await deployGatekeeper<
    AnonAadhaarChecker,
    AnonAadhaarGatekeeper,
    AnonAadhaarCheckerFactoryContract,
    AnonAadhaarGatekeeperFactoryContract
  >({
    gatekeeperFactoryName: EGatekeeperFactories.AnonAadhaar,
    checkerFactoryName: ECheckerFactories.AnonAadhaar,
    checkerFactory: new AnonAadhaarCheckerFactory(signer),
    gatekeeperFactory: new AnonAadhaarGatekeeperFactory(signer),
    signer: signer!,
    checkerArgs: [args.verifierAddress, args.nullifierSeed],
    quiet,
  });

  return [gatekeeper, checker, gatekeeperProxyFactory, checkerProxyFactory];
};

/**
 * Deploy Poseidon contracts
 * @param signer - the signer to use to deploy the contracts
 * @param quiet - whether to suppress console output
 * @returns the deployed Poseidon contracts
 */
export const deployPoseidonContracts = async (
  signer?: Signer,
  { poseidonT3, poseidonT4, poseidonT5, poseidonT6 }: IDeployMaciArgs["poseidonAddresses"] = {},
  quiet = false,
): Promise<IDeployedPoseidonContracts> => {
  const PoseidonT3Contract = !poseidonT3
    ? await deployContract<PoseidonT3>("PoseidonT3", signer, quiet)
    : PoseidonT3Factory.connect(poseidonT3);

  const PoseidonT4Contract = !poseidonT4
    ? await deployContract<PoseidonT4>("PoseidonT4", signer, quiet)
    : PoseidonT4Factory.connect(poseidonT4);

  const PoseidonT5Contract = !poseidonT5
    ? await deployContract<PoseidonT5>("PoseidonT5", signer, quiet)
    : PoseidonT5Factory.connect(poseidonT5);

  const PoseidonT6Contract = !poseidonT6
    ? await deployContract<PoseidonT6>("PoseidonT6", signer, quiet)
    : PoseidonT6Factory.connect(poseidonT6);

  return {
    PoseidonT3Contract,
    PoseidonT4Contract,
    PoseidonT5Contract,
    PoseidonT6Contract,
  };
};

/**
 * Deploy a contract with linked libraries
 * @param contractFactory - the contract factory to use
 * @param name - the name of the contract
 * @param quiet - whether to suppress console output
 * @param args - the constructor arguments of the contract
 * @returns the deployed contract instance
 */
export const deployContractWithLinkedLibraries = async <T extends BaseContract>(
  contractFactory: ContractFactory,
  ...args: unknown[]
): Promise<T> => {
  const hre = await import("hardhat");
  const deployment = Deployment.getInstance({ hre });
  deployment.setHre(hre);

  return deployment.deployContractWithLinkedLibraries({ contractFactory }, ...args);
};

/**
 * Deploy a Poll Factory contract
 * @param signer - the signer object to use to deploy the contract
 * @param quiet - whether to suppress console output
 * @returns the deployed Poll Factory contract
 */
export const deployPollFactory = async (
  signer: Signer,
  factory: typeof PollFactoryFactory | undefined,
  quiet = false,
): Promise<PollFactory> => {
  const poseidonContracts = await deployPoseidonContracts(signer, {}, quiet);
  const [poseidonT3Contract, poseidonT4Contract, poseidonT5Contract, poseidonT6Contract] = await Promise.all([
    poseidonContracts.PoseidonT3Contract.getAddress(),
    poseidonContracts.PoseidonT4Contract.getAddress(),
    poseidonContracts.PoseidonT5Contract.getAddress(),
    poseidonContracts.PoseidonT6Contract.getAddress(),
  ]);

  const pollFactory = factory || PollFactoryFactory;

  const contractFactory = await createContractFactory(
    pollFactory.abi,
    pollFactory.linkBytecode({
      "contracts/crypto/PoseidonT3.sol:PoseidonT3": poseidonT3Contract,
      "contracts/crypto/PoseidonT4.sol:PoseidonT4": poseidonT4Contract,
      "contracts/crypto/PoseidonT5.sol:PoseidonT5": poseidonT5Contract,
      "contracts/crypto/PoseidonT6.sol:PoseidonT6": poseidonT6Contract,
    }),
    signer,
  );

  return deployContractWithLinkedLibraries(contractFactory);
};

/**
 * Deploy a MACI contract
 * @param {IDeployMaciArgs} args - deploy arguments
 * @returns {IDeployedMaci} the deployed MACI contract
 */
export const deployMaci = async ({
  signUpTokenGatekeeperContractAddress,
  signer,
  poseidonAddresses,
  stateTreeDepth = 10,
  factories,
  quiet = true,
}: IDeployMaciArgs): Promise<IDeployedMaci> => {
  const emptyBallotRoots = genEmptyBallotRoots(stateTreeDepth);

  const { PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract } =
    await deployPoseidonContracts(signer, poseidonAddresses, quiet);

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

  const contractsToLink = [MACIFactory, PollFactoryFactory, MessageProcessorFactoryFactory, TallyFactoryFactory];

  // Link Poseidon contracts to MACI
  const linkedContractFactories =
    factories ||
    (await Promise.all(
      contractsToLink.map(async (factory) =>
        createContractFactory(
          factory.abi,
          factory.linkBytecode({
            "contracts/crypto/PoseidonT3.sol:PoseidonT3": poseidonAddrs.poseidonT3,
            "contracts/crypto/PoseidonT4.sol:PoseidonT4": poseidonAddrs.poseidonT4,
            "contracts/crypto/PoseidonT5.sol:PoseidonT5": poseidonAddrs.poseidonT5,
            "contracts/crypto/PoseidonT6.sol:PoseidonT6": poseidonAddrs.poseidonT6,
          }),
          signer,
        ),
      ),
    ));

  const [maciContractFactory, pollFactoryContractFactory, messageProcessorFactory, tallyFactory] =
    linkedContractFactories;

  const pollFactoryContract = await deployContractWithLinkedLibraries<PollFactory>(pollFactoryContractFactory);

  const messageProcessorFactoryContract =
    await deployContractWithLinkedLibraries<MessageProcessorFactory>(messageProcessorFactory);

  const tallyFactoryContract = await deployContractWithLinkedLibraries<TallyFactory>(tallyFactory);

  const [pollAddress, messageProcessorAddress, tallyAddress] = await Promise.all([
    pollFactoryContract.getAddress(),
    messageProcessorFactoryContract.getAddress(),
    tallyFactoryContract.getAddress(),
  ]);

  const maciContract = await deployContractWithLinkedLibraries<MACI>(
    maciContractFactory,
    pollAddress,
    messageProcessorAddress,
    tallyAddress,
    signUpTokenGatekeeperContractAddress,
    stateTreeDepth,
    emptyBallotRoots,
  );

  return {
    maciContract,
    pollFactoryContract,
    messageProcessorFactoryContract,
    tallyFactoryContract,
    poseidonAddrs,
  };
};
