module.exports.isHavingSameItems = (array1, array2) => {
    return array1.some(r => array2.includes(r))
}

module.exports.deepCopyFunction = (inObject) => {
    let outObject, value, key

    if (typeof inObject !== "object" || inObject === null) {
        return inObject
    }

    outObject = Array.isArray(inObject) ? [] : {}

    for (key in inObject) {
        value = inObject[key]
        outObject[key] = deepCopyFunction(value)
    }

    return outObject
}

module.exports.urlify = (text) => {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function (url) {
        return '<a target="_blank" href="' + url + '">' + url + '</a>';
    })
}