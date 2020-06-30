const Login = {
	showLogin: (errorMessage) => {
		localStorage.removeItem('authToken');
		
		document.getElementById('user_panel').classList.add('hidden');
		document.getElementById('login_panel').classList.remove('hidden');
		
		let username = localStorage.getItem('username');
		if (username) {
			document.getElementById('login_username').value = username;
		}
		
		let error = document.getElementById('login_panel_error');
		error.innerHTML = '';
		
		if (errorMessage) {
			error.appendChild(document.createTextNode(errorMessage));
			error.classList.remove('hidden');
		} else {
			error.classList.add('hidden');
		}
		
		document.getElementById('admin_link').classList.add('hidden');
		
		Tabs.show('registration');
		Tabs.hide('update_scores');
		
		Array.from(document.getElementsByClassName('nologin'))
			.forEach((elem) => elem.classList.remove('hidden'));
	},
	showLoggedIn: () => {
		document.getElementById('user_panel').classList.remove('hidden');
		document.getElementById('login_panel').classList.add('hidden');
		
		let message = document.getElementById('user_panel_message');
		message.innerHTML = '';
		message.appendChild(document.createTextNode('Logged in as ' + localStorage.getItem('username') + '.'));
		
		let spinner = document.getElementById('user_panel_spinner');
		
		spinner.classList.remove('lds-ripple');
		spinner.classList.add('lds-ripple-hidden');
		
		let logout = document.getElementById('logout_button');
		
		logout.classList.remove('hidden');
		
		Tabs.hide('registration');
		Tabs.show('update_scores');
		
		Array.from(document.getElementsByClassName('nologin'))
			.forEach((elem) => elem.classList.add('hidden'));
	},
	showLoginProgress: (isLogout) => {
		document.getElementById('user_panel').classList.remove('hidden');
		document.getElementById('login_panel').classList.add('hidden');
		
		let message = isLogout ? 'Logging out...' : 'Logging in as ' + localStorage.getItem('username') + '...';
		
		let messageElement = document.getElementById('user_panel_message');
		messageElement.innerHTML = '';
		
		messageElement.appendChild(document.createTextNode(message));
		
		let spinner = document.getElementById('user_panel_spinner');
		
		spinner.classList.remove('lds-ripple-hidden');
		spinner.classList.add('lds-ripple');
		
		let logout = document.getElementById('logout_button');
		
		logout.classList.add('hidden');
	},
	handleLoginResponse: (json) => {
		console.log('Got login response:', json);
		
		localStorage.setItem('authToken', json.authToken);
		localStorage.setItem('userId', json.id);
		localStorage.setItem('username', json.name);
		
		if (json.admin) document.getElementById('admin_link').classList.remove('hidden');
		
		Login.showLoggedIn();
	},
};

window.addEventListener('load', () => {
	let username = localStorage.getItem('username');
	let authToken = localStorage.getItem('authToken');
	let userId = localStorage.getItem('userId');
	
	if (username === null || authToken === null || userId === null) {
		Login.showLogin();
	} else {
		// auto login
		Login.showLoginProgress();
		
		makeApiRequest('/me', {
				method: 'POST',
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ authToken: authToken })
			})
			.then(response => {
				if (response.error) {
					console.log('Server responded with error logging in:', response.error);
					
					Login.showLogin();
				} else {
					localStorage.setItem('username', response.body.name);
					localStorage.setItem('userId', response.body.id);
					localStorage.setItem('admin', response.body.admin ? 'true' : null);
					
					if (response.body.admin) document.getElementById('admin_link').classList.remove('hidden');
		
					Login.showLoggedIn();
				}
			});
	}
	
	document.getElementById('logout_button').addEventListener('click', () => {
		Login.showLoginProgress(true);
		
		makeApiRequest('/logout', {
				method: 'POST',
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ authToken: authToken })
			})
			.then(response => {
				console.log('Logged out with status:', response.status);
				
				Login.showLogin();
			});
	});
	
	function doLogin() {
		let username = document.getElementById('login_username');
		let password = document.getElementById('login_password');
		
		localStorage.setItem('username', username.value);
		
		Login.showLoginProgress();
		
		makeApiRequest('/login', {
				method: 'POST',
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: username.value, password: password.value })
			})
			.then(response => {
				if (response.error) {
					Login.showLogin(response.error);
				} else {
					Login.handleLoginResponse(response.body);
				}
			});
	}
	
	document.getElementById('login').addEventListener('click', doLogin);
	

	document.getElementById('login_password').addEventListener('keydown', event => {
		if (event.keyCode === 13) {
			doLogin();
		}
	});
	
	document.getElementById('login_username').addEventListener('keydown', event => {
		if (event.keyCode === 13) {
			document.getElementById('login_password').focus();
		}
	});
});