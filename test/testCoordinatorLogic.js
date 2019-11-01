const supertest = require('supertest')
const ethers = require('ethers')

const { ganacheConfig, merkleTreeConfig } = require('../maci-config')
const { createMerkleTree } = require('../_build/utils/merkletree')
const { stringifyBigInts, unstringifyBigInts } = require('../_build/utils/helpers')
const { randomPrivateKey, privateToPublicKey, encrypt } = require('../_build/utils/crypto')
const { initAndStartApp } = require('../_build/index')

const { eddsa, mimc7 } = require('circomlib')

const provider = new ethers.providers.JsonRpcProvider(ganacheConfig.host)
const privateKey = ganacheConfig.privateKey
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

describe('Coordinator Logic Tests', () => {
  let app
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
    app = await initAndStartApp()
    const resp = await supertest(app).get('/publickey')
    const { publicKey } = resp.body
    coordinatorPublicKey = unstringifyBigInts(publicKey)
  })

  it('/ should return 404', async () => {
    supertest(app)
      .get('/')
      .expect(404)
  })
})
