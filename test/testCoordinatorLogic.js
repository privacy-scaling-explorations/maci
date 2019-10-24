
const supertest = require('supertest')
const ethers = require('ethers')

const { stringifyBigInts, unstringifyBigInts } = require('../_build/utils/helpers')
const { randomPrivateKey, privateToPublicKey, encrypt } = require('../_build/utils/crypto')
const { app } = require('../_build/index')

const { eddsa, mimc7 } = require('circomlib')

// Settings up provider and contract instance
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
  initialMessage = false // is this an initial message?
) => {
  const userPublicKey = privateToPublicKey(userPrivateKey)

  const userPosition = [
    ...userPublicKey,
    voteAction
  ]

  let userMessage 

  // Creates initial message
  if (initialMessage) {
    userMessage = [
      ...userPosition,
      0n, 0n, voteAction
    ]
  } else {
    const newPublicKey = newPrivateKey !== null ? privateToPublicKey(newPrivateKey) : userPublicKey
    const newVote = newVoteAction !== null ? newVoteAction : voteAction

    userMessage = [
      ...userPosition,
      ...newPublicKey,
      newVote
    ]
  }

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

  const userPrvKey = randomPrivateKey()
  const userPubKey = privateToPublicKey(userPrvKey)

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
    // User's voting position
    const userInitialEncryptedMessage = createMsg(
      coordinatorPublicKey,
      userPrvKey,
      0n
    )

    // Get current merkletree root (contract)
    const stateTreeRoot = await stateTreeContract.getRoot()

    // Get current merkletree root (local db)
    const coordinatorRoots = await supertest(app).get('/merkleroots')
    const coordinatorStateTreeRoot = coordinatorRoots.body.stateTree

    // Publish message
    await maciContract.pubishMessage(
      stringifyBigInts(userInitialEncryptedMessage),
      stringifyBigInts(userPubKey)
    )

    // Wait until merkle tree updates in smart contract
    await waitTillRootValueChanges(
      stateTreeRoot.toString(),
      async () => stateTreeContract.getRoot(),
      'StateTreeRoot values not updated after 60 seconds'
    )

    // Wait until merkle tree updates in database
    await waitTillRootValueChanges(
      coordinatorStateTreeRoot.toString(),
      async () => {
        const res = await supertest(app).get('/merkleroots')
        return res.body.stateTree.toString()
      },
      'Taking too long for `MessagePublished` event to be admitted'
    )

    // This means that new user is published
    // the merkleroot for the two statetrees should be the same
    const newUserStateTreeRoot = await stateTreeContract.getRoot()
    const newUserStateTreeRootStr = newUserStateTreeRoot.toString()

    const newCoordinatorRoots = await supertest(app).get('/merkleroots')
    const newCoordinatorStateTreeRoot = newCoordinatorRoots.body.stateTree

    assert.equal(newCoordinatorStateTreeRoot.toString(), newUserStateTreeRootStr)

    // insert -> insert -> update

    // insert -> insert (fail) -> insert
  })
})
