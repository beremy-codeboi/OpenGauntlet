const ScoreUtils = {
	getPoints: (score,chart) => Math.max(0,
		3 * score.fantasticCount
		+ score.excellentCount
		- score.missCount
		+ 3 * score.holdCount
		+ 3 * score.rollCount
		+ 3 * (score.mineCount - chart.mineCount)
	),
	getNumericItems: () => [
		{ key: 'fantasticCount', name: 'Fantastics' },
		{ key: 'excellentCount', name: 'Excellents' },
		{ key: 'greatCount', name: 'Greats' },
		{ key: 'decentCount', name: 'Decents' },
		{ key: 'wayOffCount', name: 'Way Offs' },
		{ key: 'missCount', name: 'Misses' },
		{ key: 'holdCount', name: 'Holds Held' },
		{ key: 'rollCount', name: 'Rolls Rolled' },
		{ key: 'mineCount', name: 'Mines Avoided' },
	]
};

if (typeof(module) !== 'undefined') { module.exports = ScoreUtils; }