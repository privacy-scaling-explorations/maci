import {
  type Contract,
  type ContractFactory,
  type Signer,
  type FeeData,
  BaseContract,
  JsonRpcProvider,
  Interface,
} from "ethers";
// eslint-disable-next-line
// @ts-ignore typedoc doesn't want to get types from toolbox
import { ethers } from "hardhat";

import { readFileSync, writeFileSync } from "fs";
import path from "path";

import type { Fragment, JsonFragment } from "@ethersproject/abi";

import {
  AccQueueQuinaryMaci,
  ConstantInitialVoiceCreditProxy,
  FreeForAllGatekeeper,
  MACI,
  MessageProcessor,
  MockVerifier,
  Ownable,
  PollFactory,
  PoseidonT3,
  PoseidonT4,
  PoseidonT5,
  PoseidonT6,
  SignUpToken,
  SignUpTokenGatekeeper,
  Subsidy,
  Tally,
  TopupCredit,
  Verifier,
  VkRegistry,
} from "../typechain-types";

const abiDir = path.resolve(__dirname, "..", "artifacts");
const solDir = path.resolve(__dirname, "..", "contracts");

type TAbi = string | readonly (string | Fragment | JsonFragment)[];

const getDefaultSigner = async (): Promise<Signer> => {
  const signers = await ethers.getSigners();
  return signers[0];
};

const parseArtifact = (filename: string): [TAbi, string] => {
  let filePath = "contracts/";
  if (filename.includes("Gatekeeper")) {
    filePath += "gatekeepers/";
    filePath += `${filename}.sol`;
  }

  if (filename.includes("VoiceCredit")) {
    filePath += "initialVoiceCreditProxy/";
    filePath += `${filename}.sol`;
  }

  if (filename.includes("Verifier")) {
    filePath += "crypto/Verifier.sol/";
  }

  if (filename.includes("AccQueue")) {
    filePath += "trees/AccQueue.sol/";
  }

  if (filename.includes("Poll") || filename.includes("MessageAq")) {
    filePath += "Poll.sol";
  }

  if (!filePath.includes(".sol")) {
    filePath += `${filename}.sol`;
  }

  const contractArtifact = JSON.parse(readFileSync(path.resolve(abiDir, filePath, `${filename}.json`)).toString()) as {
    abi: TAbi;
    bytecode: string;
  };

  return [contractArtifact.abi, contractArtifact.bytecode];
};

const getInitialVoiceCreditProxyAbi = (): TAbi => {
  const [abi] = parseArtifact("InitialVoiceCreditProxy.abi");
  return abi;
};

export class JSONRPCDeployer {
  provider: JsonRpcProvider;

  signer: Signer;

  options?: Record<string, unknown>;

  constructor(privateKey: string, providerUrl: string, options?: Record<string, unknown>) {
    this.provider = new JsonRpcProvider(providerUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.options = options;
  }

  async deploy(abi: TAbi, bytecode: string, ...args: unknown[]): Promise<Contract> {
    const contractInterface = new Interface(abi);
    const factory = new ethers.ContractFactory(contractInterface, bytecode, this.signer);
    const contract = await factory.deploy(...args);

    return contract as Contract;
  }
}

const genJsonRpcDeployer = (privateKey: string, url: string): JSONRPCDeployer => new JSONRPCDeployer(privateKey, url);

const log = (msg: string, quiet: boolean) => {
  if (!quiet) {
    // eslint-disable-next-line no-console
    console.log(msg);
  }
};

const getFeeData = async (): Promise<FeeData | undefined> => {
  const signer = await getDefaultSigner();
  return signer.provider?.getFeeData();
};

const linkPoseidonLibraries = async (
  solFileToLink: string,
  poseidonT3Address: string,
  poseidonT4Address: string,
  poseidonT5Address: string,
  poseidonT6Address: string,
  quiet = false,
): Promise<ContractFactory> => {
  const signer = await getDefaultSigner();

  log(`Linking Poseidon libraries to ${solFileToLink}`, quiet);
  const contractFactory = await ethers.getContractFactory(solFileToLink, {
    signer,
    libraries: {
      PoseidonT3: poseidonT3Address,
      PoseidonT4: poseidonT4Address,
      PoseidonT5: poseidonT5Address,
      PoseidonT6: poseidonT6Address,
    },
  });

  return contractFactory;
};

// Deploy a contract given a name and args
const deployContract = async <T extends BaseContract>(
  contractName: string,
  quiet = false,
  ...args: unknown[]
): Promise<T> => {
  log(`Deploying ${contractName}`, quiet);
  const signer = await getDefaultSigner();
  const contractFactory = await ethers.getContractFactory(contractName, signer);
  const contract = await contractFactory.deploy(...args, {
    maxFeePerGas: await getFeeData().then((res) => res?.maxFeePerGas),
  });
  await contract.deploymentTransaction()!.wait();

  return contract as unknown as T;
};

const deployTopupCredit = async (quiet = false): Promise<TopupCredit> =>
  deployContract<TopupCredit>("TopupCredit", quiet);

const deployVkRegistry = async (quiet = false): Promise<VkRegistry> => deployContract<VkRegistry>("VkRegistry", quiet);

const deployMockVerifier = async (quiet = false): Promise<MockVerifier> =>
  deployContract<MockVerifier>("MockVerifier", quiet);

const deployVerifier = async (quiet = false): Promise<Verifier> => deployContract<Verifier>("Verifier", quiet);

const deployConstantInitialVoiceCreditProxy = async (
  amount: number,
  quiet = false,
): Promise<ConstantInitialVoiceCreditProxy> =>
  deployContract<ConstantInitialVoiceCreditProxy>("ConstantInitialVoiceCreditProxy", quiet, amount.toString());

const deploySignupToken = async (quiet = false): Promise<SignUpToken> =>
  deployContract<SignUpToken>("SignUpToken", quiet);

const deploySignupTokenGatekeeper = async (signUpTokenAddress: string, quiet = false): Promise<SignUpTokenGatekeeper> =>
  deployContract<SignUpTokenGatekeeper>("SignUpTokenGatekeeper", quiet, signUpTokenAddress);

const deployFreeForAllSignUpGatekeeper = async (quiet = false): Promise<FreeForAllGatekeeper> =>
  deployContract<FreeForAllGatekeeper>("FreeForAllGatekeeper", quiet);

interface IDeployedPoseidonContracts {
  PoseidonT3Contract: PoseidonT3;
  PoseidonT4Contract: PoseidonT4;
  PoseidonT5Contract: PoseidonT5;
  PoseidonT6Contract: PoseidonT6;
}

const deployPoseidonContracts = async (quiet = false): Promise<IDeployedPoseidonContracts> => {
  const PoseidonT3Contract = await deployContract<PoseidonT3>("PoseidonT3", quiet);
  const PoseidonT4Contract = await deployContract<PoseidonT4>("PoseidonT4", quiet);
  const PoseidonT5Contract = await deployContract<PoseidonT5>("PoseidonT5", quiet);
  const PoseidonT6Contract = await deployContract<PoseidonT6>("PoseidonT6", quiet);

  return {
    PoseidonT3Contract,
    PoseidonT4Contract,
    PoseidonT5Contract,
    PoseidonT6Contract,
  };
};

const deployPollFactory = async (quiet = false): Promise<Contract> => deployContract("PollFactory", quiet);

// deploy a contract with linked libraries
const deployContractWithLinkedLibraries = async <T extends BaseContract>(
  contractFactory: ContractFactory,
  name: string,
  quiet = false,
  ...args: unknown[]
): Promise<T> => {
  log(`Deploying ${name}`, quiet);
  const contract = await contractFactory.deploy(...args, {
    maxFeePerGas: await getFeeData().then((res) => res?.maxFeePerGas),
  });
  await contract.deploymentTransaction()!.wait();

  return contract as T;
};

const transferOwnership = async <T extends Ownable>(contract: T, newOwner: string, quiet = false): Promise<void> => {
  log(`Transferring ownership of ${await contract.getAddress()} to ${newOwner}`, quiet);
  const tx = await contract.transferOwnership(newOwner, {
    maxFeePerGas: await getFeeData().then((res) => res?.maxFeePerGas),
  });

  await tx.wait();
};

const deployMessageProcessor = async (
  verifierAddress: string,
  vkRegistryAddress: string,
  poseidonT3Address: string,
  poseidonT4Address: string,
  poseidonT5Address: string,
  poseidonT6Address: string,
  quiet = false,
): Promise<MessageProcessor> => {
  // Link Poseidon contracts to MessageProcessor
  const mpFactory = await linkPoseidonLibraries(
    "MessageProcessor",
    poseidonT3Address,
    poseidonT4Address,
    poseidonT5Address,
    poseidonT6Address,
    quiet,
  );

  return deployContractWithLinkedLibraries<MessageProcessor>(
    mpFactory,
    "MessageProcessor",
    quiet,
    verifierAddress,
    vkRegistryAddress,
  );
};

const deployTally = async (
  verifierAddress: string,
  vkRegistryAddress: string,
  poseidonT3Address: string,
  poseidonT4Address: string,
  poseidonT5Address: string,
  poseidonT6Address: string,
  quiet = false,
): Promise<Tally> => {
  // Link Poseidon contracts to Tally
  const tallyFactory = await linkPoseidonLibraries(
    "Tally",
    poseidonT3Address,
    poseidonT4Address,
    poseidonT5Address,
    poseidonT6Address,
    quiet,
  );

  return deployContractWithLinkedLibraries<Tally>(tallyFactory, "Tally", quiet, verifierAddress, vkRegistryAddress);
};

const deploySubsidy = async (
  verifierAddress: string,
  vkRegistryAddress: string,
  poseidonT3Address: string,
  poseidonT4Address: string,
  poseidonT5Address: string,
  poseidonT6Address: string,
  quiet = false,
): Promise<Subsidy> => {
  // Link Poseidon contracts to Subsidy
  const subsidyFactory = await linkPoseidonLibraries(
    "Subsidy",
    poseidonT3Address,
    poseidonT4Address,
    poseidonT5Address,
    poseidonT6Address,
    quiet,
  );

  return deployContractWithLinkedLibraries<Subsidy>(
    subsidyFactory,
    "Subsidy",
    quiet,
    verifierAddress,
    vkRegistryAddress,
  );
};

interface IDeployedMaci {
  maciContract: MACI;
  stateAqContract: AccQueueQuinaryMaci;
  pollFactoryContract: PollFactory;
  poseidonAddrs: string[];
}

const deployMaci = async (
  signUpTokenGatekeeperContractAddress: string,
  initialVoiceCreditBalanceAddress: string,
  verifierContractAddress: string,
  topupCreditContractAddress: string,
  stateTreeDepth = 10,
  quiet = false,
): Promise<IDeployedMaci> => {
  const { PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract } =
    await deployPoseidonContracts(quiet);

  const poseidonAddrs = await Promise.all([
    PoseidonT3Contract.getAddress(),
    PoseidonT4Contract.getAddress(),
    PoseidonT5Contract.getAddress(),
    PoseidonT6Contract.getAddress(),
  ]);

  const contractsToLink = ["MACI", "PollFactory"];

  // Link Poseidon contracts to MACI
  const linkedContractFactories = await Promise.all(
    contractsToLink.map(async (contractName: string) =>
      linkPoseidonLibraries(
        contractName,
        poseidonAddrs[0],
        poseidonAddrs[1],
        poseidonAddrs[2],
        poseidonAddrs[3],
        quiet,
      ),
    ),
  );

  const [maciContractFactory, pollFactoryContractFactory] = await Promise.all(linkedContractFactories);

  const pollFactoryContract = await deployContractWithLinkedLibraries<PollFactory>(
    pollFactoryContractFactory,
    "PollFactory",
    quiet,
  );

  const maciContract = await deployContractWithLinkedLibraries<MACI>(
    maciContractFactory,
    "MACI",
    quiet,
    await pollFactoryContract.getAddress(),
    signUpTokenGatekeeperContractAddress,
    initialVoiceCreditBalanceAddress,
    topupCreditContractAddress,
    stateTreeDepth,
  );

  const [AccQueueQuinaryMaciAbi] = parseArtifact("AccQueue");
  const stateAqContractAddress = await maciContract.stateAq();
  const stateAqContract = new BaseContract(
    stateAqContractAddress,
    AccQueueQuinaryMaciAbi,
    await getDefaultSigner(),
  ) as AccQueueQuinaryMaci;

  log(`Verifier contract address: ${verifierContractAddress}`, quiet);

  return {
    maciContract,
    stateAqContract,
    pollFactoryContract,
    poseidonAddrs,
  };
};

const writeContractAddresses = (
  maciContractAddress: string,
  vkRegistryContractAddress: string,
  stateAqContractAddress: string,
  signUpTokenAddress: string,
  outputAddressFile: string,
): void => {
  const addresses = {
    MaciContract: maciContractAddress,
    VkRegistry: vkRegistryContractAddress,
    StateAqContract: stateAqContractAddress,
    SignUpToken: signUpTokenAddress,
  };

  const addressJsonPath = path.resolve(__dirname, "..", outputAddressFile);
  writeFileSync(addressJsonPath, JSON.stringify(addresses));

  // eslint-disable-next-line no-console
  console.log(addresses);
};

export {
  type IDeployedPoseidonContracts,
  type IDeployedMaci,
  deployContract,
  deployContractWithLinkedLibraries,
  deployTopupCredit,
  deployVkRegistry,
  deployMaci,
  deployMessageProcessor,
  deployTally,
  deploySubsidy,
  deploySignupToken,
  deploySignupTokenGatekeeper,
  deployConstantInitialVoiceCreditProxy,
  deployFreeForAllSignUpGatekeeper,
  deployMockVerifier,
  deployVerifier,
  deployPollFactory,
  genJsonRpcDeployer,
  getInitialVoiceCreditProxyAbi,
  transferOwnership,
  abiDir,
  solDir,
  parseArtifact,
  linkPoseidonLibraries,
  deployPoseidonContracts,
  getDefaultSigner,
  writeContractAddresses,
};
