const schedule = require('node-schedule');
const dealsService = require('./services/deals-service');
const storesService = require('./services/stores-service');
const mailerService = require('./services/mailer-service');
const timeService = require('./services/time-service');
const logger = require('./services/log-service');
const config = require('./config/config.json');

var stores = [];

var job = schedule.scheduleJob(config.schedule, async () => {
  await checkForUpdates();
  logNextRun();
});

async function checkForUpdates() {
  logger.log('Checking for new deals...');
  stores = await storesService.getStores();
  var goodDeals = await dealsService.getNewGoodDeals();
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
    deals: dealsData
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
