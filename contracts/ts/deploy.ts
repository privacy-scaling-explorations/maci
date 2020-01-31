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

const BatchUpdateStateTreeVerifier = require('@maci-contracts/compiled/BatchUpdateStateTreeVerifier.json')
const MerkleTree = require('@maci-contracts/compiled/MerkleTree.json')
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
            gasLimit: 8800000,
        },
    )
}

const deploySignupToken = async (deployer) => {
    console.log('Deploying SignUpToken')
    const signUpTokenContract = await deployer.deploy(SignUpToken, {})

    return signUpTokenContract
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
) => {
    console.log('Deploying MiMC')
    const mimcContract = await deployer.deploy(MiMC, {})

    console.log('Deploying BatchUpdateStateTreeVerifier')
    const batchUpdateStateTreeVerifierContract = await deployer.deploy(BatchUpdateStateTreeVerifier, {})

    console.log('Deploying MACI')
    const maciContract = await deployer.deploy(
        MACI,
        { CircomLib: mimcContract.contractAddress },
        config.merkleTrees.messageTreeDepth,
        config.merkleTrees.stateTreeDepth,
        config.merkleTrees.voteOptionTreeDepth,
        batchUpdateStateTreeVerifierContract.contractAddress,
        signUpTokenGatekeeperAddress,
        config.maci.signupDurationInSeconds.toString(),
        config.maci.initialVoiceCreditBalance,
        {
            x: coordinatorPublicKey[0].toString(),
            y: coordinatorPublicKey[1].toString(),
        },
    )

    return {
        mimcContract,
        batchUpdateStateTreeVerifierContract,
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

    const args = parser.parseArgs()
    const outputAddressFile = args.output
    const signUpToken = args.signUpToken

    const deployer = new etherlime.JSONRPCPrivateKeyDeployer(
        admin.privateKey,
        config.chain.url,
        {
            gasLimit: 8800000,
        },
    )


    let signUpTokenAddress
    let signUpTokenGatekeeperAddress
    if (signUpToken) {
        signUpTokenAddress = signUpToken
    } else {
        const signUpTokenContract = await deploySignupToken(deployer)
        signUpTokenAddress = signUpTokenContract.contractAddress
    }

    const signUpTokenGatekeeperContract = await deploySignupTokenGatekeeper(
        deployer,
        signUpTokenAddress,
    )

    const {
        mimcContract,
        batchUpdateStateTreeVerifierContract,
        maciContract,
    } = await deployMaci(
        deployer,
        signUpTokenGatekeeperContract.contractAddress,
    )

    const addresses = {
        MiMC: mimcContract.contractAddress,
        BatchUpdateStateTreeVerifier: batchUpdateStateTreeVerifierContract.contractAddress,
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
    genDeployer,
    genProvider,
}
