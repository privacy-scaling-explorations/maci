const path = require('path')
const { assert } = require('chai')
const compiler = require('circom')
const { stringifyBigInts, unstringifyBigInts } = require('../_build/utils/helpers')
const { Circuit } = require('snarkjs')
const { hashLeftRight } = require('../_build/utils/crypto')

const {
  randomPrivateKey,
  privateToPublicKey,
  encrypt,
  sign,
  ecdh,
  multiHash
} = require('../_build/utils/crypto')

describe('Circom Ciruits', () => {
  it('CalculateTotal', async () => {
    const circuitDef = await compiler(path.join(__dirname, 'calculateTotal_test.circom'))
    const circuit = new Circuit(circuitDef)

    const nums = [3, 3, 3, 3, 2, 4]
    const sum = nums.reduce((a, b) => a + b, 0)

    const circuitInputs = {}
    for (let i=0; i < nums.length; i++) {
      circuitInputs['nums[' + i.toString() + ']'] = nums[i].toString()
    }

    const witness = circuit.calculateWitness(circuitInputs)
    const resultIdx = circuit.getSignalIdx('main.sum')
    const result = witness[resultIdx]
    assert.equal(result.toString(), sum.toString())
  })

  //it('QuadVoteTally', async () => {
    //const circuitDef = await compiler(path.join(__dirname, 'quadVoteTally_test.circom'))
    //const circuit = new Circuit(circuitDef)

    //const NUM_VOTE_OPTIONS = 2
    //const expectedResults = []

    //const userVoteLeaves = [
      //[0, 0], // the zero leaf, which the circuit will ignore
      //[3, 5],
      //[7, 11]
    //]

    //for (let i = 0; i < NUM_VOTE_OPTIONS; i++) {
      //let subtotal = 0
      //for (let j = 0; j < userVoteLeaves.length; j++) {
        //subtotal += userVoteLeaves[j][i]
      //}
      //expectedResults.push(subtotal)
    //}

    //const circuitInputs = {
      ////'results[0]': expectedResults[0],
      ////'results[1]': 22, //expectedResults[1],
      //'voteLeaves[0][0]': userVoteLeaves[0][0],
      //'voteLeaves[0][1]': userVoteLeaves[0][1],
      //'voteLeaves[1][0]': userVoteLeaves[1][0],
      //'voteLeaves[1][1]': userVoteLeaves[1][1],
      //'voteLeaves[2][0]': userVoteLeaves[2][0],
      //'voteLeaves[2][1]': userVoteLeaves[2][1],
    //}

    //const witness = circuit.calculateWitness(circuitInputs)
    //const result0iIdx = circuit.getSignalIdx('main.results[0]')
    //const result1iIdx = circuit.getSignalIdx('main.results[1]')
    //const result0 = witness[result0iIdx]
    //const result1 = witness[result1iIdx]

    //console.log(result0, result1)
  //})
})
