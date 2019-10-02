
// @flow
// npx ganache-cli -l 8000000 -m helloworld

const ethers = require('ethers')
// const provider = ethers.getDefaultProvider()
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
const privateKey = '0x94a9f52a9ef7933f3865a91766cb5e12d25f62d6aecf1d768508d95526bfee29'
const wallet = new ethers.Wallet(privateKey, provider)

const contractAddresses = {
  'maciAddress': '0x80B97b69CbacAF65F93845293670A390E9bE3e6B',
  'executionStateMTAddress': '0x1536B4a2064A090dfa83cb6433c9bF0bf9f8416f',
  'registryMTAddress': '0x65402165BcD85eB7ceb096C6fCB3b4cFbcD17Ae3'
}

// Read-only contract
// const maciContract = new ethers.Contract(maciContractAddress, maciContractDef.abi, provider)
const maciContractDef = require('../contracts/MACI.json')
const maciContract = new ethers.Contract(
  contractAddresses['maciAddress'],
  maciContractDef.abi,
  wallet
)

const merkleTreeContractDef = require('../contracts/MerkleTree.json')
const executionStateMTContract = new ethers.Contract(
  contractAddresses['executionStateMTAddress'],
  merkleTreeContractDef.abi,
  wallet
)

const registryMTContract = new ethers.Contract(
  contractAddresses['registryMTAddress'],
  merkleTreeContractDef.abi,
  wallet
)

module.exports = {
  contractAddresses,
  maciContract,
  executionStateMTContract,
  registryMTContract
}
