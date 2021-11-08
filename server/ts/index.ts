import * as express from 'express'
import * as shelljs from 'shelljs'
import * as fs from 'fs'
import * as minilog from 'minilog'

const HTTP_PORT = 8080

const initLogger = (): any => {
  minilog.pipe(fs.createWriteStream('./debug.log'))
  minilog.enable()
  let logger = minilog('app')
  return logger
}

let logger = initLogger()

const logErrors = (err, next) => {
  logger.error(err.stack);
  next(err);
}

const signupRouter = express.Router()
signupRouter.get('/echo', function(req, res){
  logger.info('-----req.query:-----')
  logger.info(req.query)
  res.send({
    hello: 'world'
  })
})


const initApp = ():any => {
  let app = express()

  app.use(express.urlencoded())
  app.use(express.json())
  app.use('/signup/', signupRouter)

  app.use(function (err, req, res, next) {
    logErrors(err, next)
    res.status(err.status || 500).send(err.message)
  });

  return app;
}



const startServer = () => {
  let app = initApp()
  app.listen(HTTP_PORT, function () {
    logger.info('server is listening on port ' + HTTP_PORT);
  });
}

startServer();
