const schedule = require('node-schedule');
const axios = require('axios');
const dealsService = require('./services/deals-service');
const mailerService = require('./services/mailer-service');
const timeService = require('./services/time-service');
const logger = require('./services/log-service');
const config = require('./config.json');

const dealsParameters = `sortBy=Recent&onSale=1`;

const siteUrl = `${config.site.url}/${
  config.site.routes.browse
}?${dealsParameters}`;
const dealsUrl = `${config.api.url}/${
  config.api.routes.deals
}?${dealsParameters}`;
const storesUrl = `${config.api.url}/${config.api.routes.stores}`;

var stores = [];

var job = schedule.scheduleJob(config.schedule, checkForUpdates);

async function checkForUpdates() {
  logger.log('Checking for updates...');
  axios
    .get(storesUrl)
    .then(response => {
      stores = response.data;
      axios.get(dealsUrl).then(response => {
        processDealsResponse(response);
        logNextRun();
      });
    })
    .catch(error => {
      logger.error(error);
    });
}

function processDealsResponse(response) {
  var deals = dealsService.filterDeals(response.data);
  dealsService.updateLastCheck();
  if (deals.length > 0) {
    logger.log('Updates found.');
    sendEmail(deals);
  } else {
    logger.log('No updates found.');
  }
}

function sendEmail(deals) {
  var message = buildMessage(deals);
  mailerService.sendEmail(message);
}

function buildMessage(deals) {
  var message = `<h2><a href="${siteUrl}">New Game Deals</a></h2>`;

  message += '<ul>';

  for (var deal of deals) {
    var percentOff = dealsService.getPercentOff(deal);
    var store = getStoreById(deal.storeID);
    var steamUrl = `https://store.steampowered.com/app/${deal.steamAppID}/`;

    message += `<li><a href="${steamUrl}">[${store}] ${deal.title} ($${
      deal.salePrice
    } / ${percentOff}% off)</a></li>`;
  }

  message += '</ul>';

  return message;
}

function getStoreById(id) {
  return stores.find(store => store.storeID == id).storeName;
}

function logNextRun() {
  var nextInvocation = new Date(job.nextInvocation());
  var nextRun = timeService.format(nextInvocation);
  logger.log(`Next run scheduled for "${nextRun}".`);
}

logger.log('App started.');
logNextRun();
