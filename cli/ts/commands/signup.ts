import { BaseContract } from "ethers";
import { type MACI, getDefaultSigner, getDefaultNetwork, parseArtifact } from "maci-contracts";
import { PubKey } from "maci-domainobjs";

import {
  type SignupArgs,
  banner,
  contractExists,
  DEFAULT_IVCP_DATA,
  DEFAULT_SG_DATA,
  readContractAddress,
  info,
  logError,
  logGreen,
  logYellow,
  success,
} from "../utils";

/**
 * Signup a user to the MACI contract
 * @param SignupArgs - The arguments for the signup command
 * @returns The state index of the user
 */
export const signup = async ({
  maciPubKey,
  maciAddress,
  sgDataArg,
  ivcpDataArg,
  signer,
  quiet = true,
}: SignupArgs): Promise<string> => {
  banner(quiet);

  const ethSigner = signer || (await getDefaultSigner());
  const network = await getDefaultNetwork();
  // validate user key
  if (!PubKey.isValidSerializedPubKey(maciPubKey)) {
    logError("Invalid MACI public key");
  }

  const userMaciPubKey = PubKey.deserialize(maciPubKey);

  // ensure we have the contract addresses
  if (!readContractAddress("MACI", network?.name) && !maciAddress) {
    logError("Invalid MACI contract address");
  }

  const maciContractAddress = maciAddress || readContractAddress("MACI", network?.name);

  if (!(await contractExists(ethSigner.provider!, maciContractAddress))) {
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

  const maciContractAbi = parseArtifact("MACI")[0];
  const maciContract = new BaseContract(maciContractAddress, maciContractAbi, ethSigner) as MACI;

  let stateIndex = "";
  try {
    // sign up to the MACI contract
    const tx = await maciContract.signUp(userMaciPubKey.asContractParam(), sgData, ivcpData);
    const receipt = await tx.wait();

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

  return stateIndex ? stateIndex.toString() : "";
};
