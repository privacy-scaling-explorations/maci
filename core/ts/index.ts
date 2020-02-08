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
    MerkleTree,
    hashOne,
} from 'maci-crypto'

const processMessage = (
    privKey: PrivKey,
    pubKey: PubKey,
    msg: Message,
    oldStateTree: MerkleTree,
    oldUserVoteOptionTree: MerkleTree,
) => {

    // Deep-copy the trees
    const stateTree = oldStateTree.copy()
    const userVoteOptionTree = oldUserVoteOptionTree.copy()

    // Generate the ECDH shared key
    const sharedKey = Keypair.genEcdhSharedKey(privKey, pubKey)

    // Decrypt the message
    const { command, signature } = Command.decrypt(msg, sharedKey)

    const stateLeaf = stateTree.leavesRaw[command.stateIndex]

    // If the state tree index in the command is invalid, do nothing
    if (parseInt(command.stateIndex) >= parseInt(stateTree.nextIndex)) {
        return [stateTree, userVoteOptionTree]
    }

    // If the signature is invalid, do nothing
    if (!command.verifySignature(signature, stateLeaf.pubKey)) {
        return [stateTree, userVoteOptionTree]
    }

    // If the nonce is invalid, do nothing
    if (!command.nonce.equals(stateLeaf.nonce + bigInt(1))) {
        return [stateTree, userVoteOptionTree]
    }

    // If there are insufficient vote credits, do nothing
    const userPrevSpentCred =
        userVoteOptionTree.leavesRaw[
            parseInt(command.voteOptionIndex)
        ]
    const userCmdVoteOptionCredit = command.newVoteWeight

    const voteCreditsLeft = 
        stateLeaf.voiceCreditBalance + 
        (userPrevSpentCred * userPrevSpentCred) -
        (userCmdVoteOptionCredit * userCmdVoteOptionCredit)

    // If the voice credits spent is invalid, do nothing
    if (voteCreditsLeft < 0) {
        return [stateTree, userVoteOptionTree]
    }

    // Update the user's vote option tree
    userVoteOptionTree.update(
        bigInt(command.voteOptionIndex),
        hashOne(bigInt(userCmdVoteOptionCredit)),
        bigInt(userCmdVoteOptionCredit)
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
        newStateLeaf,
    )

    return {
        stateTree,
        userVoteOptionTree
    }
}

export {
    processMessage,
}
