
const supertest = require('supertest')
const ethers = require('ethers')

const { unstringifyBigInts } = require('../_build/utils/helpers')
const { randomPrivateKey, privateToPublicKey, decrypt } = require('../_build/utils/crypto')
const { app } = require('../_build/index')
const { getLatestDeployedAddress } = require('../_build/utils/helpers')

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
const executionStateMT = new ethers.Contract(
  merkleTreeContractDef.networks[merkleTreeNetworkTimestamps[1]].address,
  merkleTreeContractDef.abi,
  wallet
)
const registryMT = new ethers.Contract(
  merkleTreeContractDef.networks[merkleTreeNetworkTimestamps[0]].address,
  merkleTreeContractDef.abi,
  wallet
)

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
    // const merkleRootResp = 
  })
})
