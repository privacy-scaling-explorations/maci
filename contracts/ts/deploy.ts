require('module-alias/register')
import * as ethers from 'ethers'
import * as argparse from 'argparse'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'maci-config'
import { genPubKey } from 'maci-crypto'
import { PubKey } from 'maci-domainobjs'
import { genAccounts, genTestAccounts } from './accounts'
const PoseidonT3 = require('../compiled/PoseidonT3.json')
const PoseidonT6 = require('../compiled/PoseidonT6.json')
const SignUpToken = require('../compiled/SignUpToken.json')
const SignUpTokenGatekeeper = require('../compiled/SignUpTokenGatekeeper.json')
const FreeForAllSignUpGatekeeper = require('../compiled/FreeForAllGatekeeper.json')
const InitialVoiceCreditProxy = require('../compiled/InitialVoiceCreditProxy.json')
const ConstantInitialVoiceCreditProxy = require('../compiled/ConstantInitialVoiceCreditProxy.json')
const BatchUpdateStateTreeVerifier = require('../compiled/BatchUpdateStateTreeVerifier.json')
const QuadVoteTallyVerifier = require('../compiled/QuadVoteTallyVerifier.json')
const MACI = require('../compiled/MACI.json')

const maciContractAbi = MACI.abi
const initialVoiceCreditProxyAbi = InitialVoiceCreditProxy.abi

const genProvider = (
    rpcUrl: string = config.get('chain.url'),
) => {

    return new ethers.providers.JsonRpcProvider(rpcUrl)
}

function link(bytecode: string, libraryName: string, libraryAddress: string): string {
    // https://github.com/ethers-io/ethers.js/issues/195#issuecomment-396350174
    const symbol = '__' + libraryName + '_'.repeat(40 - libraryName.length - 2)
    return bytecode.split(symbol).join(libraryAddress.toLowerCase().substr(2))
}

export class JSONRPCDeployer {

    provider: ethers.providers.Provider
    signer: ethers.Signer
    options: any

    constructor(privateKey: string, providerUrl: string, options?: any) {
        this.provider = new ethers.providers.JsonRpcProvider(providerUrl)
        this.signer = new ethers.Wallet(privateKey, this.provider)
        this.options = options
    }

    async deploy(artifact: any, libraries: any, ...args): Promise<ethers.Contract> {
        let bytecode = artifact.bytecode
        for (const libraryName in libraries) {
            bytecode = link(bytecode, libraryName, libraries[libraryName])
        }
        const factory = new ethers.ContractFactory(artifact.abi, bytecode, this.signer)
        return await factory.deploy(...args)
    }
}

class GanacheDeployer extends JSONRPCDeployer {

    constructor(privateKey: string, port: number, options?: any) {
        const url = `http://localhost:${port}/`
        super(privateKey, url, options)
    }
}

const genJsonRpcDeployer = (
    privateKey: string,
    url: string,
) => {

    return new JSONRPCDeployer(
        privateKey,
        url,
    )
}

const genDeployer = (
    privateKey: string,
) => {
    return new GanacheDeployer(
        privateKey,
        config.get('chain.ganache.port'),
        {
            gasLimit: 10000000,
        },
    )
}

const deployConstantInitialVoiceCreditProxy = async (
    deployer,
    amount: number,
    quiet = false
) => {
    log('Deploying InitialVoiceCreditProxy', quiet)
    return await deployer.deploy(ConstantInitialVoiceCreditProxy, {}, amount.toString())
}

const deploySignupToken = async (deployer) => {
    console.log('Deploying SignUpToken')
    return await deployer.deploy(SignUpToken, {})
}

const deploySignupTokenGatekeeper = async (
    deployer,
    signUpTokenAddress: string,
    quiet = false
) => {
    log('Deploying SignUpTokenGatekeeper', quiet)
    const signUpTokenGatekeeperContract = await deployer.deploy(
        SignUpTokenGatekeeper,
        {},
        signUpTokenAddress,
    )

    return signUpTokenGatekeeperContract
}

const deployFreeForAllSignUpGatekeeper = async (
    deployer,
    quiet = false
) => {
    log('Deploying FreeForAllSignUpGatekeeper', quiet)
    return await deployer.deploy(
        FreeForAllSignUpGatekeeper,
        {},
    )
}

const log = (msg: string, quiet: boolean) => {
    if (!quiet) {
        console.log(msg)
    }
}

const deployMaci = async (
    deployer,
    signUpGatekeeperAddress: string,
    initialVoiceCreditProxy: string,
    stateTreeDepth: number = config.maci.merkleTrees.stateTreeDepth,
    messageTreeDepth: number = config.maci.merkleTrees.messageTreeDepth,
    voteOptionTreeDepth: number = config.maci.merkleTrees.voteOptionTreeDepth,
    quadVoteTallyBatchSize: number = config.maci.quadVoteTallyBatchSize,
    messageBatchSize: number = config.maci.messageBatchSize,
    voteOptionsMaxLeafIndex: number = config.maci.voteOptionsMaxLeafIndex,
    signUpDurationInSeconds: number = config.maci.signUpDurationInSeconds,
    votingDurationInSeconds: number = config.maci.votingDurationInSeconds,
    coordinatorPubKey?: PubKey,
    quiet = false,
) => {
    log('Deploying Poseidon', quiet)

    if (!coordinatorPubKey) {
        const p = genPubKey(BigInt(config.maci.coordinatorPrivKey))
        coordinatorPubKey = new PubKey(p)
    }

    log('Deploying Poseidon T3', quiet)
    const PoseidonT3Contract = await deployer.deploy(PoseidonT3, {})
    log('Deploying Poseidon T6', quiet)
    const PoseidonT6Contract = await deployer.deploy(PoseidonT6, {})

    log('Deploying BatchUpdateStateTreeVerifier', quiet)
    const batchUstVerifierContract = await deployer.deploy(BatchUpdateStateTreeVerifier, {})

    log('Deploying QuadVoteTallyVerifier', quiet)
    const quadVoteTallyVerifierContract = await deployer.deploy(QuadVoteTallyVerifier, {})

    log('Deploying MACI', quiet)

    const maxUsers = (BigInt(2 ** stateTreeDepth) - BigInt(1)).toString()
    const maxMessages = (BigInt(2 ** messageTreeDepth) - BigInt(1)).toString()

    const maciContract = await deployer.deploy(
        MACI,
        {
            PoseidonT3: PoseidonT3Contract.address,
            PoseidonT6: PoseidonT6Contract.address
        },
        { stateTreeDepth, messageTreeDepth, voteOptionTreeDepth },
        {
            tallyBatchSize: quadVoteTallyBatchSize,
            messageBatchSize: messageBatchSize,
        },
        {
            maxUsers,
            maxMessages,
            maxVoteOptions: voteOptionsMaxLeafIndex,
        },
        signUpGatekeeperAddress,
        batchUstVerifierContract.address,
        quadVoteTallyVerifierContract.address,
        signUpDurationInSeconds,
        votingDurationInSeconds,
        initialVoiceCreditProxy,
        {
            x: coordinatorPubKey.rawPubKey[0].toString(),
            y: coordinatorPubKey.rawPubKey[1].toString(),
        },
    )

    return {
        batchUstVerifierContract,
        quadVoteTallyVerifierContract,
        PoseidonT3Contract,
        PoseidonT6Contract,
        maciContract,
    }
}

const main = async () => {
    let accounts
    if (config.env === 'local-dev' || config.env === 'test') {
        accounts = genTestAccounts(1)
    } else {
        accounts = genAccounts()
    }
    const admin = accounts[0]

    console.log('Using account', admin.address)

    const parser = new argparse.ArgumentParser({
        description: 'Deploy all contracts to an Ethereum network of your choice'
    })

    parser.addArgument(
        ['-o', '--output'],
        {
            help: 'The filepath to save the addresses of the deployed contracts',
            required: true
        }
    )

    parser.addArgument(
        ['-s', '--signUpToken'],
        {
            help: 'The address of the signup token (e.g. POAP)',
            required: false
        }
    )

    parser.addArgument(
        ['-p', '--initialVoiceCreditProxy'],
        {
            help: 'The address of the contract which provides the initial voice credit balance',
            required: false
        }
    )

    const args = parser.parseArgs()
    const outputAddressFile = args.output
    const signUpToken = args.signUpToken
    const initialVoiceCreditProxy = args.initialVoiceCreditProxy

    const deployer = genDeployer(admin.privateKey)

    let signUpTokenAddress
    if (signUpToken) {
        signUpTokenAddress = signUpToken
    } else {
        const signUpTokenContract = await deploySignupToken(deployer)
        signUpTokenAddress = signUpTokenContract.address
    }

    let initialVoiceCreditBalanceAddress
    if (initialVoiceCreditProxy) {
        initialVoiceCreditBalanceAddress = initialVoiceCreditProxy
    } else {
        const initialVoiceCreditProxyContract = await deployConstantInitialVoiceCreditProxy(
            deployer,
            config.maci.initialVoiceCreditBalance,
        )
        initialVoiceCreditBalanceAddress = initialVoiceCreditProxyContract.address
    }

    const signUpTokenGatekeeperContract = await deploySignupTokenGatekeeper(
        deployer,
        signUpTokenAddress,
    )

    const {
        PoseidonT3Contract,
        PoseidonT6Contract,
        maciContract,
        batchUstVerifierContract,
        quadVoteTallyVerifierContract,
    } = await deployMaci(
        deployer,
        signUpTokenGatekeeperContract.address,
        initialVoiceCreditBalanceAddress,
    )

    const addresses = {
        PoseidonT3: PoseidonT3Contract.address,
        PoseidonT6: PoseidonT6Contract.address,
        BatchUpdateStateTreeVerifier: batchUstVerifierContract.address,
        QuadraticVoteTallyVerifier: quadVoteTallyVerifierContract.address,
        MACI: maciContract.address,
    }

    const addressJsonPath = path.join(__dirname, '..', outputAddressFile)
    fs.writeFileSync(
        addressJsonPath,
        JSON.stringify(addresses),
    )

    console.log(addresses)
}

if (require.main === module) {
    try {
        main()
    } catch (err) {
        console.error(err)
    }
}

export {
    deployMaci,
    deploySignupToken,
    deploySignupTokenGatekeeper,
    deployConstantInitialVoiceCreditProxy,
    deployFreeForAllSignUpGatekeeper,
    genDeployer,
    genProvider,
    genJsonRpcDeployer,
    maciContractAbi,
    initialVoiceCreditProxyAbi,
}
