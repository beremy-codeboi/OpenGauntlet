const argon2 = require('argon2');

const authTokens = require('./authTokens');

module.exports = app => {
	
	function usernameToId(username)
	{
		return username.toLowerCase();
	}
	
	app.expressApp.post('/register', (req, res, next) => {
		let username = req.body.username;
		let password = req.body.password;
		
		if (typeof(username) !== 'string') return res.status(400).json({ error: 'Username must be a string.', key: 'username' });
		if (typeof(password) !== 'string') return res.status(400).json({ error: 'Password must be a string.', key: 'password' });
		
		if (username.length < 4) return res.status(400).json({ error: 'Username too short.', key: 'username' });
		if (username.length > 32) return res.status(400).json({ error: 'Username too long.', key: 'username' });
		
		for (let i = 0; i < username.length; i++) {
			let code = username.charCodeAt(i);
			if (code < 33 || code > 126) {
				return res.status(400).json({ error: 'Only printable non-whitespace ASCII characters are allowed in usernames.', key: 'username' });
				return;
			}
		}
		
		if (password.length < 8) return res.status(400).json({ error: 'Password too short.', key: 'password' });
		if (password.length > 512) return res.status(400).json({ error: 'Password too long.', key: 'password' });
		
		let userId = usernameToId(username);
		
		if (app.stores.users.get(userId)) {
			return res.status(409).json({ error: 'A user with that name already exists.', key: 'username' });
		}
		
		(async () => {
			let hash = await argon2.hash(password);
			
			let id = await app.stores.users.create({
				id: userId,
				name: username,
				passwordHash: hash,
			});
			
			let token = await authTokens.create(id);
			
			return res.status(201).json({ name: username, id: id, authToken: token });
		})().catch(next);
	});
	
	let passwordTimeoutsByUserId = {};
	
	app.expressApp.post('/login', (req, res, next) => {
		if (typeof(req.body.username) !== 'string') return res.status(400).json({ error: 'Username must be a string.' });
		if (typeof(req.body.password) !== 'string') return res.status(400).json({ error: 'Password must be a string.' });
		
		let userId = app.stores.users.listIdsBy('name', req.body.username)[0];
		
		if (!userId) return res.status(404).json({ error: 'Invalid username.' });
		
		let now = Date.now();
		let timeout = passwordTimeoutsByUserId[userId];
		if (typeof(timeout) === 'number' && now < timeout) {
			return res.status(429).json({ error: 'Attempting to login too fast.' });
		} else {
			passwordTimeoutsByUserId[userId] = now + 2000;
		}
		
		let user = app.stores.users.get(userId);
		
		(async () => {
			let isPasswordValid = await argon2.verify(user.passwordHash, req.body.password);
			
			if (!isPasswordValid) {
				return res.status(401).json({ error: 'Incorrect password.' });
			}
			
			let token = await authTokens.create(user.id);
			
			return res.status(201).json({ name: user.name, id: user.id, authToken: token, admin: user.admin });
		})().catch(next);
	});
	
	app.expressApp.post('/me', (req, res, next) => {
		if (typeof(req.body.authToken) !== 'string') return res.status(400).json({ error: 'authToken must be a string.' });
		
		let userId = authTokens.userIdForToken(req.body.authToken);
		
		if (!userId) return res.status(401).json({ error: 'Invalid authToken.' });
		
		let user = app.stores.users.get(userId);
		
		// This shouldn't happen.
		// Just force the user to log back in I guess.
		if (!user) return res.status(401).json({ error: 'Invalid authToken.' });
		
		return res.status(200).json({ name: user.name, id: user.id, admin: user.admin });
	});
	
	app.expressApp.post('/disqualify', (req, res, next) => {
		if (typeof(req.body.authToken) !== 'string') return res.status(400).json({ error: 'authToken must be a string.' });
		
		let senderId = authTokens.userIdForToken(req.body.authToken);
		
		if (!senderId) return res.status(401).json({ error: 'Invalid authToken.' });
		
		let sender = app.stores.users.get(senderId);
		
		if (!sender || !sender.admin) return res.status(403).json({ error: 'You don\'t have permission to disqualify users.' });
		
		let username = req.body.username;
		
		if (typeof(username) !== 'string') return res.status(400).json({ error: 'username must be a string.' });
		
		let userId = app.stores.users.listIdsBy('name', username)[0];
		
		if (!userId) return res.status(404).json({ error: 'User not found.' });
		
		if (senderId === userId) return res.status(400).json({ error: 'You can\'t disqualify yourself.' });
		
		authTokens.destroyAllForUserId(userId);
		
		let scoreIds = app.stores.scores.listIdsBy('userId', userId);
		
		let promises = scoreIds.map(app.stores.scores.destroy);
		
		promises.push(app.stores.users.destroy(userId));
		
		Promise.all(promises)
			.then(() => res.status(200).json({}))
			.catch(next);
	});
	
	app.expressApp.post('/make_admin', (req, res, next) => {
		if (typeof(req.body.authToken) !== 'string') return res.status(400).json({ error: 'authToken must be a string.' });
		
		let senderId = authTokens.userIdForToken(req.body.authToken);
		
		if (!senderId) return res.status(401).json({ error: 'Invalid authToken.' });
		
		let sender = app.stores.users.get(senderId);
		
		if (!sender || !sender.admin) return res.status(403).json({ error: 'You don\'t have permission to disqualify users.' });
		
		let username = req.body.username;
		
		if (typeof(username) !== 'string') return res.status(400).json({ error: 'username must be a string.' });
		
		let userId = app.stores.users.listIdsBy('name', username)[0];
		
		if (!userId) return res.status(404).json({ error: 'User not found.' });
		
		let user = app.stores.users.get(userId);
		
		if (user.admin) return res.status(400).json({ error: 'User is already an admin.' });
		
		user.admin = true;
		
		app.stores.users.destroy(userId)
			.then(() => app.stores.users.create(user))
			.then(() => res.status(200).json({}))
			.catch(next);
	});
};