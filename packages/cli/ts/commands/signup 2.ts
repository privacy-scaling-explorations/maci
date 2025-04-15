import { type ContractTransactionReceipt, isBytesLike } from "ethers";
import {
  MACI__factory as MACIFactory,
  SignUpGatekeeper__factory as SignUpGatekeeperFactory,
  SemaphoreGatekeeper__factory as SemaphoreGatekeeperFactory,
  ZupassGatekeeper__factory as ZupassGatekeeperFactory,
  EASGatekeeper__factory as EASGatekeeperFactory,
  HatsGatekeeperSingle__factory as HatsSingleGatekeeperFactory,
  MerkleProofGatekeeper__factory as MerkleProofGatekeeperFactory,
} from "maci-contracts/typechain-types";
import { PubKey } from "maci-domainobjs";

import type {
  IGetGatekeeperTraitArgs,
  IParseSignupEventsArgs,
  IRegisteredUserArgs,
  ISignupData,
  SignupArgs,
  IGetGatekeeperDataArgs,
  ISemaphoreGatekeeperData,
  IZupassGatekeeperData,
  IEASGatekeeperData,
  IHatsGatekeeperData,
  IMerkleProofGatekeeperData,
} from "../utils/interfaces";

import { banner } from "../utils/banner";
import { contractExists } from "../utils/contracts";
import { DEFAULT_IVCP_DATA, DEFAULT_SG_DATA } from "../utils/defaults";
import { GatekeeperTrait } from "../utils/interfaces";
import { info, logError, logGreen, logYellow, success } from "../utils/theme";

/**
 * Signup a user to the MACI contract
 * @param {SignupArgs} args - The arguments for the signup command
 * @returns {ISignupData} The state index of the user and transaction hash
 */
export const signup = async ({
  maciPubKey,
  maciAddress,
  sgDataArg,
  ivcpDataArg,
  signer,
  quiet = true,
}: SignupArgs): Promise<ISignupData> => {
  banner(quiet);

  // validate user key
  if (!PubKey.isValidSerializedPubKey(maciPubKey)) {
    logError("Invalid MACI public key");
  }

  const userMaciPubKey = PubKey.deserialize(maciPubKey);

  if (!(await contractExists(signer.provider!, maciAddress))) {
    logError("There is no contract deployed at the specified address");
  }

  const sgData = sgDataArg || DEFAULT_SG_DATA;
  const ivcpData = ivcpDataArg || DEFAULT_IVCP_DATA;

  // we validate that the signup data and voice credit data is valid
  if (!isBytesLike(sgData)) {
    logError("invalid signup gateway data");
  }

  if (!isBytesLike(ivcpData)) {
    logError("invalid initial voice credit proxy data");
  }

  const maciContract = MACIFactory.connect(maciAddress, signer);

  let stateIndex = "";
  let voiceCredits = "";
  let receipt: ContractTransactionReceipt | null = null;

  try {
    // sign up to the MACI contract
    const tx = await maciContract.signUp(userMaciPubKey.asContractParam(), sgData, ivcpData);
    receipt = await tx.wait();

    logYellow(quiet, info(`Transaction hash: ${tx.hash}`));

    if (receipt?.status !== 1) {
      logError("The transaction failed");
    }

    const iface = maciContract.interface;

    // get state index from the event
    if (receipt?.logs) {
      const [log] = receipt.logs;
      const { args } = iface.parseLog(log as unknown as { topics: string[]; data: string }) || { args: [] };
      [stateIndex, , , voiceCredits] = args;
      logGreen(quiet, success(`State index: ${stateIndex.toString()}`));
    } else {
      logError("Unable to retrieve the transaction receipt");
    }
  } catch (error) {
    logError((error as Error).message);
  }

  return {
    stateIndex: stateIndex ? stateIndex.toString() : "",
    voiceCredits: voiceCredits ? Number.parseInt(voiceCredits, 10) : 0,
    hash: receipt!.hash,
  };
};

/**
 * Parse the signup events from the MACI contract
 */
const parseSignupEvents = async ({ maciContract, startBlock, currentBlock, publicKey }: IParseSignupEventsArgs) => {
  // 1000 blocks at a time
  for (let block = startBlock; block <= currentBlock; block += 1000) {
    const toBlock = Math.min(block + 999, currentBlock);
    // eslint-disable-next-line no-await-in-loop
    const newEvents = await maciContract.queryFilter(
      maciContract.filters.SignUp(undefined, publicKey.rawPubKey[0], publicKey.rawPubKey[1]),
      block,
      toBlock,
    );

    if (newEvents.length > 0) {
      const [event] = newEvents;

      return {
        stateIndex: event.args[0].toString(),
        voiceCredits: event.args[3].toString(),
      };
    }
  }

  return {
    stateIndex: undefined,
    voiceCredits: undefined,
  };
};

/**
 * Checks if user is registered with public key
 * @param IRegisteredArgs - The arguments for the register check command
 * @returns user registered or not and state index, voice credit balance
 */
export const isRegisteredUser = async ({
  maciAddress,
  maciPubKey,
  signer,
  startBlock,
  quiet = true,
}: IRegisteredUserArgs): Promise<{ isRegistered: boolean; stateIndex?: string; voiceCredits?: string }> => {
  banner(quiet);

  const maciContract = MACIFactory.connect(maciAddress, signer);
  const publicKey = PubKey.deserialize(maciPubKey);
  const startBlockNumber = startBlock || 0;
  const currentBlock = await signer.provider!.getBlockNumber();

  const { stateIndex, voiceCredits } = await parseSignupEvents({
    maciContract,
    startBlock: startBlockNumber,
    currentBlock,
    publicKey,
  });

  logGreen(quiet, success(`State index: ${stateIndex?.toString()}, registered: ${stateIndex !== undefined}`));

  return {
    isRegistered: stateIndex !== undefined,
    stateIndex,
    voiceCredits,
  };
};

/**
 * Get the gatekeeper type of the MACI contract
 * @param IGetGatekeeperTraitArgs - The arguments for the get gatekeeper type command
 * @returns The gatekeeper type
 */
export const getGatekeeperTrait = async ({
  maciAddress,
  signer,
}: IGetGatekeeperTraitArgs): Promise<GatekeeperTrait> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  // get the address of the signup gatekeeper
  const gatekeeperContractAddress = await maciContract.signUpGatekeeper();

  const gatekeeperContract = SignUpGatekeeperFactory.connect(gatekeeperContractAddress, signer);

  const gatekeeperType = await gatekeeperContract.getTrait();

  return gatekeeperType as GatekeeperTrait;
};

/**
 * Get the semaphore gatekeeper data
 * @param IGetSemaphoreGatekeeperDataArgs - The arguments for the get semaphore gatekeeper data command
 * @returns The semaphore gatekeeper data
 */
export const getSemaphoreGatekeeperData = async ({
  maciAddress,
  signer,
}: IGetGatekeeperDataArgs): Promise<ISemaphoreGatekeeperData> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  // get the address of the signup gatekeeper
  const gatekeeperContractAddress = await maciContract.signUpGatekeeper();

  const gatekeeperContract = SemaphoreGatekeeperFactory.connect(gatekeeperContractAddress, signer);

  // get the group ID and semaphore contract address
  const [groupId, semaphoreContractAddress] = await Promise.all([
    gatekeeperContract.groupId(),
    gatekeeperContract.semaphoreContract(),
  ]);

  return {
    address: semaphoreContractAddress,
    groupId: groupId.toString(),
  };
};

/**
 * Get the zupass gatekeeper data
 * @param IGetGatekeeperDataArgs - The arguments for the get zupass gatekeeper data command
 * @returns The zupass gatekeeper data
 */
export const getZupassGatekeeperData = async ({
  maciAddress,
  signer,
}: IGetGatekeeperDataArgs): Promise<IZupassGatekeeperData> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  // get the address of the signup gatekeeper
  const gatekeeperContractAddress = await maciContract.signUpGatekeeper();

  const gatekeeperContract = ZupassGatekeeperFactory.connect(gatekeeperContractAddress, signer);

  const [validEventId, validSigner1, validSigner2] = await Promise.all([
    gatekeeperContract.validEventId(),
    gatekeeperContract.validSigner1(),
    gatekeeperContract.validSigner2(),
  ]);

  return {
    eventId: validEventId.toString(),
    signer1: validSigner1.toString(),
    signer2: validSigner2.toString(),
  };
};

/**
 * Get the EAS gatekeeper data
 * @param IGetGatekeeperDataArgs - The arguments for the get eas gatekeeper data command
 * @returns The eas gatekeeper data
 */
export const getEASGatekeeperData = async ({
  maciAddress,
  signer,
}: IGetGatekeeperDataArgs): Promise<IEASGatekeeperData> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  const gatekeeperContractAddress = await maciContract.signUpGatekeeper();

  const gatekeeperContract = EASGatekeeperFactory.connect(gatekeeperContractAddress, signer);

  const [eas, schema, attester] = await Promise.all([
    gatekeeperContract.eas(),
    gatekeeperContract.schema(),
    gatekeeperContract.attester(),
  ]);

  return {
    eas: eas.toString(),
    schema: schema.toString(),
    attester: attester.toString(),
  };
};

/**
 * Get the hats single gatekeeper data
 * @param IGetGatekeeperDataArgs - The arguments for the get hats single gatekeeper data command
 * @returns The hats single gatekeeper data
 */
export const getHatsSingleGatekeeperData = async ({
  maciAddress,
  signer,
}: IGetGatekeeperDataArgs): Promise<IHatsGatekeeperData> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  const gatekeeperContractAddress = await maciContract.signUpGatekeeper();

  const gatekeeperContract = HatsSingleGatekeeperFactory.connect(gatekeeperContractAddress, signer);

  const [criterionHat, hatsContract] = await Promise.all([
    gatekeeperContract.criterionHat(),
    gatekeeperContract.hats(),
  ]);

  return {
    criterionHat: [criterionHat.toString()],
    hatsContract: hatsContract.toString(),
  };
};

/**
 * Get the merkleproof gatekeeper data
 * @param IGetGatekeeperDataArgs - The arguments for the get merkleproof gatekeeper data command
 * @returns The merkleproof gatekeeper data
 */
export const getMerkleProofGatekeeperData = async ({
  maciAddress,
  signer,
}: IGetGatekeeperDataArgs): Promise<IMerkleProofGatekeeperData> => {
  const maciContract = MACIFactory.connect(maciAddress, signer);

  // get the address of the signup gatekeeper
  const gatekeeperContractAddress = await maciContract.signUpGatekeeper();

  const gatekeeperContract = MerkleProofGatekeeperFactory.connect(gatekeeperContractAddress, signer);

  const [validRoot] = await Promise.all([gatekeeperContract.root()]);

  return {
    root: validRoot.toString(),
  };
};
