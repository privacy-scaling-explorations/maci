import {
    IncrementalQuadTree,
    bigInt,
    SnarkBigInt,
    hash5,
} from '../'

const ZERO_VALUE = bigInt(0)
const DEPTH = 4
const LEAVES_PER_NODE = 4
const MAX_LEAVES_PER_NODE = 5

const computeRoot = (
    depth: number,
    zeroValue: SnarkBigInt,
): SnarkBigInt => {
    const zeros: SnarkBigInt[] = []
    zeros.push(zeroValue)

    for (let i = 1; i < depth; i ++) {
        const node: SnarkBigInt[] = []
        for (let j = 0; j < MAX_LEAVES_PER_NODE; j ++) {
            node.push(zeros[i-1])
        }
        zeros.push(hash5(node))
    }

    const n: SnarkBigInt[] = []
    for (let i = 0; i < MAX_LEAVES_PER_NODE; i ++) {
        n.push(zeros[depth - 1])
    }

    return hash5(n)
}

describe('Quad Merkle Tree', () => {

    const tree = new IncrementalQuadTree(DEPTH, ZERO_VALUE, LEAVES_PER_NODE)

    it('Should calculate the correct root', () => {
        expect(computeRoot(DEPTH, ZERO_VALUE).toString())
            .toEqual(tree.root.toString())
    })
})
