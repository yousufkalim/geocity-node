const Users = require("../models/Users");
const Offers = require("../models/Offers");
const Rating = require("../models/Rating");
const bcrypt = require("bcryptjs");
const { clearFile } = require("../utils/clearFile");
const texts = require("../utils/Messages");
const JOISchemas = require("../utils/Validations");
const sendTokenResponse = require("../utils/TokenResponse");
const imagemin = require("imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");
// Create Delivery Man
exports.RegisterDeliveryMan = async (req, res, next) => {
  try {
    const { firstName, lastName, email, dob, password } = req.body;

    const ifExist = await Users.findOne({ email: email });
    if (ifExist) {
      const error = new Error(texts.already_Email);
      error.status = 400;
      throw error;
    }

    const data = {
      firstName,
      lastName,
      email,
      dob,
      password,
      role: "user",
    };
    const value = JOISchemas.register_User(data);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    value.password = hashedPassword;
    const DeliverMan = await Users.create(value);

    sendTokenResponse(DeliverMan, 200, res);
  } catch (err) {
    next(err);
  }
};

// Update Personal Info
exports.UpdatePersonalInfo = async (req, res, next) => {
  try {
    const _id = req.userId;
    const address = req.body.address;
    const phone = req.body.phone;
    const SIRET = req.body.SIRET;

    // checking files mimetype and size
    Object.entries(req.files).map((field) => {
      if (
        field[1][0].mimetype !== "application/pdf" &&
        field[1][0].mimetype !== "image/jpeg" &&
        field[1][0].mimetype !== "image/jpg"
      ) {
        const error = new Error(texts.image_Type);
        error.status = 400;
        throw error;
      }
      if (field[1][0].size > 10000000) {
        const error = new Error(texts.image_Size);
        error.status = 400;
        throw error;
      }
    });

    // replacing \\ in path with /
    let KBIS =req.files.KBIS[0].path.replace(/\\/g, "/"); 
    // await imagemin([req.files.KBIS[0].path.replace(/\\/g, "/")], {
    //   destination: "views/uploads",
    //   plugins: [imageminMozjpeg({ quality: 30 })],
    // });
    let identity = req.files.identity[0].path.replace(/\\/g, "/")
    // await imagemin(
    //   [req.files.identity[0].path.replace(/\\/g, "/")],
    //   {
    //     destination: "views/uploads",
    //     plugins: [imageminMozjpeg({ quality: 30 })],
    //   }
    // );

    let profile = req.files.profile[0].path.replace(/\\/g, "/")
    // await imagemin(
    //   [req.files.profile[0].path.replace(/\\/g, "/")],
    //   {
    //     destination: "views/uploads",
    //     plugins: [imageminMozjpeg({ quality: 30 })],
    //   }
    // );

    let diploma = req.files.diploma
      ? req.files.diploma[0].path.replace(/\\/g, "/")
      // await imagemin([req.files.diploma[0].path.replace(/\\/g, "/")], {
      //     destination: "views/uploads",
      //     plugins: [imageminMozjpeg({ quality: 30 })],
      //   })
      : "";
    let training = req.files.training
      ? req.files.training[0].path.replace(/\\/g, "/")
      // await imagemin([req.files.training[0].path.replace(/\\/g, "/")], {
      //     destination: "views/uploads",
      //     plugins: [imageminMozjpeg({ quality: 30 })],
      //   })
      : "";
    let insurance = req.files.insurance
      ? req.files.insurance[0].path.replace(/\\/g, "/")
      // await imagemin([req.files.insurance[0].path.replace(/\\/g, "/")], {
      //     destination: "views/uploads",
      //     plugins: [imageminMozjpeg({ quality: 30 })],
      //   })
      : "";

    // KBIS = KBIS[0].destinationPath.replace(/\\/g, "/");
    // identity = identity[0].destinationPath.replace(/\\/g, "/");
    // profile = profile[0].destinationPath.replace(/\\/g, "/");

    // diploma = diploma ? diploma[0].destinationPath.replace(/\\/g, "/") : "";
    // training = training ? training[0].destinationPath.replace(/\\/g, "/") : "";
    // insurance = insurance
    //   ? insurance[0].destinationPath.replace(/\\/g, "/")
    //   : "";

    const neededUser = await Users.findById(_id);
    if (neededUser) {
      if (KBIS !== "" && neededUser.proofs.KBIS) {
        clearFile(neededUser.proofs.KBIS);
      }
      if (identity !== "" && neededUser.proofs.identity) {
        clearFile(neededUser.proofs.identity);
      }
      if (profile !== "" && neededUser.proofs.profile) {
        clearFile(neededUser.proofs.profile);
      }
      if (diploma !== "" && neededUser.proofs.diploma) {
        clearFile(neededUser.proofs.diploma);
      }
      if (training !== "" && neededUser.proofs.training) {
        clearFile(neededUser.proofs.training);
      }
      if (insurance !== "" && neededUser.proofs.insurance) {
        clearFile(neededUser.proofs.insurance);
      }
    }

    const data = {
      address: {
        street: JSON.parse(address).street,
        location: JSON.parse(address).location,
        zip: JSON.parse(address).zipcode,
        complement: JSON.parse(address).complement,
        city: JSON.parse(address).city,
      },
      phone: phone,
      SIRET: SIRET,
      proofs: {
        KBIS: KBIS,
        identity: identity,
        profile: profile,
        diploma: diploma,
        training: training,
        insurance: insurance,
      },
      status: "step1",
    };
    const value = JOISchemas.user_Info(data);
    const info = await Users.findByIdAndUpdate(_id, value, { new: true });
    res.status(201).json({ user: info });
  } catch (err) {
    next(err);
  }
};

// Vehicle Information
exports.vehicleInformation = async (req, res, next) => {
  try {
    const _id = req.userId;
    const vehicle = JSON.parse(req.body.delivery).vehicle;
    const transportType = JSON.parse(req.body.delivery).transportType;
    const range = JSON.parse(req.body.delivery).range;
    const timeslots = JSON.parse(req.body.timeslots);
    const perHour = JSON.parse(req.body.delivery).perHour;
    Object.entries(req.files).map((field) => {
      if (
        field[1][0].mimetype !== "application/pdf" &&
        field[1][0].mimetype !== "image/jpeg" &&
        field[1][0].mimetype !== "image/jpg"
      ) {
        const error = new Error(texts.image_Type);
        error.status = 400;
        throw error;
      }
      if (field[1][0].size > 10000000) {
        const error = new Error(texts.image_Size);
        error.status = 400;
        throw error;
      }
    });
    let licence;
    let purchaseProof;
    if (
      vehicle.vehicleType === "Bike" ||
      vehicle.vehicleType === "Electric Bike"
    ) {
      licence = "";
      purchaseProof = "";
    } else {
      const Licence = req.files.licence[0].path.replace(/\\/g, "/")
      // await imagemin(
      //   [req.files.licence[0].path.replace(/\\/g, "/")],
      //   {
      //     destination: "views/uploads",
      //     plugins: [imageminMozjpeg({ quality: 30 })],
      //   }
      // );

      licence = Licence
      // [0].destinationPath.replace(/\\/g, "/");
      const PurchaseProof = req.files.purchaseProof[0].path.replace(/\\/g, "/")
      // await imagemin(
      //   [req.files.purchaseProof[0].path.replace(/\\/g, "/")],
      //   {
      //     destination: "views/uploads",
      //     plugins: [imageminMozjpeg({ quality: 30 })],
      //   }
      // );

      purchaseProof = PurchaseProof
      // [0].destinationPath.replace(/\\/g, "/");
    }
    const neededUser = await Users.findById(_id);
    if (neededUser) {
      if (licence !== "" && neededUser.proofs.licence) {
        clearFile(neededUser.proofs.licence);
      }
      if (purchaseProof !== "" && neededUser.proofs.purchaseProof) {
        clearFile(neededUser.proofs.purchaseProof);
      }
    }

    const allData = {
      delivery: {
        vehicle: {
          vehicleType: vehicle.vehicleType,
          licence: licence,
          purchaseProof: purchaseProof,
        },
        transportType: transportType,
        range: range,
        perHour: perHour,
      },
      timeslots: timeslots,
      status: "active",
    };

    const value = JOISchemas.vehicleInformation(allData);
    const result = await Users.findByIdAndUpdate(_id, value, { new: true });
    res.status(201).json({ user: result });
  } catch (err) {
    next(err);
  }
};

// Update
exports.Update = async (req, res, next) => {
  try {
    const _id = req.userId;
    const address = req.body.address;
    const phone = req.body.phone;
    const SIRET = req.body.SIRET;
    const perHour = req.body.perHour;
    const vehicleType = req.body.vehicleType;
    const range = req.body.range;
    const transportType = req.body.transportType;
    const timeslots = JSON.parse(req.body.timeslots);

    // checking files mimetype and size
    Object.entries(req.files).map((field) => {
      if (
        field[1][0].mimetype !== "application/pdf" &&
        field[1][0].mimetype !== "image/jpeg" &&
        field[1][0].mimetype !== "image/jpg"
      ) {
        const error = new Error(texts.image_Type);
        error.status = 400;
        throw error;
      }
      if (field[1][0].size > 10000000) {
        const error = new Error(texts.image_Size);
        error.status = 400;
        throw error;
      }
    });

    let KBIS = req.files.KBIS
      ? req.files.KBIS[0].path.replace(/\\/g, "/")
      //  await imagemin([req.files.KBIS[0].path.replace(/\\/g, "/")], {
      //     destination: "views/uploads",
      //     plugins: [imageminMozjpeg({ quality: 30 })],
      //   })
      : "";

    let identity = req.files.identity
      ? req.files.identity[0].path.replace(/\\/g, "/")
      // await imagemin([req.files.identity[0].path.replace(/\\/g, "/")], {
      //     destination: "views/uploads",
      //     plugins: [imageminMozjpeg({ quality: 30 })],
      //   })
      : "";

    let profile = req.files.profile
      ? req.files.profile[0].path.replace(/\\/g, "/")
      // await imagemin([req.files.profile[0].path.replace(/\\/g, "/")], {
      //     destination: "views/uploads",
      //     plugins: [imageminMozjpeg({ quality: 30 })],
      //   })
      : "";

    let insurance = req.files.insurance
      ? req.files.insurance[0].path.replace(/\\/g, "/")
      // await imagemin([req.files.insurance[0].path.replace(/\\/g, "/")], {
      //     destination: "views/uploads",
      //     plugins: [imageminMozjpeg({ quality: 30 })],
      //   })
      : "";

    let diploma = req.files.diploma
      ? req.files.diploma[0].path.replace(/\\/g, "/")
      // await imagemin([req.files.diploma[0].path.replace(/\\/g, "/")], {
      //     destination: "views/uploads",
      //     plugins: [imageminMozjpeg({ quality: 30 })],
      //   })
      : "";

    let training = req.files.training
      ? req.files.training[0].path.replace(/\\/g, "/")
      // await imagemin([req.files.training[0].path.replace(/\\/g, "/")], {
      //     destination: "views/uploads",
      //     plugins: [imageminMozjpeg({ quality: 30 })],
      //   })
      : "";
    let licence = req.files.licence
      ? req.files.licence[0].path.replace(/\\/g, "/")
      // await imagemin([req.files.licence[0].path.replace(/\\/g, "/")], {
      //     destination: "views/uploads",
      //     plugins: [imageminMozjpeg({ quality: 30 })],
      //   })
      : "";

    let purchaseProof = req.files.purchaseProof
      ? req.files.purchaseProof[0].path.replace(/\\/g, "/")
      // await imagemin([req.files.purchaseProof[0].path.replace(/\\/g, "/")], {
      //     destination: "views/uploads",
      //     plugins: [imageminMozjpeg({ quality: 30 })],
      //   })
      : "";

    // KBIS = KBIS ? KBIS[0].destinationPath.replace(/\\/g, "/") : "";
    // identity = identity ? identity[0].destinationPath.replace(/\\/g, "/") : "";
    // profile = profile ? profile[0].destinationPath.replace(/\\/g, "/") : "";

    // diploma = diploma ? diploma[0].destinationPath.replace(/\\/g, "/") : "";
    // training = training ? training[0].destinationPath.replace(/\\/g, "/") : "";
    // insurance = insurance ? profile[0].destinationPath.replace(/\\/g, "/") : "";
    // licence = licence ? licence[0].destinationPath.replace(/\\/g, "/") : "";
    // purchaseProof = purchaseProof
    //   ? purchaseProof[0].destinationPath.replace(/\\/g, "/")
    //   : "";

    const neededUser = await Users.findById(_id);
    if (neededUser) {
      if (KBIS !== "" && KBIS && neededUser.proofs.KBIS) {
        clearFile(neededUser.proofs.KBIS);
      }
      if (identity !== "" && identity && neededUser.proofs.identity) {
        clearFile(neededUser.proofs.identity);
      }
      if (profile !== "" && profile && neededUser.proofs.profile) {
        clearFile(neededUser.proofs.profile);
      }
      if (diploma !== "" && diploma && neededUser.proofs.diploma) {
        clearFile(neededUser.proofs.diploma);
      }
      if (training !== "" && training && neededUser.proofs.training) {
        clearFile(neededUser.proofs.training);
      }
      if (insurance !== "" && insurance && neededUser.proofs.insurance) {
        clearFile(neededUser.proofs.insurance);
      }
      if (licence !== "" && licence && neededUser.delivery.vehicle.licence) {
        clearFile(neededUser.delivery.vehicle.licence);
      }
      if (
        purchaseProof !== "" &&
        purchaseProof &&
        neededUser.delivery.vehicle.purchaseProof
      ) {
        clearFile(neededUser.delivery.vehicle.purchaseProof);
      }
    }

    const data = {
      address: {
        street: JSON.parse(address).street,
        location: JSON.parse(address).location,
        zip: JSON.parse(address).zipcode,
        complement: JSON.parse(address).complement,
        city: JSON.parse(address).city,
      },
      phone: phone,
      timeslots: timeslots,
      SIRET: SIRET,
      proofs: {
        KBIS: KBIS || neededUser.proofs.KBIS,
        identity: identity || neededUser.proofs.identity,
        profile: profile || neededUser.proofs.profile,
        diploma: diploma || neededUser.proofs.diploma,
        training: training || neededUser.proofs.training,
        insurance: insurance || neededUser.proofs.insurance,
      },
      delivery: {
        vehicle: {
          licence: licence || neededUser.delivery.vehicle.licence,
          purchaseProof:
            purchaseProof || neededUser.delivery.vehicle.purchaseProof,
          vehicleType: vehicleType || neededUser.delivery.vehicle.vehicleType,
        },
        perHour: perHour || neededUser.perHour,
        range: range || neededUser.range,
        transportType: transportType || neededUser.transportType,
      },
    };

    const info = await Users.findByIdAndUpdate(_id, data, { new: true });
    res.status(201).json({ user: info });
  } catch (err) {
    next(err);
  }
};

// Get One User
exports.getUserByToken = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await Users.findById(userId);
    if (!user) {
      const error = new Error(texts.Opps);
      error.status = 400;
      error;
    }
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

// Get All Invitations
exports.getAllInvites = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await Users.findById(userId).populate({
      path: "delivery.invitations",
      populate: {
        path: "company",
      },
    });
    if (!user) {
      const error = new Error(texts.Opps);
      error.status = 404;
      throw error;
    }
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

// Accept Invite
exports.accceptInvite = async (req, res, next) => {
  try {
    const offerId = req.params.offerId;
    const userId = req.userId;

    // updating Offer Info
    const offer = await Offers.findById(offerId).populate({
      path: "company",
      populate: { path: "rating" },
    });
    if (!offer) {
      const error = new Error(texts.Opps);
      error.status = 404;
      throw error;
    }
    if (offer.deliveryMen.length === offer.requiredPerson) {
      let newArray = [];
      await Promise.all(
        offer.desiredPersons.map(async (person) => {
          if (person.status === "pending") {
            await Users.updateOne(
              { _id: person.userId },
              {
                $pull: {
                  "delivery.invitations": offerId,
                },
              }
            );
          } else {
            newArray.push(person);
          }
        })
      );
      offer.desiredPersons = newArray;
      await offer.save();

      const error = new Error(texts.offer_Limit);
      error.status = 400;
      throw error;
    }
    let index;
    offer.desiredPersons.map((item, index2) => {
      if (String(item.userId) === String(userId)) {
        index = index2;
      }
    });

    if (index >= 0) {
      offer.desiredPersons[index].status = "accepted";
      offer.deliveryMen.push({ personId: userId });
      const updatedOffer = await offer.save();
      if (!updatedOffer) {
        const error = new Error(texts.Opps);
        error.status = 404;
        throw error;
      }
      // Updating User Info
      const user = await Users.findById(userId);
      if (!user) {
        const error = new Error(texts.Opps);
        error.status = 404;
        throw error;
      }

      user.delivery.invitations = user.delivery.invitations.filter(
        (item) => String(item) !== String(offer._id)
      );

      const updatedUser = await user.save();
      if (!updatedUser) {
        const error = new Error(texts.Opps);
        error.status = 404;
        throw error;
      }
      res.status(200).json({ user: updatedUser, offer: updatedOffer });
    } else {
      const error = new Error(texts.offer_Not_Available);
      error.status = 404;
      throw error;
    }
  } catch (err) {
    next(err);
  }
};

// Reject Invite
exports.rejectInvite = async (req, res, next) => {
  try {
    const offerId = req.params.offerId;
    const userId = req.userId;
    const offer = await Offers.findById(offerId).populate({
      path: "company",
      populate: { path: "rating" },
    });
    if (!offer) {
      const error = new Error(texts.Opps);
      error.status = 404;
      throw error;
    }
    const user = await Users.findById(userId);
    if (!user) {
      const error = new Error(texts.Opps);
      error.status = 404;
      throw error;
    }
    let index;
    offer.desiredPersons.map((item, index2) => {
      if (String(item.userId) === String(userId)) {
        index = index2;
      }
    });
    if (index >= 0) {
      offer.desiredPersons[index].status = "rejected";
      const updatedOffer = await offer.save();
      if (!updatedOffer) {
        const error = new Error(texts.Opps);
        error.status = 404;
        throw error;
      }

      user.delivery.invitations = user.delivery.invitations.filter(
        (item) => String(item) !== String(offerId)
      );
      const updatedUser = await user.save();
      if (!updatedUser) {
        const error = new Error(texts.Opps);
        error.status = 404;
        throw error;
      }
      res.status(200).json({ user: updatedUser, offer: updatedOffer });
    } else {
      res.status(200).json({ user: user, offer: offer });
    }
  } catch (err) {
    next(err);
  }
};

// Offers (Delivery Person)
exports.personOffers = async (req, res, next) => {
  try {
    const userId = req.userId;

    const offers = await Offers.find({
      "deliveryMen.personId": userId,
    }).populate({ path: "company", populate: { path: "rating" } }).sort('-createdAt');
    if (!offers) {
      const error = new Error(texts.Opps);
      error.status = 400;
      throw error;
    }
    res.status(200).json({ offers });
  } catch (err) {
    next(err);
  }
};

// Rating Offer
exports.ratingCompany = async (req, res, next) => {
  try {
    const UserId = req.userId;
    const strength = req.body.strength;
    const note = req.body.note;
    const offerId = req.body.offerId;
    const toUserId = req.body.toUserId;

    const data = {
      byUserId: UserId,
      offerId: offerId,
      strength: strength,
      note: note,
    };
    const value = JOISchemas.rating(data);

    const toUser = await Users.findById(toUserId);

    if (toUser.rating) {
      const ratingObject = await Rating.findById(toUser.rating);
      ratingObject.rating.push(value);
      const rating = await ratingObject.save();

      toUser.averageRating = (Number(toUser.averageRating) + Number(strength)) / 2;
      let user = await toUser.save();

      user.rating = rating;

      res.status(200).json({ user, rating });
    } else {
      const rating = await Rating.create({
        rating: [value],
      });
      if (!rating) {
        const error = new Error(texts.Opps);
        error.status = 400;
        throw error;
      }
      toUser.rating = rating._id;
      toUser.averageRating = Number(strength);

      let user = await toUser.save();

      user.rating = rating;

      res.status(200).json({ rating, user });
    }
  } catch (err) {
    next(err);
  }
};

// Invites
exports.getInvites = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await Users.findById(userId).populate({
      path: "delivery.invitations",
      populate: {
        path: "company",
      },
    });

    if (!user) {
      const error = new Error(texts.Opps);
      error.status = 400;
      throw error;
    }
    res.status(200).json({ invites: user.delivery.invitations });
  } catch (err) {
    next(err);
  }
};
// Get Rates
exports.getRates = async (req, res, next) => {
  try {
    let max = await Users.find({ role: "user", status: "active" })
      .sort({
        "delivery.perHour": -1,
      })
      .select("delivery.perHour")
      .limit(1);
    let min = await Users.find({ role: "user", status: "active" })
      .sort({
        "delivery.perHour": 1,
      })
      .select("delivery.perHour")
      .limit(1);
    max = max[0].delivery.perHour;
    min = min[0].delivery.perHour;
    let average = Math.ceil((max + min) / 2);
    res.status(200).json({ min, max, average });
  } catch (err) {
    next(err);
  }
};
