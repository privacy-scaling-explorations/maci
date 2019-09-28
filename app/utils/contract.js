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

const maciContractDef = require('../contracts/MACI.json')
// const maciContract = new ethers.Contract(maciContractAddress, maciContractDef.abi, provider)
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

// const registryMTContract = new ethers.Contract(
//   contractAddresses['registryMTAddress'],
//   merkleTreeContractDef.abi,
//   wallet
// )

const { createMerkleTree } = require('./merkletree')

const main = async () => {
  const a = '3841988603089958993112099136734571073807184520215994098488092942051012412900'
  const b = '12694174380082353188486235573921130397364225560561109825645490486049324271853'
  const c = '4035488248118855347271251960478993090777861856688670815823976937279433442094'
  const d = '12694174380082353188486235573921130397340354882481188553472712519604789930907'

  await maciContract.insertMessage(a)
  await maciContract.insertMessage(b)
  await maciContract.insertMessage(c)
  await maciContract.insertMessage(d)

  const maciRoot = await executionStateMTContract.getRoot()
  console.log(`MACI executionStateMTContract: ${maciRoot}`)

  const m = createMerkleTree(5, BigInt(0))
  m.insert(BigInt(a))
  m.insert(BigInt(b))
  m.insert(BigInt(c))
  m.insert(BigInt(d))

  console.log(`MerkleTree root: ${m.root}`)
}

main()
