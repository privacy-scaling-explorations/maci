const express = require('express')
const shelljs = require('shelljs')
const pg = require('pg')
const path = require('path')
const logger = require('./logger').logger
const db = require('./db')

const cliPath = path.join(
    __dirname,
    '..',
    'cli',
    './build/index.js',
)

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
  for (const [key, value] of Object.entries(req.query)) {
    logger.debug(key, value);
  }
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
postRouter.post('/', function(req, res) {
  logger.debug('new post request received...')
  for (const [key, value] of Object.entries(req.body)) {
      logger.debug(key, value);
  }
  if (!("method" in req.body)) {
    res.send("method not defined")
    return
  }

  let output
  let silent = true
  switch(req.body["method"]) {
    case "signup":
      if(!("pubkey" in req.body)){
         res.send("public key not specified")
         break
      }
      let signupCmd = `node ${cliPath} signup -p ${req.body["pubkey"]}`
      logger.debug(`process signup...${signupCmd}`)
      output = shelljs.exec(signupCmd, { silent })
      break
    default:
      res.send("unknown method...")
      return
  }
  if (output.stderr) {
     res.send(`${req.body.method} failed with ${output.stderr}`)
  } else {
    res.send("${req.body.method} success...")
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
