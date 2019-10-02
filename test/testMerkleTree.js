const MerkleTree = artifacts.require('./MerkleTree.sol')
const { createMerkleTree } = require('../_build/utils/merkletree')

contract('MerkleTree', ([owner]) => {
  const n1 = 21279832585910446005428488706555013844945993997473560159322188895856273092398n
  const n2 = 58046938963330851846154927853078139681080522834976871470120681972862700314410n
  const n3 = 48869896598428919793041129478133279178294567853142276261094715426824301555925n
  const n4 = 2051216592422994937886755928875470173110996771989424329915454080846834603127n

  let merkleTreeContract
  let merkleTreeJS

  beforeEach('Setup contract for each test', async () => {
    merkleTreeContract = await MerkleTree.new(4, 0)
    await merkleTreeContract.whitelistAddress(owner)

    merkleTreeJS = createMerkleTree(4, BigInt(0))
  })

  it('MerkleTree Insert', async () => {
    for (let n in [n1, n2, n3, n4]) {
      await merkleTreeContract.insert(n.toString())
      merkleTreeJS.insert(n)
    }

    for (let i = 0; i < 4; i++) {
      const leaf = await merkleTreeContract.getLeafAt(i.toString())
      assert.equal(merkleTreeJS.leafs[i].toString(), leaf.toString())
    }
  })

  it('MerkleTree Update', async () => {
    for (let n in [n1, n2, n3, n4]) {
      await merkleTreeContract.insert(n.toString())
      merkleTreeJS.insert(n)
    }

    const leafIndex = 1
    const newLeafValue = 72497820010176822798624954500809185021417527136581916487624992483771957765132n

    const [path, _] = merkleTreeJS.getPath(leafIndex)
    await merkleTreeContract.update(
      leafIndex,
      newLeafValue.toString(),
      path.map(x => x.toString())
    )
    merkleTreeJS.update(leafIndex, newLeafValue)

    const newRoot = await merkleTreeContract.getRoot()
    assert.equal(merkleTreeJS.root.toString(), newRoot.toString())
  })

  it('MerkleTree Update Fails', async () => {
    for (let n in [n1, n2, n3, n4]) {
      await merkleTreeContract.insert(n.toString())
      merkleTreeJS.insert(n)
    }

    try {
      const [path, _] = merkleTreeJS.getPath(0)

      await merkleTreeContract.update(
        0,
        n1.toString(),
        path.map(x => x.toString())
      )

      // Line above should throw an exception
      // this assertion should never be reached
      assert.equal(true, false)
    } catch(e) {}
  })

  it('Merkle Tree Root Calculation', async () => {
    let contractRoot

    // Make sure initial root is the same
    contractRoot = await merkleTreeContract.getRoot()
    assert.equal(merkleTreeJS.root.toString(), contractRoot.toString())

    // Insert items and validate the root will be the same
    for (let n in [n1, n2, n3, n4]) {
      await merkleTreeContract.insert(n.toString())
      merkleTreeJS.insert(n)

      contractRoot = await merkleTreeContract.getRoot()
      assert.equal(merkleTreeJS.root.toString(), contractRoot)
    }
  })
})
