const router = require("express").Router();
const multer = require("multer");

const {
  RegisterCompany,
  UpdateCompanyInfo,
  getOneUser,
  getUserByToken,
  companyOffers,
  ratingUser,
  update,
  active,
  started,
  completed,
} = require("../controllers/Company");
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

// Regiter Company
router.post("/create-company", RegisterCompany);

// Update Company Info
router.put(
  "/update-companyinfo",
  protect,
  upload.fields([
    { name: "KBIS", maxCount: 1 },
    { name: "identity", maxCount: 1 },
    { name: "profile", maxCount: 1 },
  ]),
  UpdateCompanyInfo
);

// Update Info
router.put(
  "/update",
  protect,
  upload.fields([
    { name: "KBIS", maxCount: 1 },
    { name: "identity", maxCount: 1 },
    { name: "profile", maxCount: 1 },
  ]),
  update
);
// Get One User
router.get("/get-user/:id", protect, getOneUser);

// Get One User By Token
router.get("/get-user-by-token", protect, getUserByToken);

// Offers (company created) (History)
router.get("/all-offers", protect, companyOffers);

// Rate User
router.post("/rate-user", protect, ratingUser);

// Active OFfer
router.post("/active", protect, active);

// Start Offer
router.post("/start", protect, started);

// complete Offer
router.post("/completed", protect, completed);

module.exports = router;
