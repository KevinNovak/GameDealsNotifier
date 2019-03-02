const axios = require('axios');
const logger = require('./log-service');
const config = require('../config/config.json');
const dealConditions = require('../config/deal-conditions.json');

const dealsUrl = `${config.api.url}/${
  config.api.routes.deals
}?sortBy=Recent&onSale=1`;

var lastSeenDeal = '';

async function getNewGoodDeals() {
  var newDeals = await getNewDeals();
  return newDeals.filter(isGoodDeal);
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

async function getDealsByPage(page) {
  try {
    var response = await axios.get(`${dealsUrl}&pageNumber=${page}`);
    return response.data;
  } catch (error) {
    logger.error(`Could not retrieve deals page ${page}.`);
    logger.error(error);
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

function isGoodDeal(deal) {
  for (var dealCondition of dealConditions) {
    if (matchesDealCondition(deal, dealCondition)) {
      return true;
    }
  }
  return false;
}

function matchesDealCondition(deal, dealCondition) {
  if (deal.steamRatingPercent < dealCondition.steamRating) {
    return false;
  }
  if (deal.steamRatingCount < dealCondition.reviewsCount) {
    return false;
  }
  if (getPercentOff(deal) < dealCondition.percentOff) {
    return false;
  }
  return true;
}

function getPercentOff(deal) {
  return Math.round(
    ((deal.normalPrice - deal.salePrice) / deal.normalPrice) * 100
  );
}

module.exports = {
  getNewGoodDeals,
  getPercentOff
};
