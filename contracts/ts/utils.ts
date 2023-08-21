interface SnarkProof {
	pi_a: BigInt[];
	pi_b: BigInt[][];
	pi_c: BigInt[];
}

import { VerifyingKey } from 'maci-domainobjs';
import {
	deployVkRegistry,
	deployTopupCredit,
	deployMaci,
	deployMessageProcessor,
	deployTally,
	deployMockVerifier,
	deployContract,
	deployFreeForAllSignUpGatekeeper,
	deployConstantInitialVoiceCreditProxy,
} from './';

const formatProofForVerifierContract = (_proof: SnarkProof) => {
	return [
		_proof.pi_a[0],
		_proof.pi_a[1],

		_proof.pi_b[0][1],
		_proof.pi_b[0][0],
		_proof.pi_b[1][1],
		_proof.pi_b[1][0],

		_proof.pi_c[0],
		_proof.pi_c[1],
	].map((x) => x.toString());
};

const deployTestContracts = async (
	initialVoiceCreditBalance,
	signUpDeadline,
	deactivationPeriod,
	gatekeeperContract?
) => {
	const mockVerifierContract = await deployMockVerifier();

	if (!gatekeeperContract) {
		gatekeeperContract = await deployFreeForAllSignUpGatekeeper();
	}

	const constantIntialVoiceCreditProxyContract =
		await deployConstantInitialVoiceCreditProxy(initialVoiceCreditBalance);

	// VkRegistry
	const vkRegistryContract = await deployVkRegistry();
	const topupCreditContract = await deployTopupCredit();

	const { maciContract, stateAqContract, pollFactoryContract, poseidonAddrs } =
		await deployMaci(
			gatekeeperContract.address,
			constantIntialVoiceCreditProxyContract.address,
			mockVerifierContract.address,
			vkRegistryContract.address,
			topupCreditContract.address,
			signUpDeadline,
			deactivationPeriod
		);
	const mpContract = await deployMessageProcessor(
		mockVerifierContract.address,
		poseidonAddrs[0],
		poseidonAddrs[1],
		poseidonAddrs[2],
		poseidonAddrs[3]
	);
	const tallyContract = await deployTally(
		mockVerifierContract.address,
		poseidonAddrs[0],
		poseidonAddrs[1],
		poseidonAddrs[2],
		poseidonAddrs[3]
	);

	return {
		mockVerifierContract,
		gatekeeperContract,
		constantIntialVoiceCreditProxyContract,
		maciContract,
		stateAqContract,
		vkRegistryContract,
		mpContract,
		tallyContract,
	};
};

const compareVks = (vk: VerifyingKey, vkOnChain: any): boolean => {
    let isEqual = vk.ic.length === vkOnChain.ic.length
    for (let i = 0; i < vk.ic.length; i ++) {
        isEqual = isEqual && vk.ic[i].x.toString() === vkOnChain.ic[i].x.toString()
        isEqual = isEqual && vk.ic[i].y.toString() === vkOnChain.ic[i].y.toString()
    }
    isEqual = isEqual && vk.alpha1.x.toString() === vkOnChain.alpha1.x.toString()
    isEqual = isEqual && vk.alpha1.y.toString() === vkOnChain.alpha1.y.toString()
    isEqual = isEqual && vk.beta2.x[0].toString() === vkOnChain.beta2.x[0].toString()
    isEqual = isEqual && vk.beta2.x[1].toString() === vkOnChain.beta2.x[1].toString()
    isEqual = isEqual && vk.beta2.y[0].toString() === vkOnChain.beta2.y[0].toString()
    isEqual = isEqual && vk.beta2.y[1].toString() === vkOnChain.beta2.y[1].toString()
    isEqual = isEqual && vk.delta2.x[0].toString() === vkOnChain.delta2.x[0].toString()
    isEqual = isEqual && vk.delta2.x[1].toString() === vkOnChain.delta2.x[1].toString()
    isEqual = isEqual && vk.delta2.y[0].toString() === vkOnChain.delta2.y[0].toString()
    isEqual = isEqual && vk.delta2.y[1].toString() === vkOnChain.delta2.y[1].toString()
    isEqual = isEqual && vk.gamma2.x[0].toString() === vkOnChain.gamma2.x[0].toString()
    isEqual = isEqual && vk.gamma2.x[1].toString() === vkOnChain.gamma2.x[1].toString()
    isEqual = isEqual && vk.gamma2.y[0].toString() === vkOnChain.gamma2.y[0].toString()
    isEqual = isEqual && vk.gamma2.y[1].toString() === vkOnChain.gamma2.y[1].toString()

    return isEqual
}

export { deployTestContracts, formatProofForVerifierContract, compareVks };
