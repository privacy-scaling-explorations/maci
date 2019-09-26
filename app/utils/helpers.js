// @flow

// Decimal to Binary array
const dec2bin = (x: Number, length: Number): Array<Number> => {
  return (x)
    .toString(2)
    .padStart(length, '0')
    .split('')
    .map((y: String): Number => parseInt(y))
}

module.exports = {
  dec2bin
}
