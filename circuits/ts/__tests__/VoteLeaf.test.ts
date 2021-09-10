jest.setTimeout(90000)

import {
    genWitness,
    getSignalByName,
} from './utils'

import {
    stringifyBigInts,
    VoteLeaf
} from 'maci-crypto'

describe('VoteLeaf circuit', () => {
  const valid_circuit = 'voteLeaf_test'
  const calc_circuit = 'voteLeafSquared_test'

    it('Valid vote leaf', async () => {
      const [ pos, neg ] = [ BigInt(128), BigInt(256) ]
      const packedLeaf = (new VoteLeaf(pos, neg).pack().toString()

      const witness = await genWitness(valid_circuit, { packedLeaf })
      const out = await getSignalByName(valid_circuit, witness, `main.out`)
      const actual_pos = await getSignalByName(valid_circuit, witness, `pos.out`)
      const actual_neg = await getSignalByName(valid_circuit, witness, `neg.out`)

      expect(actual_pos).toEqual(pos)
      expect(actual_neg).toEqual(neg)
      expect(out).toEqual(1)
    })

    it('Invalid vote leaf', async () => {
      const packedLeaf = BigInt(Math.pow(2, 50)).toString()

      const witness = await genWitness(valid_circuit, { packedLeaf })
      const out = await getSignalByName(valid_circuit, witness, `main.out`)

      expect(out).toEqual(0)
    })

    it('Valid squared calc', async() => {
      const [ pos, neg ] = [ BigInt(128), BigInt(256) ]
      const packedLeaf = (new VoteLeaf(pos, neg).pack().toString()
      const squared = Math.pow((pos + neg), 2)

      const witness = await genWitness(calc_circuit, { packedLeaf })
      const actual_squared = await getSignalByName(calc_circuit, witness, `squared.out`)
      const actual_pos = Math.sqrt(actual_squared) - neg
      const actual_neg = Math.sqrt(actual_squred) - pos

      expect(actual_squared).toEqual(squared)
      expect(actual_pos).toEqual(pos)
      expect(actual_neg).toEqual(neg)
    })

})
