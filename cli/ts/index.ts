import { createCommand } from "commander"
import {
    genKeyPair,
    genMaciPubKey,
    airdrop,
    deployVkRegistryContract,
    deploy,
    showContracts,
    deployPoll,
    mergeMessages,
    publish,
    setVerifyingKeys,
    mergeSignups,
    timeTravel,
    signup,
    topup,
    verify,
    genProofs,
    fundWallet,
    proveOnChain
} from "./commands"
import { readFileSync } from "fs"
import { join } from "path"

const packagePath = join(__dirname, '..')
const { description, version, name } = JSON.parse(
    readFileSync(`${packagePath}/package.json`, "utf8")
)
const program = createCommand()
program.name(name).description(description).version(version)

program
    .command("create")
    .description("deploy the contracts")
    .option("-v, --vkRegistryAddress <vkRegistryAddress>", "the vk registry contract address")
    .option("-i, --initialVoiceCredits <initialVoiceCredits>", "the initial voice credits")
    .option("-p, --initialVoiceCreditsProxyAddress <initialVoiceCreditsProxyAddress>", "the initial voice credits proxy contract address")
    .option("-g", "--signupGatekeeperAddress <signupGatekeeperAddress>", "the signup gatekeeper contract address")
    .option("-q, --quiet", "whether to print values to the console")
    .action(async (cmdOptions) => await deploy({
        quiet: cmdOptions.quiet,
        vkRegistryAddress: cmdOptions.vkRegistryAddress,
        initialVoiceCredits: cmdOptions.initialVoiceCredits,
        initialVoiceCreditsProxyAddress: cmdOptions.initialVoiceCreditsProxyAddress,
        signupGatekeeperAddress: cmdOptions.signupGatekeeperAddress,
    }))
program
    .command("genMaciPubKey")
    .description("generate a new MACI public key")
    .requiredOption("-sk, --privkey <privkey>", "the private key")
    .action((cmdObj) => genMaciPubKey({ privkey: cmdObj.privkey }))
program
    .command("genMaciKeyPair")
    .description("generate a new MACI key pair")
    .action(genKeyPair)
program
    .command("airdrop")
    .description("airdrop topup credits to the coordinator")
    .requiredOption("-a, --amount <amount>", "the amount of topup")
    .option("-x, --contract <contract>", "the MACI contract address")
    .option("-o, --poll-id <pollId>", "poll id")
    .option("-t, --token-address <tokenAddress>", "the token address")
    .option("-q, --quiet", "whether to print values to the console")
    .action(async (cmdObj) => await airdrop({
        amount: cmdObj.amount,
        maciAddress: cmdObj.contract,
        pollId: cmdObj.pollId,
        contractAddress: cmdObj.tokenAddress,
        quiet: cmdObj.quiet,
    }))
program
    .command("deployVkRegistry")
    .description("deploy a new verification key registry contract")
    .option("-q, --quiet", "whether to print values to the console")
    .action(async (cmdObj) => await deployVkRegistryContract({ quiet: cmdObj.quiet }))
program
    .command("show")
    .description("show the deployed contract addresses")
    .action(showContracts)
program 
    .command("deployPoll")
    .description("deploy a new poll")
    .requiredOption("-t, --duration <pollDuration>", "the poll duration")
    .requiredOption("-g, --max-messages <maxMessages>", "the max messages")
    .requiredOption("-mv, --max-vote-options <maxVoteOptions>", "the max vote options")
    .requiredOption("-i, --int-state-tree-depth <intStateTreeDepth>", "the int state tree depth")
    .requiredOption("-b, --msg-batch-depth <messageTreeSubDepth>", "the message tree sub depth")
    .requiredOption("-m, --msg-tree-depth <messageTreeDepth>", "the message tree depth")
    .requiredOption("-v, --vote-option-tree-depth <voteOptionTreeDepth>", "the vote option tree depth")
    .requiredOption("-pk, --pubkey <coordinatorPubkey>", "the coordinator public key")
    .option("-x, --maci-address <maciAddress>", "the MACI contract address")
    .option("-q, --quiet", "whether to print values to the console")
    .action(async (cmdObj) => await deployPoll({
        pollDuration: cmdObj.duration,
        maxMessages: cmdObj.maxMessages,
        maxVoteOptions: cmdObj.maxVoteOptions,
        intStateTreeDepth: cmdObj.intStateTreeDepth,
        messageTreeSubDepth: cmdObj.msgBatchDepth,
        messageTreeDepth: cmdObj.msgTreeDepth,
        voteOptionTreeDepth: cmdObj.voteOptionTreeDepth,
        coordinatorPubkey: cmdObj.pubkey,
        maciAddress: cmdObj.maciAddress,
        quiet: cmdObj.quiet
    }))
program
    .command("setVerifyingKeys")
    .description("set the verifying keys")
    .requiredOption("-s, --state-tree-depth <stateTreeDepth>", "the state tree depth")
    .requiredOption("-i, --int-state-tree-depth <intStateTreeDepth>", "the intermediate state tree depth")
    .requiredOption("-m, --msg-tree-depth <messageTreeDepth>", "the message tree depth")
    .requiredOption("-v, --vote-option-tree-depth <voteOptionTreeDepth>", "the vote option tree depth")
    .requiredOption("-b, --msg-batch-depth <messageBatchDepth>", "the message batch depth")
    .requiredOption("-p, --process-messages-zkey <processMessagesZkeyPath>", "the process messages zkey path")
    .requiredOption("-t, --tally-votes-zkey <tallyVotesZkeyPath>", "the tally votes zkey path")
    .option("-k, --vk-registry <vkRegistry>", "the vk registry contract address")
    .option("-q, --quiet", "whether to print values to the console")
    .option("-ss, --subsidy-zkey <subsidyZkeyPath>", "the subsidy zkey path")
    .action(async (cmdObj) => await setVerifyingKeys({
        stateTreeDepth: cmdObj.stateTreeDepth,
        intStateTreeDepth: cmdObj.intStateTreeDepth,
        messageTreeDepth: cmdObj.msgTreeDepth,
        voteOptionTreeDepth: cmdObj.voteOptionTreeDepth,
        messageBatchDepth: cmdObj.msgBatchDepth,
        processMessagesZkeyPath: cmdObj.processMessagesZkey,
        tallyVotesZkeyPath: cmdObj.tallyVotesZkey,
        vkRegistry: cmdObj.vkRegistry,
        subsidyZkeyPath: cmdObj.subsidyZkey,
        quiet: cmdObj.quiet,
    }))
program
    .command("publish")
    .description("publish a new message to a MACI Poll contract")
    .requiredOption("-p, --pubkey <pubkey>", "the MACI public key which should replace the user's public key in the state tree")
    .option("-x, --contract <contract>", "the MACI contract address")
    .option("-sk, --privkey <privkey>", "your serialized MACI private key")
    .requiredOption("-i, --state-index <stateIndex>", "the user's state index")
    .requiredOption("-v, --vote-option-index <voteOptionIndex>", "the vote option index")
    .requiredOption("-n, --nonce <nonce>", "the message nonce")
    .option("-s, --salt <salt>", "the message salt")
    .requiredOption("-o, --poll-id <pollId>", "the poll id")
    .requiredOption("-w, --new-vote-weight <newVoteWeight>", "the new vote weight")
    .option("-q, --quiet", "whether to print values to the console")
    .action(async (cmdObj) => await publish({
        pubkey: cmdObj.pubkey,
        maciContractAddress: cmdObj.contract,
        privateKey: cmdObj.privkey,
        stateIndex: cmdObj.stateIndex,
        voteOptionIndex: cmdObj.voteOptionIndex,
        nonce: cmdObj.nonce,
        salt: cmdObj.salt,
        pollId: cmdObj.pollId,
        newVoteWeight: cmdObj.newVoteWeight,
        quiet: cmdObj.quiet
    }))
program
    .command("mergeMessages")
    .description("merge the message accumulator queue")
    .option("-q, --quiet", "whether to print values to the console")
    .option("-x, --maci-contract-address <maciContractAddress>", "the MACI contract address")
    .requiredOption("-o, --poll-id <pollId>", "the poll id")
    .option("-n, --num-queue-ops <numQueueOps>", "the number of queue operations")
    .action(async (cmdObj) => await mergeMessages({
        quiet: cmdObj.quiet,
        maciContractAddress: cmdObj.maciContractAddress,
        pollId: cmdObj.pollId,
        numQueueOps: cmdObj.numQueueOps,
    }))
program
    .command("mergeSignups")
    .description("merge the signups accumulator queue")
    .option("-q, --quiet", "whether to print values to the console")
    .option("-x, --maci-contract-address <maciContractAddress>", "the MACI contract address")
    .requiredOption("-o, --poll-id <pollId>", "the poll id")
    .option("-n, --num-queue-ops <numQueueOps>", "the number of queue operations")
    .action(async (cmdObj) => await mergeSignups({
        quiet: cmdObj.quiet,
        maciContractAddress: cmdObj.maciContractAddress,
        pollId: cmdObj.pollId,
        numQueueOps: cmdObj.numQueueOps,
    }))
program
    .command("timeTravel")
    .description("fast-forward the time (only works for local hardhat testing")
    .requiredOption("-s, --seconds <seconds>", "the number of seconds to fast-forward")
    .option("-p, --provider <provider>", "the provider")
    .option("-q, --quiet", "whether to print values to the console")
    .action(async (cmdObj) => await timeTravel({
        quiet: cmdObj.quiet,
        provider: cmdObj.provider,
        seconds: cmdObj.seconds,
    }))
program 
    .command("signup")
    .description("Sign up to a MACI contract")
    .requiredOption("-p, --pubkey <maciPubKey>", "the MACI public key")
    .option("-x, --maci-address <maciAddress>", "the MACI contract address")
    .option("-s, --sg-data <sgData>", "the signup gateway data")
    .option("-i, --ivcp-data <ivcpData>", "the initial voice credit proxy data")
    .option("-q, --quiet", "whether to print values to the console")
    .action(async (cmdObj) => await signup({
        maciPubKey: cmdObj.pubkey,
        maciAddress: cmdObj.maciAddress,
        sgDataArg: cmdObj.sgData,
        ivcpDataArg: cmdObj.ivcpData,
        quiet: cmdObj.quiet,
    }))
program 
    .command("topup")
    .description("Top up an account with voice credits")
    .requiredOption("-a, --amount <amount>", "the amount of topup")
    .option("-x, --maci-address <maciAddress>", "the MACI contract address")
    .requiredOption("-i, --state-index <stateIndex>", "state leaf index")
    .requiredOption("-o, --poll-id <pollId>", "poll id")
    .option("-q, --quiet", "whether to print values to the console")
    .action(async (cmdObj) => await topup({
        amount: cmdObj.amount,
        maciAddress: cmdObj.maciAddress,
        stateIndex: cmdObj.stateIndex,
        pollId: cmdObj.pollId,
        quiet: cmdObj.quiet,
    }))
program 
    .command("fundWallet")
    .description("Fund a wallet with Ether")
    .requiredOption("-a, --amount <amount>", "the amount of Ether")
    .requiredOption("-w, --address <address>", "the address to fund")
    .option("-q, --quiet", "whether to print values to the console")
    .action(async (cmdObj) => await fundWallet({
        amount: cmdObj.amount,
        address: cmdObj.address,
        quiet: cmdObj.quiet,
    }))
program
    .command("verify")
    .description("verify the results of a poll and optionally the subsidy results")
    .requiredOption("-o, --poll-id <pollId>", "the poll id")
    .requiredOption("-t, --tally-file <tallyFile>", "the tally file")
    .option("-s, --subsidy-file <subsidyFile>", "the subsidy file")
    .option("-x, --contract <contract>", "the MACI contract address")
    .option("-tc, --tally-contract <tallyContract>", "the tally contract address")
    .option("-sc, --subsidy-contract <subsidyContract>", "the subsidy contract address")
    .option("-q, --quiet", "whether to print values to the console")
    .action(async (cmdObj) => await verify({
        pollId: cmdObj.pollId,
        tallyFile: cmdObj.tallyFile,
        subsidyFile: cmdObj.subsidyFile,
        maciAddress: cmdObj.contract,
        tallyAddress: cmdObj.tallyContract,
        subsidyAddress: cmdObj.subsidyContract,
        quiet: cmdObj.quiet
    }))
program
    .command("genProofs")
    .description("generate the proofs for a poll")
    .option("-sk, --privkey <privkey>", "your serialized MACI private key")
    .option("-x, --contract <contract>", "the MACI contract address")
    .requiredOption("-o, --poll-id <pollId>", "the poll id")
    .option("-t, --tally-file <tallyFile>", "the tally file")
    .option("-s, --subsidy-file <subsidyFile>", "the subsidy file")
    .requiredOption("-r, --rapidsnark <rapidsnark>", "the path to the rapidsnark binary")
    .requiredOption("-wp, --process-witnessgen <processWitnessgen>", "the path to the process witness generation binary")
    .requiredOption("-wt, --tally-witnessgen <tallyWitnessgen>", "the path to the tally witness generation binary")
    .option("-ws, --subsidy-witnessgen <subsidyWitnessgen>", "the path to the subsidy witness generation binary")
    .requiredOption("-zp, --process-zkey <processZkey>", "the path to the process zkey")
    .requiredOption("-zt, --tally-zkey <tallyZkey>", "the path to the tally zkey")
    .option("-zs, --subsidy-zkey <subsidyZkey>", "the path to the subsidy zkey")
    .option("-q, --quiet", "whether to print values to the console")
    .requiredOption("-f, --output <outputDir>", "the output directory for proofs")
    .option('-tx, --transaction-hash <transactionHash>', 'transaction hash of MACI contract creation')
    .action(async (cmdObj) => {
        await genProofs({
            coordinatorPrivKey: cmdObj.privkey,
            maciAddress: cmdObj.contract,
            pollId: cmdObj.pollId,
            tallyFile: cmdObj.tallyFile,
            subsidyFile: cmdObj.subsidyFile,
            rapidsnark: cmdObj.rapidsnark,
            processWitgen: cmdObj.processWitnessgen,
            tallyWitgen: cmdObj.tallyWitnessgen,
            subsidyWitgen: cmdObj.subsidyWitnessgen,
            processZkey: cmdObj.processZkey,
            tallyZkey: cmdObj.tallyZkey,
            subsidyZkey: cmdObj.subsidyZkey,
            quiet: cmdObj.quiet,
            outputDir: cmdObj.output,
            transactionHash: cmdObj.transactionHash,
        })
    })
program 
    .command("proveOnChain")
    .description("prove the results of a poll on chain")
    .requiredOption("-o, --poll-id <pollId>", "the poll id")
    .option("-q, --quiet", "whether to print values to the console")
    .option("-x, --contract <contract>", "the MACI contract address")
    .option("-t, --tally-contract <tallyContract>", "the tally contract address")
    .option("-s, --subsidy-contract <subsidyContract>", "the subsidy contract address")
    .requiredOption("-f, --proof-dir <proofDir>", "the proof output directory from the genProofs subcommand")
    .action(async (cmdObj) => await proveOnChain({
        pollId: cmdObj.pollId,
        maciAddress: cmdObj.contract,
        tallyAddress: cmdObj.tallyContract,
        subsidyAddress: cmdObj.subsidyContract,
        proofDir: cmdObj.proofDir,
        quiet: cmdObj.quiet
    }))
program.parseAsync(process.argv)
