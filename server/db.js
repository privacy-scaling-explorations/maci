const mongodb = require('mongodb')
const to = require('await-to-js').default
const logger = require('./logger').logger
const MongoClient = require('mongodb').MongoClient;

const dbName = 'poll'
const collectionName = 'poll-v1.0.0'
const uri = process.env.mongo_uri
if (!uri) {
  logger.error('mongo_uri is not defined')
  process.exit(1)
}

let dbClient 
// initialize connection once
MongoClient.connect(uri, function(err, client) {
  if (err) {
    logger.error(`cannot connect to mongodb with error ${err}`)
    process.exit(1)
  }
  dbClient = client
});


exports.createCollection = async function createCollection() {
  if (!dbClient) {
     logger.error('db is not initialized')
     return false
  }
  let dbo = dbClient.db(dbName)
  let err  = await to(dbo.createCollection(collectionName))
  if (err) {
    logger.error(`cannot create collection ${COLLECTION_V1} with error ${err}`)
    return false
  }
  return true
}

exports.ping = async function ping() {
  if (!dbClient) {
     logger.error('db is not initialized')
     return false
  }
  await dbClient.db('admin').command({ping: 1})
  logger.info('connected successfully to the mongodb')
  return true
}


