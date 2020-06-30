function makeApiRequest(url, params) {
	let result = {
		status: -1,
		body: null,
		error: null,
	};
	
	return fetch(url, params)
		.then(response => {
			result.status = response.status;
			
			return response.json();
		})
		.then(json => {
			if (result.status < 300) {
				result.body = json;
			} else {
				result.error = json.error || 'Something went wrong.';
				result.body = json;
			}
			
			return result;
		})
		.catch(err => {
			console.log('Error making API request to ' + url + ':', err);
			
			result.error = 'Something went wrong.';
			
			return result;
		});
}