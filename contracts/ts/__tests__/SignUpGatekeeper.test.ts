jest.setTimeout(90000)
import * as ethers from 'ethers'
import { getDefaultSigner, deploySignupToken, deploySignupTokenGatekeeper, deployFreeForAllSignUpGatekeeper } from '../deploy'
import { deployTestContracts } from '../utils'
import {
    Keypair,
} from 'maci-domainobjs'

const initialVoiceCreditBalance = 100

describe('SignUpGatekeeper', () => {
    let signUpToken;
    let freeForAllContract;
    let signUpTokenGatekeeperContract;

    beforeAll(async () => {
        freeForAllContract = await deployFreeForAllSignUpGatekeeper()
        signUpToken = await deploySignupToken()
        signUpTokenGatekeeperContract= await deploySignupTokenGatekeeper(signUpToken.address)
    })

    describe('Deployment', () => {
        it('Gatekeepers should be deployed correctly', async () => {
            expect(freeForAllContract).toBeDefined()
            expect(signUpToken).toBeDefined()
            expect(signUpTokenGatekeeperContract).toBeDefined()
        })

        it('SignUpTokenGatekeeper has token address set', async () => {
            expect(
                await signUpTokenGatekeeperContract.token()
            ).toBe(signUpToken.address)
        })
    })

    describe('SignUpTokenGatekeeper', () => {
        let maciContract
        beforeEach(async () => {
            freeForAllContract = await deployFreeForAllSignUpGatekeeper()
            signUpToken = await deploySignupToken()
            signUpTokenGatekeeperContract= await deploySignupTokenGatekeeper(signUpToken.address)
            const r = await deployTestContracts(
                initialVoiceCreditBalance,
                signUpTokenGatekeeperContract.address
            )

            maciContract = r.maciContract
        })

        it('Adds MACI instance', async () => {
            expect(
                await signUpTokenGatekeeperContract.maci()
            ).toBe(maciContract.address)
        })

        /*
        it('Reverts if address provided is not a MACI instance', async () => {
            const user = new Keypair()
            const iface = maciContract.interface

            try {
                await maciContract.signUp(
                    user.pubKey.asContractParam(),
                    ethers.utils.defaultAbiCoder.encode(
                        signUpToken.interface.format(ethers.utils.FormatTypes.json),
                        [0,1]
                    ),
                    ethers.utils.defaultAbiCoder.encode(['uint256'], [0]),
                    { gasLimit: 300000 },
                )
            } catch (e) {
                console.log(e.message)
                //const error = "Transaction reverted: function selector was not recognized and there's no fallback function"
                //expect(e.message.endsWith(error)).toBeTruthy()
            }
        })
        */
    })
});

