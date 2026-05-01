const nodemailer = require('nodemailer');
const dns = require('dns');

// ✅ Custom DNS lookup to force IPv4 only
const customLookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dns.lookup(hostname, { ...options, family: 4 }, callback);
};

// ✅ Create email transporter with IPv4-only configuration
const createMailTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    lookup: customLookup, // ✅ Force IPv4 DNS resolution
    family: 4, // ✅ IPv4 only
    requireTLS: true,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
};

module.exports = { createMailTransporter, customLookup };
