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
)

const cliCmd = `cd ${cliPath} && node build/index.js`

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

  let output, cmd, query, dbres
  let silent = true
  switch(req.body["method"]) {
    case "signup":
      if(!("pubkey" in req.body && req.body["pubkey"]) || !("maci" in req.body && req.body["maci"])){
         res.send("missing parameters...")
         break
      }
      query = { 'MACI': req.body["maci"]};
      dbres = await dbClient.db(db.dbName).collection(db.collectionName).findOne(query)
      if(!dbres) {
        res.send(`MACI contract address ${req.body["maci"]} not exist`)
        break
      }
      cmd = `${cliCmd} signup -p ${req.body["pubkey"]} -x ${req.body["maci"]}`
      logger.debug(`process signup...${cmd}`)
      output = shelljs.exec(cmd, { silent })
      break
    case "genkey":
      cmd = `${cliCmd} genMaciKeypair`
      logger.debug(`process genkey...${cmd}`)
      output = shelljs.exec(cmd, { silent })
      break
    case "publish": // TODO: change http to https to protect private key
      if(!("pubkey" in req.body && req.body["pubkey"]) || !("maci" in req.body && req.body["maci"])){
         res.send("missing parameters...")
         break
      }
      query = { 'MACI': req.body["maci"]}
      dbres = await dbClient.db(db.dbName).collection(db.collectionName).findOne(query)
      if(!dbres) {
        res.send(`MACI contract address ${req.body["maci"]} not exist`)
        break
      }

      cmd = `${cliCmd} publish -p ${req.body["pubkey"]} -x ${req.body["maci"]} -sk ${req.body["privkey"]} -i ${req.body["state_index"]} -v ${req.body["vote_option_index"]} -w ${req.body["new_vote_weight"]} -n ${req.body["nonce"]} -o ${req.body["poll_id"]}`
      if (req.body["salt"]) {
        cmd += ` -s ${req.body["salt"]}`
      }
      logger.debug(`publishMessage...${cmd}`)
      output = shelljs.exec(cmd, { silent })
      break
    case "verify":
      if(!("maci" in req.body && req.body["maci"])||!("poll_id" in req.body && req.body["poll_id"])){
         res.send("missing parameters...")
         break
      }
      query = { 'MACI': req.body["maci"]}
      dbres = await dbClient.db(db.dbName).collection(db.collectionName).findOne(query)
      if(!dbres) {
        res.send(`MACI contract address ${req.body["maci"]} not exist`)
        break
      }
      let pptKey = "PollProcessorAndTally-" + req.body["poll_id"]
      if (!(pptKey in dbres)) {
         res.send(`PollProcessAndTally contract for poll ${req.body["poll_id"]} not exists`)
         break
      }
      pptAddr = dbres[pptKey]
      cmd = `${cliCmd} verify -t ${req.body["tally_file"]} -x ${req.body["maci"]} -o ${req.body["poll_id"]} -q ${pptAddr}`
      output = shelljs.exec(cmd, { silent })
      break
    default:
      res.send("unknown method...")
  }
  if (!output) {
      return
  } else if(output.stderr) {
     res.send(`${req.body.method} failed with error: ${output.stderr}`)
  } else {
    res.send(`${output}`)
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
