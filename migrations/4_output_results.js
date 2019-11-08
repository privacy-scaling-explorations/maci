const fs = require('fs')
const path = require('path')

module.exports = async (_) => {
  const data = JSON.stringify({
    ...global.contracts
  }, null, 4)

  console.log(data)

  // Saves to a file if needed
  const buildDir = path.resolve(__dirname, '../app/contracts')
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir)
  }
  fs.writeFileSync(path.resolve(buildDir, 'DeployedAddresses.json'), data)
}
