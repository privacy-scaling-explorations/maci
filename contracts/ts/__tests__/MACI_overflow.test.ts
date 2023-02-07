jest.setTimeout(90000)
import * as ethers from 'ethers'
import { parseArtifact, getDefaultSigner } from '../deploy'
import { deployTestContracts } from '../utils'
import {
    Keypair,
} from 'maci-domainobjs'

import {
    MaxValues,
    TreeDepths,
} from 'maci-core'

const coordinator = new Keypair()
const users = [
    new Keypair(),
    new Keypair(),
    new Keypair(),
]

const STATE_TREE_DEPTH = 10
const STATE_TREE_ARITY = 5
const MESSAGE_TREE_DEPTH = 4
const MESSAGE_TREE_SUBDEPTH = 2

// Poll parameters
const duration = 15
const maxValues: MaxValues = {
    maxUsers: 25,
    maxMessages: 25,
    maxVoteOptions: 25,
}

const treeDepths: TreeDepths = {
    intStateTreeDepth: 1,
    messageTreeDepth: MESSAGE_TREE_DEPTH,
    messageTreeSubDepth: MESSAGE_TREE_SUBDEPTH,
    voteOptionTreeDepth: 2,
}

const initialVoiceCreditBalance = 100
let signer: ethers.Signer
const [ pollAbi ] = parseArtifact('Poll')

describe('Overflow testing', () => {
    let maciContract: ethers.Contract
    let stateAqContract: ethers.Contract
    let vkRegistryContract: ethers.Contract
    let pptContract: ethers.Contract
    let pollId: number
    beforeEach(async () => {
        signer = await getDefaultSigner()
        const r = await deployTestContracts(
            initialVoiceCreditBalance,
        )
        maciContract = r.maciContract
        stateAqContract = r.stateAqContract
        vkRegistryContract = r.vkRegistryContract
        pptContract = r.pptContract
    })

    it('MACI.stateTreeDepth should be correct', async () => {
        const std = await maciContract.stateTreeDepth()
        expect(std.toString()).toEqual(STATE_TREE_DEPTH.toString())
    })
    it('SignUps - should not overflow', async () => {
        await maciContract.signUp(
            users[0].pubKey.asContractParam(),
            ethers.utils.defaultAbiCoder.encode(['uint256'], [1]),
            ethers.utils.defaultAbiCoder.encode(['uint256'], [0]),
        )
    })

    it('Deploy Poll - should not overflow', async () => {
        await maciContract.deployPoll(
            duration,
            maxValues,
            treeDepths,
            coordinator.pubKey.asContractParam()
        )
    })

    it('Deploy Poll - should not overflow with larger values for tree depths', async () => {
        /* 
            Poll Contract
            require(
                _maxValues.maxMessages <=
                treeArity**uint256(_treeDepths.messageTreeDepth) &&
                _maxValues.maxMessages >= _batchSizes.messageBatchSize &&
                _maxValues.maxMessages % _batchSizes.messageBatchSize == 0 &&
                _maxValues.maxVoteOptions <=
                treeArity**uint256(_treeDepths.voteOptionTreeDepth) &&
                _maxValues.maxVoteOptions < (2**50),
                "PollFactory: invalid _maxValues"
            );
        
            MACI Contract
            BatchSizes memory batchSizes = BatchSizes(
                uint24(MESSAGE_TREE_ARITY)**_treeDepths.messageTreeSubDepth,
                uint24(STATE_TREE_ARITY)**_treeDepths.intStateTreeDepth,
                uint24(STATE_TREE_ARITY)**_treeDepths.intStateTreeDepth
            );
            MESSAGE_TREE_ARITY = 5
            STATE_TREE_ARITY = 5;
            stateTreeDepth = 10;


            struct BatchSizes {
                uint256 messageBatchSize;
                uint256 tallyBatchSize;
                uint256 subsidyBatchSize;
            }

            treeArity = 5;
        
            TS
            const maxValues: MaxValues = {
                maxUsers: 1000,
                maxMessages: 25,
                maxVoteOptions: 25,
            }
        */

        const _treeDepths: TreeDepths = {
            intStateTreeDepth: 2,
            messageTreeDepth: 5,
            messageTreeSubDepth: 5,
            voteOptionTreeDepth: 2,
        }

        const _maxValues: MaxValues = {
            maxUsers: 25,
            maxMessages: 3125,
            maxVoteOptions: 25
        }

        // require maxMessages <= treeArity ** messageTreeDepths
        // require 25 <= 5 * 5 Ok
        // require maxMessages >= messageBatchSize(5)**(5)
        // require 3125 >= 3125
        // require _maxValues.maxMessages % _batchSizes.messageBatchSize == 0
        // require 3125 % 3125
        // require _maxValues.maxVoteOptions <=
        // treeArity**uint256(_treeDepths.voteOptionTreeDepth)
        // require 25 <= 5 ** 2 
        // require _maxValues.maxVoteOptions < (2**50)
        // require 25 < 2 ** 50 -> 25 < 1125899906842624
        const tx = await maciContract.deployPoll(
            duration,
            _maxValues,
            _treeDepths,
            coordinator.pubKey.asContractParam()
        )

        const receipt = await tx.wait()
        console.log(`Used ${receipt.gasUsed?.toString()} gas`)
    })
})
