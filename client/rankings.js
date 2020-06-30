
window.addEventListener('load', () => {
	let roundLinks = document.getElementById('round_ranking_links');
	let roundContent = document.getElementById('round_rankings');
	let tournamentContent = document.getElementById('tournament_rankings');
	
	function showModalScore(username, chart, score) {
		let scoreDiv = document.createElement('div');
		
		scoreDiv.appendChild(Scores.createCunt(chart));
		scoreDiv.style = 'text-align:left';
		
		let title = document.createElement('h5');
		title.appendChild(document.createTextNode(username + ' - ' + chart.title + ' [' + chart.difficulty + ']'));
		
		scoreDiv.appendChild(title);
		
		let scoreItems = [
			{ value: score.fantasticCount, name: 'Fantastics' },
			{ value: score.excellentCount, name: 'Excellents' },
			{ value: score.greatCount, name: 'Greats' },
			{ value: score.decentCount, name: 'Decents' },
			{ value: score.wayOffCount, name: 'Way Offs' },
			{ value: score.missCount, name: 'Misses' },
			{ value: score.holdCount, name: 'Holds', max: chart.holdCount, },
			{ value: score.rollCount, name: 'Rolls', max: chart.rollCount, },
			{ value: score.mineCount, name: 'Mines Avoided', max: chart.mineCount, },
		];
		
		scoreItems.forEach(item => {
			let p = document.createElement('p');
			
			let label = document.createElement('div');
			label.classList.add('input_label');
			label.appendChild(document.createTextNode(item.name + ' '));
			p.appendChild(label);
			
			let valueString = typeof(item.max) === 'number' ? (item.value + ' / ' + item.max) : String(item.value);
			
			p.appendChild(document.createTextNode(valueString));
			scoreDiv.appendChild(p);
		});
		
		let urlP = document.createElement('p');
		
		urlP.appendChild(document.createTextNode('Screenshot/Video URL: '));
		
		if (score.approval === 'approved') {
			let urlLink = document.createElement('a');
			urlLink.href = score.url;
			
			if (score.url.startsWith(window.location.protocol + '//' + window.location.host + '/'))
			{
				urlP.innerHTML = '';
				
				let urlImg = document.createElement('img');
				urlImg.src = score.url;
				urlLink.appendChild(urlImg);
				urlImg.style.width = '418px';
				urlImg.style.height = 'auto';
			}
			else
			{
				urlLink.target = "_blank";
				urlLink.style.maxWidth = '250px';
				urlLink.style.textOverflow = 'ellipsis';
				urlLink.style.overflowX = 'hidden';
				urlLink.style.display = 'inline-block';
				urlLink.style.whiteSpace = 'nowrap';
				urlLink.appendChild(document.createTextNode(score.url));
			}
			
			urlP.appendChild(urlLink);
		} else {
			let message = document.createElement('span');
			message.style.color = '#AAA';
			message.appendChild(document.createTextNode('(awaiting approval)'));
			urlP.appendChild(message);
		}
		
		scoreDiv.appendChild(urlP);
		
		Modal.show(scoreDiv);
	}
	
	function showRoundRankings(round, rankings, sortBy) {
		roundContent.innerHTML = '';
		
		sortBy = sortBy || 'rank';
		
		let table = document.createElement('table');
		table.classList.add('rankings');
		
		let columns = [
			{
				title:'Rank',
				sortKey: 'rank'
			},
			{
				title: 'Username',
			},
			{
				title: 'Total Points',
			},
		];
		
		let sortByChartPrefix = 'chart:';
		round.charts.forEach(chart => {
			columns.push({
				title: chart.title,
				sortKey: sortByChartPrefix + chart.id
			});
		});
		
		let titleRow = document.createElement('tr');
		columns.forEach(column => {
			let cell = document.createElement('td');
			cell.classList.add('title');
			if (column.sortKey)
			{
				let titleButton = document.createElement('div');
				titleButton.classList.add(sortBy === column.sortKey ? 'table_sort_active' : 'table_sort_button');
				titleButton.appendChild(document.createTextNode(column.title));
				titleButton.addEventListener('click', () => showRoundRankings(round, rankings, column.sortKey));
				cell.appendChild(titleButton);
			}
			else
			{
				cell.appendChild(document.createTextNode(column.title));
			}
			titleRow.appendChild(cell);
		});
		table.appendChild(titleRow);
		
		let sortGetter;
		if (sortBy.startsWith(sortByChartPrefix))
		{
			let chartId = sortBy.substring(sortByChartPrefix.length, sortBy.length);
			sortGetter = x => {
				let score = x.scoresByChartId[chartId];
				return score ? -score.points : 0;
			};
		}
		else
		{
			sortGetter = x => x[sortBy];
		}
		
		rankings.sort((a,b) => {
			let aVal = sortGetter(a);
			let bVal = sortGetter(b);
			
			if (aVal < bVal) return -1;
			
			if (aVal > bVal) return 1;
			
			return 0;
		});
		
		rankings.forEach(ranking => {
			let row = document.createElement('tr');
			
			let rankCell = document.createElement('td');
			rankCell.appendChild(document.createTextNode(ranking.rank));
			
			if (ranking.tournamentPoints > 0) {
				let tournamentPointsSpan = document.createElement('span');
				tournamentPointsSpan.classList.add('round_points');
				tournamentPointsSpan.appendChild(document.createTextNode(' (+' + ranking.tournamentPoints + ')')); 
				rankCell.appendChild(tournamentPointsSpan);
			}
			
			row.appendChild(rankCell);
			
			let usernameCell = document.createElement('td');
			usernameCell.appendChild(document.createTextNode(ranking.username));
			row.appendChild(usernameCell);
			
			let totalPointsCell = document.createElement('td');
			totalPointsCell.appendChild(document.createTextNode(ranking.totalPoints));
			row.appendChild(totalPointsCell);
			
			round.charts.forEach(chart => {
				let chartPointsCell = document.createElement('td');
				chartPointsCell.style.whiteSpace = 'nowrap';
				let score = ranking.scoresByChartId[chart.id];
				if (score) {
					let scoreButton = document.createElement('div');
					scoreButton.classList.add('link_button');
					
					scoreButton.appendChild(document.createTextNode(score.points));
					
					scoreButton.addEventListener('click', showModalScore.bind(null, ranking.username, chart, score));
					
					chartPointsCell.appendChild(scoreButton);
					
					if (score.approval === 'approved')
					{
						let check = document.createElement('span');
						check.style.color = '#77FF77';
						check.title = 'Approved by an admin.';
						check.appendChild(document.createTextNode(' \u2713'));
						chartPointsCell.appendChild(check);
					}
				} else {
					chartPointsCell.appendChild(document.createTextNode('-'));
				}
				
				row.appendChild(chartPointsCell);
			});
			
			table.appendChild(row);
		});
		
		if (rankings.length === 0) {
			let nothingRow = document.createElement('tr');
			
			let nothingCell = document.createElement('td');
			
			nothingCell.appendChild(document.createTextNode('No scores yet for ' + round.name));
			nothingCell.colSpan = columns.length;
			
			nothingRow.appendChild(nothingCell);
			
			table.appendChild(nothingRow);
		}
		
		roundContent.appendChild(table);
	}
	
	function showTournamentRankings(rankings) {
		tournamentContent.innerHTML = '';
		
		let table = document.createElement('table');
		table.classList.add('rankings');
		
		let titles = ['Rank','Username','Tournament Points', 'Total Score Points'];
		
		let titleRow = document.createElement('tr');
		titles.forEach(title => {
			let cell = document.createElement('td');
			cell.classList.add('title');
			cell.appendChild(document.createTextNode(title));
			titleRow.appendChild(cell);
		});
		table.appendChild(titleRow);
		
		rankings.forEach((ranking, index) => {
			let row = document.createElement('tr');
			
			let values = [ranking.rank, ranking.username, ranking.tournamentPoints, ranking.scorePoints];
			
			values.forEach(value => {
				let cell = document.createElement('td');
				cell.appendChild(document.createTextNode(value));
				
				row.appendChild(cell);
			});
			
			table.appendChild(row);
		});
		
		if (rankings.length === 0) {
			let nothingRow = document.createElement('tr');
			let nothingCell = document.createElement('td');
			nothingCell.appendChild(document.createTextNode('No one has posted any scores yet.'));
			nothingCell.colSpan = titles.length;
			nothingRow.appendChild(nothingCell);
			table.appendChild(nothingRow);
		}
		
		tournamentContent.appendChild(table);
	}
	
	function showMessage(content, message, type) {
		content.innerHTML = '';
		
		let span = document.createElement('span');
		if (type) span.classList.add('input_' + type);
		span.appendChild(document.createTextNode(message));
		
		content.appendChild(span);
	}
	
	let gotRankings = false;
	
	let curRankingIndex = null;
	
	let rounds = null;
	
	function showLoading(content, message) {
		content.innerHTML = '<div class="lds-ripple"><div></div><div></div></div> ';
		content.appendChild(document.createTextNode(message));
	}
	
	function loadRoundRankings(index) {
		if (curRankingIndex !== null) {
			let oldLink = rounds[curRankingIndex].link;
			if (oldLink) oldLink.classList.add('link_button');
		}
		
		curRankingIndex = index;
		let link = rounds[index].link;
		if (link) link.classList.remove('link_button');
		
		showLoading(roundContent, 'Loading rankings for ' + rounds[index].name);
		
		makeApiRequest('/round_rankings/' + index)
			.then(response => {
				if (curRankingIndex !== index) return;
				
				if (response.error) {
					showMessage(roundContent, 'Failed to load round rankings: ' + response.error, 'error');
					return;
				}
				
				showRoundRankings(rounds[index], response.body.rankings);
			});
	}
	
	Tabs.addShowListener('rankings', () => {
		roundLinks.innerHTML = '';
		roundContent.innerHTML = '';
		tournamentContent.innerHTML = '';
		
		showLoading(roundLinks, 'Loading rounds...');
		
		makeApiRequest('/rounds')
			.then(response => {
				roundLinks.innerHTML = '';
				
				if (response.error) {
					roundContent.classList.remove('hidden');
					showMessage(roundContent, 'Failed to load rounds: ' + response.error, 'error');
					return;
				}
				
				rounds = response.body.rounds;
				if (!rounds || rounds.length === 0) {
					showMessage(roundContent, 'No rounds have started.');
					return;
				}
				
				if (rounds.length > 1) {
					rounds.forEach((round, index) => {
						if (index !== 0) roundLinks.appendChild(document.createTextNode(' '));
						
						round.link = document.createElement('span');
						round.link.appendChild(document.createTextNode(round.name));
						round.link.addEventListener('click', loadRoundRankings.bind(null, index));
						round.link.classList.add('link_button');
						roundLinks.appendChild(round.link);
					});
				}
				
				loadRoundRankings(rounds.length - 1);
			});
			
		showLoading(tournamentContent, 'Loading tournament rankings...');
		makeApiRequest('/tournament_rankings')
			.then(response => {
				if (response.error) {
					showMessage(tournamentContent, 'Failed to load tournament rankings: ' + response.error, 'error');
					return;
				}
				
				showTournamentRankings(response.body.rankings);
			});
	});
});