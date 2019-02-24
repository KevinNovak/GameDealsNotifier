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
  var percentOff = (deal.normalPrice - deal.salePrice) / deal.normalPrice;
  if (percentOff < config.deals.percentOff) {
    return false;
  }
  return true;
}

function updateLastCheck() {
  lastCheck = timeService.secondsSinceEpoch();
}

module.exports = {
  filterDeals,
  updateLastCheck
};
