function setPage(id) {
	window.location.hash = '#' + id;
	
	updatePageElementVisibilities();
}

function updatePageElementVisibilities() {
	var pageId = (window.location.hash || '#home').slice(1);
	
	var pageElements = document.getElementsByClassName('content');
	
	for (var i = 0; i < pageElements.length; i++) {
		if (pageElements[i].getAttribute('data-page-id') === pageId) {
			pageElements[i].classList.remove('hidden');
		} else {
			pageElements[i].classList.add('hidden');
		}
	}
	
	console.log('PAGE ID:', pageId);
}

let tabPrefix = 'tab_';
let contentPrefix = 'content_';

function tabIdToContentId(tabId) {
	return tabId.substring(tabPrefix.length);
}

let curContentId = null;
	
function setContentId(newContentId) {
	if (newContentId === curContentId) return;
	
	if (curContentId !== null) {
		let oldTab = document.getElementById(tabPrefix + curContentId);
		let oldContent = document.getElementById(contentPrefix + curContentId);
		if (oldTab) oldTab.classList.remove('selected');
		if (oldContent) oldContent.classList.add('hidden');
	}

	curContentId = newContentId;

	let tab = document.getElementById(tabPrefix + newContentId);
	let content = document.getElementById(contentPrefix + newContentId);
	
	if (!tab || !content || tab.classList.contains('hidden')) return setContentId('home');
	
	tab.classList.add('selected');
	content.classList.remove('hidden');

	window.location.hash = '#' + newContentId;
	
	if (Tabs._showListeners[newContentId]) {
		Tabs._showListeners[newContentId].forEach(f => f());
	}
}

const Tabs = {
	_showListeners: {},
	hide: (id) => {
		document.getElementById(tabPrefix + id).classList.add('hidden');
		
		if (window.location.hash === '#' + id) {
			window.location.hash = '#home';
		}
	},
	show: (id) => {
		document.getElementById(tabPrefix + id).classList.remove('hidden');
	},
	addShowListener: (id, listener) => {
		if (!Tabs._showListeners[id]) Tabs._showListeners[id] = [];
		
		Tabs._showListeners[id].push(listener);
		
		if (window.location.hash === '#' + id) listener();
	}
}

window.addEventListener('load', () => {
	let initialContentId = (window.location.hash || '#home').substring(1);
	
	Array.from(document.getElementsByClassName('tab')).forEach(tab => {
		let onClick = setContentId.bind(null, tabIdToContentId(tab.id));
		
		tab.addEventListener('click', onClick);
	});
	
	setContentId(initialContentId);
	
	Array.from(document.getElementsByClassName('local_date')).forEach(dateElem => {
		dateElem.appendChild(document.createTextNode(Utils.formatDate(new Date(+(dateElem.dataset.timestamp)))));
	});
});

window.addEventListener('hashchange', function() {
	setContentId((window.location.hash || '#home').substring(1));
});