const ethers = require('ethers')
const { mimc7 } = require('circomlib')

const { mimcAddress } = require('../_build/contracts/DeployedAddresses.json')
const { dbPool } = require('../_build/utils/db')
const { stringifyBigInts, linkLibraries } = require('../_build/utils/helpers')
const { createMerkleTree, saveMerkleTreeToDb, loadMerkleTreeFromDb } = require('../_build/utils/merkletree')
const { ganacheConfig, merkleTreeConfig } = require('../maci-config')

const provider = new ethers.providers.JsonRpcProvider(ganacheConfig.host)
const privateKey = ganacheConfig.privateKey
const wallet = new ethers.Wallet(privateKey, provider)

const merkletreeDef = require('../_build/contracts/MerkleTree.json')
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
    merkleTreeContract = await merkleTreeFactory.deploy(
      merkleTreeConfig.treeDepth,
      stringifyBigInts(merkleTreeConfig.zeroValue)
    )

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
      merkleTreeJS.insert(h)
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
      merkleTreeJS.insert(h)
    }

    const leafIndex = 1
    const newLeafRawValue = [1n, 2n, 3n, 4n, 5n]
    const newLeafValue = mimc7.multiHash(newLeafRawValue)

    // eslint-disable-next-line
    const [path, _] = merkleTreeJS.getPathUpdate(leafIndex)
    await merkleTreeContract.update(
      leafIndex,
      newLeafValue.toString(),
      path.map(x => x.toString())
    )
    merkleTreeJS.update(leafIndex, newLeafValue)

    const newRoot = await merkleTreeContract.getRoot()
    assert.equal(merkleTreeJS.root.toString(), newRoot.toString())
  })

  it('MerkleTree Invalid Update Fails', async () => {
    for (let n in ns) {
      const h = mimc7.multiHash(n)

      await merkleTreeContract.insert(h.toString())
      merkleTreeJS.insert(h)
    }

    try {
      // eslint-disable-next-line
      const [path, _] = merkleTreeJS.getPathUpdate(0)

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
      merkleTreeJS.insert(h)

      contractRoot = await merkleTreeContract.getRoot()
      assert.equal(merkleTreeJS.root.toString(), contractRoot)
    }
  })

  it('Merkle Tree Serialization to/from Db', async () => {
    const mkName = 'TestMerkleTree42'
    const mk1 = createMerkleTree(4, 0n)

    // Need to save on every insert
    const h1 = mimc7.multiHash(n1)
    const h2 = mimc7.multiHash(n2)
    const h3 = mimc7.multiHash(n3)

    mk1.insert(h1)
    mk1.insert(h2)
    mk1.insert(h3)

    // Saves index 0 to merkletree (h1)
    await saveMerkleTreeToDb(dbPool, mkName, mk1, 0)

    // Saves index 1 to merkletree (h2)
    await saveMerkleTreeToDb(dbPool, mkName, mk1, 1)

    // Saves latest index to merkletree (h3)
    await saveMerkleTreeToDb(dbPool, mkName, mk1)

    const mk2 = await loadMerkleTreeFromDb(dbPool, mkName)

    assert.equal(true, mk1.equals(mk2))

    // Update second element
    const h2New = mimc7.multiHash([h1, h2, h3])
    mk1.update(1, h2New)

    // Saves updated leave to database
    await saveMerkleTreeToDb(dbPool, mkName, mk1, 1)

    // Compare trees
    const mk3 = await loadMerkleTreeFromDb(dbPool, mkName)

    assert.equal(true, mk1.equals(mk3))

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
