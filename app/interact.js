// @flow

const { maciContract } = require('./utils/contracts')
const { randomPrivateKey } = require('./utils/crypto')
const { stringifyBigInts } = require('./utils/helpers')

const main = async () => {
  const a = Array(5).fill(1).map(randomPrivateKey).map(stringifyBigInts)

  await maciContract.pubishMessage(a)

  console.log(`Submitted: ${a}`)
}

main()
