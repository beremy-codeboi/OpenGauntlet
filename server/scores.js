const authTokens = require('./authTokens');
const rounds = require('./rounds');
const ScoreUtils = require('../client/common/ScoreUtils');
const screenshots = require('./screenshots');

module.exports = app => {
	function rankBy(rankings, keys) {
		rankings.sort((a,b) => {
			let differingKey = keys.find(key => a[key] !== b[key]);
			if (!differingKey) return 0;
			return b[differingKey] - a[differingKey];
		});
		
		let rank = 0;
		rankings.forEach((ranking, index) => {
			let prevRanking = index === 0 ? null : rankings[index - 1];
			
			if (prevRanking === null || keys.some(key => ranking[key] !== prevRanking[key])) {
				rank = index + 1;
			}
			
			ranking.rank = rank;
		});
	}
	
	function buildRoundRankings(round) {
		let rankingsByUserId = {};
		
		round.charts.forEach(chart => {
			app.stores.scores.listIdsBy('chartId', chart.id)
				.map(app.stores.scores.get)
				.forEach(score => {
					if (!rankingsByUserId[score.userId]) {
						rankingsByUserId[score.userId] = {
							userId: score.userId,
							scoresByChartId: {},
							totalPoints: 0,
							username: app.stores.users.get(score.userId).name,
						};
					}
					
					rankingsByUserId[score.userId].totalPoints += score.points;
					rankingsByUserId[score.userId].scoresByChartId[score.chartId] = score;
				});
		});
		
		let rankings = [];
		for (let userId in rankingsByUserId) {
			rankings.push(rankingsByUserId[userId]);
		}
		
		rankBy(rankings, ['totalPoints']);
		
		rankings.forEach(ranking => {
			ranking.tournamentPoints = Math.max(0, 11 - ranking.rank);
		});
		
		return rankings;
	}
	
	let rankingsByRound = rounds.getAllRounds().map(buildRoundRankings);
	
	function buildTournamentRankings() {
		let rankingsByUserId = {};
		rankingsByRound.forEach(roundRankings => {
			roundRankings.forEach(ranking => {
				if (ranking.tournamentPoints === 0 && ranking.scorePoints === 0) return;
				
				if (rankingsByUserId[ranking.userId] === undefined) {
					rankingsByUserId[ranking.userId] = {
						userId: ranking.userId,
						username: app.stores.users.get(ranking.userId).name,
						tournamentPoints: 0,
						scorePoints: 0,
					};
				}
				
				rankingsByUserId[ranking.userId].tournamentPoints += ranking.tournamentPoints;
				rankingsByUserId[ranking.userId].scorePoints += ranking.totalPoints;
			});
		});
		
		let rankings = [];
		for (let userId in rankingsByUserId) {
			rankings.push(rankingsByUserId[userId]);
		}
		
		rankBy(rankings, ['tournamentPoints', 'scorePoints']);
		
		return rankings;
	}
	
	let tournamentRankings = buildTournamentRankings();
	
	function updateRoundAndTournamentRankings(roundIndex) {
		rankingsByRound[roundIndex] = buildRoundRankings(rounds.getRound(roundIndex));
		tournamentRankings = buildTournamentRankings();
	}
	
	async function createScore(score)
	{
		await app.stores.scores.create(score);
		await screenshots.handleNewScore(score);
	}
	
	app.expressApp.get('/round_scores/:roundIndex/:userId', (req, res, next) => {
		let round = rounds.getRound(+req.params.roundIndex);
		
		if (!round) return res.status(404).json({ error: 'Round not found.' });
		
		let scores = [];
		
		round.charts.forEach(chart => {
			let scoreId = chart.id + '_' + req.params.userId;
			let score = app.stores.scores.get(scoreId);
			
			if (score) scores.push(score);
		});
		
		return res.status(200).json({ scores: scores });
	});
	
	app.expressApp.get('/round_rankings/:roundIndex', (req, res, next) => {
		let round = rounds.getRound(+req.params.roundIndex);
		
		if (!round) return res.status(404).json({ error: 'Round not found.' });
		
		return res.status(200).json({ rankings: rankingsByRound[round.index] });
	});
	
	app.expressApp.get('/tournament_rankings', (req, res, next) => {
		return res.status(200).json({ rankings: tournamentRankings });
	});
	
	app.expressApp.post('/score', (req, res, next) => {
		if (typeof(req.body.authToken) !== 'string') {
			return res.status(400).json({ error: 'authToken must be a string.' });
		}
		
		let senderId = authTokens.userIdForToken(req.body.authToken);
		
		if (!senderId) {
			return res.status(401).json({ error: 'Invalid auth token.' });
		}
		
		let sender = app.stores.users.get(senderId);
		
		let userId = req.body.userId || senderId;
		
		if (userId !== senderId) {
			if (!sender.admin) {
				return res.status(403).json({ error: 'You do not have permission to update other users\' scores.' });
			}
		}
		
		let chartId = req.body.chartId;
		let url = String(req.body.url);
		
		if (typeof(chartId) !== 'string') {
			return res.status(400).json({ error: 'Chart id must be a string.', key: 'chartId' });
		}
		
		let round, chart;
		if (sender.admin) {
			chart = rounds.getChart(chartId);
			round = rounds.getRound(chart.roundIndex);
		} else {
			round = rounds.getCurrentRound();
			chart = round && round.charts.find(chart => chart.id === chartId);
		}
		
		if (!chart) {
			return res.status(400).json({ error: 'Chart is not in round.' });
		}
		
		let badItem = ScoreUtils.getNumericItems().find(item => {
			let value = req.body[item.key];
			return !Number.isInteger(value) || value < 0;
		});
		
		if (badItem) {
			return res.status(400).json({ error: badItem.name + ' must be a non-negative integer.', key: badItem.key });
		}
		
		let fantasticCount = req.body.fantasticCount;
		let excellentCount = req.body.excellentCount;
		let greatCount = req.body.greatCount;
		let decentCount = req.body.decentCount;
		let wayOffCount = req.body.wayOffCount;
		let missCount = req.body.missCount;
		let holdCount = req.body.holdCount;
		let rollCount = req.body.rollCount;
		let mineCount = req.body.mineCount;
		
		if (!url) {
			return res.status(400).json({ error: 'Screenshot/Video URL is required.', key: 'url'});
		}
		
		if (url.indexOf('://') === -1) {
			url = 'http://' + url;
		}
		
		let isUrlValid = /^https?:\/\/[^.]+\.[^.]+/.test(url);
		
		if (!isUrlValid) {
			return res.status(400).json({ error: 'Invalid Screenshot/Video URL', key: 'url' });
		}
		
		if (fantasticCount + excellentCount + greatCount + decentCount + wayOffCount + missCount !== chart.stepCount) {
			return res.status(400).json({ error: 'Total number of steps doesn\'t match number of steps in chart.', key: 'fantasticCount' });
		}
		
		if (holdCount > chart.holdCount) {
			return res.status(400).json({ error: 'Hold count exceeds number of holds in the chart.', key: 'holdCount' });
		}
		
		if (rollCount > chart.rollCount) {
			return res.status(400).json({ error: 'Roll count exceeds number of rolls in the chart.', key: 'rollCount' });
		}
		
		if (mineCount > chart.mineCount) {
			return res.status(400).json({ error: 'Mine count exceeds number of mines in the chart.', key: 'mineCount' });
		}
		
		let id = chartId + '_' + userId;
		
		let score = {
			id,
			userId,
			chartId,
			fantasticCount,
			excellentCount,
			greatCount,
			decentCount,
			wayOffCount,
			missCount,
			holdCount,
			rollCount,
			mineCount,
			url,
			approval: sender.admin ? 'approved' : 'none',
		};
		
		score.points = ScoreUtils.getPoints(score, chart);
		
		(async () => {
			let existingScore = app.stores.scores.get(id);
			
			if (existingScore) {
				await app.stores.scores.destroy(id);
			}
			
			await createScore(score);
			
			updateRoundAndTournamentRankings(round.index);
			
			return res.status(201).json({ score });
		})().catch(next);
	});
	
	app.expressApp.get('/current_round', (req, res, next) => {
		res.status(200).json({ round: rounds.getCurrentRound() });
	});
	
	app.expressApp.get('/rounds', (req, res, next) => {
		let now = Date.now();
		
		let startedRounds = rounds.getAllRounds()
			.filter(round => round.startTimestamp <= now);
		
		res.status(200).json({ rounds: startedRounds });
	});
	
	app.expressApp.post('/scores_for_approval', (req, res, next) => {
		if (typeof(req.body.authToken) !== 'string') {
			return res.status(400).json({ error: 'authToken must be a string.' });
		}
		
		let userId = authTokens.userIdForToken(req.body.authToken);
		
		if (!userId) {
			return res.status(401).json({ error: 'Invalid auth token.' });
		}
		
		let user = app.stores.users.get(userId);
		if (!user || !user.admin) {
			return res.status(403).json({ error: 'nice try lol' });
		}
		
		let scores = app.stores.scores.listIdsBy('approval', 'none')
			.map(app.stores.scores.get);
			
		scores.forEach(score => {
			score.username = app.stores.users.get(score.userId).name;
			let chart = rounds.getChart(score.chartId);
			score.chartTitle = chart.title + ' [' + chart.difficulty + ']';
		});
			
		return res.status(200).json({ scores });
	});
	
	app.expressApp.post('/approve_score', (req, res, next) => {
		if (typeof(req.body.authToken) !== 'string') {
			return res.status(400).json({ error: 'authToken must be a string.' });
		}
		
		let userId = authTokens.userIdForToken(req.body.authToken);
		
		if (!userId) {
			return res.status(401).json({ error: 'Invalid auth token.' });
		}
		
		let user = app.stores.users.get(userId);
		if (!user || !user.admin) {
			return res.status(403).json({ error: 'nice try lol' });
		}
		
		if (typeof(req.body.scoreId) !== 'string') {
			return res.status(400).json({ error: 'scoreId must be a string.' });
		}
		
		let score = app.stores.scores.get(scoreId);
		
		if (!score) {
			return res.status(404).json({ error: 'Score not found.' });
		}
		
		score.approval = 'approved';
		
		(async () => {
			await app.stores.scores.destroy(scoreId);
			await createScore(score);
			
			return res.status(200).json({ score });
		})().catch(next);
	});
	
	app.expressApp.delete('/score/:chartId/:userId', (req, res, next) => {
		if (typeof(req.body.authToken) !== 'string') {
			return res.status(400).json({ error: 'authToken must be a string.' });
		}
		
		let senderId = authTokens.userIdForToken(req.body.authToken);
		
		if (!senderId) {
			return res.status(401).json({ error: 'Invalid auth token.' });
		}
		
		if (senderId !== req.params.userId) {
			let sender = app.stores.users.get(senderId);
			if (!sender || !sender.admin) {
				return res.status(403).json({ error: 'You don\'t have permission to delete other users\' scores.' });
			}
		}
		
		let scoreId = req.params.chartId + '_' + req.params.userId;
		
		app.stores.scores.destroy(scoreId)
			.then(() => res.status(200).json({}))
			.catch(next);
	});
}