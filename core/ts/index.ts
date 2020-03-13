import {
    PrivKey,
    PubKey,
    Command,
    Message,
    Keypair,
    StateLeaf,
} from 'maci-domainobjs'

import {
    bigInt,
    IncrementalMerkleTree,
} from 'maci-crypto'

const processMessage = (
    sharedKey: PrivKey,
    msg: Message,
    stateLeaf: StateLeaf,
    oldStateTree: IncrementalMerkleTree,
    oldUserVoteOptionTree: IncrementalMerkleTree,
) => {

    // Deep-copy the trees
    const stateTree = oldStateTree.copy()
    const userVoteOptionTree = oldUserVoteOptionTree.copy()

    // Decrypt the message
    const { command, signature } = Command.decrypt(msg, sharedKey)

    // If the state tree index in the command is invalid, do nothing
    if (parseInt(command.stateIndex) >= parseInt(stateTree.nextIndex)) {
        return { stateTree, userVoteOptionTree, stateLeaf }
    }

    // If the signature is invalid, do nothing
    if (!command.verifySignature(signature, stateLeaf.pubKey)) {
        return { stateTree, userVoteOptionTree, stateLeaf }
    }

    // If the nonce is invalid, do nothing
    if (!command.nonce.equals(stateLeaf.nonce + bigInt(1))) {
        return { stateTree, userVoteOptionTree, stateLeaf }
    }

    // If there are insufficient vote credits, do nothing
    const userPrevSpentCred =
        userVoteOptionTree.getLeaf(parseInt(command.voteOptionIndex))

    const userCmdVoteOptionCredit = command.newVoteWeight

    const voteCreditsLeft = 
        stateLeaf.voiceCreditBalance + 
        (userPrevSpentCred * userPrevSpentCred) -
        (userCmdVoteOptionCredit * userCmdVoteOptionCredit)

    // If the voice credits spent is invalid, do nothing
    if (voteCreditsLeft < 0) {
        return { stateTree, userVoteOptionTree, stateLeaf }
    }

    // Update the user's vote option tree
    userVoteOptionTree.update(
        bigInt(command.voteOptionIndex),
        bigInt(userCmdVoteOptionCredit),
    )

    // Update the state tree
    const newStateLeaf = new StateLeaf(
        command.newPubKey,
        userVoteOptionTree.root,
        voteCreditsLeft,
        stateLeaf.nonce + bigInt(1)
    )

    stateTree.update(
        command.stateIndex,
        newStateLeaf.hash(),
    )

    return { stateTree, userVoteOptionTree, newStateLeaf }
}

export {
    processMessage,
}
