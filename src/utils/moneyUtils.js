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
export const formatCurrency = function(val) {
  if (val === undefined || val === null || val === "") {
    return val;
  }
  val = parseFloat(val);
  const formatted = `$${(val ?? 0.0).toLocaleString("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
  return formatted;
};
export const formatNumber = function(val) {
  if (val === undefined || val === null || val === "") {
    return val;
  }
  return (Math.round(parseFloat(val) * 100) / 100).toFixed(2);
  // val = parseFloat(val);
  // const formatted = `${(val ?? 0.0).toLocaleString("en-US", {
  //   style: "decimal",
  //   minimumFractionDigits: 2,
  //   maximumFractionDigits: 2
  // })}`;
  // return formatted;
};
export const formatDecimalNumber = function(val, digits) {
  if (val == undefined || val == null || val == "") return "";
  val = parseFloat(val);
  return `${(val ?? 0.0).toFixed(digits)}`;
};
