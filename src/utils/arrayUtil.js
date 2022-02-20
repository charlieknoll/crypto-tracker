export const shuffle = function (arr) {
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
function convertCase(val, lowerCase) {
  if (!lowerCase) return val;
  return val[0].toLowerCase() + val.substring(1);
}
export const convertToCsv = function (
  arr,
  names,
  delimiter,
  lowerCaseProperties
) {
  if (!delimiter) delimiter = ",";
  const content = [names.map((n) => wrapCsvValue(n)).join(delimiter)]
    .concat(
      arr.map((val) =>
        names
          .map((name) =>
            wrapCsvValue(val[convertCase(name, lowerCaseProperties)])
          )
          .join(delimiter)
      )
    )
    .join("\r\n");
  return content;
};
export const convertToCsvNoHeadher = function (arr, names, delimiter) {
  if (!delimiter) delimiter = ",";
  const content = arr
    .map((val) => names.map((name) => val[name]).join(delimiter))
    .join("\r\n");
  return content;
};

export const commaStringToArray = function (val) {
  let array = val.replaceAll(" ", "").split(",");
  if (array.length == 1 && array[0] == "") {
    array.pop();
  }
  return array;
};
export const commaStringToLowerCaseArray = function (val) {
  const array = commaStringToArray(val);
  return array.map((v) => (v ?? "").toLowerCase());
};
