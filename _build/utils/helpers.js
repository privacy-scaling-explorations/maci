//      

const { stringifyBigInts, unstringifyBigInts } = require('snarkjs/src/stringifybigint')

const flipBits = (x               )                => {
  return x
    .map((x        )         => {
      if (x === 0) return 1
      return 0
    })
}

const _stringifyBigInts = (x        )         => stringifyBigInts(x)
const _unstringifyBigInts = (x     )         => unstringifyBigInts(x)

module.exports = {
  flipBits,
  stringifyBigInts: _stringifyBigInts,
  unstringifyBigInts: _unstringifyBigInts
}
