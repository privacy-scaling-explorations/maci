import * as fs from 'fs'
import * as path from 'path'

import { IncrementalQuinTree } from 'maci-crypto'
import {
    Ballot,
} from 'maci-domainobjs'

const genEmptyBallotRootsContract = (
): string => {

    const template = fs.readFileSync(
        path.join(
            __dirname,
            '..',
            'ts',
            'EmptyBallotRoots.sol.template',
        ),
    ).toString()

    let r = ''
    for (let i = 1; i < 6; i ++) {
        const ballot = new Ballot(5 ** i, i)
        const z = ballot.hash()
        // The empty Ballot tree root
        const ballotTree = new IncrementalQuinTree(10, BigInt(z), 5)
        const root = ballotTree.root

        r += `        emptyBallotRoots[${i-1}] = uint256(${root});\n`

    }

    const generated = template
        .replace('<% ROOTS %>', r)
    return generated
}


if (require.main === module) {
    const generated = genEmptyBallotRootsContract()
    console.log(generated)
}

export {
    genEmptyBallotRootsContract,
}
