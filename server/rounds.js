const roundsData = require('./rounds.json');
const roundDuration = 1000 * 60 * 60 * 24 * 14;
const roundsStart = 1578124800000;

(() => {
	roundsData.chartsById = {};
	
	roundsData.rounds.forEach((round, roundIndex) => {
		
		if (!round.charts) throw new Error('Round ' + roundIndex + ' missing charts.');
		
		round.index = roundIndex;
		round.startTimestamp = roundsStart + roundDuration * roundIndex;
		round.endTimestamp = round.startTimestamp + roundDuration;
		
		if (!round.name) round.name = 'Round ' + (roundIndex + 1);
		
		round.charts.forEach((chart, chartIndex) => {
			['title','songId', 'difficulty', 'stepCount', 'holdCount', 'rollCount', 'mineCount'].forEach(key => {
				if (typeof(chart[key]) === 'undefined') throw new Error('Round ' + roundIndex + ' chart ' + chartIndex + ' missing ' + key);
			});
			chart.id = chart.songId + '_' + chart.difficulty;
			chart.roundIndex = roundIndex;
			roundsData.chartsById[chart.id] = chart;
		});
	});
})();

const rounds = {
	getCurrentRound: () => {
		let now = Date.now();
		
		let durationSinceStart = now - roundsStart;

		if (durationSinceStart < 0) return null;
		
		let roundIndex = Math.floor(durationSinceStart / roundDuration);
		
		if (roundIndex >= roundsData.rounds.length) return null;
		
		return roundsData.rounds[roundIndex];
	},
	getRound: (index) => {
		return roundsData.rounds[index];
	},
	getAllRounds: () => roundsData.rounds,
	getChart: id => roundsData.chartsById[id],
};

module.exports = rounds;