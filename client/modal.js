(() => {
	window.addEventListener('load', () => {
		function updateBodySize() {
			document.body.style.height = window.innerHeight + 'px';
		}
		
		updateBodySize();
		
		window.addEventListener('resize', updateBodySize);
	});
})();


const Modal = {
	show: (content, options) => {
		let dim = document.createElement('div');
		dim.classList.add('modal_dim');
		
		let wrap = document.createElement('div');
		wrap.classList.add('modal_wrapper');
		
		let modal = document.createElement('div');
		modal.classList.add('modal');
		modal.appendChild(content);
		
		modal.addEventListener('click', (e) => {
			e.stopPropagation();
		});
		
		wrap.appendChild(modal);
		
		dim.appendChild(wrap);
		
		let body = document.getElementsByTagName('body')[0];
		body.appendChild(dim);
		
		let required = options && options.required;
		
		if (!required)
		{
			dim.addEventListener('click', () => {
				body.removeChild(dim);
			});
		}
		
		return {
			destroy: () => {
				body.removeChild(dim);
			},
		};
	},
	promptAction: (message, actionName, action) => {
		let div = document.createElement('div');
		
		let p = document.createElement('p');
		p.appendChild(document.createTextNode(message));
		
		div.appendChild(p);
		
		let yesButton = document.createElement('div');
		yesButton.appendChild(document.createTextNode(actionName));
		yesButton.classList.add('button');
		div.appendChild(yesButton);
		
		let noButton = document.createElement('div');
		noButton.appendChild(document.createTextNode('Cancel'));
		noButton.classList.add('button');
		div.appendChild(noButton);
		
		let modal = Modal.show(div);
		
		yesButton.addEventListener('click', () => {
			modal.destroy();
			action();
		});
		
		noButton.addEventListener('click', () => {
			modal.destroy();
		});
	}
}