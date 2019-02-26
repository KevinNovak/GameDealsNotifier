const nodemailer = require('nodemailer');
const logger = require('./log-service');
const config = require('../config.json');

const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.sender.email,
    pass: config.email.sender.password
  }
});

async function sendEmail(message) {
  const mailOptions = {
    from: `"${config.email.sender.name}" <${config.email.sender.email}>`,
    to: config.email.receivers,
    subject: config.email.subject,
    html: message
  };

  logger.log('Sending notifications...');
  try {
    await transporter.sendMail(mailOptions);
    logger.log('Notifications sent.');
  } catch (error) {
    logger.log('Notifications not sent.');
    logger.error(error);
  }
}

module.exports = {
  sendEmail
};
