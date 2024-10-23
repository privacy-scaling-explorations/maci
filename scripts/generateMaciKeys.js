const { genKeypair } = require("maci-crypto");
const fs = require("fs");
const path = require("path");

function generateMaciKeys() {
  const { privKey, pubKey } = genKeypair();

  const keys = {
    privateKey: privKey.toString(),
    publicKey: pubKey.toString(),
  };

  const outputDir = path.join(__dirname, "..", "maci-keys");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, "maci-keys.json");
  fs.writeFileSync(outputFile, JSON.stringify(keys, null, 2));

  console.log("MACI keys generated and saved to:", outputFile);
}

generateMaciKeys();
