import { MACI__factory as MACIFactory } from "maci-contracts/typechain-types";
import { PubKey } from "maci-domainobjs";

import type { IRegisteredUserArgs, ISignupData, SignupArgs } from "../utils/interfaces";
import type { ContractTransactionReceipt } from "ethers";

import { banner } from "../utils/banner";
import { contractExists } from "../utils/contracts";
import { DEFAULT_IVCP_DATA, DEFAULT_SG_DATA } from "../utils/defaults";
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

  const regex32ByteHex = /^0x[a-fA-F0-9]{64}$/;

  // we validate that the signup data and voice credit data is valid
  if (!sgData.match(regex32ByteHex)) {
    logError("invalid signup gateway data");
  }

  if (!ivcpData.match(regex32ByteHex)) {
    logError("invalid initial voice credit proxy data");
  }

  const maciContract = MACIFactory.connect(maciAddress, signer);

  let stateIndex = "";
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
      [stateIndex] = args;
      logGreen(quiet, success(`State index: ${stateIndex.toString()}`));
    } else {
      logError("Unable to retrieve the transaction receipt");
    }
  } catch (error) {
    logError((error as Error).message);
  }

  return {
    stateIndex: stateIndex ? stateIndex.toString() : "",
    hash: receipt!.hash,
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
  quiet = true,
}: IRegisteredUserArgs): Promise<{ isRegistered: boolean; stateIndex?: string; voiceCredits?: string }> => {
  banner(quiet);

  const maciContract = MACIFactory.connect(maciAddress, signer);
  const publicKey = PubKey.deserialize(maciPubKey).asContractParam();

  const events = await maciContract.queryFilter(maciContract.filters.SignUp(undefined, publicKey.x, publicKey.y));
  const stateIndex = events[0]?.args[0].toString() as string | undefined;
  const voiceCredits = events[0]?.args[3].toString() as string | undefined;

  logGreen(quiet, success(`State index: ${stateIndex?.toString()}, registered: ${stateIndex !== undefined}`));

  return {
    isRegistered: stateIndex !== undefined,
    stateIndex,
    voiceCredits,
  };
};
