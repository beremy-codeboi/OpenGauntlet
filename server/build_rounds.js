const fs = require('fs');

const packPath = './pack/';
const songFolders = fs.readdirSync(packPath, { withFileTypes: true })
	.filter(x => x.isDirectory())
	.map(x => x.name);

roundNames = ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', 'Round 6', 'Round 7', 'Meme'];

function getSmAttributes(sm, key)
{
	let attributes = [];
	
	let searchIndex = 0;
	
	while (true)
	{
		let prefix = '#' + key + ':';
		let prefixIndex = sm.indexOf(prefix, searchIndex);
		
		if (prefixIndex === -1) break;
		
		let startIndex = prefixIndex + prefix.length;
		let endIndex = sm.indexOf(';', startIndex);
		
		attributes.push(sm.substring(startIndex, endIndex));
		
		searchIndex = endIndex;
	}
	
	return attributes;
}

function parseNotes(notesString)
{
	notesString = notesString.trim();
	
	let parts = notesString.split(':').map(x => x.trim());
	
	if (parts.length !== 6) throw new Error('Notes have ' + parts.length + ' parts?');
	
	let style = parts[0];
	
	let difficulty = +parts[3];
	
	let measures = parts[5].split(',').map(x => x.trim().split('\n').map(x => x.trim()));
	
	let notes = {
		style: style,
		difficulty: difficulty,
		stepCount: 0,
		holdCount: 0,
		rollCount: 0,
		mineCount: 0
	};
	
	for (let measure of measures)
	{
		for (let row of measure)
		{
			if (row.startsWith('//')) continue;
			
			let hasStep = false;
			
			for (let c of row)
			{
				
				switch (c)
				{
					case '1':
						hasStep = true;
						break;
					
					case '2':
						hasStep = true;
						notes.holdCount++;
						break;
					
					case '4':
						hasStep = true;
						notes.rollCount++;
						break;
					
					case 'M':
						notes.mineCount++;
						break;
				}
			}
			
			if (hasStep) notes.stepCount++;
		}
	}
	
	return notes;
}

function nameToId(name)
{
	let idChars = [];
	for (let c of name)
	{
		c = c.toLowerCase();
		if (c === ' ')
		{
			c = '_';
		}
		else if ('a' <= c && c <= 'z')
		{
			
		}
		else if ('0' <= c && c <= '9')
		{
			
		}
		else
		{
			c = '';
		}
		
		idChars.push(c);
	}
	
	let id = idChars.join('');
	
	return id;
}

function shortName(name)
{
	let openIndex = name.indexOf('(');
	if (openIndex === -1) return name;
	
	let closeIndex = name.indexOf(')', openIndex);
	if (closeIndex === -1) return name;
	
	return name.substring(0, openIndex).trim() + ' ' + name.substring(closeIndex+1, name.length).trim();
}

function buildChart(folder)
{
	let path = packPath + folder;
	
	let smFiles = fs.readdirSync(path, { withFileTypes: true })
		.map(x => x.name)
		.filter(x => x.toLowerCase().endsWith('.sm'));
	
	if (smFiles.length !== 1) throw new Error('Song ' + folder + ' has ' + smFiles.length + ' sm files.');
	
	let smPath = path + '/' + smFiles[0];
	
	let sm = fs.readFileSync(smPath).toString('ascii');
	
	let titles = getSmAttributes(sm, 'TITLE');
	
	if (titles.length !== 1) throw new Error('Song ' + folder + ' has ' + titles.length + ' titles.');
	
	let title = titles[0];
	
	title = title.substring(title.indexOf(']') + 2, title.length);
	
	let id = nameToId(title);
	
	let noteStrings = getSmAttributes(sm, 'NOTES');
	
	let notes = noteStrings.map(parseNotes)
		.filter(x => x.style === 'dance-single');
	
	if (notes.length !== 1) throw new Error('Song ' + folder + ' has ' + notes.length + ' single charts.');
	
	let chart = notes[0];
	delete chart.style;
	chart.title = title;
	chart.songId = id;
	chart.shortTitle = shortName(title);
	
	return chart;
}

function buildRound(roundName)
{
	let roundFolders = songFolders.filter(folder => folder.startsWith('[' + roundName + ']'));
	
	if (roundFolders.length != 5)
	{
		throw new Error('Round [' + roundName + '] has ' + roundFolders.length + ' songs.');
	}
	
	let round = { name: roundName === 'Meme' ? 'Meme Round' : roundName };
	
	round.roundId = nameToId(round.name);
	
	round.scored = roundName != 'Meme';
	
	round.charts = roundFolders.map(buildChart);
	
	return round;
}

let rounds = roundNames.map(buildRound);

let songIds = [];
for (let round of rounds)
{
	for (let chart of round.charts)
	{
		songIds.push(chart.songId);
	}
}

songIds.sort();

for (let i = 0; i + 1 < songIds.length; i++)
{
	if (songIds[i] === songIds[i+1]) throw new Error('Duplicate song id ' + songIds[i]);
}

let fileContents = { rounds: rounds };

fs.writeFileSync('rounds.json', JSON.stringify(fileContents, null, '\t'));