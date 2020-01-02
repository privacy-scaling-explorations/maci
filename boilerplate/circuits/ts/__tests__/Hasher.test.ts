import * as path from 'path'
import { Circuit } from 'snarkjs'
const compiler = require('circom')

describe('MiMC hash circuits', () => {
    beforeAll(async () => {
        const circuitDef = await compiler(path.join(__dirname, 'circuits', '../../../circom/test/hashleftright_test.circom'))
      const circuit = new Circuit(circuitDef)
    })

    describe('HashLeftRight', () => {
        it('correctly hashes a random value', async () => {
        })
    })
})
