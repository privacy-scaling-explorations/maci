const supertest = require('supertest')
const ethers = require('ethers')

const { merkleTreeConfig } = require('./config')
const { createMerkleTree } = require('../_build/utils/merkletree')
const { stringifyBigInts, unstringifyBigInts } = require('../_build/utils/helpers')
const { randomPrivateKey, privateToPublicKey, encrypt } = require('../_build/utils/crypto')
const { app } = require('../_build/index')

const { eddsa, mimc7 } = require('circomlib')

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
const privateKey = '0x989d5b4da447ba1c7f5d48e3b4310d0eec08d4abd0f126b58249598abd8f4c37'
const wallet = new ethers.Wallet(privateKey, provider)

const { getContractAddresses } = require('../_build/utils/settings')
const {
  MACI_CONTRACT_ADDRESS,
  STATE_TREE_ADDRESS,
  RESULT_TREE_ADDRESS
} = getContractAddresses()

const maciContractDef = require('../_build/contracts/MACI.json')
const maciContract = new ethers.Contract(
  MACI_CONTRACT_ADDRESS,
  maciContractDef.abi,
  wallet
)

const merkleTreeContractDef = require('../_build/contracts/MerkleTree.json')
const stateTreeContract = new ethers.Contract(
  STATE_TREE_ADDRESS,
  merkleTreeContractDef.abi,
  wallet
)
const resultTreeContract = new ethers.Contract(
  RESULT_TREE_ADDRESS,
  merkleTreeContractDef.abi,
  wallet
)

// Sleep to ensure events are emitted
const sleep = (ms) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

// Generic function to wait for root value changes
const waitTillRootValueChanges = async (originalVal, f, errMsg) => {
  let sameRoot = true
  let loopIter = 0
  while (sameRoot) {
    const curRoot = await f()
    sameRoot = originalVal.toString() === curRoot.toString()

    if (sameRoot) {
      await sleep(5000) // Sleep 5 seconds
      loopIter += 1

      // Wait 1 minute max
      if (loopIter > 12) {
        throw new Error(errMsg)
      }
    }
  }
}

// Creates a message in an encrypted message format
// this is so it can broadcast it to the smart contract
const createMsg = (
  coordinatorPublicKey,
  userPrivateKey,
  voteAction, // Previous vote action, if its an initial message then it'll be the primary one
  newPrivateKey = null, // Used when user wants to update their position
  newVoteAction = null,
) => {
  const userPublicKey = privateToPublicKey(userPrivateKey)

  const userPosition = [
    ...userPublicKey,
    voteAction
  ]

  const newPublicKey = newPrivateKey !== null ? privateToPublicKey(newPrivateKey) : userPublicKey
  const newVote = newVoteAction !== null ? newVoteAction : voteAction

  const userMessage = [
    ...userPosition,
    ...newPublicKey,
    newVote
  ]

  const userMessageHash = mimc7.multiHash(userMessage)
  const signature = eddsa.signMiMC(
    userPrivateKey.toString(),
    userMessageHash
  )

  // Insert signature into message
  const userMessageWithSig = [
    ...userMessage,
    signature.R8[0],
    signature.R8[1],
    signature.S
  ]

  // Encrypt message with shared key
  const userEncryptedMessage = encrypt(
    userMessageWithSig,
    newPrivateKey !== null ? newPrivateKey : userPrivateKey,
    coordinatorPublicKey
  )

  return userEncryptedMessage
}

describe('GET /', () => {
  let coordinatorPublicKey

  const stateTreeJS = createMerkleTree(
    merkleTreeConfig.treeDepth,
    merkleTreeConfig.zeroValue
  )
  const resultTreeJS = createMerkleTree(
    merkleTreeConfig.treeDepth,
    merkleTreeConfig.zeroValue
  )

  before('Setup Contract for coordinator test', async () => {
    const resp = await supertest(app).get('/publickey')
    const { publicKey } = resp.body
    coordinatorPublicKey = unstringifyBigInts(publicKey)
  })

  it('/ should return 404', async () => {
    supertest(app)
      .get('/')
      .expect(404)
  })

  it('testing coordinator logic', async () => {
    // Tests coordinator logic
    // 1. Inserts new user and checks stateTree
    //    and resultTree merkleroots
    // 2. Inserts new user and checks if stateTree
    //    and resultTree merkleroots are updated
    // 3. Insert a new user (but with invalidSignature)
    //    stateTree should update, but resultTree shouldn't
    // 4. Updates a new user (both stateTree and resultTree should update)

    // User's initial private key
    const user1PrivateKey = randomPrivateKey()
    const user1PublicKey = privateToPublicKey(user1PrivateKey)

    const user2PrivateKey = randomPrivateKey()
    const user2PublicKey = privateToPublicKey(user2PrivateKey)

    // User1 initial message
    const user1Message1 = createMsg(
      coordinatorPublicKey,
      user1PrivateKey,
      0n
    )

    // Get current merkletree roots
    let stateTreeRoot = await stateTreeContract.getRoot()
    let resultTreeRoot = await resultTreeContract.getRoot()
    let coordinatorRoots = await supertest(app).get('/merkleroots')

    // Publish message
    await maciContract.pubishMessage(
      stringifyBigInts(user1Message1),
      stringifyBigInts(user1PublicKey)
    )

    // Wait until merkle tree updates in smart contract
    await waitTillRootValueChanges(
      stateTreeRoot.toString(),
      async () => stateTreeContract.getRoot(),
      'stateTreeContract root value not updated after 60 seconds'
    )
    await waitTillRootValueChanges(
      resultTreeRoot.toString(),
      async () => resultTreeContract.getRoot(),
      'resultTreeContract root value not updated after 60 seconds'
    )

    // Wait until merkle tree updates in database
    await waitTillRootValueChanges(
      coordinatorRoots.body.stateTree.toString(),
      async () => {
        const res = await supertest(app).get('/merkleroots')
        return res.body.stateTree.toString()
      },
      'coordinator stateTree root value not updated after 60 seconds'
    )
    await waitTillRootValueChanges(
      coordinatorRoots.body.resultTree.toString(),
      async () => {
        const res = await supertest(app).get('/merkleroots')
        return res.body.resultTree.toString()
      },
      'coordinator resultTree root value not updated after 60 seconds'
    )

    // This means that new user is published
    // the merkleroot for the two statetrees should be the same
    resultTreeRoot = await resultTreeContract.getRoot()
    stateTreeRoot = await stateTreeContract.getRoot()
    coordinatorRoots = await supertest(app).get('/merkleroots')

    // Assert roots are the same
    assert.equal(
      coordinatorRoots.body.stateTree.toString(),
      stateTreeRoot.toString()
    )

    assert.equal(
      stateTreeRoot.toString(),
      resultTreeRoot.toString()
    )

    // Update local state
    stateTreeJS.insert(user1Message1)
    resultTreeJS.insert(user1Message1)

    // Ensure local state syncs up
    assert.equal(
      stateTreeRoot.toString(),
      stateTreeJS.root.toString(),
    )

    assert.equal(
      stateTreeRoot.toString(),
      resultTreeJS.root.toString(),
    )

    // User2 Initial Message
    const user2Message1 = createMsg(
      coordinatorPublicKey,
      user2PrivateKey,
      0n
    )

    // Publish (should succeed)
    await maciContract.pubishMessage(
      stringifyBigInts(user2Message1),
      stringifyBigInts(user2PublicKey)
    )

    // Wait until merkle tree updates in smart contract
    await waitTillRootValueChanges(
      stateTreeRoot.toString(),
      async () => stateTreeContract.getRoot(),
      'stateTreeContract root value not updated after 60 seconds'
    )
    await waitTillRootValueChanges(
      resultTreeRoot.toString(),
      async () => resultTreeContract.getRoot(),
      'resultTreeContract root value not updated after 60 seconds'
    )

    // Wait until merkle tree updates in database
    await waitTillRootValueChanges(
      coordinatorRoots.body.stateTree.toString(),
      async () => {
        const res = await supertest(app).get('/merkleroots')
        return res.body.stateTree.toString()
      },
      'coordinator stateTree root value not updated after 60 seconds'
    )
    await waitTillRootValueChanges(
      coordinatorRoots.body.resultTree.toString(),
      async () => {
        const res = await supertest(app).get('/merkleroots')
        return res.body.resultTree.toString()
      },
      'coordinator resultTree root value not updated after 60 seconds'
    )

    resultTreeRoot = await resultTreeContract.getRoot()
    stateTreeRoot = await stateTreeContract.getRoot()
    coordinatorRoots = await supertest(app).get('/merkleroots')

    assert.equal(
      coordinatorRoots.body.stateTree.toString(),
      stateTreeRoot.toString()
    )

    assert.equal(
      stateTreeRoot.toString(),
      resultTreeRoot.toString()
    )

    // Update local state
    stateTreeJS.insert(user2Message1)
    resultTreeJS.insert(user2Message1)

    // Ensure local state syncs up
    assert.equal(
      stateTreeRoot.toString(),
      stateTreeJS.root.toString(),
    )

    assert.equal(
      stateTreeRoot.toString(),
      resultTreeJS.root.toString(),
    )

    // insert -> insert -> update

    // insert -> insert (fail) -> insert
  })
})
