
// @flow
// npx ganache-cli -l 8000000 -m helloworld
import type { ContractAddresses } from './settings'

const ethers = require('ethers')
const { getContractAddresses } = require('./settings')

// const provider = ethers.getDefaultProvider()
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
const privateKey = '0x94a9f52a9ef7933f3865a91766cb5e12d25f62d6aecf1d768508d95526bfee29'
const wallet = new ethers.Wallet(privateKey, provider)

const contractAddresses: ContractAddresses = getContractAddresses()

// Read-only contract
// const maciContract = new ethers.Contract(maciContractAddress, maciContractDef.abi, provider)
const maciContractDef = require('../contracts/MACI.json')
const maciContract = new ethers.Contract(
  contractAddresses.MACI_CONTRACT_ADDRESS,
  maciContractDef.abi,
  wallet
)

const merkleTreeContractDef = require('../contracts/MerkleTree.json')
const stateTreeContract = new ethers.Contract(
  contractAddresses.STATE_TREE_ADDRESS,
  merkleTreeContractDef.abi,
  wallet
)

const resultTreeContract = new ethers.Contract(
  contractAddresses.RESULT_TREE_ADDRESS,
  merkleTreeContractDef.abi,
  wallet
)

module.exports = {
  contractAddresses,
  maciContract,
  resultTreeContract,
  stateTreeContract
}
