require('module-alias/register')
import * as ethers from 'ethers'
import * as argparse from 'argparse' 
import * as fs from 'fs' 
import * as path from 'path'
import * as etherlime from 'etherlime-lib'
import { config } from 'maci-config'
import { genPubKey, bigInt } from 'maci-crypto'
import { genAccounts, genTestAccounts } from './accounts'
const MiMC = require('@maci-contracts/compiled/MiMC.json')
const Hasher = require('@maci-contracts/compiled/Hasher.json')
const SignUpToken = require('@maci-contracts/compiled/SignUpToken.json')
const SignUpTokenGatekeeper = require('@maci-contracts/compiled/SignUpTokenGatekeeper.json')
const ConstantInitialVoiceCreditProxy = require('@maci-contracts/compiled/ConstantInitialVoiceCreditProxy.json')
const BatchUpdateStateTreeVerifier = require('@maci-contracts/compiled/BatchUpdateStateTreeVerifier.json')
const QuadVoteTallyVerifier = require('@maci-contracts/compiled/QuadVoteTallyVerifier.json')
const MACI = require('@maci-contracts/compiled/MACI.json')

const coordinatorPublicKey = genPubKey(bigInt(config.maci.coordinatorPrivKey))

const genProvider = () => {
    const rpcUrl = config.get('chain.url')
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

    return provider
}

const genDeployer = (
    privateKey: string,
) => {
    return new etherlime.EtherlimeGanacheDeployer(
        privateKey,
        config.get('chain.ganache.port'),
        {
            gasLimit: 10000000,
        },
    )
}

const deployInitialVoiceCreditProxy = async (deployer, amount: number) => {
    console.log('Deploying InitialVoiceCreditProxy')
    return await deployer.deploy(ConstantInitialVoiceCreditProxy, {}, amount)
}

const deploySignupToken = async (deployer) => {
    console.log('Deploying SignUpToken')
    return await deployer.deploy(SignUpToken, {})
}

const deploySignupTokenGatekeeper = async (
    deployer,
    signUpTokenAddress: string,
) => {
    console.log('Deploying SignUpTokenGatekeeper')
    const signUpTokenGatekeeperContract = await deployer.deploy(
        SignUpTokenGatekeeper,
        {},
        signUpTokenAddress,
    )

    return signUpTokenGatekeeperContract
}

const deployMaci = async (
    deployer,
    signUpTokenGatekeeperAddress: string,
    initialVoiceCreditProxy: string,
) => {
    console.log('Deploying MiMC')
    const mimcContract = await deployer.deploy(MiMC, {})

    console.log('Deploying BatchUpdateStateTreeVerifier')
    const batchUstVerifierContract = await deployer.deploy(BatchUpdateStateTreeVerifier, {})

    console.log('Deploying QuadVoteTallyVerifier')
    const quadVoteTallyVerifierContract = await deployer.deploy(QuadVoteTallyVerifier, {})

    console.log('Deploying MACI')
    const maciContract = await deployer.deploy(
        MACI,
        { MiMC: mimcContract.contractAddress },
        { 
            stateTreeDepth: config.maci.merkleTrees.stateTreeDepth,
            messageTreeDepth: config.maci.merkleTrees.messageTreeDepth,
        },
        2 ** config.maci.merkleTrees.intermediateStateTreeDepth,
        config.maci.messageBatchSize,
        config.maci.voteOptionsMaxLeafIndex,
        signUpTokenGatekeeperAddress,
        batchUstVerifierContract.contractAddress,
        quadVoteTallyVerifierContract.contractAddress,
        config.maci.signUpDurationInSeconds.toString(),
        config.maci.votingDurationInSeconds.toString(),
        initialVoiceCreditProxy,
        {
            x: coordinatorPublicKey[0].toString(),
            y: coordinatorPublicKey[1].toString(),
        },
    )

    return {
        batchUstVerifierContract,
        quadVoteTallyVerifierContract,
        mimcContract,
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
    let signUpTokenGatekeeperAddress
    if (signUpToken) {
        signUpTokenAddress = signUpToken
    } else {
        const signUpTokenContract = await deploySignupToken(deployer)
        signUpTokenAddress = signUpTokenContract.contractAddress
    }

    let initialVoiceCreditBalanceAddress
    if (initialVoiceCreditProxy) {
        initialVoiceCreditBalanceAddress = initialVoiceCreditProxy
    } else {
        const initialVoiceCreditProxyContract = await deployInitialVoiceCreditProxy(
            deployer,
            config.maci.initialVoiceCreditBalance,
        )
        initialVoiceCreditBalanceAddress = initialVoiceCreditProxyContract.contractAddress
    }

    const signUpTokenGatekeeperContract = await deploySignupTokenGatekeeper(
        deployer,
        signUpTokenAddress,
    )

    const {
        mimcContract,
        maciContract,
        batchUstVerifierContract,
        quadVoteTallyVerifierContract,
    } = await deployMaci(
        deployer,
        signUpTokenGatekeeperContract.contractAddress,
        initialVoiceCreditBalanceAddress,
    )

    const addresses = {
        MiMC: mimcContract.contractAddress,
        BatchUpdateStateTreeVerifier: batchUstVerifierContract.contractAddress,
        QuadraticVoteTallyVerifier: quadVoteTallyVerifierContract.contractAddress,
        MACI: maciContract.contractAddress,
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
    deployInitialVoiceCreditProxy,
    genDeployer,
    genProvider,
}
