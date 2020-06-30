function redirectToHome() {
	window.location.href = 'index.html';
}

window.addEventListener('load', () => {
	let username = localStorage.getItem('username');
	let authToken = localStorage.getItem('authToken');
	let userId = localStorage.getItem('userId');
	
	if (username === null || authToken === null || userId === null) {
		redirectToHome();
		return;
	}
	
	let usernameInput = document.getElementById('username_input');
	
	document.getElementById('disqualify_user_button').addEventListener('click', () => {
		let username = usernameInput.value;
		Modal.promptAction('Disqualify ' + username + ' permanently?', 'DQ', () => {
			makeApiRequest('/disqualify', {
				method: 'POST',
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ authToken: authToken, username: username }),
			}).then(response => {
				alert(response.error || (username + ' is disqualified.'));
			});
		});
	});
	
	document.getElementById('admin_user_button').addEventListener('click', () => {
		let username = usernameInput.value;
		Modal.promptAction('Make ' + usernameInput.value + ' an admin?', 'Admin', () => {
			makeApiRequest('/make_admin', {
				method: 'POST',
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ authToken: authToken, username: username }),
			}).then(response => {
				alert(response.error || (username + ' is now an admin.'));
			});
		});
	});
	
	let scoresContainer = document.getElementById('scores_for_approval');
	
	makeApiRequest('/scores_for_approval', {
		method: 'POST',
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ authToken: authToken })
	}).then(response => {
		if (response.error) {
			if (response.status === 401) {
				window.location.href = 'index.html';
			} else {
				alert(response.error);
			}
			
			return;
		}
		
		let scoresTable = document.createElement('table');
		
		let titles = ['User', 'Chart', 'Fantastics', 'Excellents', 'Greats', 'Decents', 'Way Offs', 'Misses', 'Holds', 'Rolls', 'Mines', 'URL'];
		
		let titleRow = document.createElement('tr');
		titleRow.classList.add('title');
		titles.forEach(title => {
			let cell = document.createElement('td');
			cell.appendChild(document.createTextNode(title));
			titleRow.appendChild(cell);
		});
		
		let actionCell = document.createElement('td');
		actionCell.appendChild(document.createTextNode('Action'));
		actionCell.colSpan = 2;
		titleRow.appendChild(actionCell);
		
		scoresTable.appendChild(titleRow);
		
		response.body.scores.forEach(score => {
			let scoreRow = document.createElement('tr');
			
			['username', 'chartTitle'].forEach(key => {
				let cell = document.createElement('td');
				cell.appendChild(document.createTextNode(score[key]));
				scoreRow.appendChild(cell);
			});
			
			let numberInputs = {};
			
			['fantasticCount', 'excellentCount', 'greatCount', 'decentCount', 'wayOffCount', 'missCount', 'holdCount', 'rollCount', 'mineCount'].forEach(key => {
				let cell = document.createElement('td');
				let input = document.createElement('input');
				input.value = score[key];
				
				input.style = 'width:50px';
				
				cell.appendChild(input);
				scoreRow.appendChild(cell);
				
				numberInputs[key] = input;
			});
			
			let urlCell = document.createElement('td');
			let urlLink = document.createElement('a');
			urlLink.href = score.url;
			urlLink.appendChild(document.createTextNode(score.url));
			urlLink.style.width = '200px';
			urlLink.style.display = 'inline-block';
			urlLink.style.textOverflow = 'ellipsis';
			urlLink.style.whiteSpace = 'nowrap';
			urlLink.style.overflow = 'hidden';
			urlCell.appendChild(urlLink);
			scoreRow.appendChild(urlCell);

			let approveCell = document.createElement('td');
			let approveButton = document.createElement('div');
			approveButton.appendChild(document.createTextNode('Approve'));
			
			approveButton.addEventListener('click', () => {
				let requestBody = {
					url: score.url,
					userId: score.userId,
					chartId: score.chartId,
					authToken: authToken,
				};
				
				for (let key in numberInputs) {
					requestBody[key] = +numberInputs[key].value;
				}
				
				makeApiRequest('/score', {
					method: 'POST',
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(requestBody)
				}).then(response => {
					if (response.error) {
						alert(response.error);
					} else {
						scoresTable.removeChild(scoreRow);
					}
				});
			});
			
			approveButton.classList.add('button');
			approveCell.appendChild(approveButton);
			scoreRow.appendChild(approveCell);
			
			let rejectCell = document.createElement('td');
			let rejectButton = document.createElement('div');
			rejectButton.appendChild(document.createTextNode('Reject'));
			
			rejectButton.addEventListener('click', () => {
				makeApiRequest('/score/' + score.chartId + '/' + score.userId, {
					method: 'DELETE',
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ authToken: authToken }),
				}).then(response => {
					if (response.error) {
						alert(response.error);
					} else {
						scoresTable.removeChild(scoreRow);
					}
				});
			});
			
			rejectButton.classList.add('button');
			rejectCell.appendChild(rejectButton);
			scoreRow.appendChild(rejectCell);
			
			scoresTable.appendChild(scoreRow);
		});
		
		scoresContainer.appendChild(scoresTable);
	});
});