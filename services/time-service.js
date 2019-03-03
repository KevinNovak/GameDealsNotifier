const moment = require('moment');

function format(time) {
  return moment(time).format('YYYY-MM-DD HH:mm:ss');
}

function unixToRelative(unixTime) {
  return moment.unix(unixTime).fromNow();
}

module.exports = {
  format,
  unixToRelative
};
