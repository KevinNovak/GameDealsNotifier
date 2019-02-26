const schedule = require('node-schedule');
const axios = require('axios');
const dealsService = require('./services/deals-service');
const mailerService = require('./services/mailer-service');
const timeService = require('./services/time-service');
const logger = require('./services/log-service');
const config = require('./config.json');

const dealsParameters = `sortBy=Recent&onSale=1`;

const maxPages = 20;

const siteUrl = `${config.site.url}/${
  config.site.routes.browse
}?${dealsParameters}`;
const dealsUrl = `${config.api.url}/${
  config.api.routes.deals
}?${dealsParameters}`;
const storesUrl = `${config.api.url}/${config.api.routes.stores}`;

var stores = [];
var job = schedule.scheduleJob(config.schedule, checkForUpdates);

function getDealsPage(page) {
  return axios.get(`${dealsUrl}&pageNumber=${page}`);
}

function allNew(deals) {
  for (var deal of deals) {
    if (!dealsService.isNewDeal(deal)) {
      return false;
    }
  }
  return true;
}

async function getNewDeals() {
  var deals = [];
  for (i = 0; i < maxPages; i++) {
    var dealsPage = (await getDealsPage(i)).data;
    if (allNew(dealsPage)) {
      deals.push(...dealsPage);
    } else {
      deals.push(...dealsPage.filter(dealsService.isNewDeal));
      break;
    }
  }
  dealsService.updateLastCheck();
  return deals;
}

async function checkForUpdates() {
  logger.log('Checking for new deals...');
  stores = (await axios.get(storesUrl)).data;
  var deals = await getNewDeals();
  processDeals(deals);
  logNextRun();
}

function processDeals(deals) {
  var deals = deals.filter(dealsService.isGoodDeal);
  dealsService.updateLastCheck();
  if (deals.length > 0) {
    logger.log(`Found ${deals.length} new deals.`);
    sendEmail(deals);
  } else {
    logger.log('No new deals.');
  }
}

function sendEmail(deals) {
  var message = buildMessage(deals);
  mailerService.sendEmail(message);
}

function buildMessage(deals) {
  var message = `<h2><a href="${siteUrl}">New Game Deals</a></h2>`;

  message += '<ol>';

  for (var deal of deals) {
    var percentOff = dealsService.getPercentOff(deal);
    var store = getStoreById(deal.storeID);
    var steamUrl = `https://store.steampowered.com/app/${deal.steamAppID}/`;
    var dealUrl = `http://www.cheapshark.com/redirect?dealID=${deal.dealID}`;

    message += `<li>[${store}] ${deal.title} ($${
      deal.salePrice
    } / ${percentOff}% off)
      <ul>
        <li><a href="${steamUrl}">Steam Link</a></li>
        <li><a href="${dealUrl}">Deal Link</a></li>
      </ul>
    </li>`;
  }

  message += '</ol>';

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
