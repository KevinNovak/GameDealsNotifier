const axios = require('axios');
const logger = require('./log-service');
const config = require('../config/config.json');
const dealConditions = require('../config/deal-conditions.json');

const dealsUrl = `${config.api.url}/${
  config.api.routes.deals
}?sortBy=Recent&onSale=1`;

var lastKnownDealId = '';
var lastKnownChangeTime = 0;

async function getNewGoodDeals() {
  var newDeals = await getNewDeals();
  return newDeals.filter(isGoodDeal);
}

async function getNewDeals() {
  var deals = [];

  for (i = 0; i < config.api.maxDealsPages; i++) {
    var dealsPage = await getDealsByPage(i);
    deals.push(...dealsPage);
    if (dealsPage.some(isOldDeal)) {
      break;
    }
  }

  deals.sort(compareDeals);

  var oldDealIndex = deals.findIndex(isOldDeal);
  var newDeals = oldDealIndex == -1 ? deals : deals.slice(0, oldDealIndex);

  if (newDeals.length > 0) {
    var firstDeal = newDeals[0];
    lastKnownDealId = firstDeal.dealID;
    lastKnownChangeTime = firstDeal.lastChange;
  }

  return newDeals;
}

function isOldDeal(deal) {
  return (
    deal.dealID == lastKnownDealId || deal.lastChange <= lastKnownChangeTime
  );
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

function matchesDealCondition(deal, condition) {
  // Steam rating
  if (condition.steamRating) {
    if (condition.steamRating.min) {
      if (deal.steamRatingPercent < condition.steamRating.min) {
        return false;
      }
    }
    if (condition.steamRating.max) {
      if (deal.steamRatingPercent > condition.steamRating.max) {
        return false;
      }
    }
  }

  // Number of reviews
  if (condition.reviewsCount) {
    if (condition.reviewsCount.min) {
      if (deal.steamRatingCount < condition.reviewsCount.min) {
        return false;
      }
    }
    if (condition.reviewsCount.max) {
      if (deal.steamRatingCount > condition.reviewsCount.max) {
        return false;
      }
    }
  }

  // Percent off
  if (condition.percentOff) {
    var percentOff = getPercentOff(deal);
    if (condition.percentOff.min) {
      if (percentOff < condition.percentOff.min) {
        return false;
      }
    }
    if (condition.percentOff.max) {
      if (percentOff > condition.percentOff.max) {
        return false;
      }
    }
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
