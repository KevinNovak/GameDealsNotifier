const axios = require('axios');
const nodemailer = require('nodemailer');
const config = require('./config.json');

const dealsParameters = `sortBy=Recent&onSale=1&steamRating=${
  config.deals.steamRating
}`;

const dealsUrl = `${config.api.url}/${
  config.api.routes.deals
}?${dealsParameters}`;
const storesUrl = `${config.api.url}/${config.api.routes.stores}`;

const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.sender,
    pass: config.email.password
  }
});

var lastCheck = timeSinceEpoch();
var stores = [];

function timeSinceEpoch() {
  return Math.floor(new Date().getTime() / 1000);
}

async function checkForUpdates() {
  axios
    .get(storesUrl)
    .then(response => {
      stores = response.data;
      axios.get(dealsUrl).then(response => processDealsResponse(response));
    })
    .catch(error => {
      console.log(error);
    });
}

function processDealsResponse(response) {
  var deals = response.data.filter(isNewDeal).filter(isGoodDeal);
  if (deals.length > 0) {
    sendEmail(deals);
  }
  lastCheck = timeSinceEpoch();
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

async function sendEmail(deals) {
  var message = '<h2>New Game Deals</h2>';

  message += '<ul>';

  for (var deal of deals) {
    var percentOff = Math.round(
      ((deal.normalPrice - deal.salePrice) / deal.normalPrice) * 100
    );
    message += `<li>[${getStoreById(deal.storeID)}] ${deal.title} ($${
      deal.salePrice
    } / ${percentOff}% off)</li>`;
  }

  message += '</ul>';

  const mailOptions = {
    from: config.email.sender,
    to: config.email.receivers,
    subject: config.email.subject,
    html: message
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log(info);
    }
  });
}

function getStoreById(id) {
  return stores.find(store => store.storeID == id).storeName;
}

checkForUpdates();
