
function clearErrors() {
	['username_error', 'password_error', 'confirm_password_error', 'register_error'].forEach(id => {
		document.getElementById(id).innerHTML = '';
	});
}


function register() {
	clearErrors();
	
	let username = document.getElementById('username');
	let password = document.getElementById('password');
	let confirmPassword = document.getElementById('confirm_password');
	
	if (!username.value) {
		document.getElementById('username_error').appendChild(document.createTextNode('👈 Hello???'));
		Utils.focusAtEnd(username);
		return;
	}
	
	if (username.value.length < 4) {
		document.getElementById('username_error').appendChild(document.createTextNode('Username must be at least 4 characters '));
		Utils.focusAtEnd(username);
		return;
	}
	
	let invalidChars = new Set();
	
	for (let i = 0; i < username.value.length; i++) {
		let code = username.value.codePointAt(i);
		
		let isSurrogatePair = code > 0xFFFF;
			
		if (code < 33 || code > 126) {
			let c = isSurrogatePair ? username.value.substring(i, i+2) : username.value.charAt(i);
			invalidChars.add(c);
		}
	
		if (isSurrogatePair) {
			// Skip the next character.
			i++;
		}
	}
	
	
	if (invalidChars.size !== 0) {
		let sortedInvalidChars = Array.from(invalidChars);
		sortedInvalidChars.sort();
		let message = 'The following characters are not allowed in usernames: "' + sortedInvalidChars.join('", "') + '"';
		document.getElementById('username_error').appendChild(document.createTextNode(message));
		Utils.focusAtEnd(username);
		return;
	}
	
	if (!password.value) {
		document.getElementById('password_error').appendChild(document.createTextNode('👈 Hello???'));
		Utils.focusAtEnd(password);
		return;
	}
	
	if (password.value.length < 8) {
		document.getElementById('password_error').appendChild(document.createTextNode('Password must be at least 8 characters.'));
		Utils.focusAtEnd(password);
		return;
	}
	
	if (!confirmPassword.value) {
		document.getElementById('confirm_password_error').appendChild(document.createTextNode('👈 Hello???'));
		Utils.focusAtEnd(confirmPassword);
		return;
	}
	
	if (password.value !== confirmPassword.value) {
		document.getElementById('confirm_password_error').appendChild(document.createTextNode('Passwords don\'t match ya dingus.'));
		Utils.focusAtEnd(confirmPassword);
		return;
	}
	
	makeApiRequest('/register', {
		method: 'POST',
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username: username.value,
			password: password.value,
		})
	}).then(response => {
		if (response.error) {
			let key = (response.body && response.body.key) || 'register';
			let message = (response.body && response.body.error) || 'An unknown error occurred.';
			
			document.getElementById(key + '_error').appendChild(document.createTextNode(message));
			if (key !== 'register') document.getElementById(key).focus();
		} else {
			Login.handleLoginResponse(response.body);
		}
	});
}

window.addEventListener('load', () => {
	document.getElementById('register').addEventListener('click', register);
});