import { getDefaultSigner, parseArtifact } from "maci-contracts"
import { banner, contractExists, info, logError, logGreen, logYellow, readContractAddress, success, VerifyArgs } from "../utils/"
import { Contract } from "ethers"
import { existsSync, readFileSync } from "fs"
import { genTallyResultCommitment } from "maci-core"
import { hash2, hash3 } from "maci-crypto"

/**
 * Verify the results of a poll and optionally the subsidy results
 * @param param0 The arguments to the verify command
 */
export const verify = async ({
    quiet,
    pollId,
    maciAddress,
    tallyAddress,
    subsidyAddress,
    tallyFile,
    subsidyFile
}: VerifyArgs) => {
    if(!quiet) banner()
    const signer = await getDefaultSigner()

    // check existence of MACI, Tally and Subsidy contract addresses
    if (!readContractAddress("MACI") && !maciAddress) logError('MACI contract address is empty')
    if (!readContractAddress("Tally-"+pollId) && !tallyAddress) logError('Tally contract address is empty')
    if (!readContractAddress("Subsidy-"+pollId) && !subsidyAddress) logError('Subsidy contract address is empty')

    const maciContractAddress = maciAddress ? maciAddress : readContractAddress("MACI")
    const tallyContractAddress = tallyAddress ? tallyAddress : readContractAddress("Tally-"+pollId)
    const subsidyContractAddress = subsidyAddress ? subsidyAddress : readContractAddress("Subsidy-"+pollId)

    if (!(await contractExists(signer.provider, maciContractAddress))) {
        logError(`Error: there is no contract deployed at ${maciContractAddress}.`)
    }
    if (!(await contractExists(signer.provider, tallyContractAddress))) {
        logError(`Error: there is no contract deployed at ${tallyContractAddress}.`)
    }
    if (!(await contractExists(signer.provider, subsidyContractAddress))) {
        logError(`Error: there is no contract deployed at ${subsidyContractAddress}.`)
    }

    const maciContract = new Contract(
        maciContractAddress,
        parseArtifact('MACI')[0],
        signer
    )
    const pollAddr = await maciContract.polls(pollId)

    const pollContract = new Contract(
        pollAddr,
        parseArtifact('Poll')[0],
        signer
    )

    const tallyContract = new Contract(
        tallyContractAddress,
        parseArtifact('Tally')[0],
        signer
    )

    const subsidyContract = new Contract(
        subsidyContractAddress,
        parseArtifact('Subsidy')[0],
        signer
    )

    // verification 
    const onChainTallycomment = BigInt(await tallyContract.tallyCommitment())
    if (!quiet) logYellow(info(`on-chain tally commitment: ${onChainTallycomment.toString(16)}`))

    // read the tally file
    if (!existsSync(tallyFile)) logError(`Unable to open ${tallyFile}`)
    const tallyData = JSON.parse(readFileSync(tallyFile, { encoding: 'utf8' }))

    if (!quiet) logYellow(info(`tally file: ${tallyData}`))

    // check the results commitment
    const validResultsCommitment = tallyData.newTallyCommitment && tallyData.newTallyCommitment.match(/0x[a-fA-F0-9]+/) 
    if (!validResultsCommitment) logError('Invalid results commitment format')


    const treeDepths = await pollContract.treeDepths()
    const voteOptionTreeDepth = Number(treeDepths.voteOptionTreeDepth)
    const numVoteOptions = 5 ** voteOptionTreeDepth
    if (tallyData.results.tally.length != numVoteOptions) logError('Wrong number of vote options.')
    if (tallyData.perVOSpentVoiceCredits.tally.length != numVoteOptions) logError('Wrong number of vote options.')

    // verify that the results commitment matches the output of genTallyResultCommitment()

    // verify the results
    // compute newResultsCommitment
    const newResultsCommitment = genTallyResultCommitment(
        tallyData.results.tally.map((x: any) => BigInt(x)),
        tallyData.results.salt,
        voteOptionTreeDepth    
    )

    // compute newSpentVoiceCreditsCommitment
    const newSpentVoiceCreditsCommitment = hash2([
        BigInt(tallyData.totalSpentVoiceCredits.spent),
        BigInt(tallyData.totalSpentVoiceCredits.salt),
    ])

    // compute newPerVOSpentVoiceCreditsCommitment
    const newPerVOSpentVoiceCreditsCommitment = genTallyResultCommitment(
        tallyData.perVOSpentVoiceCredits.tally.map((x: any) => BigInt(x)),
        tallyData.perVOSpentVoiceCredits.salt,
        voteOptionTreeDepth
    )

    // compute newTallyCommitment
    const newTallyCommitment = hash3([
        newResultsCommitment,
        newSpentVoiceCreditsCommitment,
        newPerVOSpentVoiceCreditsCommitment,
    ])

    if (onChainTallycomment !== newTallyCommitment) logError('The on-chain tally commitment does not match.')
    if (!quiet) logGreen(success('The on-chain tally commitment matches.'))

    // verify subsidy result if subsidy file is provided
    if (subsidyFile) {
        const onChainSubsidyCommitment = BigInt(await subsidyContract.subsidyCommitment())
        if (!quiet) logYellow(info(`on-chain subsidy commitment: ${onChainSubsidyCommitment.toString(16)}`))

        // read the subsidy file
        if (!existsSync(subsidyFile)) logError(`There is no such file: ${subsidyFile}`)
        const subsidyData = JSON.parse(readFileSync(subsidyFile, { encoding: 'utf8' }))

        if (!quiet) logYellow(info(`subsidy file: ${subsidyData}`))

        // check the results commitment
        const validResultsCommitment = subsidyData.newSubsidyCommitment && subsidyData.newSubsidyCommitment.match(/0x[a-fA-F0-9]+/)
        if (!validResultsCommitment) logError('Invalid results commitment format')

        if (subsidyData.results.subsidy.length !== numVoteOptions) logError('Wrong number of vote options.')

        // compute the new SubsidyCommitment
        const newSubsidyCommitment = genTallyResultCommitment(
            subsidyData.results.subsidy.map((x: any) => BigInt(x)),
            subsidyData.results.salt,
            voteOptionTreeDepth
        )

        if (onChainSubsidyCommitment !== newSubsidyCommitment) logError('The on-chain subsidy commitment does not match.')

        if (!quiet) logGreen(success('The on-chain subsidy commitment matches.'))
    }
}