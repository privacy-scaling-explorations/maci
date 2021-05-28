import * as fs from 'fs'
import * as path from 'path'
import * as ethers from 'ethers'
import * as shell from 'shelljs'
import * as argparse from 'argparse'
import { config } from 'maci-config'
import { genPubKey } from 'maci-crypto'
import { PubKey } from 'maci-domainobjs'
import { genAccounts, genTestAccounts } from './accounts'

const abiDir = path.join(__dirname, '..', 'compiled')
const solDir = path.join(__dirname, '..', 'sol')
const loadBin = (filename: string) => {
    return fs.readFileSync(path.join(abiDir, filename)).toString()
}

const loadAbi = (filename: string) => {
    return JSON.parse(fs.readFileSync(path.join(abiDir, filename)).toString())
}

const loadAB = (contractName: string) => {
    const abi = loadAbi(contractName + '.abi')
    const bin = loadBin(contractName + '.bin')

    return [ abi, bin ]
}


const [ SignupTokenAbi, SignupTokenBin ] = loadAB('SignUpToken')
const [ SignUpTokenGatekeeperAbi, SignUpTokenGatekeeperBin ] = loadAB('SignUpTokenGatekeeper')
const [ ConstantInitialVoiceCreditProxyAbi, ConstantInitialVoiceCreditProxyBin ]
    = loadAB('ConstantInitialVoiceCreditProxy')
const [ UserDefinedInitialVoiceCreditProxyAbi, UserDefinedInitialVoiceCreditProxyBin ]
    = loadAB('UserDefinedInitialVoiceCreditProxy')
const [ FreeForAllSignUpGatekeeperAbi, FreeForAllSignUpGatekeeperBin ]
    = loadAB('FreeForAllGatekeeper')
const InitialVoiceCreditProxyAbi = loadAbi('InitialVoiceCreditProxy.abi')

const PoseidonT3 = require('../compiled/PoseidonT3.json')
const PoseidonT6 = require('../compiled/PoseidonT6.json')

const maciContractAbi = loadAbi('MACI.abi')
const initialVoiceCreditProxyAbi = InitialVoiceCreditProxyAbi

const linkPoseidonContracts = (
    solFilesToLink: string[],
    poseidonT3Address,
    poseidonT6Address,
) => {
    let inputFiles = ''
    for (const f of solFilesToLink) {
        inputFiles += `${solDir}/${f} `
    }

    const d = path.join(__dirname, '..')
    const maciSolPath = path.join(d, 'sol')
    const ozSolPath = path.join(d, 'node_modules', '@openzeppelin')

    const poseidonPath = path.join(__dirname, '..', 'sol', 'Poseidon.sol')
    const solcPath = path.join(__dirname, '..', 'solc')
    const linkCmd = `${solcPath}`
        + ` @openzeppelin/=${ozSolPath}/`
        + ` -o ${abiDir} ${inputFiles} --overwrite --bin`
        + ` --allow-paths ${maciSolPath}/,${ozSolPath}`
        + ` --libraries ${poseidonPath}:PoseidonT3:${poseidonT3Address}`
        + ` --libraries ${poseidonPath}:PoseidonT6:${poseidonT6Address}`

    shell.exec(linkCmd)
}

const genProvider = (
    rpcUrl: string = config.get('chain.url'),
) => {

    return new ethers.providers.JsonRpcProvider(rpcUrl)
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

    async deploy(abi: any, bytecode: any, ...args): Promise<ethers.Contract> {
        const factory = new ethers.ContractFactory(abi, bytecode, this.signer)
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

const deployUserDefinedInitialVoiceCreditProxy = async (
    deployer,
    quiet = false
) => {
    log('Deploying UserDefinedInitialVoiceCreditProxy', quiet)
    return await deployer.deploy(
        UserDefinedInitialVoiceCreditProxyAbi,
        UserDefinedInitialVoiceCreditProxyBin,
    )
}

const deployConstantInitialVoiceCreditProxy = async (
    deployer,
    amount: number,
    quiet = false
) => {
    log('Deploying InitialVoiceCreditProxy', quiet)
    return await deployer.deploy(
        ConstantInitialVoiceCreditProxyAbi,
        ConstantInitialVoiceCreditProxyBin,
        amount.toString(),
    )
}

const deploySignupToken = async (deployer) => {
    console.log('Deploying SignUpToken')
    return await deployer.deploy(
        SignupTokenAbi,
        SignupTokenBin,
    )
}

const deploySignupTokenGatekeeper = async (
    deployer,
    signUpTokenAddress: string,
    quiet = false
) => {
    log('Deploying SignUpTokenGatekeeper', quiet)
    const signUpTokenGatekeeperContract = await deployer.deploy(
        SignUpTokenGatekeeperAbi,
        SignUpTokenGatekeeperBin,
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
        FreeForAllSignUpGatekeeperAbi,
        FreeForAllSignUpGatekeeperBin,
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
    configType = 'test',
    quiet = false,
) => {
    log('Deploying Poseidon', quiet)

    if (!coordinatorPubKey) {
        const p = genPubKey(BigInt(config.maci.coordinatorPrivKey))
        coordinatorPubKey = new PubKey(p)
    }

    log('Deploying Poseidon T3', quiet)
    const PoseidonT3Contract = await deployer.deploy(
        PoseidonT3.abi,
        PoseidonT3.bytecode,
    )
    await PoseidonT3Contract.deployTransaction.wait()

    log('Deploying Poseidon T6', quiet)
    const PoseidonT6Contract = await deployer.deploy(
        PoseidonT6.abi,
        PoseidonT6.bytecode,
    )
    await PoseidonT6Contract.deployTransaction.wait()

    let batchUstVerifierContract
    let quadVoteTallyVerifierContract
    if (configType === 'test') {
        log('Deploying BatchUpdateStateTreeVerifier', quiet)
        batchUstVerifierContract = await deployer.deploy(
            ...loadAB('BatchUpdateStateTreeVerifier'),
        )
        await batchUstVerifierContract.deployTransaction.wait()

        log('Deploying QuadVoteTallyVerifier', quiet)
        quadVoteTallyVerifierContract = await deployer.deploy(
            ...loadAB('QuadVoteTallyVerifier'),
        )
        await quadVoteTallyVerifierContract.deployTransaction.wait()

    } else if (configType === 'prod-small') {
        log('Deploying BatchUpdateStateTreeVerifier', quiet)
        batchUstVerifierContract = await deployer.deploy(
            ...loadAB('BatchUpdateStateTreeVerifierSmall'),
        )
        await batchUstVerifierContract.deployTransaction.wait()

        log('Deploying QuadVoteTallyVerifier', quiet)
        quadVoteTallyVerifierContract = await deployer.deploy(
            ...loadAB('QuadVoteTallyVerifierSmall'),
        )
        await quadVoteTallyVerifierContract.deployTransaction.wait()
    } else if (configType === 'prod-medium') {
        log('Deploying BatchUpdateStateTreeVerifier', quiet)
        batchUstVerifierContract = await deployer.deploy(
            ...loadAB('BatchUpdateStateTreeVerifierMedium'),
        )
        await batchUstVerifierContract.deployTransaction.wait()

        log('Deploying QuadVoteTallyVerifier', quiet)
        quadVoteTallyVerifierContract = await deployer.deploy(
            ...loadAB('QuadVoteTallyVerifierMedium'),
        )
        await quadVoteTallyVerifierContract.deployTransaction.wait()
    } else if (configType === 'prod-large') {
        log('Deploying BatchUpdateStateTreeVerifier', quiet)
        batchUstVerifierContract = await deployer.deploy(
            ...loadAB('BatchUpdateStateTreeVerifierLarge'),
        )
        await batchUstVerifierContract.deployTransaction.wait()

        log('Deploying QuadVoteTallyVerifier', quiet)
        quadVoteTallyVerifierContract = await deployer.deploy(
            ...loadAB('QuadVoteTallyVerifierLarge'),
        )
        await quadVoteTallyVerifierContract.deployTransaction.wait()
    } else if (configType === 'prod-32') {
        log('Deploying BatchUpdateStateTreeVerifier', quiet)
        batchUstVerifierContract = await deployer.deploy(
            ...loadAB('BatchUpdateStateTreeVerifier32'),
        )
        await batchUstVerifierContract.deployTransaction.wait()

        log('Deploying QuadVoteTallyVerifier', quiet)
        quadVoteTallyVerifierContract = await deployer.deploy(
            ...loadAB('QuadVoteTallyVerifier32'),
        )
        await quadVoteTallyVerifierContract.deployTransaction.wait()
    }


    log('Deploying MACI', quiet)

    const maxUsers = (BigInt(2 ** stateTreeDepth) - BigInt(1)).toString()
    const maxMessages = (BigInt(2 ** messageTreeDepth) - BigInt(1)).toString()

    // Link Poseidon contracts to MACI
    linkPoseidonContracts(['MACI.sol'], PoseidonT3Contract.address, PoseidonT6Contract.address)

    const [ MACIAbi, MACIBin ] = loadAB('MACI')

    const maciContract = await deployer.deploy(
        MACIAbi,
        MACIBin,
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
        deployer.signer.address,
    )
    await maciContract.deployTransaction.wait()

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
    deployUserDefinedInitialVoiceCreditProxy,
    deployFreeForAllSignUpGatekeeper,
    genDeployer,
    genProvider,
    genJsonRpcDeployer,
    maciContractAbi,
    initialVoiceCreditProxyAbi,
    abiDir,
    solDir,
    loadAB,
    loadAbi,
    loadBin,
    linkPoseidonContracts,
}
