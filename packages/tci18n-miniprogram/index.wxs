var langs = {}
function splitKey(key) {
	if (typeof key === 'string' && key.indexOf('#!!!#') > -1) {
			const [value, filePathIndex] = key.split('#!!!#')
			let filePath = ''
			let index = ''
			if (filePathIndex) {
					const splitIndex = filePathIndex.lastIndexOf('_')
					filePath = filePathIndex.slice(0, splitIndex)
					index = filePathIndex.slice(splitIndex + 1)
			}
			return [value, filePath, index]
	}
	return [key, '', '']
}
function t() {
	var key, variables, locale;
	if (arguments.length === 1) {
		key = arguments[0];
		locale = 'zh-cn';
	} else if (arguments.length === 2) {
		key = arguments[0];
		locale = arguments[1];
	} else if (arguments.length === 3) {
		key = arguments[0];
		variables = arguments[1]
		locale = arguments[2];
	}
	if (langs && locale) {
		var message = langs[locale];
		if (message && message[key]) {
			var msg = message[key];
			if (variables && Object.keys(variables).length) {
				Object.keys(variables).forEach(function(k) {
					msg = msg.replace('{' + k + '}' , variables[k]);
				})
			}
			return msg
		} else {
			var value = splitKey(key)[0]
			if (variables && Object.keys(variables).length) {
				Object.keys(variables).forEach(function(k) {
					value = value.replace('{' + k + '}', variables[k]);
				})
			}
			return value
		}
	}
	return splitKey(key)[0] || '';
}
var setLangs = function(data) {
	// 在这里处理数据
  langs = data
}
module.exports.setLangs = setLangs;
module.exports.t = t