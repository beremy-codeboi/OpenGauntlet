const crypto = require('crypto');
const util = require('util');

const randomBytes = util.promisify(crypto.randomBytes);

let maxTokensPerUser = 10;

let authTokensByUserId = {};
let userIdsByAuthToken = {};

let authTokens = {
	create: async (id) => {
		let bytes = await randomBytes(32);
		
		let token = bytes.toString('base64');
		
		if (!authTokensByUserId[id]) authTokensByUserId[id] = [];
		
		authTokensByUserId[id].push(token);
		userIdsByAuthToken[token] = id;
		
		while (authTokensByUserId[id].length > maxTokensPerUser) {
			let invalidToken = authTokensByUserId[id].shift();
			delete userIdsByAuthToken[invalidToken];
		}
		
		return token;
	},
	userIdForToken: (token) => {
		return userIdsByAuthToken[token];
	},
	destroy: (token) => {
		let id = userIdsByAuthToken[token];
		
		if (!id) return;
		
		delete userIdsByAuthToken[token];
		
		authTokensByUserId[id] = authTokensByUserId.filter(existingToken => existingToken !== token);
	},
	destroyAllForUserId: (userId) => {
		if (!authTokensByUserId[userId]) return;
		
		authTokensByUserId[userId].forEach(token => {
			delete userIdsByAuthToken[token];
		});
		
		delete authTokensByUserId[userId];
	},
};

module.exports = authTokens;
