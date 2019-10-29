const redis = require('redis')
const { promisify } = require('util')
const { getRedisCredentials } = require('./settings')
const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = getRedisCredentials()

const redisClient = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD
})

// Async redis commands
const redisGet = promisify(redisClient.get).bind(redisClient)
const redisSet = promisify(redisClient.set).bind(redisClient)
const redisOn = promisify(redisClient.on).bind(redisClient)
const redisFlushAll = promisify(redisClient.flushall).bind(redisClient)

// Init redis
const initRedis = async () => {
  // redisOn doesn't work for some reason
  // Try setting a value that expires after 10 seconds
  await redisSet('42', 42, 'EX', 10)

  if (process.env.ENV_TYPE === 'TEST') {
    await redisFlushAll('ASYNC')
    console.log('[STATUS]', 'Flushing redis cache')
  }
}

module.exports = {
  redisGet,
  redisSet,
  redisOn,
  redisFlushAll,
  initRedis
}
