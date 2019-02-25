const moment = require('moment');

function format(time) {
  return moment(time).format('YYYY-MM-DD HH:mm:ss');
}

function secondsSinceEpoch() {
  return Math.floor(new Date().getTime() / 1000);
}

module.exports = {
  format,
  secondsSinceEpoch
};
