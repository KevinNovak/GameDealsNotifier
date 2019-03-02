const axios = require('axios');
const config = require('../config/config.json');

const storesUrl = `${config.api.url}/${config.api.routes.stores}`;

async function getStores() {
  try {
    var response = await axios.get(storesUrl);
    return response.data;
  } catch (error) {
    console.error('Could not retrieve stores.');
    console.error(error);
  }
}

module.exports = {
  getStores
};
