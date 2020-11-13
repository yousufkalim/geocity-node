const Project = require('../models/Project');


module.exports = function RemovePendingProjects(agenda) {
  agenda.define('remove pending projects', async (job, done) => {
    const today = new Date();
    today.setDate(today.getDate() - 30);
    await Project.updateMany({ deletionRequestTime: { $lt: today } }, { isDeleted:true });
    done();
  });
}