const Offers = require("../models/Offers");
module.exports = async () => {
  try {
    const offers = await Offers.find();
    await Promise.all(
      offers.map(async (offer) => {
        if (offer.desiredPersons.length === 0) {
          await Offers.findByIdAndDelete(offer._id);
        }
      })
    );
  } catch (err) {}
};
