const nodemailer = require('nodemailer');
const config = require('../config.json');

const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.sender,
    pass: config.email.password
  }
});

function sendEmail(message) {
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

module.exports = {
  sendEmail
};
