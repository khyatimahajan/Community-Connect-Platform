// Helper methods

// Check if array has same items
module.exports.isHavingSameItems = (array1, array2) => {
	return array1.some((r) => array2.includes(r));
};

// Deep copying array and items
module.exports.deepCopyFunction = (inObject) => {
	let outObject, value, key;

	if (typeof inObject !== 'object' || inObject === null) {
		return inObject;
	}

	outObject = Array.isArray(inObject) ? [] : {};

	for (key in inObject) {
		value = inObject[key];
		outObject[key] = deepCopyFunction(value);
	}

	return outObject;
};

// Add a tag if url is present in string
module.exports.urlify = (text) => {
	var urlRegex = /(https?:\/\/[^\s]+)/g;
	return text.replace(urlRegex, function (url) {
		return '<a target="_blank" href="' + url + '">' + url + '</a>';
	});
};

// Find common elements
module.exports.findCommonElements = (arr1, arr2) => {
	return arr1.some((item) => arr2.includes(item));
};

//unescape quotes
module.exports.unescapeQuotes = (str) => {
	return str.replace(/"/g, '\\"');
};
