const nodemailer = require('nodemailer');
const config = require('../config.json');

const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.sender.email,
    pass: config.email.sender.password
  }
});

function sendEmail(message) {
  const mailOptions = {
    from: `"${config.email.sender.name}" <${config.email.sender.email}>`,
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
