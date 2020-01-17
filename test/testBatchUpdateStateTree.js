const { assert } = require('chai')
const path = require('path')
const compiler = require('circom')
const { Circuit } = require('snarkjs')
const { stringifyBigInts, unstringifyBigInts } = require('../_build/utils/helpers')
const { merkleTreeConfig } = require('../maci-config')

const {
  randomPrivateKey,
  privateToPublicKey,
  decrypt,
  verify,
  signAndEncrypt,
  hash,
  multiHash,
  babyJubJubPrivateKey
} = require('../_build/utils/crypto')

const {
  createMerkleTree
} = require('../_build/utils/merkletree.js')

const str2BigInt = s => {
  return BigInt(parseInt(
    Buffer.from(s).toString('hex'), 16
  ))
}

const getRandom = (min, max) => {
  return parseInt(Math.random() * (max - min) + min)
}

describe('Batch Update State Tree Circuit', () => {
  const coordinatorSk = randomPrivateKey()
  const coordinatorPk = privateToPublicKey(coordinatorSk)

  const createUser = (voteOptionLength, creditBalance = 125n, nonce = 0n) => {
    // Helper function to create a user
    // and their related vote option tree
    const userSk = randomPrivateKey()
    const userPk = privateToPublicKey(userSk)

    const ephemeralSk = randomPrivateKey()
    const ephemeralPk = privateToPublicKey(ephemeralSk)

    const userVoteOptionTree = createMerkleTree(2, merkleTreeConfig.zeroValue)
    for (let i = 0; i < voteOptionLength; i++) {
      userVoteOptionTree.insert(hash(0n), 0n) // Voted for no one by default
    }

    const userExistingStateTreeData = [
      userPk[0], // public key x
      userPk[1], // public key y
      userVoteOptionTree.root, // vote option tree root
      creditBalance, // credit balance (arbitrary)
      nonce
    ]

    return [
      userSk,
      userPk[0],
      userPk[1],
      ephemeralSk,
      ephemeralPk,
      nonce,
      userExistingStateTreeData,
      userVoteOptionTree
    ]
  }

  const processMessage = (ecdhPriv, ecdhPub, _msg, _stateTree, _userVoteOptionTree) => {
    // Make copies to the BigInt objects / classes
    const msg = unstringifyBigInts(
      unstringifyBigInts(_msg)
    )
    const stateTree = Object.assign(Object.create(Object.getPrototypeOf(_stateTree)), _stateTree)
    const userVoteOptionTree = Object.assign(Object.create(Object.getPrototypeOf(_userVoteOptionTree)), _userVoteOptionTree)

    // Decrypt the msg and extract relevant parts of it
    const msgDecrypted = decrypt(
      msg,
      ecdhPriv,
      ecdhPub
    )

    const [
      userCmdIndex,
      userCmdPubX,
      userCmdPubY,
      userCmdVoteOptionIndex,
      userCmdVoteOptionCredit,
      userCmdNonce, // eslint-disable-line
      userCmdSalt,  // eslint-disable-line
      userCmdSigR8X,
      userCmdSigR8Y,
      userCmdSigS
    ] = msgDecrypted

    // User data in state tree
    const [
      userStatePubX, // eslint-disable-line
      userStatePubY, // eslint-disable-line
      userStateVoteRoot, // eslint-disable-line
      userStateVoteBalance,
      userStateNonce
    ] = stateTree.leavesRaw[parseInt(userCmdIndex)]

    const cmd = msgDecrypted.slice(0, -3)

    const msgSig = {
      R8: [userCmdSigR8X, userCmdSigR8Y],
      S: userCmdSigS
    }

    const msgSigPubKey = [
      userStatePubX, userStatePubY
    ]

    // If Index is invalid, return
    if (parseInt(userCmdIndex) >= parseInt(stateTree.nextIndex)) {
      return [
        stateTree,
        userVoteOptionTree
      ]
    }

    // If signature isn't valid, do nothing
    if (!verify(multiHash(cmd), msgSig, msgSigPubKey)) {
      return [
        stateTree,
        userVoteOptionTree
      ]
    }

    // If nonce isn't valid, do nothing
    if (parseInt(userCmdNonce) !== parseInt(userStateNonce + 1n)) {
      return [
        stateTree,
        userVoteOptionTree
      ]
    }

    // If insufficient vote credits, do nothing
    const userPrevSpentCred = userVoteOptionTree.leavesRaw[parseInt(userCmdVoteOptionIndex)]
    const voteCreditsLeft = BigInt(userStateVoteBalance + BigInt(userPrevSpentCred * userPrevSpentCred) - BigInt(userCmdVoteOptionCredit * userCmdVoteOptionCredit))
    if (parseInt(voteCreditsLeft) < 0) {
      return [
        stateTree,
        userVoteOptionTree
      ]
    }

    userVoteOptionTree.update(
      parseInt(userCmdVoteOptionIndex),
      // Replace voted credits new new command
      hash(BigInt(userCmdVoteOptionCredit)),
      BigInt(userCmdVoteOptionCredit)
    )

    const userNewStateTreeData = [
      userCmdPubX,
      userCmdPubY,
      userVoteOptionTree.root,
      voteCreditsLeft,
      userStateNonce + 1n
    ]

    stateTree.update(
      parseInt(userCmdIndex),
      multiHash(userNewStateTreeData),
      userNewStateTreeData
    )

    return [
      stateTree,
      userVoteOptionTree
    ]
  }

  it('Valid Inputs', async () => {
    // Since there's not types here:
    // userCmd:
    /* [
      [0] - user index in state tree
      [1] - Same public key
      [2] - Same public key
      [3] - Vote option index (voting for candidate 0)
      [4] - sqrt of the number of voice credits user wishes to spend (spending 25 credit balance)
      [5] - Nonce
      [6] - Random salt
    ]
    */

    // Circuit definition
    const circuitDef = await compiler(path.join(__dirname, 'circuits', 'batch_update_state_tree_test.circom'))
    const circuit = new Circuit(circuitDef)

    const treeDepth = 4
    const voteOptionTreeDepth = 2

    // Contruct the tree(s)
    const msgTree = createMerkleTree(treeDepth, merkleTreeConfig.zeroValue)
    let stateTree = createMerkleTree(treeDepth, merkleTreeConfig.zeroValue)
    const voteOptionTree = createMerkleTree(voteOptionTreeDepth, merkleTreeConfig.zeroValue)

    // Insert candidates into vote option tree
    voteOptionTree.insert(hash(str2BigInt('candidate 1')))
    voteOptionTree.insert(hash(str2BigInt('candidate 2')))
    voteOptionTree.insert(hash(str2BigInt('candidate 3')))
    voteOptionTree.insert(hash(str2BigInt('candidate 4')))

    // stateTree index 0 is a random leaf
    // used to insert random data when the
    // decryption fails
    stateTree.insert(hash(str2BigInt('random data')))

    // Vote option length (not tree depth)
    const voteOptionLength = Math.pow(2, voteOptionTreeDepth)
    const batchSize = 4

    // Create register users
    let users = {}
    for (let i = 0; i < batchSize; i++) {
      const [
        sk,
        pkX,
        pkY,
        ephemeralSk,
        ephemeralPk,
        nonce,
        existingStateTreeData,
        userVoteOptionTree
      ] = createUser(voteOptionLength)

      stateTree.insert(multiHash(existingStateTreeData), existingStateTreeData)

      const stateTreeIndex = stateTree.nextIndex - 1

      users[i] = {
        sk,
        pkX,
        pkY,
        ephemeralSk,
        ephemeralPk,
        lastNonce: nonce,
        existingStateTreeData,
        userVoteOptionTree,
        userIndex: stateTreeIndex
      }
    }

    // Create user commands and messages
    let msgs = []
    let cmds = []
    for (let i = 0; i < batchSize; i++) {
      const voteOptionIndex = getRandom(0, voteOptionLength)
      const voteOptionWeight = getRandom(0, 8)
      const user = users[i]
      const salt = randomPrivateKey()

      const cmd = [
        BigInt(user.userIndex),
        user.pkX,
        user.pkY,
        BigInt(voteOptionIndex),
        BigInt(voteOptionWeight),
        user.lastNonce + 1n,
        salt
      ]

      const msg = signAndEncrypt(
        cmd,
        user.sk,
        user.ephemeralSk,
        coordinatorPk
      )

      cmds.push(cmd)
      msgs.push(msg)
    }

    // Insert user messages into msg tree
    let msgIdxs = []
    for (let i = 0; i < batchSize; i++) {
      msgTree.insert(multiHash(msgs[i]))
      msgIdxs.push(msgTree.nextIndex - 1)
    }

    // Generate circuit inputs
    let msgTreeBatchPathElements = []
    let msgTreeBatchPathIndexes = []
    const msgTreeBatchStartIndex = msgIdxs[0]

    let stateTreeBatchRaw = []
    let stateTreeBatchRoot = []
    let stateTreeBatchPathElements = []
    let stateTreeBatchPathIndexes = []

    let userVoteOptionsBatchRoot = []
    let userVoteOptionsBatchPathElements = []
    let userVoteOptionsBatchPathIndexes = []

    let voteOptionTreeBatchLeafRaw = []

    let ecdhPublicKeyBatch = []

    for (let i = 0; i < batchSize; i++) {
      // Get relevant PATHs
      const cmd = cmds[i]
      const msg = msgs[i]
      const user = users[i]

      const [
        msgTreePathElements,
        msgTreePathIndexes
      ] = msgTree.getPathUpdate(msgIdxs[i])

      msgTreeBatchPathElements.push(msgTreePathElements)
      msgTreeBatchPathIndexes.push(msgTreePathIndexes)

      const [
        stateTreePathElements,
        stateTreePathIndexes
      ] = stateTree.getPathUpdate(user.userIndex)

      stateTreeBatchRaw.push(
        stateTree.leavesRaw[user.userIndex]
      )

      stateTreeBatchRoot.push(stateTree.root)
      stateTreeBatchPathElements.push(stateTreePathElements)
      stateTreeBatchPathIndexes.push(stateTreePathIndexes)

      const userVoteOptionIndex = parseInt(cmd[3])

      const [
        userVoteOptionsPathElements,
        userVoteOptionsPathIndexes
      ] = user.userVoteOptionTree.getPathUpdate(userVoteOptionIndex)

      userVoteOptionsBatchRoot.push(user.userVoteOptionTree.root)
      userVoteOptionsBatchPathElements.push(userVoteOptionsPathElements)
      userVoteOptionsBatchPathIndexes.push(userVoteOptionsPathIndexes)

      voteOptionTreeBatchLeafRaw.push(user.userVoteOptionTree.leavesRaw[userVoteOptionIndex])

      ecdhPublicKeyBatch.push(user.ephemeralPk)

      // Process command in state tree
      // acc stands for accumulator
      const [ accStateTree, accUserVoteOptionTree ] = processMessage(
        coordinatorSk,
        user.ephemeralPk,
        msg,
        stateTree,
        user.userVoteOptionTree
      )

      stateTree = accStateTree
      user.userVoteOptionTree = accUserVoteOptionTree
    }

    const stateTreeMaxIndex = BigInt(stateTree.nextIndex - 1)
    const voteOptionsMaxIndex = BigInt(voteOptionTree.nextIndex - 1)

    // After processing all commands, insert random leaf
    const randomLeafRoot = stateTree.root
    const randomLeaf = randomPrivateKey()
    const [
      randomLeafPathElements,
      _
    ] = stateTree.getPathUpdate(0)

    const circuitInputs = stringifyBigInts({
      'coordinator_public_key': coordinatorPk,
      'message': msgs,
      'msg_tree_root': msgTree.root,
      'msg_tree_path_elements': msgTreeBatchPathElements,
      'msg_tree_batch_start_index': msgTreeBatchStartIndex,
      'random_leaf': randomLeaf,
      'random_leaf_root': randomLeafRoot,
      'random_leaf_path_elements': randomLeafPathElements,
      'vote_options_leaf_raw': voteOptionTreeBatchLeafRaw,
      'vote_options_tree_root': userVoteOptionsBatchRoot,
      'vote_options_tree_path_elements': userVoteOptionsBatchPathElements,
      'vote_options_tree_path_index': userVoteOptionsBatchPathIndexes,
      'vote_options_max_leaf_index': voteOptionsMaxIndex,
      'state_tree_data_raw': stateTreeBatchRaw,
      'state_tree_max_leaf_index': stateTreeMaxIndex,
      'state_tree_root': stateTreeBatchRoot,
      'state_tree_path_elements': stateTreeBatchPathElements,
      'state_tree_path_index': stateTreeBatchPathIndexes,
      'ecdh_private_key': babyJubJubPrivateKey(coordinatorSk),
      'ecdh_public_key': ecdhPublicKeyBatch
    })

    const witness = circuit.calculateWitness(circuitInputs)
    const idx = circuit.getSignalIdx('main.root')
    const circuitNewStateRoot = witness[idx].toString()

    // Finally update state tree random leaf
    stateTree.update(0, randomLeaf)

    assert.equal(stateTree.root.toString(), circuitNewStateRoot)
  })
})
