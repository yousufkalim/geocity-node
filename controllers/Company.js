const Users = require("../models/Users");
const Offers = require("../models/Offers");
const Rating = require("../models/Rating");
const { clearFile } = require("../utils/clearFile");
const bcrypt = require("bcryptjs");
const texts = require("../utils/Messages");
const JOISchemas = require("../utils/Validations");
const SMS = require("../utils/SMS");
const sendTokenResponse = require("../utils/TokenResponse");
const imagemin = require("imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");
// create company
exports.RegisterCompany = async (req, res, next) => {
  try {
    const { firstName, lastName, email, dob, password, company } = req.body;
    const Exists = await Users.findOne({ email: email });
    if (Exists) {
      const error = new Error(texts.already_Email);
      error.status = 400;
      throw error;
    }
    const data = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      dob,
      password,
      company: {
        companyName: company.companyName,
        perMonth: company.perMonth,
        workForce: company.workForce,
      },
      role: "company",
    };

    const value = JOISchemas.register_Company(data);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    value.password = hashedPassword;
    const Company = await Users.create(value);
    sendTokenResponse(Company, 200, res);
  } catch (err) {
    next(err);
  }
};

// Update Company Info
exports.UpdateCompanyInfo = async (req, res, next) => {
  try {
    const _id = req.userId;
    const address = JSON.parse(req.body.address);
    const phone = req.body.phone;
    const SIRET = req.body.SIRET;
    const openingTime = JSON.parse(req.body.company).openingTime;
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
    // replacing \\ in path with /

    let KBIS = req.files.KBIS[0].path.replace(/\\/g, "/");
    let identity = req.files.identity[0].path.replace(/\\/g, "/");
    let profile = req.files.profile[0].path.replace(/\\/g, "/");

    console.log(KBIS, identity, profile)
    let files;
    // if (KBIS && identity && profile) {
    //   files = await imagemin([KBIS, identity, profile], {
    //     destination: "views/uploads",
    //     plugins: [imageminMozjpeg({ quality: 30 })],
    //   });
    // }
    console.log('files',files)
    // if (files) {
    //   KBIS = files[0].destinationPath.replace(/\\/g, "/");
    //   identity = files[1].destinationPath.replace(/\\/g, "/");
    //   profile = files[2].destinationPath.replace(/\\/g, "/");
    // }

    const data = {
      address: {
        street: address.street,
        location: address.location,
        zip: address.zipcode,
        complement: address.complement,
        city: address.city,
      },
      phone: phone,
      timeslots: timeslots,
      proofs: {
        KBIS: KBIS,
        identity: identity,
        profile: profile,
      },
      SIRET: SIRET,
      company: {
        openingTime: openingTime,
      },
    };

    JOISchemas.update_Company_Info(data);
    const user = await Users.findById(_id);
    user.address = {
      street: address.street,
      location: address.location,
      zip: address.zipcode,
      complement: address.complement,
      city: address.city,
    };
    user.phone = phone;
    user.proofs = {
      KBIS: KBIS,
      identity: identity,
      profile: profile,
    };
    user.SIRET = SIRET;
    user.timeslots = timeslots;
    user.company = {
      ...user.company,
      openingTime: openingTime,
    };
    user.status = "step1";
    const updatedUser = await user.save();
    res.status(201).json({ user: updatedUser });
  } catch (err) {
    next(err);
  }
};

//  Updating Some Data
exports.update = async (req, res, next) => {
  try {
    const userId = req.userId;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const address = req.body.address ? JSON.parse(req.body.address) : "";
    const phone = req.body.phone;
    const SIRET = req.body.SIRET;
    const timeslots = req.body.timeslots ? JSON.parse(req.body.timeslots) : "";

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
      // await imagemin([req.files.KBIS[0].path.replace(/\\/g, "/")], {
      //     destination: "views/uploads",
      //     plugins: [imageminMozjpeg({ quality: 30 })],
      //   })
      : "";

    let identity = req.files.identity
      ? req.files.identity[0].path.replace(/\\/g, "/")
      //  await imagemin([req.files.identity[0].path.replace(/\\/g, "/")], {
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

    // KBIS = KBIS ? KBIS[0].destinationPath.replace(/\\/g, "/") : "";
    // identity = identity ? identity[0].destinationPath.replace(/\\/g, "/") : "";
    // profile = profile ? profile[0].destinationPath.replace(/\\/g, "/") : "";

    const neededUser = await Users.findById(userId);
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
    }

    // address validation

    const data = {
      address: {
        street: address.street,
        location: address.location,
        zip: address.zipcode,
        complement: address.complement,
        city: address.city,
      },
      phone: phone,
      timeslots: timeslots,
      proofs: {
        KBIS: KBIS,
        identity: identity,
        profile: profile,
      },
      SIRET: SIRET,
    };

    JOISchemas.update_Company(data);
    const user = await Users.findById(userId);
    user.address = {
      street: address.street || user.address.street,
      location: address.location || user.address.location,
      zip: address.zipcode || user.address.zip,
      complement: address.complement || user.address.complement,
      city: address.city || user.address.city,
    };
    user.phone = phone || user.phone;
    user.proofs = {
      KBIS: KBIS || user.proofs.KBIS,
      identity: identity || user.proofs.identity,
      profile: profile || user.proofs.profile,
    };
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.SIRET = SIRET || user.SIRET;
    user.timeslots = timeslots || user.timeslots;
    user.status = user.status;

    const updatedUser = await user.save();

    res.status(201).json({ user: updatedUser });
  } catch (err) {
    next(err);
  }
};

//  Get One User
exports.getOneUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const info = await Users.findById(id);
    if (!info) {
      const error = new Error(texts.not_Exists);
      error.status = 400;
      throw err;
    }
    res.status(200).json({ user: info });
  } catch (err) {
    next(err);
  }
};

// Get User By Token
exports.getUserByToken = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await Users.findById(userId);
    if (!user) {
      const error = new Error(texts.not_Exists);
      error.status = 400;
      throw error;
    }
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

// Offers (Comapny Created)
exports.companyOffers = async (req, res, next) => {
  try {
    const userId = req.userId;
    const offers = await Offers.find({
      company: userId,
      desiredPersons: {
        $elemMatch: {
          status: { $in: ["pending", "accepted", "rejected"] },
        },
      },
    })
      .populate({
        path: "deliveryMen.personId",
        populate: {
          path: "rating",
        },
      })
      .populate("desiredPersons.userId").sort('-createdAt');

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

// Rate User
exports.ratingUser = async (req, res, next) => {
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

// Active Mission
exports.active = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const offerId = req.body.offerId;

    const offer = await Offers.findById(offerId)
      .populate("deliveryMen.personId")
      .populate("desiredPersons.userId");
    if (!offer) {
      const error = new Error(texts.Opps);
      error.status = 400;
      throw error;
    }
    offer.deliveryMen.map((person) => {
      if (String(person.personId._id) === String(userId)) {
        person.status = "active";
        SMS(texts.active, person.personId.phone);
      }
    });
    const updatedOffer = await offer.save();
    res.status(200).json({ offer: updatedOffer });
  } catch (err) {
    next(err);
  }
};

// Start Mission
exports.started = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const offerId = req.body.offerId;

    const offer = await Offers.findById(offerId)
      .populate("deliveryMen.personId")
      .populate("desiredPersons.userId");
    if (!offer) {
      const error = new Error(texts.Opps);
      error.status = 400;
      throw error;
    }
    offer.deliveryMen.map((person) => {
      if (String(person.personId._id) === String(userId)) {
        person.status = "started";
        SMS(texts.started, person.personId.phone);
      }
    });
    const updatedOffer = await offer.save();
    res.status(200).json({ offer: updatedOffer });
  } catch (err) {
    next(err);
  }
};
// Complete  Mission
exports.completed = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const offerId = req.body.offerId;

    const offer = await Offers.findById(offerId)
      .populate({
        path: "deliveryMen.personId",
        populate: {
          path: "rating",
        },
      })
      .populate("desiredPersons.userId");
    if (!offer) {
      const error = new Error(texts.Opps);
      error.status = 400;
      throw error;
    }

    offer.deliveryMen.map((person) => {
      if (String(person.personId._id) === String(userId)) {
        person.status = "completed";
        SMS(texts.complete, person.personId.phone);
      }
    });
    const updatedOffer = await offer.save();
    const user = await Users.findById(userId);
    // const time = Math.abs(updatedOffer.end - updatedOffer.start);
    let hoursToAddPerc = 0;
    if (parseInt(updatedOffer.start) >= 0 && parseInt(updatedOffer.start) < 8) {
      hoursToAddPerc = hoursToAddPerc + (8 - updatedOffer.start);
    }
    if (parseInt(updatedOffer.end) >= 20 && parseInt(updatedOffer.end) < 24) {
      hoursToAddPerc = hoursToAddPerc + (24 - updatedOffer.end);
    }
    let hours = Math.abs(updatedOffer.end - updatedOffer.start);
    let NewRate = hours * user.delivery.perHour;
    if (hoursToAddPerc > 0) {
      NewRate = NewRate + user.delivery.perHour * 0.1 * hoursToAddPerc;
    }
    // NewRate;
    // const price = time * user.delivery.perHour;
    user.totalEaring = user.totalEaring + NewRate;
    await user.save();

    res.status(200).json({ offer: updatedOffer });
  } catch (err) {
    next(err);
  }
};
