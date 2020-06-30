const authTokens = require('./authTokens');
const fs = require('fs');
const rounds = require('./rounds');
const util = require('util');
const uuid = require('uuid');

const fsWriteFile = util.promisify(fs.writeFile);

if (!fs.existsSync('./screenshots'))
{
	fs.mkdirSync('./screenshots');
}

module.exports = Screenshots
function Screenshots(app) {
	let screenshotsStore = app.stores.screenshots;
	
	function getScreenshotPath(id)
	{
		return './screenshots/' + id;
	}
	
	const allowedFileTypes = new Set(['png', 'jpg', 'jpeg']);
	
	app.expressApp.get('/screenshot/:filename', (req, res, next) => {
		let filename = req.params.filename;
		
		res.sendFile(filename, { root: './screenshots' });
	});
	
	app.expressApp.post('/screenshot/:chartId', (req, res, next) => {
		if (req.body.constructor !== Buffer)
		{
			return res.status(400).json({ error: 'Screenshot must be uploaded as raw binary.' });
		}
		
		if (!req.query.type)
		{
			return res.status(400).json({ error: 'File type is required.' });
		}
	
		let fileType = req.query.type;
		if (!allowedFileTypes.has(fileType)) return res.status(400).json({ error: 'File type must be png or jpg.' });
	
		let auth = req.headers.authorization;
		
		if (!auth) return res.status(401).json({ error: 'Missing auth token.' });
		
		let parts = auth.split(' ');
		if (parts.length !== 2 || parts[0] !== 'Token') return res.status(400).json({ error: 'Malformed auth token.' });
		
		let token = parts[1];
		
		let senderId = authTokens.userIdForToken(token);
		
		let chart = rounds.getChart(req.params.chartId);
		if (!chart) return res.status(404).json({ error: 'Chart not found in current round.' });
		
		let scoreId = chart.id + '_' + senderId;
		
		
		(async () => {
			let screenshots = screenshotsStore.get(scoreId);
			
			if (!screenshots)
			{
				screenshots = { id:scoreId, active: null, pending:[] };
				await screenshotsStore.create(screenshots);
			}
			
			if (screenshots.pending.length > 0)
			{
				for (let pendingSS of screenshots.pending)
				{
					fs.unlink(getScreenshotPath(pendingSS), (err) => {
						if (err) {
							// No biggie.
							console.error('Failed to delete screenshot:', err);
						}
					});
				}
				screenshots.pending = [];
				
				await screenshotsStore.destroy(screenshots.id);
				await screenshotsStore.create(screenshots);
			}
			
			let screenshotFilename = uuid.v4() + '.' + fileType;
			
			await fsWriteFile(getScreenshotPath(screenshotFilename), req.body);
			
			screenshots = screenshotsStore.get(screenshots.id);
			
			screenshots.pending.push(screenshotFilename);
			
			await screenshotsStore.destroy(screenshots.id);
			await screenshotsStore.create(screenshots);
			
			return res.status(200).json({ url: '/screenshot/' + screenshotFilename });
			
		})().catch(next);
	});
	
	Screenshots.handleNewScore = async score => {
		let screenshots = screenshotsStore.get(score.id);
		
		if (!screenshots) return;
		
		if (screenshots.pending.length === 0) return;
		
		let filename = score.url.split('/').pop();
		
		if (!screenshots.pending.some(x => x === filename)) return;
		
		screenshots.pending = screenshots.pending.filter(x => x !== filename);
		
		if (screenshots.active)
		{
			fs.unlink(getScreenshotPath(screenshots.active), (err) => {
				if (err) console.error('Failed to delete screenshot:', err);
			});
		}
		
		screenshots.active = filename;
		await screenshotsStore.destroy(screenshots.id);
		await screenshotsStore.create(screenshots);
	};
};