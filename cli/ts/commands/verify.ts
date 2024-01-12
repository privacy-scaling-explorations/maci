import { BaseContract } from "ethers";
import { type Tally, type MACI, type Subsidy, type Poll, getDefaultSigner, parseArtifact } from "maci-contracts";
import { hash2, hash3, genTreeCommitment } from "maci-crypto";

import fs from "fs";

import type { SubsidyData, TallyData } from "../utils/interfaces";

import { banner, contractExists, info, logError, logGreen, logYellow, readContractAddress, success } from "../utils";
import { verifyPerVOSpentVoiceCredits, verifyTallyResults } from "../utils/verifiers";

/**
 * Verify the results of a poll and optionally the subsidy results
 * @param pollId - the id of the poll
 * @param subsidyEnabled - whether to deploy subsidy contract
 * @param tallyFile - the path to the tally file
 * @param maciAddress - the address of the MACI contract
 * @param tallyAddress - the address of the Tally contract
 * @param subsidyAddress - the address of the Subsidy contract
 * @param subsidyFile - the path to the subsidy file
 * @param quiet - whether to log the output
 */
export const verify = async (
  pollId: string,
  subsidyEnabled: boolean,
  tallyFile?: string,
  tallyData?: TallyData,
  maciAddress?: string,
  tallyAddress?: string,
  subsidyAddress?: string,
  subsidyFile?: string,
  quiet = true,
): Promise<void> => {
  banner(quiet);
  const signer = await getDefaultSigner();

  // check existence of MACI, Tally and Subsidy contract addresses
  if (!readContractAddress("MACI") && !maciAddress) {
    logError("MACI contract address is empty");
  }

  if (!readContractAddress(`Tally-${pollId}`) && !tallyAddress) {
    logError("Tally contract address is empty");
  }

  if (subsidyEnabled && !readContractAddress(`Subsidy-${pollId}`) && !subsidyAddress) {
    logError("Subsidy contract address is empty");
  }

  const maciContractAddress = maciAddress || readContractAddress("MACI");
  const tallyContractAddress = tallyAddress || readContractAddress(`Tally-${pollId}`);

  let subsidyContractAddress = "";
  if (subsidyEnabled) {
    subsidyContractAddress = subsidyAddress || readContractAddress(`Subsidy-${pollId}`);
  }

  if (!(await contractExists(signer.provider!, maciContractAddress))) {
    logError(`Error: there is no contract deployed at ${maciContractAddress}.`);
  }

  if (!(await contractExists(signer.provider!, tallyContractAddress))) {
    logError(`Error: there is no contract deployed at ${tallyContractAddress}.`);
  }

  if (subsidyEnabled && !(await contractExists(signer.provider!, subsidyContractAddress))) {
    logError(`Error: there is no contract deployed at ${subsidyContractAddress}.`);
  }

  const maciContract = new BaseContract(maciContractAddress, parseArtifact("MACI")[0], signer) as MACI;
  const pollAddr = await maciContract.polls(pollId);

  const pollContract = new BaseContract(pollAddr, parseArtifact("Poll")[0], signer) as Poll;

  const tallyContract = new BaseContract(tallyContractAddress, parseArtifact("Tally")[0], signer) as Tally;

  const subsidyContract = subsidyEnabled
    ? (new BaseContract(subsidyContractAddress, parseArtifact("Subsidy")[0], signer) as Subsidy)
    : undefined;

  // verification
  const onChainTallycomment = BigInt(await tallyContract.tallyCommitment());

  logYellow(quiet, info(`on-chain tally commitment: ${onChainTallycomment.toString(16)}`));

  // ensure we have either tally data or tally file
  if (!(tallyData || tallyFile)) {
    logError("No tally data or tally file provided.");
  }
  // if we have the data as param, then use that
  let tallyResults: TallyData;
  if (tallyData) {
    tallyResults = tallyData;
  } else {
    // read the tally file
    if (!tallyFile || !fs.existsSync(tallyFile)) {
      logError(`Unable to open ${tallyFile}`);
    }

    tallyResults = JSON.parse(fs.readFileSync(tallyFile!, { encoding: "utf8" })) as TallyData;
  }

  // check the results commitment
  const validResultsCommitment = tallyResults.newTallyCommitment.match(/0x[a-fA-F0-9]+/);

  if (!validResultsCommitment) {
    logError("Invalid results commitment format");
  }

  const treeDepths = await pollContract.treeDepths();
  const voteOptionTreeDepth = Number(treeDepths.voteOptionTreeDepth);
  const numVoteOptions = 5 ** voteOptionTreeDepth;

  if (tallyResults.results.tally.length !== numVoteOptions) {
    logError("Wrong number of vote options.");
  }

  if (tallyResults.perVOSpentVoiceCredits.tally.length !== numVoteOptions) {
    logError("Wrong number of vote options.");
  }

  // verify that the results commitment matches the output of genTreeCommitment()

  // verify the results
  // compute newResultsCommitment
  const newResultsCommitment = genTreeCommitment(
    tallyResults.results.tally.map((x) => BigInt(x)),
    BigInt(tallyResults.results.salt),
    voteOptionTreeDepth,
  );

  // compute newSpentVoiceCreditsCommitment
  const newSpentVoiceCreditsCommitment = hash2([
    BigInt(tallyResults.totalSpentVoiceCredits.spent),
    BigInt(tallyResults.totalSpentVoiceCredits.salt),
  ]);

  // compute newPerVOSpentVoiceCreditsCommitment
  const newPerVOSpentVoiceCreditsCommitment = genTreeCommitment(
    tallyResults.perVOSpentVoiceCredits.tally.map((x) => BigInt(x)),
    BigInt(tallyResults.perVOSpentVoiceCredits.salt),
    voteOptionTreeDepth,
  );

  // compute newTallyCommitment
  const newTallyCommitment = hash3([
    newResultsCommitment,
    newSpentVoiceCreditsCommitment,
    newPerVOSpentVoiceCreditsCommitment,
  ]);

  if (onChainTallycomment !== newTallyCommitment) {
    logError("The on-chain tally commitment does not match.");
  }
  logGreen(quiet, success("The on-chain tally commitment matches."));

  // verify total spent voice credits on-chain
  const isValid = await tallyContract.verifySpentVoiceCredits(
    tallyResults.totalSpentVoiceCredits.spent,
    tallyResults.totalSpentVoiceCredits.salt,
    newResultsCommitment,
    newPerVOSpentVoiceCreditsCommitment,
  );
  if (isValid) {
    logGreen(quiet, success("The on-chain verification of total spent voice credits passed."));
  } else {
    logError("The on-chain verification of total spent voice credits failed.");
  }

  // verify per vote option voice credits on-chain
  const failedSpentCredits = await verifyPerVOSpentVoiceCredits(
    tallyContract,
    tallyResults,
    voteOptionTreeDepth,
    newSpentVoiceCreditsCommitment,
    newResultsCommitment,
  );
  if (failedSpentCredits.length === 0) {
    logGreen(quiet, success("The on-chain verification of per vote option spent voice credits passed"));
  } else {
    logError(
      `At least one tally result failed the on-chain verification. Please check your Tally data at these indexes: ${failedSpentCredits.join(
        ", ",
      )}`,
    );
  }

  // verify tally result on-chain for each vote option
  const failedPerVOSpentCredits = await verifyTallyResults(
    tallyContract,
    tallyResults,
    voteOptionTreeDepth,
    newSpentVoiceCreditsCommitment,
    newPerVOSpentVoiceCreditsCommitment,
  );

  if (failedPerVOSpentCredits.length === 0) {
    logGreen(quiet, success("The on-chain verification of tally results passed"));
  } else {
    logError(
      `At least one spent voice credits entry in the tally results failed the on-chain verification. Please check your tally results at these indexes: ${failedPerVOSpentCredits.join(
        ", ",
      )}`,
    );
  }

  // verify subsidy result if subsidy file is provided
  if (subsidyEnabled && subsidyFile && subsidyContract !== undefined) {
    const onChainSubsidyCommitment = BigInt(await subsidyContract.subsidyCommitment());

    logYellow(quiet, info(`on-chain subsidy commitment: ${onChainSubsidyCommitment.toString(16)}`));

    // read the subsidy file
    if (!fs.existsSync(subsidyFile)) {
      logError(`There is no such file: ${subsidyFile}`);
    }

    const subsidyData = JSON.parse(fs.readFileSync(subsidyFile, { encoding: "utf8" })) as SubsidyData;

    // check the results commitment
    const validResultsSubsidyCommitment = subsidyData.newSubsidyCommitment.match(/0x[a-fA-F0-9]+/);

    if (!validResultsSubsidyCommitment) {
      logError("Invalid results commitment format");
    }

    if (subsidyData.results.subsidy.length !== numVoteOptions) {
      logError("Wrong number of vote options.");
    }

    // compute the new SubsidyCommitment
    const newSubsidyCommitment = genTreeCommitment(
      subsidyData.results.subsidy.map((x) => BigInt(x)),
      BigInt(subsidyData.results.salt),
      voteOptionTreeDepth,
    );

    if (onChainSubsidyCommitment !== newSubsidyCommitment) {
      logError("The on-chain subsidy commitment does not match.");
    }

    logGreen(quiet, success("The on-chain subsidy commitment matches."));
  }
};
