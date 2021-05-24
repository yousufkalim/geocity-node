const express = require("express");
const router = express.Router();
const {
  getAllOffers,
  getOffer,
  sendInvites,
  newOffer,
  cancelUser,
  getTotalRatingsAndToltalOffers,
} = require("../controllers/Offers");
const { protect } = require("../middlewares/auth");
//  All Offers
router.get("/offers", getAllOffers);

// One Offer
router.get("/offer/:id", getOffer);

// Create Offer / Search
router.post("/new-offer", protect, newOffer);

// Send Invites
router.post("/invite", sendInvites);

// Cancel Invite
router.post("/cancel", protect, cancelUser);
router.get("/total", protect, getTotalRatingsAndToltalOffers);

module.exports = router;
