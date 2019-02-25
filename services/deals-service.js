const timeService = require('./time-service');
const dealConditions = require('../deal-conditions.json');
const config = require('../config.json');

var lastCheck = timeService.secondsSinceEpoch();

function filterDeals(deals) {
  return deals.filter(isNewDeal).filter(isGoodDeal);
}

function isNewDeal(deal) {
  return deal.lastChange > lastCheck;
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

function isGoodDeal(deal) {
  for (var dealCondition of dealConditions) {
    if (matchesDealCondition(deal, dealCondition)) {
      return true;
    }
  }
  return false;
}

function getPercentOff(deal) {
  return Math.round(
    ((deal.normalPrice - deal.salePrice) / deal.normalPrice) * 100
  );
}

function updateLastCheck() {
  lastCheck = timeService.secondsSinceEpoch();
}

module.exports = {
  filterDeals,
  getPercentOff,
  updateLastCheck
};
