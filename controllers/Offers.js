const Offers = require("../models/Offers");
const Users = require("../models/Users");
const JOISchemas = require("../utils/Validations");
const moment = require("moment");
const texts = require("../utils/Messages");
const SMS = require("../utils/SMS");

// Create New Offer
exports.newOffer = async (req, res, next) => {
  try {
    const company = req.userId;
    const start = req.body.start;
    const end = req.body.end;
    const date = req.body.date;
    const range = req.body.range;
    const vehicle = req.body.vehicle;
    const volume = req.body.volume;
    const price = req.body.price;
    const requiredPerson = req.body.requiredPerson || 1;
    const rating = req.body.rating;

    const data = {
      start: start,
      end: end,
      date: date,
      range: range,
      company: company,
      vehicle: vehicle,
      volume: volume,
      price: price,
      requiredPerson: requiredPerson,
      rating: rating,
    };
    const value = JOISchemas.offer(data);
    const offer = await Offers.create(value);
    if (!offer) {
      const err = new Error(texts.Opps);
      err.status = 400;
      throw err;
    }

    // Delete Offer after 15 minutes
    setTimeout(async () => {
      const newOffer = await Offers.findById(offer._id);
      if (newOffer.desiredPersons.length === 0) {
        await Offers.findByIdAndDelete(offer._id);
      }
    }, 900000);

    const Company = await Users.findById(offer.company);

    const coordinates = Company.address.location;
    function kmToRadian(km) {
      var earthRadiusInMiles = 6378;
      return km / earthRadiusInMiles;
    }

    // FInd Type to search from
    let types = ["small", "medium", "large"];
    let gotType = offer.volume; // medeium
    const typeIndex = types.indexOf(gotType);
    let searchType = types.splice(typeIndex, types.length);

    // Find Vehicles to search from
    let vehicleOffer = offer.vehicle;
    let allVehicles = [
      "Bike",
      "Scooter",
      "Electric bike",
      "Car",
      "Truck",
      "Large volume permit",
    ];
    let indexOfVehicle = allVehicles.indexOf(
      vehicleOffer[vehicleOffer.length - 1]
    );
    let newArray = allVehicles.splice(indexOfVehicle, allVehicles.length);

    const users = await Users.find({
      role: "user",
      status: "active",
      "delivery.range": { $gte: offer.range },
      "delivery.perHour": { $lte: offer.price },
      "delivery.transportType": { $in: searchType },
      $or: [
        { averageRating: { $gte: offer.rating } },
        { rating: { $eq: undefined } },
      ],
      "delivery.vehicle.vehicleType": { $in: newArray },
      timeslots: {
        $elemMatch: {
          day: moment(offer.date).day(),
          slots: {
            $elemMatch: {
              from: { $lte: start },
              to: { $gte: end },
            },
          },
        },
      },
      "address.location": {
        $geoWithin: { $centerSphere: [coordinates, kmToRadian(offer.range)] },
      },
    });
    res.status(200).json({ offer, users });
  } catch (err) {
    next(err);
  }
};

// Get All Offers
exports.getAllOffers = async (req, res, next) => {
  try {
    const info = await Offers.find();
    res.status(200).json({ offer: info });
  } catch (err) {
    next(err);
  }
};

// Get One Offer
exports.getOffer = async (req, res, next) => {
  try {
    const id = req.params.id;

    const info = await Offers.findById(id);
    res.status(200).json({ offer: info });
  } catch {
    next(err);
  }
};

// Send Invitation
exports.sendInvites = async (req, res, next) => {
  try {
    const userId = req.body._id;
    const offerId = req.body.offerId;
    const User = await Users.findById(userId);
    if (!User) {
      const error = new Error(texts.Opps);
      error.status = 400;
      throw error;
    }

    const offer = await Offers.findById(offerId);
    if (!offer) {
      const error = new Error(texts.Opps);
      error.status = 400;
      throw error;
    }
    User.delivery.invitations.push(offerId);
    const Updated = await User.save();
    SMS(texts.invite, User.phone);

    offer.desiredPersons.push({ userId: userId });
    const updatedOffer = await offer.save();
    res.status(200).json({ user: Updated, offer: updatedOffer });
  } catch (err) {
    next(err);
  }
};

// Cancel User
exports.cancelUser = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const offerId = req.body.offerId;

    const Offer1 = await Offers.findOneAndUpdate(
      {
        _id: offerId,
        deliveryMen: {
          $elemMatch: {
            personId: userId,
          },
        },
      },
      {
        $set: {
          "deliveryMen.$.status": "rejected",
        },
      },
      { new: true }
    );
    const Offer = await Offers.findOneAndUpdate(
      {
        _id: offerId,
        desiredPersons: {
          $elemMatch: {
            userId: userId,
          },
        },
      },
      {
        $set: {
          "desiredPersons.$.status": "rejected",
        },
      },
      { new: true }
    )
      .populate("company")
      .populate("deliveryMen.personId")
      .populate("desiredPersons.userId");
    if (!Offer) {
      const error = new Error(texts.Opps);
      error.status = 400;
      throw error;
    }
    SMS(texts.offer_cancel, Offer.company.phone);
    const user = await Users.findOneAndUpdate(
      { _id: userId },
      {
        $pull: {
          "delivery.invitations": offerId,
        },
      },
      { new: true }
    );
    if (!user) {
      const error = new Error(texts.Opps);
      error.status = 400;
      throw error;
    }
    SMS(texts.offer_cancel, user.phone);
    res.status(201).json({ offer: Offer, user });
  } catch (err) {
    next(err);
  }
};

//  Get Total Ratings And Total Offers
exports.getTotalRatingsAndToltalOffers = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await Users.findById(userId).populate("rating");
    if (!user) {
      const error = new Error(texts.Opps);
      error.status = 400;
      throw error;
    }
    if (user.role === "company") {
      let totalRatings = 0;
      if (user.rating) {
        totalRatings = user.rating.rating.length;
      }
      const offers = await Offers.find({ company: userId });
      if (!offers) {
        const err = new Error(texts.Opps);
        err.status = 400;
        throw err;
      }

      let persons = 0;
      offers.map((ofrer) =>
        ofrer.deliveryMen.map(
          (person) => person.status === "completed" && persons++
        )
      );

      res.status(200).json({
        totalRatings,
        totalOffers: persons,
      });
    } else {
      let totalRatings = 0;
      if (user.rating) {
        totalRatings = user.rating.rating.length;
      }
      const offers = await Offers.find({
        "deliveryMen.personId": userId,
        "deliveryMen.status": "completed",
      });
      if (!offers) {
        const err = new Error(texts.Opps);
        err.status = 400;
        throw err;
      }
      const totalCompleteOffers = offers.length;
      res.status(200).json({
        totalRatings,
        totalOffers: totalCompleteOffers,
      });
    }
  } catch (err) {
    next(err);
  }
};
