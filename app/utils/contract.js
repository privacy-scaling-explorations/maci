// @flow

const ethers = require('ethers')
// const provider = ethers.getDefaultProvider()
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')

const maciContractAddress = '0x76ccadf30aA8adc54dF391216805c46E39bdc78a'
const maciContractDef = require('../contracts/MACI.json')
const maciContract = new ethers.Contract(maciContractAddress, maciContractDef.abi, provider)

const { mimc7 } = require('circomlib')

const main = async () => {
  const a = await maciContract.mimcHashTest(1, 2)

  console.log(a.toString())

  const b = mimc7.hash(1, 2, 91).toString()

  console.log(b)
}

main()
