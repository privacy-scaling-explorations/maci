import {
    StateLeaf,
    Keypair,
} from 'maci-domainobjs'

import { deployPoseidonContracts, linkPoseidonLibraries } from '../'
import { expect } from 'chai'
import { Contract } from 'ethers'

describe('DomainObjs', () => {
    let doContract: Contract

    describe('Deployment', () => {
        before(async () => {
			const { PoseidonT3Contract, PoseidonT4Contract, PoseidonT5Contract, PoseidonT6Contract } = await deployPoseidonContracts(true)

            // Link Poseidon contracts
            const doContractFactory = await linkPoseidonLibraries(
                'DomainObjs',
                await PoseidonT3Contract.getAddress(),
                await PoseidonT4Contract.getAddress(),
                await PoseidonT5Contract.getAddress(),
                await PoseidonT6Contract.getAddress(),
                true
            )

            doContract = await doContractFactory.deploy()
			await doContract.waitForDeployment()
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

            expect(onChainHash.toString()).to.eq(expectedHash.toString())
        })
    })
})
