// @flow

const ethers = require('ethers')
// const provider = ethers.getDefaultProvider()
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
const privateKey = '0x94a9f52a9ef7933f3865a91766cb5e12d25f62d6aecf1d768508d95526bfee29'
const wallet = new ethers.Wallet(privateKey, provider)

const maciContractAddress = '0xbc27B8dC5A1f1d548E0319E252C2E256D62B3596'
const maciContractDef = require('../contracts/MACI.json')
// const maciContract = new ethers.Contract(maciContractAddress, maciContractDef.abi, provider)
const maciContract = new ethers.Contract(maciContractAddress, maciContractDef.abi, wallet)

const { mimc7 } = require('circomlib')
const { createMerkleTree } = require('./merkletree')

const main = async () => {
  const a = '3841988603089958993112099136734571073807184520215994098488092942051012412900'
  const b = '12694174380082353188486235573921130397364225560561109825645490486049324271853'
  const c = '4035488248118855347271251960478993090777861856688670815823976937279433442094'
  const d = '12694174380082353188486235573921130397340354882481188553472712519604789930907'

  await maciContract.insert(a)
  await maciContract.insert(b)
  await maciContract.insert(c)
  await maciContract.insert(d)

  const maciRoot = await maciContract.root()
  console.log(`MACI Root: ${maciRoot}`)

  const m = createMerkleTree(2, BigInt(0))

  m.insert(BigInt(a))
  m.insert(BigInt(b))
  m.insert(BigInt(c))
  m.insert(BigInt(d))

  console.log(`merkletree root: ${m.root}`)
}

main()
