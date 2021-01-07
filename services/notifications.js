const User = require("../models/User");

module.exports = {
  addNotifcation,
};

async function addNotifcation(data) {
  try {
    console.log(data);

    var currentUser = await User.findById(data.user);
    // var currentUser = await User.findByIdAndUpdate(
    //   data.id,
    //   {
    //     $push: {
    //       notifications: {
    //         title: data.title,
    //         description: data.message,
    //         projectID: "test",
    //       },
    //     },
    //   },
    //   { new: true }
    // );
    console.log(currentUser, "currentUser");
    return "Added";
  } catch (e) {
    return "Error Adding: " + e;
  }
}
