
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');

const store = require('./store');
const authTokens = require('./authTokens');

async function init() {
	try {
		let usersStore = await store.load('users', ['name']);
		let scoresStore = await store.load('scores', ['chartId','userId','approval']);
		let screenshotsStore = await store.load('screenshots', []);
		
		let expressApp = express();
		
		let app = {
			stores: {
				users: usersStore,
				scores: scoresStore,
				screenshots: screenshotsStore,
			},
			expressApp: expressApp
		}
		
		expressApp.use(bodyParser.json());
		expressApp.use(bodyParser.raw({ limit:'10mb' }));
		
		expressApp.disable('etag');
		
		// Log non-GET requests.
		expressApp.use((req, res, next) => {
			if (req.method === 'GET') return next();
			
			let bodyString;
			
			if (req.body.constructor === Buffer)
			{
				bodyString = '<binary>';
			}
			else
			{
				let body = JSON.parse(JSON.stringify(req.body));
			
				if (body.password) body.password = 'xxxxxxxx';
				
				if (body.authToken) {
					body.senderId = authTokens.userIdForToken(body.authToken);
					body.authToken = 'xxxxxxxx';
				}
				
				bodyString = JSON.stringify(body);
			}
			
			res.on('finish', () => {
				console.log(`${Date.now()} ${req.method} ${req.path} ${bodyString} ${res.statusCode} ${res.get('Content-Length') || 0}b sent`);
			});
			
			res.on('error', (err) => {
				console.error(`${Date.now()} ${req.method} ${req.path} ${bodyString} ${err}`);
			});
			
			next();
		});
		
		require('./users')(app);
		require('./scores')(app);
		require('./chartDownloads')(app);
		require('./screenshots')(app);
		
		expressApp.use(express.static('../client'));
		
		expressApp.listen(8000, () => console.log('listening...'));
	} catch (err) {
		console.log("Error initializing ", err);
	}
}

init();