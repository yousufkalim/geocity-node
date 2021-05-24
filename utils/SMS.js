const client = require("twilio")(
  process.env.TWILLIO_ACCOUNT_SID,
  process.env.TWILLIO_ACCOUNT_AUTH_TOKEN
);
module.exports = (body, to) => {
  client.messages.create({
    body: body,
    from: process.env.TWILIO_NUMBER_FROM,
    to: process.env.TWILIO_NUMBER_CODE + to,
  });
};
