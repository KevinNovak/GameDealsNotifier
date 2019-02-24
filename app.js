const axios = require('axios');
const dealsService = require('./services/deals-service');
const mailerService = require('./services/mailer-service');
const config = require('./config.json');

const dealsParameters = `sortBy=Recent&onSale=1&steamRating=${
  config.deals.steamRating
}`;

const dealsUrl = `${config.api.url}/${
  config.api.routes.deals
}?${dealsParameters}`;
const storesUrl = `${config.api.url}/${config.api.routes.stores}`;

var stores = [];

async function checkForUpdates() {
  axios
    .get(storesUrl)
    .then(response => {
      stores = response.data;
      axios.get(dealsUrl).then(response => processDealsResponse(response));
    })
    .catch(error => {
      console.log(error);
    });
}

function processDealsResponse(response) {
  var deals = dealsService.filterDeals(response.data);
  dealsService.updateLastCheck();
  if (deals.length > 0) {
    sendEmail(deals);
  }
}

function sendEmail(deals) {
  var message = '<h2>New Game Deals</h2>';

  message += '<ul>';

  for (var deal of deals) {
    var percentOff = dealsService.getPercentOff(deal);
    var store = getStoreById(deal.storeID);
    message += `<li>[${store}] ${deal.title} ($${
      deal.salePrice
    } / ${percentOff}% off)</li>`;
  }

  message += '</ul>';

  mailerService.sendEmail(message);
}

function getStoreById(id) {
  return stores.find(store => store.storeID == id).storeName;
}

checkForUpdates();
