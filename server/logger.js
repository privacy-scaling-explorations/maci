const minilog = require('minilog')
const path = require('path')
const fs = require('fs')

const logDir = './logs'
const logFile = path.join(logDir, 'server.log')
const logFileOld = path.join(logDir, 'old.log')

const initLogger = () => {
  if (!fs.existsSync(logDir)){
    fs.mkdirSync(logDir)
  } 
  if (fs.existsSync(logFile)) {
     fs.renameSync(logFile, logFileOld)
  }
  minilog.enable()
  minilog.pipe(fs.createWriteStream(logFile))

  let logger = minilog('app')
  logger.info("logger init...")
  return logger
}

let logger = initLogger()

exports.logger = logger



