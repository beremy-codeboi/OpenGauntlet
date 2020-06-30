window.addEventListener('load', () => {
	if (typeof(fetch) === 'undefined' || typeof(localStorage) === 'undefined') {
		var body = document.getElementsByTagName('body')[0];
		body.innerHTML = (
			'<p>Your browser sucks</p>\n'
			+ '<p><a href="https://www.mozilla.org/en-US/firefox/new/">Download Firefox</a></p>\n'
			+ '<p><a href="https://www.google.com/chrome/">Download Chrome</a></p>\n'
		);
	}
});