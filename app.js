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
var job = schedule.scheduleJob(config.schedule, async () => {
  await checkForUpdates();
  logNextRun();
});

async function getDealsByPage(page) {
  try {
    var response = await axios.get(`${dealsUrl}&pageNumber=${page}`);
    return response.data;
  } catch (error) {
    console.error(`Could not retrieve deals page ${page}.`);
    console.error(error);
  }
}

async function getStores() {
  try {
    var response = await axios.get(storesUrl);
    return response.data;
  } catch (error) {
    console.error('Could not retrieve stores.');
    console.error(error);
  }
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
  var newDeals = [];
  for (i = 0; i < config.api.maxDealsPages; i++) {
    var dealsPage = await getDealsByPage(i);
    if (allNew(dealsPage)) {
      newDeals.push(...dealsPage);
    } else {
      newDeals.push(...dealsPage.filter(dealsService.isNewDeal));
      break;
    }
  }
  dealsService.updateLastCheck();
  return newDeals;
}

async function checkForUpdates() {
  logger.log('Checking for new deals...');
  stores = await getStores();
  var newDeals = await getNewDeals();
  var goodDeals = newDeals.filter(dealsService.isGoodDeal);
  if (goodDeals.length > 0) {
    logger.log(`Found ${goodDeals.length} new deals.`);
    await sendEmail(goodDeals);
  } else {
    logger.log('No new deals.');
  }
}

async function sendEmail(deals) {
  var message = buildMessage(deals);
  await mailerService.sendEmail(message);
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
