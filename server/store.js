const util = require('util');
const fs = require('fs');
const uuid = require('uuid');

const storePath = 'store/';

if (!fs.existsSync(storePath))
{
	fs.mkdirSync(storePath);
}

function toPath(name) {
	return storePath + name + '.store';
}

function clone(obj) {
	if (obj === undefined) return undefined;
	return JSON.parse(JSON.stringify(obj));
}

async function load(name, indexKeys) {
	let path = toPath(name);
	
	let indexes = {};
	
	let itemsById = await new Promise((resolve, reject) => {
		if (!fs.existsSync(path)) return resolve({});
		
		fs.readFile(path, (err, data) => {
			if (err) {
				console.log('Error reading store ' + name + ':', err);
				return reject(err);
			}
			
			let lines = data.toString('utf8').split('\n');
			
			let itemsById = {};
			
			lines.forEach(line => {
				line = line.trim();
				
				if (line === '') return;
				
				let c = line.charAt(0);
				
				if (c === '+') {
					let json = line.substring(1);
					try {
						let item = JSON.parse(json);
						itemsById[item.id] = item;
					} catch (err) {
						console.log('JSON parse error');
						reject(err);
					}
				} else if (c === '-') {
					let id = line.substring(1);
					delete itemsById[id];
				}
			});
			
			resolve(itemsById);
		});
	});
	
	let writeStream = fs.createWriteStream(path, { flags: 'a' });
	let writeAsync = util.promisify(writeStream.write.bind(writeStream));
	
	indexKeys.forEach(key => {
		indexes[key] = {};
		
		for (let id in itemsById) {
			let item = itemsById[id];
			let value = item[key];
			
			if (typeof(value) !== undefined) {
				if (!indexes[key][value]) { indexes[key][value] = []; }
				indexes[key][value].push(id);
			}
		}
	});
	
	let store = {
		_listeners: [],
		get: id => clone(itemsById[id]),
		create: async (item) => {
			item = clone(item);
			
			if (!item.id) {
				item.id = uuid.v4();
			}
			
			if (itemsById[item.id]) throw new Error('Item with id ' + item.id + ' already exists.');
			
			itemsById[item.id] = item;
			
			for (let key in indexes) {
				let value = item[key];
				if (typeof(value) !== 'undefined') {
					if (!indexes[key][value]) indexes[key][value] = [];
					indexes[key][value].push(item.id);
				}
			}
			
			let json = JSON.stringify(item);
			
			if (json.indexOf('\n') !== -1) {
				console.log('JSON.stringify gave new lines. This shouldn\'t happen.');
				json = json.split('\n').join('');
			}
			
			await writeAsync('+' + json + '\n');
			
			return item.id;
		},
		listIdsBy: (key, value) => {
			if (key === 'id') {
				return [store.get(value)];
			}
			
			let index = indexes[key];
			
			if (!index) throw new Error('Can\'t get by key ' + key + ' with no index for it.');
			
			return Array.from(index[value] || []);
		},
		update: async (item) => {
			throw new Error('Update not yet implemented.');
		},
		destroy: async (id) => {
			let item = itemsById[id];
			
			if (!item) return;
			
			delete itemsById[id];
			
			for (let key in indexes) {
				let value = item[key];
				if (typeof(value) !== 'undefined' && indexes[key][value]) {
					indexes[key][value] = indexes[key][value].filter(x => x !== id);
				}
			}
			
			await writeAsync('-' + id + '\n');
		},
	}
	
	return store;
}

module.exports = {
	load: load,
};