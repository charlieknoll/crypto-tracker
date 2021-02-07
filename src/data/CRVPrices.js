const etherscanIoData = `
"Date","Value"
"20-09-10","1.97"
"20-09-20","1.48"
"20-10-26","0.34"
"21-01-07","0.73"
`;

const parse = require("csv-parse/lib/sync");

const stagePrices = parse(etherscanIoData, {
  trim: true,
  columns: true,
  skip_empty_lines: true
});

const mappedPrices = stagePrices
  .map(function(sp) {
    return { timestamp: parseInt(sp.UnixTimeStamp), price: sp.Value };
  })
  .reverse();
export const getCRVPrice = function(yymmdd) {
  const price = mappedPrices.find(mp => yymmdd == mp.date);
  return price.price;
};
