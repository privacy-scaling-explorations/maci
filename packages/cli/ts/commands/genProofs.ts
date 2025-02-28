import { PrivKey } from "maci-domainobjs";
import { generateProofs, type ITallyData } from "maci-sdk";

import {
  banner,
  doesPathExist,
  logError,
  promptSensitiveValue,
  readContractAddress,
  type GenProofsArgs,
} from "../utils";

/**
 * Generate proofs for the message processing and tally calculations
 * @note see different options for zkey files to use specific circuits https://maci.pse.dev/docs/trusted-setup, https://maci.pse.dev/docs/testing/#pre-compiled-artifacts-for-testing
 * @param GenProofsArgs - The arguments for the genProofs command
 * @returns The tally data
 */
export const genProofsCommand = async ({
  outputDir,
  tallyFile,
  tallyZkey,
  processZkey,
  pollId,
  rapidsnark,
  processWitgen,
  processDatFile,
  tallyWitgen,
  tallyDatFile,
  coordinatorPrivKey,
  maciAddress,
  transactionHash,
  processWasm,
  tallyWasm,
  useWasm,
  stateFile,
  startBlock,
  blocksPerBatch,
  endBlock,
  signer,
  ipfsMessageBackupFiles,
  useQuadraticVoting = true,
  quiet = true,
}: GenProofsArgs): Promise<ITallyData> => {
  banner(quiet);

  // differentiate whether we are using wasm or rapidsnark
  if (useWasm) {
    // if no rapidsnark then we assume we go with wasm
    // so we expect those arguments
    if (!processWasm) {
      logError("Please specify the process wasm file location");
    }

    if (!tallyWasm) {
      logError("Please specify the tally wasm file location");
    }

    const wasmResult = doesPathExist([processWasm!, tallyWasm!]);

    if (!wasmResult[0]) {
      logError(`Could not find ${wasmResult[1]}.`);
    }
  } else {
    if (!rapidsnark) {
      logError("Please specify the rapidsnark file location");
    }

    if (!processWitgen) {
      logError("Please specify the process witgen file location");
    }

    if (!tallyWitgen) {
      logError("Please specify the tally witgen file location");
    }

    const witgenResult = doesPathExist([rapidsnark!, processWitgen!, tallyWitgen!, processDatFile!, tallyDatFile!]);

    if (!witgenResult[0]) {
      logError(`Could not find ${witgenResult[1]}.`);
    }
  }

  // check if zkeys were provided
  const zkResult = doesPathExist([processZkey, tallyZkey]);

  if (!zkResult[0]) {
    logError(`Could not find ${zkResult[1]}.`);
  }

  const network = await signer.provider?.getNetwork();
  const maciContractAddress = await readContractAddress("MACI", network?.name);

  if (!maciContractAddress && !maciAddress) {
    logError("Please provide a MACI contract address");
  }

  // the coordinator's MACI private key
  const privateKey = coordinatorPrivKey || (await promptSensitiveValue("Insert your MACI private key"));

  if (!PrivKey.isValidSerializedPrivKey(privateKey)) {
    logError("Invalid MACI private key");
  }

  const { tallyData } = await generateProofs({
    networkName: network?.name || "",
    chainId: network?.chainId.toString() || "0",
    maciContractAddress,
    coordinatorPrivateKey: privateKey,
    pollId: Number(pollId),
    ipfsMessageBackupFiles,
    stateFile: stateFile || "",
    transactionHash: transactionHash || "",
    startBlock,
    endBlock,
    blocksPerBatch,
    signer,
    outputDir,
    tallyFile,
    tallyZkey,
    tallyWitgen,
    tallyWasm,
    processZkey,
    processWitgen,
    processWasm,
    useQuadraticVoting,
    rapidsnark,
  });

  return tallyData;
};
