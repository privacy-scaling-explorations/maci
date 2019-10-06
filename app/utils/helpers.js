// @flow

const { stringifyBigInts, unstringifyBigInts } = require('snarkjs/src/stringifybigint')

const flipBits = (x: Array<Number>): Array<Number> => {
  return x
    .map((x: Number): Number => {
      if (x === 0) return 1
      return 0
    })
}

const _stringifyBigInts = (x: BigInt): String => stringifyBigInts(x)
const _unstringifyBigInts = (x: Any): BigInt => unstringifyBigInts(x)

const getLatestDeployedAddress = (contractJson: Object): String => {
  const { networks } = contractJson

  if (networks === undefined || networks.length === 0) {
    throw new Error('Contract not deployed yet!')
  }

  const latestTimestamp = Object.keys(networks).sort((a, b) => b - a)[0]

  return networks[latestTimestamp].address
}

module.exports = {
  flipBits,
  getLatestDeployedAddress,
  stringifyBigInts: _stringifyBigInts,
  unstringifyBigInts: _unstringifyBigInts
}
