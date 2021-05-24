const router = require("express").Router();
const multer = require("multer");

const {
  RegisterDeliveryMan,
  UpdatePersonalInfo,
  vehicleInformation,
  getUserByToken,
  getAllInvites,
  accceptInvite,
  rejectInvite,
  personOffers,
  ratingCompany,
  getInvites,
  Update,
  getRates,
} = require("../controllers/User");
const { protect } = require("../middlewares/auth");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "views/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Register Delivery Person
router.post("/create-deliveryman", RegisterDeliveryMan);

// Update Delivery Man Personal Info
router.put(
  "/update-personalinfo",
  protect,
  upload.fields([
    { name: "KBIS", maxCount: 1 },
    { name: "identity", maxCount: 1 },
    { name: "profile", maxCount: 1 },
    { name: "diploma", maxCount: 1 },
    { name: "training", maxCount: 1 },
    { name: "insurance", maxCount: 1 },
  ]),
  UpdatePersonalInfo
);

// Update  Vehicle Info
router.put(
  "/vehicle-info",
  protect,
  upload.fields([
    { name: "licence", maxCount: 1 },
    { name: "purchaseProof", maxCount: 1 },
  ]),
  vehicleInformation
);

// Update
router.put(
  "/update",
  protect,
  upload.fields([
    { name: "KBIS", maxCount: 1 },
    { name: "identity", maxCount: 1 },
    { name: "profile", maxCount: 1 },
    { name: "diploma", maxCount: 1 },
    { name: "training", maxCount: 1 },
    { name: "insurance", maxCount: 1 },
    { name: "licence", maxCount: 1 },
    { name: "purchaseProof", maxCount: 1 },
  ]),
  Update
);

// Get One User By Token
router.get("/get-user-by-token", protect, getUserByToken);

// Get All Invite
router.get("/all-invites", protect, getAllInvites);

// Accept Invite
router.get("/accept/:offerId", protect, accceptInvite);

// Reject Invite
router.get("/reject/:offerId", protect, rejectInvite);

// Offers (Delivery Person)(History)
router.get("/offers", protect, personOffers);

// Rating Offer
router.post("/rate-company", protect, ratingCompany);

//Get Ivitations
router.get("/invites", protect, getInvites);

// Get Rates
router.get("/get-rates", protect, getRates);

module.exports = router;
