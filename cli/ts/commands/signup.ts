import { BaseContract } from "ethers";
import { MACI, getDefaultSigner, parseArtifact } from "maci-contracts";
import { PubKey } from "maci-domainobjs";

import { banner } from "../utils";
import { contractExists } from "../utils/contracts";
import { DEFAULT_IVCP_DATA, DEFAULT_SG_DATA } from "../utils/defaults";
import { readContractAddress } from "../utils/storage";
import { info, logError, logGreen, logYellow, success } from "../utils/theme";

/**
 * Signup a user to the MACI contract
 * @param maciPubKey - the public key of the user
 * @param maciAddress - the address of the MACI contract
 * @param sgDataArg - the signup gateway data
 * @param ivcpDataArg - the initial voice credit proxy data
 * @param quiet - whether to log the output
 * @returns the state index of the user
 */
export const signup = async (
  maciPubKey: string,
  maciAddress?: string,
  sgDataArg?: string,
  ivcpDataArg?: string,
  quiet = true,
): Promise<string> => {
  banner(quiet);

  const signer = await getDefaultSigner();
  // validate user key
  if (!PubKey.isValidSerializedPubKey(maciPubKey)) {
    logError("Invalid MACI public key");
  }

  const userMaciPubKey = PubKey.deserialize(maciPubKey);

  // ensure we have the contract addresses
  if (!readContractAddress("MACI") && !maciAddress) {
    logError("Invalid MACI contract address");
  }

  const maciContractAddress = maciAddress || readContractAddress("MACI");

  if (!(await contractExists(signer.provider!, maciContractAddress))) {
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
  const maciContract = new BaseContract(maciContractAddress, maciContractAbi, signer) as MACI;

  let stateIndex = "";
  try {
    // sign up to the MACI contract
    const tx = await maciContract.signUp(userMaciPubKey.asContractParam(), sgData, ivcpData, { gasLimit: 1000000 });
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
