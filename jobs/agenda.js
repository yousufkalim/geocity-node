const Agenda = require('agenda');
const RemovePendingProjects = require('./DeletePendingProjects');

const agenda = new Agenda({
  db: { address: "mongodb://localhost:27017/CP" },
  options: { useNewUrlParser: true, useUnifiedTopology: true },
});



RemovePendingProjects(agenda);

(async function () {
  await agenda.start();
  await agenda.every('2 minutes', 'remove pending projects');
})();

module.exports = agenda;