const rounds = require('./rounds');

module.exports = (app) => {
	rounds.getAllRounds().forEach(round => {
		let filename = round.roundId + '.zip';
		let path = '/charts/' + filename;
		app.expressApp.get(path, (req, res, next) => {
			if (round.startTimestamp >= Date.now()) {
				return res
					.status(403)
					.type('text/plain')
					.send('Round is in the future.');
			}
			
			return res.sendFile(filename, { root: './charts/' });
		});
	});
};