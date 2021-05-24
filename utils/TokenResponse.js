module.exports = (User, statusCode, res) => {
  //create token

  const token = User.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + Number(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }
  if (User) {
    res
      .status(statusCode)
      .cookie("token", token, options)
      .json({ token: token, user: User });
  } else {
    res.json({ message: texts.Opps });
  }
};
