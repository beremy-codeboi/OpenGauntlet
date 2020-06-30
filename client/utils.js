const Utils = {
	focusAtEnd: (element) => {
		element.focus();
		element.value = element.value;
	},
	
	getLocalTimezone: () => {
		return Intl && Intl.DateTimeFormat().resolvedOptions().timeZone;
	},

	pad2: (x) => {
		return ("0"+x).slice(-2);
	},

	formatDate: (date) => {
	  var monthNames = [
		"January", "February", "March",
		"April", "May", "June", "July",
		"August", "September", "October",
		"November", "December"
	  ];

	  var day = date.getDate();
	  var monthIndex = date.getMonth();
	  var year = date.getFullYear();
	  
	  var hours = date.getHours();
	  var amPm = hours < 12 ? 'am' : 'pm';
	  hours = hours % 12;
	  if (hours === 0) hours = 12;
	  
	  
	  var minutes = Utils.pad2(date.getMinutes());

	  let timeZone = Utils.getLocalTimezone() || 'local';
	  
	  return monthNames[monthIndex] + ' ' + day + ' ' + year + ' at ' + hours + ':' + minutes + ' ' + amPm + ' (' + timeZone + ' time)';
	},
};