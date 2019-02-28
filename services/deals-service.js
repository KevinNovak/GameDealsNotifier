const dealConditions = require('../deal-conditions.json');

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

module.exports = {
  isGoodDeal,
  getPercentOff
};
