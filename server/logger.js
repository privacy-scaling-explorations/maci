const minilog = require('minilog')
const path = require('path')
const fs = require('fs')

const LOG_DIR = './logs'
const initLogger = () => {
  if (!fs.existsSync(LOG_DIR)){
    fs.mkdirSync(LOG_DIR);
  }
  //let log_path = path.join(LOG_DIR, `${Date.now()}.log`)
  let log_path = path.join(LOG_DIR, 'debug.log')
  minilog.pipe(fs.createWriteStream(log_path))
  minilog.enable()
  let logger = minilog('app')
  return logger
}

let logger = initLogger()

exports.logger = logger



