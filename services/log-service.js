const timeService = require('./time-service');

function log(message) {
  console.log(`[${now()}] ${message}`);
}

function error(message) {
  console.error(`[${now()}] ${message}`);
}

function now() {
  return timeService.format(new Date());
}

module.exports = {
  log,
  error
};
