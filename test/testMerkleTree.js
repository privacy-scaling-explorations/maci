const ethers = require('ethers')

const { mimcAddress } = require('../_build/contracts/DeployedAddresses.json')
const { dbPool } = require('../_build/utils/db')
const { stringifyBigInts, linkLibraries } = require('../_build/utils/helpers')
const { merkleTreeConfig } = require('./config')
const { createMerkleTree, saveMerkleTreeToDb, loadMerkleTreeFromDb } = require('../_build/utils/merkletree')
const { mimc7 } = require('circomlib')

const merkletreeDef = require('../_build/contracts/MerkleTree.json')
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545')
const privateKey = '0x989d5b4da447ba1c7f5d48e3b4310d0eec08d4abd0f126b58249598abd8f4c37'
const wallet = new ethers.Wallet(privateKey, provider)

const merkleTreeFactory = new ethers.ContractFactory(
  merkletreeDef.abi,
  linkLibraries(merkletreeDef.bytecode, 'MiMC', mimcAddress),
  wallet
)

describe('MerkleTree', () => {
  const n1 = [
    2797420674019184276147165048582285497712289330881034162721130566n,
    8427934753412846593442005159092452875457323490236044611796073070n,
    9469411125398348049965633920124821744896988621636234325004950105n,
    2923302930217940454917090977863765617169883907003492572894363522n,
    0n
  ]
  const n2 = [
    1330609023410448726619682254666295116250929207613706337286188962n,
    7283492628341460800002638659392299735744302068883365423320392808n,
    96864075774826222663476299560881317026395539922755910892839713n,
    2456138780885236327953645884408972334942885107455927146618659151n,
    1n
  ]
  const n3 = [
    6936974700787696040635595887625314144179272410714180932753872117n,
    6250380342377444598507603048104066119476512507053655992814127749n,
    5668013437164926280306746546748473260430823993035190591406122953n,
    1585442726572570137149962979954409407260045685953150336947296067n,
    5n
  ]
  const n4 = [
    5229547711681003634222565892199961035333819119411843822418215696n,
    7706096548158393230435363596458038582375557031601041353397380351n,
    3909458901148920235564639377356912641542827392978411156375333476n,
    1969937445135844943809267310847101382855620527876925674981003198n,
    9n
  ]
  const ns = [n1, n2, n3, n4]

  let merkleTreeContract
  let merkleTreeJS

  beforeEach('Setup contract for each test', async () => {
    merkleTreeContract = await merkleTreeFactory.deploy(4, 0)
    await merkleTreeContract.deployed()
    await merkleTreeContract.whitelistAddress(wallet.address)

    merkleTreeJS = createMerkleTree(
      merkleTreeConfig.treeDepth,
      merkleTreeConfig.zeroValue
    )
  })

  it('MerkleTree Insert', async () => {
    for (let n in ns) {
      const h = mimc7.multiHash(n)

      await merkleTreeContract.insert(h.toString())
      merkleTreeJS.insert(n, [0n, 0n])
    }

    for (let i = 0; i < ns.length; i++) {
      const leaf = await merkleTreeContract.getLeafAt(i.toString())
      assert.equal(merkleTreeJS.leaves[i].toString(), leaf.toString())
    }
  })

  it('MerkleTree Update', async () => {
    for (let n in ns) {
      const h = mimc7.multiHash(n)

      await merkleTreeContract.insert(h.toString())
      merkleTreeJS.insert(n, [0n, 0n])
    }

    const leafIndex = 1
    const newLeafRawValue = [1n, 2n, 3n, 4n, 5n]
    const newLeafValue = mimc7.multiHash(newLeafRawValue)

    const [path, _] = merkleTreeJS.getPath(leafIndex)
    await merkleTreeContract.update(
      leafIndex,
      newLeafValue.toString(),
      path.map(x => x.toString())
    )
    merkleTreeJS.update(leafIndex, newLeafRawValue, [0n, 0n])

    const newRoot = await merkleTreeContract.getRoot()
    assert.equal(merkleTreeJS.root.toString(), newRoot.toString())
  })

  it('MerkleTree Invalid Update Fails', async () => {
    for (let n in ns) {
      const h = mimc7.multiHash(n)

      await merkleTreeContract.insert(h.toString())
      merkleTreeJS.insert(n, [0n, 0n])
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
    } catch (e) {}
  })

  it('Merkle Tree Root Calculation', async () => {
    let contractRoot

    // Make sure initial root is the same
    contractRoot = await merkleTreeContract.getRoot()
    assert.equal(merkleTreeJS.root.toString(), contractRoot.toString())

    // Insert items and validate the root will be the same
    for (let n in ns) {
      const h = mimc7.multiHash(n)

      await merkleTreeContract.insert(h.toString())
      merkleTreeJS.insert(n, [0n, 0n])

      contractRoot = await merkleTreeContract.getRoot()
      assert.equal(merkleTreeJS.root.toString(), contractRoot)
    }
  })

  it('Merkle Tree Serialization to/from Db', async () => {
    const mkName = 'TEST_MERKLE_TREE'
    const mk1 = createMerkleTree(4, 0n)

    // Need to save on every insert
    mk1.insert(n1, [42n, 32n])
    await saveMerkleTreeToDb(dbPool, mkName, mk1)
    mk1.insert(n2, [52n, 32n])
    await saveMerkleTreeToDb(dbPool, mkName, mk1)

    const mk2 = await loadMerkleTreeFromDb(dbPool, mkName)

    const stringify = (x) => JSON.stringify(stringifyBigInts(x))

    assert.equal(mk1.nextIndex, mk2.nextIndex)
    assert.equal(mk1.depth.toString(), mk2.depth.toString())
    assert.equal(mk1.leafNumber.toString(), mk2.leafNumber.toString())
    assert.equal(mk1.root.toString(), mk2.root.toString())
    assert.equal(stringify(mk1.filledPaths), stringify(mk2.filledPaths))
    assert.equal(stringify(mk1.filledSubtrees), stringify(mk2.filledSubtrees))
    assert.equal(stringify(mk1.leaves), stringify(mk2.leaves))
    assert.equal(stringify(mk1.ecdhPublicKeys), stringify(mk2.ecdhPublicKeys))
    assert.equal(stringify(mk1.encryptedValues), stringify(mk2.encryptedValues))

    // Delete from merkletree
    await dbPool.query({
      text: `DELETE FROM leaves
             WHERE merkletree_id=(SELECT id from merkletrees WHERE name=$1);`,
      values: [mkName]
    })

    await dbPool.query({
      text: 'DELETE FROM merkletrees WHERE name=$1',
      values: [mkName]
    })
  })
})
