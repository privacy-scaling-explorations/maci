// @flow

const { bigInt } = require('snarkjs')

const flipBits = (x: Array<Number>): Array<Number> => {
  return x
    .map((x: Number): Number => {
      if (x === 0) return 1
      return 0
    })
}

const stringifyBigInts = (o: Any): Any => {
  // eslint-disable-next-line valid-typeof
  if ((typeof (o) === 'bigint') || (o instanceof bigInt)) {
    return o.toString(10)
  } else if (Array.isArray(o)) {
    return o.map(stringifyBigInts)
  } else if (typeof o === 'object') {
    const res = {}
    for (let k in o) {
      res[k] = stringifyBigInts(o[k])
    }
    return res
  } else {
    return o
  }
}

const unstringifyBigInts = (o: Any): Any => {
  if ((typeof (o) === 'string') && (/^[0-9]+$/.test(o))) {
    return bigInt(o)
  } else if (Array.isArray(o)) {
    return o.map(unstringifyBigInts)
  } else if (typeof o === 'object') {
    const res = {}
    for (let k in o) {
      res[k] = unstringifyBigInts(o[k])
    }
    return res
  } else {
    return o
  }
}

module.exports = {
  flipBits,
  stringifyBigInts,
  unstringifyBigInts
}
