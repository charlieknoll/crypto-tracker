import { ethers } from "ethers";
import { actions } from "../boot/actions";
import { getPrice } from "./price-provider";
import { floatToMoney } from "../utils/moneyUtils";
import { store } from "src/boot/store";
import { LocalStorage } from "quasar";
const parse = require("csv-parse/lib/sync");

function applyBuyProps(btx, op, price) {
  //buy props
  const tx = Object.assign({}, btx);
  tx.price = op.Action == "BUY" ? parseFloat(op.Price) * price : price;
  tx.amount =
    op.Action == "BUY"
      ? parseFloat(op.Volume)
      : parseFloat(op["Cost/Proceeds"]);
  tx.asset = op.Action == "BUY" ? op.Symbol : op.Currency;
  tx.fee = 0.0;
  tx.gross = floatToMoney(tx.price * tx.amount);
  tx.action = "BUY";
  tx.txId = tx.txId.replace("-0", "-1");
  return tx;
}
function applySellProps(btx, op, price) {
  const tx = Object.assign({}, btx);
  tx.price = op.Action == "SELL" ? parseFloat(op.Price) * price : price;
  tx.amount =
    op.Action == "SELL"
      ? parseFloat(op.Volume)
      : parseFloat(op["Cost/Proceeds"]);
  tx.gross = floatToMoney(tx.price * tx.amount);
  tx.fee =
    op.Action == "SELL"
      ? floatToMoney(parseFloat(op.Fee) * price)
      : floatToMoney(parseFloat(op.Fee) * tx.price);
  tx.action = "SELL";
  tx.asset = op.Action == "SELL" ? op.Symbol : op.Currency;

  return tx;
}
export const processExchangeTradesFile = function(data) {
  const stagedData = parse(data, {
    trim: true,
    columns: true,
    skip_empty_lines: true
  });
  const mappedData = [];

  for (const op of stagedData) {
    const tradeDate = new Date(op.Date.substring(0, 19));
    const timestamp = tradeDate.getTime() / 1000;
    const txId =
      op.ExchangeId == ""
        ? ethers.utils
            .id(op.Date + op.Symbol + op.Price + op.Amount + Math.random())
            .substring(2, 9)
        : op.ExchangeId;
    const date = op.Date.substring(0, 10);
    const account = op.Account == "" ? op.Memo : op.Account;
    op.exchangePrice = op.Price;
    op.exchangeFee = op.Fee;
    if (op.Currency != "USD") {
      //split into a buy tx and a sell tx, converting to USD
      const price = 0.0;
      //base tx
      const tx = {
        timestamp,
        date,
        memo: op.Memo,
        account,
        txId: txId + "-0",
        exchangePrice: op.Price,
        exchangeFee: op.Fee,
        exchangeCurrency: op.Currency
      };
      mappedData.push(applySellProps(tx, op, price));
      mappedData.push(applyBuyProps(tx, op, price));
    } else {
      mappedData.push({
        timestamp,
        price: parseFloat(op.Price),
        date,
        amount: parseFloat(op.Volume),
        memo: op.Memo,
        account,
        fee: parseFloat(op.Fee),
        feeCurrency: op.FeeCurrency,
        asset: op.Symbol,
        action: op.Action.toUpperCase(),
        gross: floatToMoney(parseFloat(op.Price) * parseFloat(op.Volume)),
        txId,
        exchangePrice: op.Price,
        exchangeFee: op.Fee,
        exchangeCurrency: op.Currency
      });
    }
  }
  actions.mergeArrayToData(
    "exchangeTrades",
    mappedData,
    (a, b) => a.txId == b.txId
  );
};

export const getExchangeTrades = async function() {
  const data = LocalStorage.getItem("exchangeTrades") ?? [];
  const mappedData = [];

  for (const tx of data) {
    if (tx.exchangeCurrency != "USD") {
      const price = await getPrice(tx.exchangeCurrency, tx.date);
      tx.price =
        tx.Action == "SELL" ? parseFloat(tx.exchangePrice) * price : price;
      tx.gross = floatToMoney(tx.price * tx.amount);
      tx.fee = floatToMoney(parseFloat(tx.exchangeFee) * tx.price);
    }
  }
  return data;

  //TODO set running balances
  // const assets = [];
  // const _openingPositions = [...(actions.getData("openingPositions") ?? [])];
  // for (const op of _openingPositions) {
  //   let asset = assets.find(a => a.symbol == op.asset);
  //   if (!asset) {
  //     asset = { symbol: op.asset, amount: 0.0 };
  //     assets.push(asset);
  //   }
  //   asset.amount += op.amount;
  //   op.runningBalance = asset.amount;
  // }
  // const _exchangeTrades = [...(actions.getData("exchangeTrades") ?? [])];
  // for (const et of _exchangeTrades) {
  //   let asset = assets.find(a => a.symbol == et.asset);
  //   if (!asset) {
  //     asset = { symbol: et.asset, amount: 0.0 };
  //     assets.push(asset);
  //   }
  //   asset.amount += et.action == "BUY" ? et.amount : -et.amount;
  //   et.runningBalance = asset.amount;
  // }
  // actions.mergeArrayToData(
  //   "openingPositions",
  //   _openingPositions,
  //   (a, b) => a.txId == b.txId
  // );
  // actions.mergeArrayToData(
  //   "exchangeTrades",
  //   _exchangeTrades,
  //   (a, b) => a.txId == b.txId
  // );
};

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
    name: "account",
    label: "Account",
    field: "account",
    align: "left"
  },
  {
    name: "asset",
    label: "Asset",
    field: "asset",
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
    field: "amount",
    align: "right",
    format: (val, row) => `${(val ?? 0.0).toFixed(4)}`
  },
  {
    name: "price",
    label: "Price",
    field: "price",
    align: "right",
    format: (val, row) => `$${val ? parseFloat(val).toFixed(2) : "0.00"}`
  },
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
  },
  {
    name: "runningBalance",
    label: "Running Balance",
    field: "runningBalance",
    align: "right",
    format: (val, row) => `${(val ?? 0.0).toFixed(4)}`
  }
];
