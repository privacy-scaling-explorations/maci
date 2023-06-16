jest.setTimeout(90000);
import * as ethers from 'ethers';
import {
	getDefaultSigner,
	deploySignupToken,
	deploySignupTokenGatekeeper,
	deployFreeForAllSignUpGatekeeper,
} from '../deploy';
import { deployTestContracts } from '../utils';
import { Keypair } from 'maci-domainobjs';

const initialVoiceCreditBalance = 100;
const signUpDuration = 100;
const deactivationPeriod = 10;

describe('SignUpGatekeeper', () => {
	let signUpToken;
	let freeForAllContract;
	let signUpTokenGatekeeperContract;

	beforeAll(async () => {
		freeForAllContract = await deployFreeForAllSignUpGatekeeper();
		signUpToken = await deploySignupToken();
		signUpTokenGatekeeperContract = await deploySignupTokenGatekeeper(
			signUpToken.address
		);
	});

	describe('Deployment', () => {
		it('Gatekeepers should be deployed correctly', async () => {
			expect(freeForAllContract).toBeDefined();
			expect(signUpToken).toBeDefined();
			expect(signUpTokenGatekeeperContract).toBeDefined();
		});

		it('SignUpTokenGatekeeper has token address set', async () => {
			expect(await signUpTokenGatekeeperContract.token()).toBe(
				signUpToken.address
			);
		});
	});

	describe('SignUpTokenGatekeeper', () => {
		let maciContract;
		beforeEach(async () => {
			freeForAllContract = await deployFreeForAllSignUpGatekeeper();
			signUpToken = await deploySignupToken();
			signUpTokenGatekeeperContract = await deploySignupTokenGatekeeper(
				signUpToken.address
			);
			const signer = await getDefaultSigner();
			const latestBlock = await signer.provider.getBlock('latest');
			const signUpDeadline = latestBlock.timestamp + signUpDuration;
			const r = await deployTestContracts(
				initialVoiceCreditBalance,
				signUpDeadline,
				signUpTokenGatekeeperContract,
				deactivationPeriod
			);

			maciContract = r.maciContract;
		});

		it('sets MACI instance correctly', async () => {
			await signUpTokenGatekeeperContract.setMaciInstance(maciContract.address);

			expect(await signUpTokenGatekeeperContract.maci()).toBe(
				maciContract.address
			);
		});

		it('Reverts if address provided is not a MACI instance', async () => {
			const user = new Keypair();
			const signer = await getDefaultSigner();

			await signUpToken.giveToken(await signer.address, 0);

			try {
				await maciContract.signUp(
					user.pubKey.asContractParam(),
					ethers.utils.defaultAbiCoder.encode(['uint256'], [1]),
					ethers.utils.defaultAbiCoder.encode(['uint256'], [0]),
					{ gasLimit: 300000 }
				);
			} catch (e) {
				const error =
					"'SignUpTokenGatekeeper: only specified MACI instance can call this function'";
				expect(e.message.endsWith(error)).toBeTruthy();
			}
		});
	});
});
