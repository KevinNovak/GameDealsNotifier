const timeService = require('./time-service');
const config = require('../config.json');

var lastCheck = timeService.secondsSinceEpoch();

function filterDeals(deals) {
  return deals.filter(isNewDeal).filter(isGoodDeal);
}

function isNewDeal(deal) {
  return deal.lastChange > lastCheck;
}

function isGoodDeal(deal) {
  if (deal.steamRatingCount < config.deals.steamRating) {
    return false;
  }
  if (getPercentOff(deal) < config.deals.percentOff) {
    return false;
  }
  return true;
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
