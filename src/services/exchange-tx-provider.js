import { ethers } from "ethers";
import { actions } from "../boot/actions";
import { getPrice } from "./price-provider";
import { floatToMoney } from "../utils/moneyUtils";
import { LocalStorage } from "quasar";
const parse = require("csv-parse/lib/sync");

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
    const action = op.Action.toUpperCase();
    if (!(action == "SELL" || action == "BUY")) {
      throw new Error("Invalid action in trade data.");
    }
    const txId =
      op.ExchangeId.trim() == ""
        ? ethers.utils
            .id(
              op.Date +
                op.Action +
                op.Account +
                op.Currency +
                op.Symbol +
                op.Price +
                op.Amount +
                op.ExchangeId
            )
            .substring(2, 12)
        : op.ExchangeId;
    const date = op.Date.substring(0, 10);
    const account = op.Account == "" ? op.Memo : op.Account;
    mappedData.push({
      timestamp,
      price: parseFloat(op.Price),
      date,
      volume: parseFloat(op.Volume),
      memo: op.Memo,
      account,
      fee: parseFloat(op.Fee),
      feeCurrency: op.FeeCurrency.toUpperCase(),
      currency: op.Currency.toUpperCase(),
      asset: op.Symbol,
      action,
      txId
    });
  }

  actions.mergeArrayToData(
    "exchangeTrades",
    mappedData,
    (a, b) => a.txId == b.txId
  );
  return mappedData.length;
};

export const getExchangeTrades = async function() {
  const data = LocalStorage.getItem("exchangeTrades") ?? [];
  const mappedData = [];

  for (const tx of data) {
    if (tx.currency != "USD") {
      const currencyUSDPrice = await getPrice(tx.currency, tx.date);
      const currencyPrice = tx.price;
      const txId = tx.txId;
      const timestamp = tx.timestamp;
      tx.amount = tx.volume;
      tx.price = currencyPrice * currencyUSDPrice;
      tx.gross = floatToMoney(tx.amount * tx.price);
      tx.exchangeFee = tx.fee;
      if (tx.feeCurrency == tx.currency) {
        tx.fee = floatToMoney(tx.fee * currencyUSDPrice);
      } else {
        tx.fee = floatToMoney(tx.fee);
      }
      const fee = tx.fee;
      tx.txId = txId + (tx.action == "SELL" ? "-1" : "-2");
      tx.timestamp = timestamp + (tx.action == "BUY" ? 1 : 0);
      tx.fee = tx.action == "SELL" ? fee : 0.0;
      const currencyTx = Object.assign({}, tx);
      currencyTx.action = tx.action == "SELL" ? "BUY" : "SELL";
      currencyTx.txId = txId + (currencyTx.action == "SELL" ? "-1" : "-2");
      currencyTx.timestamp = timestamp + (currencyTx.action == "BUY" ? 1 : 0);
      currencyTx.price = currencyUSDPrice;
      currencyTx.asset = tx.currency;
      currencyTx.amount = tx.volume * currencyPrice;
      currencyTx.gross = currencyTx.price * currencyTx.amount;
      currencyTx.fee = currencyTx.action == "SELL" ? fee : 0.0;
      if (tx.action == "SELL") {
        mappedData.push(tx);
        mappedData.push(currencyTx);
      } else {
        mappedData.push(currencyTx);
        mappedData.push(tx);
      }
    } else {
      tx.amount = tx.volume;
      tx.gross = floatToMoney(tx.amount * tx.price);
      mappedData.push(tx);
    }
  }

  //TODO set running balances
  const assets = [];
  const _openingPositions = [...(actions.getData("openingPositions") ?? [])];
  for (const op of _openingPositions) {
    let asset = assets.find(a => a.symbol == op.asset);
    if (!asset) {
      asset = { symbol: op.asset, amount: 0.0 };
      assets.push(asset);
    }
    asset.amount += op.amount;
    op.runningBalance = asset.amount;
  }
  //const _exchangeTrades = [...(actions.getData("exchangeTrades") ?? [])];
  for (const et of mappedData) {
    let asset = assets.find(a => a.symbol == et.asset);
    if (!asset) {
      asset = { symbol: et.asset, amount: 0.0 };
      assets.push(asset);
    }
    asset.amount += et.action == "BUY" ? et.amount : -et.amount;
    et.runningBalance = asset.amount;
  }
  return mappedData.sort((a, b) => {
    if (a.timestamp != b.timestamp) return a - b;
    return a.txId < b.txId ? 1 : -1;
  });
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
  }
];
