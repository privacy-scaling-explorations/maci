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

// Workaround to link external libraries
// https://github.com/ethers-io/ethers.js/issues/195#issuecomment-396350174
const linkLibraries = (bytecode, libName, libAddress) => {
  let symbol = '__' + libName + '_'.repeat(40 - libName.length - 2)
  return bytecode.split(symbol).join(libAddress.toLowerCase().substr(2))
}

module.exports = {
  flipBits,
  linkLibraries,
  stringifyBigInts: _stringifyBigInts,
  unstringifyBigInts: _unstringifyBigInts
}
