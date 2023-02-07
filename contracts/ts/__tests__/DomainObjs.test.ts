jest.setTimeout(90000)
import {
    StateLeaf,
    Keypair,
} from 'maci-domainobjs'

import { deployPoseidonContracts, linkPoseidonLibraries } from '../'

let doContract

describe('DomainObjs', () => {

    describe('Deployment', () => {
        beforeAll(async () => {
            console.log('Deploying Poseidon')
			const { PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract } = await deployPoseidonContracts()

            // Link Poseidon contracts
            const doContractFactory = await linkPoseidonLibraries(
                'DomainObjs',
                PoseidonT3Contract.address,
                PoseidonT4Contract.address,
                PoseidonT5Contract.address,
                PoseidonT6Contract.address,
            )

            console.log('Deploying DomainObjs')

            doContract = await doContractFactory.deploy()
			await doContract.deployTransaction.wait()
        })

        it('should correctly hash a StateLeaf', async () => {
            const keypair = new Keypair()
            const voiceCreditBalance = BigInt(1234)
            const stateLeaf = new StateLeaf(
                keypair.pubKey,
                voiceCreditBalance,
                BigInt(456546345),
            )
            const onChainHash = await doContract.hashStateLeaf(
                stateLeaf.asContractParam(),
            )
            const expectedHash = stateLeaf.hash()

            expect(onChainHash.toString()).toEqual(expectedHash.toString())
        })
    })
})
