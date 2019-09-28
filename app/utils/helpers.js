// @flow

const flipBits = (x: Array<Number>): Array<Number> => {
  return x
    .map((x: Number): Number => {
      if (x === 0) return 1
      return 0
    })
}

module.exports = {
  flipBits
}
