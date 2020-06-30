const Scores = {
	// b*****s are renamed to cunts because ad block developers have brain damage.
	createCunt: (chart) => {
		let cuntWrapper = document.createElement('div');
		cuntWrapper.classList.add('song_cunt_wrapper');
		
		if (chart.cunt) {
			let cunt = document.createElement('img');
			cunt.src = '/cunts/' + chart.cunt;
			
			cunt.classList.add('song_cunt');
			cunt.alt = chart.title;
			
			cuntWrapper.appendChild(cunt);
		} else {
			let cuntDiv = document.createElement('div');
			cuntDiv.classList.add('song_cunt');
			
			let cunt = document.createElement('img');
			cunt.src = '/cunts/fallback.png';
			cunt.alt = chart.title;
			
			cunt.classList.add('song_fallback_cunt');
			cuntDiv.appendChild(cunt);
			
			let title = document.createElement('div');
			title.classList.add('song_fallback_cunt_title');
			
			title.appendChild(document.createTextNode(chart.shortTitle));
			
			cuntDiv.appendChild(title);
			
			cuntWrapper.appendChild(cuntDiv);
		}
		
		return cuntWrapper;
	}
};


window.addEventListener('load', () => {
	let content = document.getElementById('content_update_scores');
	
	function stringToInteger(s) {
		let value = Number(s);
		if (isNaN(value)) value = 0;
		value = Math.floor(value);
		if (value < 0) value = 0;
		return value;
	}

	function showMessage(message) {
		content.innerHTML = '';
		content.appendChild(document.createTextNode(message));
	}
	
	function scoreToString(score) {
		return score.points + ' Points ['
			+ score.fantasticCount + 'f/'
			+ score.excellentCount + 'e/'
			+ score.greatCount + 'g/'
			+ score.decentCount + 'd/'
			+ score.wayOffCount + 'w/'
			+ score.missCount + 'm/'
			+ score.holdCount + 'h/'
			+ score.rollCount + 'r/'
			+ score.mineCount + 'M]';
	}
	
	function showRound(round, scores) {
		content.innerHTML = '';
		
		let endMessage = document.createElement('p');
		endMessage.appendChild(document.createTextNode(round.name + ' will end ' + Utils.formatDate(new Date(round.endTimestamp))));
		content.appendChild(endMessage);
		
		let container = document.createElement('div');
		container.classList.add('center_wrapper');
		content.appendChild(container);
		
		let currentScoreContainer = null;
		
		function toggleScoreContainer(scoreContainer)
		{
			if (scoreContainer.classList.contains('hidden')){
				scoreContainer.classList.remove('hidden');
				
				if (currentScoreContainer)
				{
					currentScoreContainer.classList.add('hidden');
				}
				
				currentScoreContainer = scoreContainer;
			} else {
				scoreContainer.classList.add('hidden');
				currentScoreContainer = null;
			}
		}
		
		round.charts.forEach(chart => {
			
			let cunt = Scores.createCunt(chart);
			container.appendChild(cunt);
			
			let scoreContainer = document.createElement('div');
			scoreContainer.classList.add('hidden');
			container.appendChild(scoreContainer);
			
			container.appendChild(document.createElement('br'));
			
			cunt.addEventListener('click', () => {
				toggleScoreContainer(scoreContainer);
			});
			
			let best = document.createElement('div');
			best.classList.add('score');
			
			let bestScore = null;
			
			scores.forEach(score => {
				if (score.chartId === chart.id) {
					bestScore = score;
				}
			});
			
			best.appendChild(document.createTextNode(bestScore ? scoreToString(bestScore) : '(No Score)'));
			
			scoreContainer.appendChild(best);
			
			let titleP = document.createElement('p');
			
			titleP.appendChild(document.createTextNode('Update score for ' + chart.title + ' [' + chart.difficulty + ']'));
			
			scoreContainer.appendChild(titleP);
			
			let numberInputItems = ScoreUtils.getNumericItems();
			
			numberInputItems.forEach(item => {
				let itemP = document.createElement('p');
				
				let label = document.createElement('div');
				label.classList.add('input_label');
				label.appendChild(document.createTextNode(item.name));
				itemP.appendChild(label);
				
				let input = document.createElement('input');
				itemP.appendChild(input);
				
				input.addEventListener('change', () => {
					setMessage(null);
					input.value = String(stringToInteger(input.value));
				});
				
				scoreContainer.appendChild(itemP);
				
				item.input = input;
			});
			
			let urlP = document.createElement('p');
			urlP.style.marginBottom = '4px';
			
			let urlLabel = document.createElement('div');
			urlLabel.classList.add('input_label');
			urlLabel.appendChild(document.createTextNode('Screenshot/Video URL'));
			urlP.appendChild(urlLabel);
			
			let urlInput = document.createElement('input');
			urlInput.addEventListener('change', () => setMessage(null));
			
			urlP.appendChild(urlInput);
			
			scoreContainer.appendChild(urlP);
			
			let screenshotP = document.createElement('p');
			screenshotP.style.marginTop = '0px';
			
			let screenshotInput = document.createElement('input');
			screenshotInput.type = 'file';
			screenshotP.appendChild(screenshotInput);
			screenshotInput.accept = 'image/png, image/jpeg';
			
			screenshotInput.style.display = 'none';
			
			let screenshotButton = document.createElement('button');
			screenshotButton.appendChild(document.createTextNode('Upload File...'));
			screenshotButton.onclick = () => screenshotInput.click();
			screenshotP.appendChild(screenshotButton);
			
			screenshotInput.onchange = uploadScreenshot;
			
			scoreContainer.appendChild(screenshotP);
			
			let messageElement = document.createElement('div');
			messageElement.classList.add('input_error');
			scoreContainer.appendChild(messageElement);
			
			let setMessage = (message, type) => {
				messageElement.innerHTML = '';
				if (message) messageElement.appendChild(document.createTextNode(message));
				if (type) messageElement.className = 'input_' + type;
			}
			
			let updateButton = document.createElement('div');
			updateButton.classList.add('button');
			updateButton.appendChild(document.createTextNode('Update'));
			
			function sendUpdate(requestBody) {
				makeApiRequest('/score', {
						method: 'POST',
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(requestBody)
					})
					.then(response => {
						if (response.error) {
							let key = response.body && response.body.key;
							if (key) {
								numberInputItems.forEach(item => {
									if (item.key === key) {
										Utils.focusAtEnd(item.input);
									}
								});
								
								if (key === 'url') {
									Utils.focusAtEnd(urlInput);
								}
							}
							
							setMessage(response.error, 'error');
						} else {
							setMessage('Score updated.', 'success');
							best.innerHTML = '';
							best.appendChild(document.createTextNode(scoreToString(response.body.score)));
						}
					});
			}
			
			updateButton.addEventListener('click', () => {
				setMessage(null);
				
				let requestBody = {
					authToken: localStorage.getItem('authToken'),
					chartId: chart.id,
					url: urlInput.value,
				};
				
				numberInputItems.forEach(item => {
					requestBody[item.key] = stringToInteger(item.input.value);
				});
				
				if (bestScore) {
					let newPoints = ScoreUtils.getPoints(requestBody, chart);
					
					if (newPoints < bestScore.points) {
						Modal.promptAction('New score is less points than existing score. Update anyway?', 'Update', sendUpdate.bind(null, requestBody));
						return;
					}
				}
				
				sendUpdate(requestBody);
			});
			
			let updateButtonP = document.createElement('p');
			updateButtonP.appendChild(updateButton);
			
			scoreContainer.appendChild(updateButtonP);
			
			function getResizedFile(file, callback)
			{
				if (file.size <= 1000000)
				{
					return callback(null, file, file.name.split('.').pop().toLowerCase());
				}
				
				let img = new Image();
				img.onload = () => {
					let canvas = document.createElement('canvas');
					
					canvas.width = 640;
					canvas.height = Math.round(canvas.width * img.height / img.width);
					
					let context = canvas.getContext('2d');
					
					context.drawImage(img, 0, 0, canvas.width, canvas.height);
					
					let blobCallback = blob => callback(null, blob, 'jpg');
					
					canvas.toBlob(blobCallback, 'image/jpeg', 0.92);
				};
				
				img.onerror = (err) => {
					callback('Error uploading image (maybe it\'s not an image?)');
					console.log(err);
				}
				
				img.src = URL.createObjectURL(file);
			}
			
			function uploadScreenshot()
			{
				if (screenshotInput.files.length === 0) return;
				
				let modal = Modal.show(document.createTextNode('Uploading...'), { required: true });
				
				let file = screenshotInput.files[0];
				
				getResizedFile(file, (err, file, type) => {
					if (err)
					{
						modal.destroy();
						setMessage(err, 'error');
						return;
					}
					
					var uploadReq = new XMLHttpRequest();
					uploadReq.open("POST", '/screenshot/' + chart.id + '?type=' + encodeURIComponent(type), true);
					uploadReq.setRequestHeader('Content-Type', 'application/octet-stream');
					uploadReq.setRequestHeader('Authorization', 'Token ' + localStorage.getItem('authToken'));
					uploadReq.onload = () => {
						modal.destroy();
						
						console.log('Uploaded ', uploadReq);

						let responseJson = {};
						try {
							responseJson = JSON.parse(uploadReq.responseText);
						} catch(e) { }
							
						if (uploadReq.status !== 200)
						{
							console.log(uploadReq.status, uploadReq.responseText);
						
							let defaultErrors = {
								413: 'Screenshot can\'t exceed 10mb.',
								401: 'Authentication failed.',
							};
							
							responseJson.error = responseJson.error || defaultErrors[uploadReq.status] || 'Failed to upload screenshot.';
							
							setMessage(responseJson.error, 'error');
							
							return;
						}
						
						urlInput.value = window.location.protocol + '//' + window.location.host + responseJson.url;
						setMessage(null);
					};

					uploadReq.send(file);
				});
				
				
			}
		});
	}
	
	let loadedUpdateScoresPage = false;
	
	Tabs.addShowListener('update_scores', () => {
		if (loadedUpdateScoresPage) return;
		loadedUpdateScoresPage = true;
		
		makeApiRequest('/current_round')
			.then(roundResponse => {
				if (roundResponse.error) {
					showMessage(roundResponse.error);
					return;
				}
				
				let roundData = roundResponse.body;
				
				if (roundData.round) {
					let url = '/round_scores/' + roundData.round.index + '/' + localStorage.getItem('userId');
					console.log(url);
					makeApiRequest(url)
						.then(scoresResponse => {
							if (scoresResponse.error) {
								showMessage(scoresResponse.error);
								return;
							}
							
							showRound(roundData.round, scoresResponse.body.scores);
						});
				} else {
					showMessage('No round is currently in progress.');
				}
			});
	});
});

if (!HTMLCanvasElement.prototype.toBlob) {
   Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
     value: function (callback, type, quality) {
       var canvas = this;
       setTimeout(function() {
         var binStr = atob( canvas.toDataURL(type, quality).split(',')[1] ),
         len = binStr.length,
         arr = new Uint8Array(len);

         for (var i = 0; i < len; i++ ) {
            arr[i] = binStr.charCodeAt(i);
         }

         callback( new Blob( [arr], {type: type || 'image/png'} ) );
       });
     }
  });
}