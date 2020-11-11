const Project = require('../models/Project');


module.exports = function RemovePendingProjects(agenda) {
  agenda.define('remove pending projects', async (job, done) => {
    console.log('job running')
    const today = new Date();
    console.log(today);
    today.setDate(today.getDate() - 30);
    console.log(today);
    await Project.updateMany({ deletionRequestTime: { $lt: today } }, { isDeleted:true });
    done();
  });
}