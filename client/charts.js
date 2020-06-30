window.addEventListener('load', () => {
	let content = document.getElementById('content_charts');
	Tabs.addShowListener('charts', () => {
		content.innerHTML = '';
		let header = document.createElement('h3');
		header.appendChild(document.createTextNode('Charts'));
		content.appendChild(header);
		
		let spinner = document.createElement('div');
		spinner.classList.add('lds-ripple');
		spinner.innerHTML = '<div></div><div></div>';
		
		content.appendChild(spinner);
		
		makeApiRequest('/rounds').then(response => {
			content.removeChild(spinner);
			
			if (response.error) {
				let div = document.createElement('div');
				div.classList.add('input_error');
				div.appendChild(document.createTextNode(response.error));
				content.appendChild(div);
				return;
			}
			
			let rounds = response.body.rounds;
			
			rounds.reverse();
			
			rounds.forEach(round => {
				let roundHeader = document.createElement('h5');
				roundHeader.appendChild(document.createTextNode(round.name));
				content.appendChild(roundHeader);
				
				let link = document.createElement('a');
				link.appendChild(document.createTextNode('Download'));
				link.href = '/charts/' + round.roundId + '.zip';
				
				content.appendChild(link);
				
				let chartsP = document.createElement('p');
				
				let chartsChunks = ['Charts: '];
				
				round.charts.forEach((chart, chartIndex) => {
					if (chartIndex !== 0) chartsChunks.push(', ');
					chartsChunks.push(chart.title + ' [' + chart.difficulty + ']');
				});
				
				chartsP.appendChild(document.createTextNode(chartsChunks.join('')));
				
				content.appendChild(chartsP);
			});
			
			if (rounds.length === 0) {
				content.appendChild(document.createTextNode('Chart lists and download links for each round will appear here when the round starts.'));
			}
		});
	});
});