const { Notification } = require("../_helper/db");

module.exports = {
  addNotifcation,
};

async function addNotifcation(data) {
  try {
    var notification = new Notification(data);
    await notification.save();
    return "Added";
  } catch (e) {
    return "Error Adding: " + e;
  }
}
