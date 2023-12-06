import { getDefaultSigner, parseArtifact } from "maci-contracts";
import { banner, contractExists, info, logError, logGreen, logYellow, readContractAddress, success } from "../utils/";
import { Contract } from "ethers";
import { existsSync, readFileSync } from "fs";
import { hash2, hash3, genTreeCommitment } from "maci-crypto";
import { TallyData } from "../utils/interfaces";

/**
 * Verify the results of a poll and optionally the subsidy results
 * @param pollId - the id of the poll
 * @param tallyFile - the path to the tally file
 * @param maciAddress - the address of the MACI contract
 * @param tallyAddress - the address of the Tally contract
 * @param subsidyAddress - the address of the Subsidy contract
 * @param subsidyFile - the path to the subsidy file
 * @param quiet - whether to log the output
 */
export const verify = async (
  pollId: string,
  tallyFile?: string,
  tallyFileData?: TallyData,
  maciAddress?: string,
  tallyAddress?: string,
  subsidyAddress?: string,
  subsidyFile?: string,
  quiet = true,
) => {
  banner(quiet);
  const signer = await getDefaultSigner();

  // check existence of MACI, Tally and Subsidy contract addresses
  if (!readContractAddress("MACI") && !maciAddress) logError("MACI contract address is empty");
  if (!readContractAddress("Tally-" + pollId) && !tallyAddress) logError("Tally contract address is empty");
  if (!readContractAddress("Subsidy-" + pollId) && !subsidyAddress) logError("Subsidy contract address is empty");

  const maciContractAddress = maciAddress ? maciAddress : readContractAddress("MACI");
  const tallyContractAddress = tallyAddress ? tallyAddress : readContractAddress("Tally-" + pollId);
  const subsidyContractAddress = subsidyAddress ? subsidyAddress : readContractAddress("Subsidy-" + pollId);

  if (!(await contractExists(signer.provider, maciContractAddress))) {
    logError(`Error: there is no contract deployed at ${maciContractAddress}.`);
  }
  if (!(await contractExists(signer.provider, tallyContractAddress))) {
    logError(`Error: there is no contract deployed at ${tallyContractAddress}.`);
  }
  if (!(await contractExists(signer.provider, subsidyContractAddress))) {
    logError(`Error: there is no contract deployed at ${subsidyContractAddress}.`);
  }

  const maciContract = new Contract(maciContractAddress, parseArtifact("MACI")[0], signer);
  const pollAddr = await maciContract.polls(pollId);

  const pollContract = new Contract(pollAddr, parseArtifact("Poll")[0], signer);

  const tallyContract = new Contract(tallyContractAddress, parseArtifact("Tally")[0], signer);

  const subsidyContract = new Contract(subsidyContractAddress, parseArtifact("Subsidy")[0], signer);

  // verification
  const onChainTallycomment = BigInt(await tallyContract.tallyCommitment());

  logYellow(quiet, info(`on-chain tally commitment: ${onChainTallycomment.toString(16)}`));

  // ensure we have either tally data or tally file
  if (!tallyFileData && !tallyFile) logError("No tally data or tally file provided.");
  // if we have the data as param, then use that
  let tallyData: TallyData;
  if (tallyFileData) {
    tallyData = tallyFileData;
  } else {
    // read the tally file
    if (!existsSync(tallyFile)) logError(`Unable to open ${tallyFile}`);
    tallyData = JSON.parse(readFileSync(tallyFile, { encoding: "utf8" }));
  }

  // check the results commitment
  const validResultsCommitment = tallyData.newTallyCommitment && tallyData.newTallyCommitment.match(/0x[a-fA-F0-9]+/);
  if (!validResultsCommitment) logError("Invalid results commitment format");

  const treeDepths = await pollContract.treeDepths();
  const voteOptionTreeDepth = Number(treeDepths.voteOptionTreeDepth);
  const numVoteOptions = 5 ** voteOptionTreeDepth;
  if (tallyData.results.tally.length != numVoteOptions) logError("Wrong number of vote options.");
  if (tallyData.perVOSpentVoiceCredits.tally.length != numVoteOptions) logError("Wrong number of vote options.");

  // verify that the results commitment matches the output of genTreeCommitment()

  // verify the results
  // compute newResultsCommitment
  const newResultsCommitment = genTreeCommitment(
    tallyData.results.tally.map((x: any) => BigInt(x)),
    BigInt(tallyData.results.salt),
    voteOptionTreeDepth,
  );

  // compute newSpentVoiceCreditsCommitment
  const newSpentVoiceCreditsCommitment = hash2([
    BigInt(tallyData.totalSpentVoiceCredits.spent),
    BigInt(tallyData.totalSpentVoiceCredits.salt),
  ]);

  // compute newPerVOSpentVoiceCreditsCommitment
  const newPerVOSpentVoiceCreditsCommitment = genTreeCommitment(
    tallyData.perVOSpentVoiceCredits.tally.map((x: any) => BigInt(x)),
    BigInt(tallyData.perVOSpentVoiceCredits.salt),
    voteOptionTreeDepth,
  );

  // compute newTallyCommitment
  const newTallyCommitment = hash3([
    newResultsCommitment,
    newSpentVoiceCreditsCommitment,
    newPerVOSpentVoiceCreditsCommitment,
  ]);

  if (onChainTallycomment !== newTallyCommitment) logError("The on-chain tally commitment does not match.");
  logGreen(quiet, success("The on-chain tally commitment matches."));

  // verify subsidy result if subsidy file is provided
  if (subsidyFile) {
    const onChainSubsidyCommitment = BigInt(await subsidyContract.subsidyCommitment());

    logYellow(quiet, info(`on-chain subsidy commitment: ${onChainSubsidyCommitment.toString(16)}`));

    // read the subsidy file
    if (!existsSync(subsidyFile)) logError(`There is no such file: ${subsidyFile}`);
    const subsidyData = JSON.parse(readFileSync(subsidyFile, { encoding: "utf8" }));

    logYellow(quiet, info(`subsidy file: ${subsidyData}`));

    // check the results commitment
    const validResultsCommitment =
      subsidyData.newSubsidyCommitment && subsidyData.newSubsidyCommitment.match(/0x[a-fA-F0-9]+/);
    if (!validResultsCommitment) logError("Invalid results commitment format");

    if (subsidyData.results.subsidy.length !== numVoteOptions) logError("Wrong number of vote options.");

    // compute the new SubsidyCommitment
    const newSubsidyCommitment = genTreeCommitment(
      subsidyData.results.subsidy.map((x: any) => BigInt(x)),
      subsidyData.results.salt,
      voteOptionTreeDepth,
    );

    if (onChainSubsidyCommitment !== newSubsidyCommitment) logError("The on-chain subsidy commitment does not match.");

    logGreen(quiet, success("The on-chain subsidy commitment matches."));
  }
};
