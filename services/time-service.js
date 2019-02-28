const moment = require('moment');

function format(time) {
  return moment(time).format('YYYY-MM-DD HH:mm:ss');
}

module.exports = {
  format
};
