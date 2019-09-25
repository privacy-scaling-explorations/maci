// @flow

const ethers = require('ethers')
// const provider = ethers.getDefaultProvider()
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')

const maciContractAddress = '0x4CEd6657a4d7c84521F773a646ec357Bd7788D06'
const maciContractDef = require('../contracts/MACI.json')
const maciContract = new ethers.Contract(maciContractAddress, maciContractDef.abi, provider)

const main = async () => {
  const a = await maciContract.hashLeftRight(0, 0)

  console.log(a)
}

main()
