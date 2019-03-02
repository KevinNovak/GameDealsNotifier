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
var lastSeenDeal = '';

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

function compareDeals(a, b) {
  if (a.lastChange < b.lastChange) {
    return 1;
  }
  if (a.lastChange > b.lastChange) {
    return -1;
  }
  if (a.title > b.title) {
    return 1;
  }
  if (a.title < b.title) {
    return -1;
  }
  return 0;
}

async function getNewDeals() {
  var deals = [];

  for (i = 0; i < config.api.maxDealsPages; i++) {
    var dealsPage = await getDealsByPage(i);
    deals.push(...dealsPage);
    if (deals.some(deal => deal.dealID == lastSeenDeal)) {
      break;
    }
  }

  deals.sort(compareDeals);

  var lastSeenDealIndex = deals.findIndex(deal => deal.dealID == lastSeenDeal);
  var newDeals =
    lastSeenDealIndex == -1 ? deals : deals.slice(0, lastSeenDealIndex);

  if (deals.length > 0) {
    lastSeenDeal = deals[0].dealID;
  }

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
  var emailData = createEmailData(deals);
  await mailerService.sendEmail(emailData);
}

function createEmailData(deals) {
  var dealsData = deals.map(deal => ({
    store: getStoreById(deal.storeID),
    title: deal.title,
    price: deal.salePrice,
    percentOff: dealsService.getPercentOff(deal),
    steamUrl: `https://store.steampowered.com/app/${deal.steamAppID}/`,
    dealUrl: `http://www.cheapshark.com/redirect?dealID=${deal.dealID}`
  }));

  return {
    deals: dealsData,
    siteUrl
  };
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
