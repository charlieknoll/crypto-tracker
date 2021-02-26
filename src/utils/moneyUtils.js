import { BigNumber, ethers } from "ethers";

export const floatToMoney = function(val) {
  return Math.round(parseFloat(val) * 100) / 100;
};
export const bnToMoney = function(bn, unitPrice, decimals) {
  const bnAmount = bn.mul(
    BigNumber.from(Math.round(parseFloat(unitPrice) * 100))
  );
  return Math.round(ethers.utils.formatUnits(bnAmount, decimals)) / 100;
};
export const weiToMoney = function(bn, ethPrice) {
  return bnToMoney(bn, ethPrice, 18);
};
export const bnToFloat = function(bn, decimals) {
  try {
    return parseFloat(ethers.utils.formatUnits(bn, decimals));
  } catch (error) {
    //kill
    return 0.0;
  }
};
