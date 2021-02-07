import { LocalStorage } from "quasar";
import { store } from "../boot/store";
import { ethers } from "ethers";
import { getPrice } from "../data/etherPrices";
import { getCRVPrice } from "../data/CRVPrices";

import { actions } from "../boot/actions";
import getMethodName from "./methods";
import { history } from "./tx-provider";

const BigNumber = ethers.BigNumber;
const FixedNumber = ethers.FixedNumber;
const baseCurrencies = ["USDC", "USDT", "TUSD", "DAI"];
let tokenPrices = [];

let tokentxs = require("../data/tokentxs.json").result;
const parentTxs = history();
function toNumberWithDecimals(bn, decimals) {
  if (!bn || !decimals) return 0.0;
  return (
    Math.round(
      bn
        .mul(1000)
        .div(BigNumber.from(10).pow(decimals))
        .toNumber()
    ) / 1000
  );
}
function initParentTransaction(tx) {
  tx.inTokenTxs = [];
  tx.outTokenTxs = [];
  tx.otherTokenTxs = [];
  tx.usdProceeds = 0.0;
  tx.usdSpent = 0.0;
}
function addTokenTx(tx, toAccount, fromAccount) {
  tx.action = tx.parentTx.methodName;
  if (baseCurrencies.find(c => c == tx.tokenSymbol.toUpperCase())) {
    const gross = tx.decimalAmount;
    tx.gross = gross;
  } else {
    tx.gross = 0.0;
  }
  if (toAccount.type == "Owned" && fromAccount.type != "Owned") {
    tx.parentTx.inTokenTxs.push(tx);
    tx.parentTx.usdSpent += tx.gross;
    //assign fees proportionally to non baseCurrency buys/sells
    if (tx.parentTx.toAccount && tx.parentTx.toAccount.type == "Income") {
      tx.action += "/INCOME";
      tx.gross = tx.decimalAmount * getCRVPrice(tx.date);
    } else {
      tx.action = tx.fromName.includes("Spam") ? "SPAM" : tx.action + "/BUY";
    }
  } else if (fromAccount.type == "Owned" && toAccount.type != "Owned") {
    tx.parentTx.outTokenTxs.push(tx);
    tx.parentTx.usdProceeds += tx.gross;

    tx.action += tx.parentTx.toAccount.type == "Gift" ? "/GIFT" : "/SELL";
  } else {
    tx.action = "TRANSFER";
    tx.gross = 0.0;
    tx.parentTx.otherTokenTxs.push(tx);
  }
}
function distributeFee(pt) {
  const allTxs = pt.inTokenTxs.concat(pt.outTokenTxs).concat(pt.otherTokenTxs);
  const feeTxs = [];
  for (const t of allTxs) {
    if (!t.amount.eq(0)) {
      feeTxs.push(t);
    } else {
      t.fee = 0.0;
    }
  }
  for (const t of feeTxs) {
    t.fee = pt.fee / feeTxs.length;
  }
}
//For only base currency tx's
function setBaseCurrencyExchangeTxGross(pt) {
  //take the abs of in and out difference
  const additionalFee = Math.abs(pt.usdProceeds - pt.usdSpent);

  //distribute it as fees on the out txs proportional to value
  const ptGross = pt.usdProceeds > pt.usdSpent ? pt.usdSpent : pt.usdProceeds;
  const txSet =
    pt.usdProceeds < pt.usdSpent
      ? pt.inTokenTxs.filter(inTx => !inTx.amount.eq(0))
      : pt.outTokenTxs.filter(outTx => !outTx.amount.eq(0));
  for (const tx of txSet) {
    tx.fee += (additionalFee * tx.gross) / ptGross;
    //console.log("base currency tx:", tx);
  }
}
function setImpliedGrossAndPrices(parentGross, txSet) {
  let totalAmounts = 0.0;
  for (const tx of txSet) {
    totalAmounts += tx.decimalAmount;
  }
  for (const tx of txSet) {
    tx.gross = (parentGross * tx.decimalAmount) / totalAmounts;
  }

  //calc prices using the proportional amount parent proceeds
  for (const tx of txSet) {
    tokenPrices.unshift({
      symbol: tx.tokenSymbol,
      price: parentGross / tx.decimalAmount
    });
  }
}
function setBaseCurrencyTokenTxGross(pt) {
  //TODO handle baseCurrency on both sides
  const nonBaseTxs =
    pt.usdProceeds !== 0.0
      ? pt.inTokenTxs.filter(inTx => !inTx.amount.eq(0))
      : pt.outTokenTxs.filter(outTx => !outTx.amount.eq(0));
  const parentGross = pt.usdProceeds == 0.0 ? pt.usdSpent : pt.usdProceeds;

  setImpliedGrossAndPrices(parentGross, nonBaseTxs);
}
function setImpliedTxGross(pt) {
  //no base currency transactions
  //TODO handle price lookups
  //first look for sell in recent prices, if not then buy
  const outTxs = pt.outTokenTxs.filter(outTx => !outTx.amount.eq(0));
  if (outTxs.length == 0) return;
  let pricesMapped = true;
  const outTxsPrices = outTxs.map(tx => {
    tx.tokenPrice = tokenPrices.find(tp => tp.symbol == tx.tokenSymbol);
    pricesMapped = pricesMapped && tx.tokenPrice;
    return tx;
  });
  if (!pricesMapped) {
    console.error("No existing price for sold token can be implied", tx);
    return;
    //throw new Error("No existing price for sold token can be implied");
  }
  let parentGross = 0.0;
  for (const tx of outTxsPrices) {
    tx.gross = tx.tokenPrice.price * tx.decimalAmount;
    parentGross += tx.gross;
  }
  setImpliedGrossAndPrices(
    parentGross,
    pt.inTokenTxs.filter(tx => !tx.amount.eq(0))
  );
}
function setGross(pt) {
  //TODO ensure that all tokens are baseTokens

  if (pt.usdProceeds !== 0.0 && pt.usdSpent !== 0.0) {
    setBaseCurrencyExchangeTxGross(pt);
  } else if (pt.usdProceeds + pt.usdSpent != 0.0) {
    setBaseCurrencyTokenTxGross(pt);
  } else {
    setImpliedTxGross(pt);
  }
}

function MappedTransaction(tx) {
  const toAccount = actions.addImportedAddress({ address: tx.to });
  const fromAccount = actions.addImportedAddress({ address: tx.from });
  //token symbol assigned here
  Object.assign(this, tx);
  this.hash = tx.hash.toLowerCase();
  this.toName = toAccount.name;
  this.fromName = fromAccount.name;
  this.toAccount = toAccount;
  this.fromAccount = fromAccount;
  //TODO convert amount using token decimal
  this.amount = BigNumber.from(tx.value);
  this.decimalAmount = toNumberWithDecimals(this.amount, tx.tokenDecimal);

  //this.displayAmount = ethers.utils.formatUnits(tx.value, tx.tokenDecimal);
  this.displayAmount =
    Math.round(
      BigNumber.from(tx.value)
        .mul(100)
        .div(BigNumber.from(10).pow(tx.tokenDecimal))
        .toNumber()
    ) / 100;

  let ethPrice = getPrice(parseInt(tx.timeStamp));
  this.fee =
    Math.round(
      ethers.utils.formatEther(
        BigNumber.from(tx.gasUsed)
          .mul(BigNumber.from(tx.gasPrice))
          .mul(BigNumber.from(parseFloat(ethPrice) * 100))
      )
    ) / 100;

  // this.fee = toNumberWithDecimals(
  //   BigNumber.from(tx.gasUsed)
  //     .mul(BigNumber.from(tx.gasPrice))
  //     .mul(BigNumber.from(parseFloat(ethPrice))),
  //   18
  // );

  //set parent transaction
  this.parentTx = parentTxs.find(pt => pt.hash == tx.hash);
  if (!this.parentTx) {
    //TODO trigger download from etherscan
    this.parentTx = { hash: tx.hash };
    initParentTransaction(this.parentTx);
  }

  this.seqNo =
    this.parentTx.outTokenTxs.length +
    this.parentTx.inTokenTxs.length +
    this.parentTx.otherTokenTxs.length;
  this.txId = this.hash.substring(2, 8) + "-" + this.seqNo;

  addTokenTx(this, toAccount, fromAccount);
  //determine action using parent tx and to/from owned
  this.timestamp = parseInt(tx.timeStamp);
  this.date = new Date(this.timestamp * 1000).toISOString().slice(2, 10);
  //.replace(/-/g, ""); //new Date(parseInt(tx.timestamp));
  //Determine if it is INCOME (curve redemption), SPEND (GitCoin), EXPENSE, BUY, SELL
}

function buildHistory() {
  //build tx list
  //fields: tx-seqno, timestamp, short date fee, ethprice, token, action, realized short term gain, realized long term gain,
  //cost basis
  tokentxs = LocalStorage.getItem("tokentxs") ?? tokentxs;
  tokenPrices = [];

  //start with tx's and insert any token txs
  const mappedTxs = [];
  for (const pt of parentTxs) {
    initParentTransaction(pt);
  }
  for (const t of tokentxs) {
    mappedTxs.push(new MappedTransaction(t, 0));
  }
  //distribute baseCurrency costs/proceeds and fees to non baseCurrency
  for (const pt of parentTxs) {
    distributeFee(pt);
  }
  for (const pt of parentTxs) {
    setGross(pt);
  }
  //console.log("Token Prices", tokenPrices);
  return mappedTxs;
}
export const tokenHistory = buildHistory;
export const columns = [
  {
    name: "date",
    label: "Date",
    field: "date",
    align: "left"
  },
  {
    name: "txId",
    label: "Id",
    field: "txId",
    align: "left"
  },
  {
    name: "from",
    label: "From",
    field: "fromName",
    align: "left"
  },
  {
    name: "to",
    label: "To",
    field: "toName",
    align: "left"
  },
  {
    name: "tokenSymbol",
    label: "Token",
    field: "tokenSymbol",
    align: "left"
  },
  {
    name: "action",
    label: "Action",
    field: "action",
    align: "left"
  },
  {
    name: "amount",
    label: "Amount",
    field: "displayAmount",
    align: "right"
  },
  // {
  //   name: "price",
  //   label: "Implied USD Total",
  //   field: "gross",
  //   align: "right",
  //   format: (val, row) => `$${val ? parseFloat(val).toFixed(2) : "0.00"}`
  // },
  {
    name: "fee",
    label: "Fee",
    field: "fee",
    align: "right",
    format: (val, row) => `$${(val ?? 0.0).toFixed(2)}`
  },
  {
    name: "gross",
    label: "Gross",
    field: "gross",
    align: "right",
    format: (val, row) => `$${(val ?? 0.0).toFixed(2)}`
  }
];
