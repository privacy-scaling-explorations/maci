const express = require('express')
const shelljs = require('shelljs')
const pg = require('pg')
const logger = require('./logger').logger
const db = require('./db')

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

const signupRouter = express.Router()
signupRouter.get('/echo', function(req, res){
  logger.info('-----req.query:-----')
  logger.info(req.query)
  db.ping(dbClient)
  res.send({
    hello: 'world'
  })
})

function initApp() {
  let app = express()

  app.use(express.urlencoded({extended: true}))
  app.use(express.json())
  app.use('/signup/', signupRouter)

  app.use(function (err, req, res, next) {
    logErrors(err, next)
    res.status(err.status || 500).send(err.message)
  });

  app.use(function(req, res, next) {
    res.status(404).send('Invalid request...');
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
