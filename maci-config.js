module.exports = {
  merkleTreeConfig: {
    stateTreeName: process.env.STATE_TREE_NAME || 'StateTree',
    cmdTreeName: process.env.CMD_TREE_NAME || 'CmdTree',
    treeDepth: process.env.MERKLE_TREE_DEPTH || 4,
    zeroValue: 0n,
    durationSignUpBlockNumbers: process.env.SIGNUP_BLOCK_DURATION || 20
  },
  ganacheConfig: {
    mnemonic: 'helloworld',
    host: 'http://localhost:8545',
    privateKey: '0x989d5b4da447ba1c7f5d48e3b4310d0eec08d4abd0f126b58249598abd8f4c37'
  }
}
