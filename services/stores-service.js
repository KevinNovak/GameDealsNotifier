const axios = require('axios');
const logger = require('./log-service');
const config = require('../config/config.json');

const storesUrl = `${config.api.url}/${config.api.routes.stores}`;

async function getStores() {
  try {
    var response = await axios.get(storesUrl);
    return response.data;
  } catch (error) {
    logger.error('Could not retrieve stores.');
    logger.error(error);
  }
}

module.exports = {
  getStores
};
