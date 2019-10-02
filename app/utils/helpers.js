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

module.exports = {
  flipBits,
  stringifyBigInts: _stringifyBigInts,
  unstringifyBigInts: _unstringifyBigInts
}
