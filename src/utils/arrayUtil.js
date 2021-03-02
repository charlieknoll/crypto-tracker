const shuffle = function(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
function wrapCsvValue(val) {
  let formatted = val;

  formatted =
    formatted === void 0 || formatted === null ? "" : String(formatted);

  formatted = formatted.split('"').join('""');
  /**
   * Excel accepts \n and \r in strings, but some other CSV parsers do not
   * Uncomment the next two lines to escape new lines
   */
  // .split('\n').join('\\n')
  // .split('\r').join('\\r')

  return `"${formatted}"`;
}
const convertToCsv = function(arr, names) {
  const content = [names.map(n => wrapCsvValue(n)).join(",")]
    .concat(
      arr.map(val => names.map(name => wrapCsvValue(val[name])).join(","))
    )
    .join("\r\n");
  return content;
};
const commaStringToArray = function(val) {
  let array = val.replaceAll(" ", "").split(",");
  if (array.length == 1 && array[0] == "") {
    array.pop();
  }
  return array;
};
export { shuffle, convertToCsv, commaStringToArray };
