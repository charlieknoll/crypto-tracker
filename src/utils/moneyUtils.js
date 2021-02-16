export const floatToMoney = function(val) {
  return Math.round(parseFloat(val) * 100) / 100;
};
