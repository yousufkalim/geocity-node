const jwt = require("jsonwebtoken");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middlewares/async");
const User = require("../models/User");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  //make sure token exists
  if (!token) {
    return res.status(400).send("Please Login to view that resource");
  }
  try {
    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return res.status(400).send("Please Login to view that resource");
  }
});

//Grant Access to specific Roles

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(400).send("Please Login to view that resource");
    }
    next();
  };
};

//dashboard authentication

exports.dashboard = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  //make sure token exists
  if (!token) {
    return res.status(400).send("Please Login to view that resource");
  }
  try {
    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    user_role = req.user.role;
    if (user_role == "user") {
      return res.status(200).send("User is here");
    } else {
      return res.status(200).send("Admin is here");
    }
    next();
  } catch (err) {
    return res.status(400).send("Please Login to view that resource");
  }
});

//Customer dashboard middleware
exports.customer_dashboard = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  //make sure token exists
  if (!token) {
    req.flash("error_msg", "Please Login");
    return res.redirect("/api/v1/auth/customer-login");
  }
  try {
    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    user_role = req.user.role;
    if (user_role == "customer") {
      return res.render("customer/customer-dashboard.ejs", {
        lname: req.user.lname,
        userID: req.user.id,
      });
    }
    next();
  } catch (err) {
    req.flash("error_msg", "Error");
    return res.redirect("/api/v1/auth/customer-login");
  }
});
