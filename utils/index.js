module.exports.isHavingSameItems = (array1, array2) => {
    return array1.some(r => array2.includes(r))
}