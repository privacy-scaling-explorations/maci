import * as fs from 'fs'
import * as path from 'path'
const { ethers } = require('hardhat')
import { Contract, ContractFactory } from 'ethers'

const abiDir = path.join(__dirname, '..', 'artifacts')
const solDir = path.join(__dirname, '..', 'contracts')

const getDefaultSigner = async () => {
	const signers = await ethers.getSigners()
	return signers[0]
}

const parseArtifact = (filename: string) => {
	let filePath = 'contracts/'
	if (filename.includes('Gatekeeper')) {
		filePath += 'gatekeepers/'
		filePath += `${filename}.sol`
	}

	if (filename.includes('VoiceCredit')) {
		filePath += 'initialVoiceCreditProxy/'
		filePath += `${filename}.sol`
	}

	if (filename.includes('Verifier')) {
		filePath += 'crypto/Verifier.sol/'
	}

	if (filename.includes('AccQueue')) {
		filePath += 'trees/AccQueue.sol/'
	}

	if (filename.includes('Poll') || filename.includes('MessageAq')) {
		filePath += 'Poll.sol'
	}

	if (!filePath.includes('.sol')) {
		filePath += `${filename}.sol`
	}

	const contractArtifact = JSON.parse(
		fs.readFileSync(path.join(abiDir, filePath, `${filename}.json`)).toString()
	)

	return [ contractArtifact.abi, contractArtifact.bytecode ]
}

const getInitialVoiceCreditProxyAbi = () => {
    const [ abi ] = parseArtifact('InitialVoiceCreditProxy.abi')
    return abi
}

export class JSONRPCDeployer {
    provider: any
    signer: any
    options: any

    constructor(privateKey: string, providerUrl: string, options?: any) {
        this.provider = new ethers.providers.JsonRpcProvider(providerUrl)
        this.signer = new ethers.Wallet(privateKey, this.provider)
        this.options = options
    }

    async deploy(abi: any, bytecode: any, ...args): Promise<any> {
		const contractInterface = new ethers.utils.Interface( abi )
        const factory = new ethers.ContractFactory(contractInterface, bytecode, this.signer)
        return await factory.deploy(...args)
    }
}

class HardhatDeployer extends JSONRPCDeployer {

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

const log = (msg: string, quiet: boolean) => {
    if (!quiet) {
        console.log(msg)
    }
}

const linkPoseidonLibraries = async (
    solFileToLink: string,
    poseidonT3Address: string,
    poseidonT4Address: string,
    poseidonT5Address: string,
    poseidonT6Address: string,
    quiet: boolean = false,
) => {
	const signer = await getDefaultSigner()

	log('Linking Poseidon libraries to ' + solFileToLink, quiet)
	const contractFactory = await ethers.getContractFactory(
		solFileToLink,
		{
			signer,
			libraries: {
				PoseidonT3: poseidonT3Address,
				PoseidonT4: poseidonT4Address,
				PoseidonT5: poseidonT5Address,
				PoseidonT6: poseidonT6Address,
			},
		},
	)

	return contractFactory
}

const deployTopupCredit = async (quiet = false) => {
    return await deployContract('TopupCredit', quiet)
}

const deployVkRegistry = async (quiet = false) => {
    return await deployContract('VkRegistry', quiet)
}

const deployMockVerifier = async (quiet = false) => {
    return await deployContract('MockVerifier', quiet)
}

const deployVerifier = async (quiet = false) => {
    return await deployContract('Verifier', quiet)
}

const deployConstantInitialVoiceCreditProxy = async (
    amount: number,
    quiet = false
) => {
    return await deployContract('ConstantInitialVoiceCreditProxy', quiet, amount.toString())
}

const deploySignupToken = async (quiet = false) => {
    return await deployContract('SignUpToken', quiet)
}

const deploySignupTokenGatekeeper = async (
    signUpTokenAddress: string,
    quiet = false
) => {
    return await deployContract('SignUpTokenGatekeeper', quiet, signUpTokenAddress)
}

const deployFreeForAllSignUpGatekeeper = async (
    quiet = false
) => {
    return await deployContract('FreeForAllGatekeeper', quiet)
}


const deployPoseidonContracts = async (quiet = false) => {
    const PoseidonT3Contract = await deployContract('PoseidonT3', quiet)
    const PoseidonT4Contract = await deployContract('PoseidonT4', quiet)
    const PoseidonT5Contract = await deployContract('PoseidonT5', quiet)
    const PoseidonT6Contract = await deployContract('PoseidonT6', quiet)

    return {
        PoseidonT3Contract,
        PoseidonT4Contract,
        PoseidonT5Contract,
        PoseidonT6Contract,
    }
}

const deployPollFactory = async (quiet = false) => {
    return await deployContract('PollFactory', quiet)
}

// Deploy a contract given a name and args
const deployContract = async (contractName: string, quiet: boolean = false, ...args: any) : Promise<Contract>  =>  {
    log(`Deploying ${contractName}`, quiet)
    const signer = await getDefaultSigner()
    const contractFactory = await ethers.getContractFactory(contractName, signer)
    const contract: Contract = await contractFactory.deploy(...args, {
        maxFeePerGas: await getFeeData['maxFeePerGas']
    })
    
    await contract.deployTransaction.wait()
    return contract
}

// deploy a contract with linked libraries
const deployContractWithLinkedLibraries = async (contractFactory: ContractFactory, name: string, quiet: boolean = false, ...args: any) : Promise<Contract> => {
    log(`Deploying ${name}`, quiet)
    const contract = await contractFactory.deploy(...args, {
        maxFeePerGas: await getFeeData['maxFeePerGas']
    })
    await contract.deployTransaction.wait()
    return contract
}


const transferOwnership = async (contract: Contract, newOwner: string, quiet: boolean = false) => {
    await (await (contract.transferOwnership(newOwner, {
        maxFeePerGas: await getFeeData['maxFeePerGas'],
    }))).wait()
}

const initMaci = async (contract: Contract, quiet: boolean = false, ...args: any) => {
    log('Initializing MACI', quiet)
    await (await contract.init(...args, {
        maxFeePerGas: await getFeeData['maxFeePerGas']
    })).wait()
}

const getFeeData = async (): Promise<any> => {
    const signer = await getDefaultSigner()
    const fee = await signer.provider.getFeeData()
    console.log('fee', fee)
    return await signer.provider.getFeeData()
}

const deployTally = async (
    verifierAddress,
    poseidonT3Address,
    poseidonT4Address,
    poseidonT5Address,
    poseidonT6Address,
    quiet = false
    ) => {
    // Link Poseidon contracts to Tally
    const tallyFactory = await linkPoseidonLibraries(
            'Tally',
            poseidonT3Address,
            poseidonT4Address,
            poseidonT5Address,
            poseidonT6Address,
            quiet
        )
    const tallyContract = await deployContractWithLinkedLibraries(
        tallyFactory,
        'Tally',
        quiet,
        verifierAddress,
    )
    return tallyContract
}

const deployMaci = async (
    signUpTokenGatekeeperContractAddress: string,
    initialVoiceCreditBalanceAddress: string,
    verifierContractAddress: string,
    vkRegistryContractAddress: string,
    topupCreditContractAddress: string,
    quiet = false,
) => {

    const {
        PoseidonT3Contract,
        PoseidonT4Contract,
        PoseidonT5Contract,
        PoseidonT6Contract,
    } = await deployPoseidonContracts(quiet)

    const poseidonAddrs = [PoseidonT3Contract.address, PoseidonT4Contract.address, PoseidonT5Contract.address, PoseidonT6Contract.address]

    const contractsToLink = ['MACI', 'PollFactory']

    // Link Poseidon contracts to MACI
    const linkedContractFactories = contractsToLink.map(async (contractName: string) => {
        return await linkPoseidonLibraries(
            contractName,
            PoseidonT3Contract.address,
            PoseidonT4Contract.address,
            PoseidonT5Contract.address,
            PoseidonT6Contract.address,
            quiet
        )
    })

    const [
        maciContractFactory,
        pollFactoryContractFactory,
    ] = await Promise.all(linkedContractFactories)

    const pollFactoryContract = await deployContractWithLinkedLibraries(
        pollFactoryContractFactory,
        'PollFactory',
        quiet
    )

    const maciContract = await deployContractWithLinkedLibraries(
        maciContractFactory, 
        'MACI',
        quiet,
        pollFactoryContract.address,
        signUpTokenGatekeeperContractAddress,
        initialVoiceCreditBalanceAddress
    )

    log('Transferring ownership of PollFactoryContract to MACI', quiet)
    await transferOwnership(pollFactoryContract, maciContract.address, quiet)

    await initMaci(maciContract, quiet, vkRegistryContractAddress, topupCreditContractAddress)

    const [ AccQueueQuinaryMaciAbi, ] = parseArtifact('AccQueue')
    const stateAqContractAddress = await maciContract.stateAq()
    const stateAqContract = new ethers.Contract(
        stateAqContractAddress,
        AccQueueQuinaryMaciAbi,
        await getDefaultSigner(),
    )

    return {
        maciContract,
        stateAqContract,
        pollFactoryContract,
        poseidonAddrs,
    }
}

const writeContractAddresses = (
	maciContractAddress: string,
	vkRegistryContractAddress: string,
	stateAqContractAddress: string,
	signUpTokenAddress: string,
	outputAddressFile: string
) => {
    const addresses = {
        MaciContract: maciContractAddress,
        VkRegistry: vkRegistryContractAddress,
        StateAqContract: stateAqContractAddress,
        SignUpToken: signUpTokenAddress,
    }

    const addressJsonPath = path.join(__dirname, '..', outputAddressFile)
    fs.writeFileSync(
        addressJsonPath,
        JSON.stringify(addresses),
    )

    console.log(addresses)
}

export {
    deployContract,
    deployContractWithLinkedLibraries,
    deployTopupCredit,
    deployVkRegistry,
    deployMaci,
    deployTally,
    deploySignupToken,
    deploySignupTokenGatekeeper,
    deployConstantInitialVoiceCreditProxy,
    deployFreeForAllSignUpGatekeeper,
    deployMockVerifier,
    deployVerifier,
    deployPollFactory,
    genJsonRpcDeployer,
    getInitialVoiceCreditProxyAbi,
    initMaci,
    transferOwnership,
    abiDir,
    solDir,
    parseArtifact,
    linkPoseidonLibraries,
    deployPoseidonContracts,
	getDefaultSigner,
    writeContractAddresses
}
