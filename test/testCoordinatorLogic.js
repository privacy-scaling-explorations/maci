
const supertest = require('supertest')
const ethers = require('ethers')

const { stringifyBigInts, unstringifyBigInts } = require('../_build/utils/helpers')
const { randomPrivateKey, privateToPublicKey, encrypt } = require('../_build/utils/crypto')
const { app } = require('../_build/index')
const { getLatestDeployedAddress } = require('../_build/utils/helpers')

const { eddsa, mimc7 } = require('circomlib')

// Settings up provider and contract instance
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
const privateKey = '0x989d5b4da447ba1c7f5d48e3b4310d0eec08d4abd0f126b58249598abd8f4c37'
const wallet = new ethers.Wallet(privateKey, provider)

const maciContractDef = require('../_build/contracts/MACI.json')
const maciContract = new ethers.Contract(
  getLatestDeployedAddress(maciContractDef),
  maciContractDef.abi,
  wallet
)

const merkleTreeContractDef = require('../_build/contracts/MerkleTree.json')
const merkleTreeNetworkTimestamps = Object.keys(merkleTreeContractDef.networks)
  .sort((a, b) => b-a)
const stateTree = new ethers.Contract(
  merkleTreeContractDef.networks[merkleTreeNetworkTimestamps[1]].address,
  merkleTreeContractDef.abi,
  wallet
)
const result = new ethers.Contract(
  merkleTreeContractDef.networks[merkleTreeNetworkTimestamps[0]].address,
  merkleTreeContractDef.abi,
  wallet
)

const sleep = (ms) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

describe('GET /', function () {
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
    // User's voteing position
    const userPosition = [
      ...userPubKey,
      0n // Action
    ]

    // Initial message (to obtain signature)
    const userInitialMessage = [
      ...userPosition,
      0n, 0n, 0n
    ]

    const userMessageHash = mimc7.multiHash(userInitialMessage)
    const signature = eddsa.signMiMC(
      userPrvKey.toString(),
      userMessageHash
    )

    // Insert signature into message
    const userInitialMessageWithSig = [
      ...userInitialMessage,
      signature.R8[0],
      signature.R8[1],
      signature.S
    ]

    // Encrypt message with shared key
    const userInitialEncryptedMessage = encrypt(
      userInitialMessageWithSig,
      userPrvKey,
      coordinatorPublicKey
    )

    // Get current merkletree root
    const stateTreeRoot = await stateTree.getRoot()
    let sameStateTreeRoot = true
    let loopIter = 0

    // Publish message
    await maciContract.pubishMessage(
      stringifyBigInts(userInitialEncryptedMessage),
      stringifyBigInts(userPubKey)
    )

    // Wait until merkle tree updates
    while (sameStateTreeRoot) {
      const curStateTreeRoot = await stateTree.getRoot()
      sameStateTreeRoot = curStateTreeRoot.toString() === stateTreeRoot.toString()

      if (sameStateTreeRoot) {
        await sleep(5000) // Sleep 5 seconds
        loopIter += 1

        // Wait 1 minute max
        if (loopIter > 12) {
          throw new Error('Taking too long for `MessagePublished` event to be admitted')
        }
      }
    }

    // This means that new user should be published
    // make sure the merkleroot is the same
    const newUserStateTreeRoot = await stateTree.getRoot()
    const coordinatorRoots = await supertest(app).get('/merkleroots')
    const coordinatorStateTreeRoot = coordinatorRoots.body.stateTree
    const newUserStateTreeRootStr = newUserStateTreeRoot.toString()

    // TODO: Use database to store stuff
    console.log(coordinatorStateTreeRoot)
    console.log(newUserStateTreeRootStr)
  })
})
