import * as path from "path";

// set NODE_CONFIG_DIR

if (!process.env.hasOwnProperty("NODE_CONFIG_DIR")) {
  process.env.NODE_CONFIG_DIR = path.join(__dirname, "../");
}

if (!process.env.hasOwnProperty("NODE_ENV")) {
  process.env.NODE_ENV = "test";
}

const config = require("config");

module.exports = {
  merkleTreeConfig: {
    cmdTreeName: process.env.CMD_TREE_NAME || "CmdTree",
    stateTreeName: process.env.STATE_TREE_NAME || "StateTree",
    treeDepth: process.env.MERKLE_TREE_DEPTH || 4,
    zeroValue:
      "5503045433092194285660061905880311622788666850989422096966288514930349325741",
    durationSignUpBlockNumbers: process.env.SIGN_UP_BLOCK_DURATION || 20
  },
  ganacheConfig: {
    mnemonic: "helloworld",
    host: "http://localhost:8545",
    privateKey:
      "0x94a9f52a9ef7933f3865a91766cb5e12d25f62d6aecf1d768508d95526bfee29"
  },
  coordinatorConfig: {
    privateKey:
      process.env.COORDINATOR_PRIVATE_KEY ||
      "7320473111418094673250215182902171603871183593344656923519201805"
  }
};
