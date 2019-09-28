module.exports = async (_) => {
  console.log(JSON.stringify({
    ...global.contractAddresses
  }, null, 4))
}
