const express = require('express')
const pg = require('pg')
const logger = require('./logger').logger
const db = require('./db')
const handler_v1 = require('./handler_v1');
const handler_v0_10 = require('./handler_v0_10');


process.on('unhandledRejection', (err) => {
    logger.error(`unhandledRejection: ${err}`)
})

process.on('uncaughtException', (err) => {
    logger.error(`unhandledException: ${err}`)
})


let dbClient
const HTTP_PORT = 8080

const logErrors = (err, next) => {
  logger.error(err.stack);
  next(err);
}

const getRouter = express.Router()
getRouter.get('/', function(req, res){
  logger.debug('new get request received...')
  if (!("method" in req.query)) {
    res.send("method not defined")
    return
  }
  switch(req.query["method"]) {
    case "ping":
      db.ping(dbClient)
      break
    default:
      res.send("unknown method...")
      return
  }
  res.send("success...")
})

const postRouter = express.Router()
postRouter.post('/', async function(req, res) {
  logger.debug('new post request received...')
  //for (const [key, value] of Object.entries(req.body)) {
  //    logger.debug(key, value);
  //}
  if (!("method" in req.body)) {
    res.send("method not defined")
    return
  }
  if (!("version" in req.body)) {
    res.send("version not defined")
    return
  }

  switch(req.body["version"]) {
    case "v1.0":
      await handler_v1(req, res, dbClient)
      break
    case "v0.10":
      await handler_v0_10(req, res, dbClient)
      break
    default:
      res.send("unknown version...")
  }
})


function initApp() {
  let app = express()

  app.use(express.urlencoded({extended: true}))
  app.use(express.json())
  app.use('/get/', getRouter)
  app.use('/post/', postRouter)

  app.use(function (err, req, res, next) {
    logErrors(err, next)
    res.status(err.status || 500).send(err.message)
  });

  app.use(function(req, res, next) {
    res.status(404).send('404: Invalid request...');
  });

  return app;
}

async function startServer() {
  let app = initApp()
  app.listen(HTTP_PORT, function () {
    logger.info('server is listening on port ' + HTTP_PORT);
  });
}

async function main() {
   dbClient = await db.initConnection()
   if (!dbClient) {
     return
   }
   startServer()
}

main()
