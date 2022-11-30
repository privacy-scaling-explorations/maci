import * as fs from 'fs'
import * as path from 'path'
const { ethers } = require('hardhat')
import { BigNumber } from 'ethers'

const abiDir = path.join(__dirname, '..', 'artifacts')
const solDir = path.join(__dirname, '..', 'contracts')

const getDefaultSigner = async () => {
	const signers = await ethers.getSigners()
	const signer = signers[0]

	return signer
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

const linkPoseidonLibraries = async (
    solFileToLink: string,
    poseidonT3Address,
    poseidonT4Address,
    poseidonT5Address,
    poseidonT6Address,
    quiet = false,
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

const deployTopupCredit = async () => {
	const signer = await getDefaultSigner()
    const topupCreditFactory = await ethers.getContractFactory('TopupCredit', signer)
    const gasFees = await signer.provider.getFeeData()
    return await topupCreditFactory.deploy({
        maxFeePerGas: BigNumber.from(gasFees['maxFeePerGas']).mul(2),
    })
}

const deployVkRegistry = async () => {
	const signer = await getDefaultSigner()
    const vkRegistryFactory = await ethers.getContractFactory('VkRegistry', signer)
    const gasFees = await signer.provider.getFeeData()
    return await vkRegistryFactory.deploy({
        maxFeePerGas: BigNumber.from(gasFees['maxFeePerGas']).mul(2),
    })
}

const deployMockVerifier = async (quiet = false) => {
    log('Deploying MockVerifier', quiet)
	const signer = await getDefaultSigner()
    const factory = await ethers.getContractFactory('MockVerifier', signer)
    return await factory.deploy()
}

const deployVerifier = async (quiet = false) => {
    log('Deploying Verifier', quiet)
	const signer = await getDefaultSigner()
    const factory = await ethers.getContractFactory('Verifier', signer)
    return await factory.deploy()
}

const deployConstantInitialVoiceCreditProxy = async (
    amount: number,
    quiet = false
) => {
    log('Deploying InitialVoiceCreditProxy', quiet)
	const signer = await getDefaultSigner()
    const voiceCreditFactory = await ethers.getContractFactory('ConstantInitialVoiceCreditProxy', signer)
    return await voiceCreditFactory.deploy(amount.toString())
}

const deploySignupToken = async (quiet = false) => {
    log('Deploying SignUpToken', quiet)
	const signer = await getDefaultSigner()
    const factory = await ethers.getContractFactory('SignUpToken', signer)
    return await factory.deploy()
}

const deploySignupTokenGatekeeper = async (
    signUpTokenAddress: string,
    quiet = false
) => {
    log('Deploying SignUpTokenGatekeeper', quiet)

	const signer = await getDefaultSigner()
    const factory = await ethers.getContractFactory('SignUpTokenGatekeeper', signer)

    return await factory.deploy(signUpTokenAddress)
}

const deployFreeForAllSignUpGatekeeper = async (
    quiet = false
) => {
    log('Deploying FreeForAllGatekeeper', quiet)
	const signer = await getDefaultSigner()
    const factory = await ethers.getContractFactory('FreeForAllGatekeeper', signer)
    return await factory.deploy()
}

const log = (msg: string, quiet: boolean) => {
    if (!quiet) {
        console.log(msg)
    }
}

const deployPoseidonContracts = async (quiet = false) => {
    log('Deploying Poseidon contracts', quiet)
	const signer = await getDefaultSigner()
    const PoseidonT3ContractFactory = await ethers.getContractFactory('PoseidonT3', signer)
    const PoseidonT4ContractFactory = await ethers.getContractFactory('PoseidonT4', signer)
    const PoseidonT5ContractFactory = await ethers.getContractFactory('PoseidonT5', signer)
    const PoseidonT6ContractFactory = await ethers.getContractFactory('PoseidonT6', signer)

    const gasFees = await signer.provider.getFeeData()

	const PoseidonT3Contract = await PoseidonT3ContractFactory.deploy({
        maxFeePerGas: gasFees['maxFeePerGas'],
    })
    const PoseidonT4Contract = await PoseidonT4ContractFactory.deploy({
        maxFeePerGas: gasFees['maxFeePerGas'],
    })
    const PoseidonT5Contract = await PoseidonT5ContractFactory.deploy({
        maxFeePerGas: gasFees['maxFeePerGas'],
    })
    const PoseidonT6Contract = await PoseidonT6ContractFactory.deploy({
        maxFeePerGas: gasFees['maxFeePerGas'],
    })

    await PoseidonT3Contract.deployTransaction.wait()
    await PoseidonT4Contract.deployTransaction.wait()
    await PoseidonT5Contract.deployTransaction.wait()
    await PoseidonT6Contract.deployTransaction.wait()

    return {
        PoseidonT3Contract,
        PoseidonT4Contract,
        PoseidonT5Contract,
        PoseidonT6Contract,
    }
}

const deployPollFactory = async (quiet = false) => {
	const signer = await getDefaultSigner()
    log('Deploying PollFactory', quiet)
    const pollFactory = await ethers.getContractFactory('PollFactory', signer)
    const gasFees = await signer.provider.getFeeData()

    return await pollFactory.deploy({
        maxFeePerGas: gasFees['maxFeePerGas'],
    })
}

const deployPpt = async (verifierContractAddress: string, quiet = false) => {
	const signer = await getDefaultSigner()
    log('Deploying PollProcessorAndTallyer', quiet)
    const pptFactory = await ethers.getContractFactory('PollProcessorAndTallyer', signer)

    const gasFees = await signer.provider.getFeeData()

    return await pptFactory.deploy(verifierContractAddress, {
        maxFeePerGas: gasFees['maxFeePerGas'],
    })
}

const deployMessageAqFactory = async (quiet = false) => {
	const signer = await getDefaultSigner()
    log('Deploying MessageAqFactory', quiet)
    const messageAqFactory = await ethers.getContractFactory('MessageAqFactory', signer)
    // MessageAqFactory
    const gasFees = await signer.provider.getFeeData()

    return await messageAqFactory.deploy({
        maxFeePerGas: gasFees['maxFeePerGas'],
    })
}

const deployMaci = async (
    signUpTokenGatekeeperContractAddress: string,
    initialVoiceCreditBalanceAddress: string,
    verifierContractAddress: string,
    vkRegistryContractAddress: string,
    topupCreditContractAddress: string,
    quiet = false,
) => {

    const signer = await getDefaultSigner()

    const {
        PoseidonT3Contract,
        PoseidonT4Contract,
        PoseidonT5Contract,
        PoseidonT6Contract,
    } = await deployPoseidonContracts(quiet)

    const contractsToLink = ['MACI', 'PollFactory', 'MessageAqFactory']

    // Link Poseidon contracts to MACI
    const linkedContractFactories = contractsToLink.map( async (contractName: string) => {
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
        messageAqFactory,
    ] = await Promise.all(linkedContractFactories)

    const pollFactoryContract = await pollFactoryContractFactory.deploy()
    await pollFactoryContract.deployTransaction.wait()

    log('Deploying MACI', quiet)

    let gasFees = await signer.provider.getFeeData()

    const maciContract = await maciContractFactory.deploy(
        pollFactoryContract.address,
        signUpTokenGatekeeperContractAddress,
        initialVoiceCreditBalanceAddress,
        {
            maxFeePerGas: gasFees['maxFeePerGas'],
        }
    )

    await maciContract.deployTransaction.wait()

    gasFees = await signer.provider.getFeeData()

    log('Transferring PollFactory ownership to MACI', quiet)
    await (await (pollFactoryContract.transferOwnership(maciContract.address, {
        maxFeePerGas: gasFees['maxFeePerGas'],
    }))).wait()

    gasFees = await signer.provider.getFeeData()

    const messageAqContract = await messageAqFactory.deploy({
        maxFeePerGas: gasFees['maxFeePerGas'],
    })
    await messageAqContract.deployTransaction.wait()

    gasFees = await signer.provider.getFeeData()

    log('Transferring MessageAqFactory ownership to PollFactory', quiet)
    await (await (messageAqContract.transferOwnership(pollFactoryContract.address, {
        maxFeePerGas: gasFees['maxFeePerGas'],
    }))).wait()

    log('Initialising MACI', quiet)
    gasFees = await signer.provider.getFeeData()

    await (await (maciContract.init(
        vkRegistryContractAddress,
        messageAqContract.address,
        topupCreditContractAddress,
        {
            maxFeePerGas: gasFees['maxFeePerGas'],
        }
    ))).wait()

    const [ AccQueueQuinaryMaciAbi, ] = parseArtifact('AccQueue')
    const stateAqContractAddress = await maciContract.stateAq()
    const stateAqContract = new ethers.Contract(
        stateAqContractAddress,
        AccQueueQuinaryMaciAbi,
        signer,
    )

    return {
        maciContract,
        stateAqContract,
        pollFactoryContract,
        messageAqContract,
    }
}

const writeContractAddress = (
	maciContractAddress: string,
	vkRegistryContractAddress: string,
	stateAqContractAddress: string,
	signUpTokenAddress: string,
	pptContractAddress: string,
	outputAddressFile: string
) => {
    const addresses = {
        MaciContract: maciContractAddress,
        VkRegistry: vkRegistryContractAddress,
        StateAqContract: stateAqContractAddress,
        SignUpToken: signUpTokenAddress,
        ProcessAndTallyContract: pptContractAddress,
    }

    const addressJsonPath = path.join(__dirname, '..', outputAddressFile)
    fs.writeFileSync(
        addressJsonPath,
        JSON.stringify(addresses),
    )

    console.log(addresses)
}

export {
    deployTopupCredit,
    deployVkRegistry,
    deployMaci,
    deploySignupToken,
    deploySignupTokenGatekeeper,
    deployConstantInitialVoiceCreditProxy,
    deployFreeForAllSignUpGatekeeper,
    deployMockVerifier,
    deployVerifier,
    deployPollFactory,
    deployPpt,
    deployMessageAqFactory,
    genJsonRpcDeployer,
    getInitialVoiceCreditProxyAbi,
    abiDir,
    solDir,
    parseArtifact,
    linkPoseidonLibraries,
    deployPoseidonContracts,
	getDefaultSigner
}
