import { ethers } from "ethers";
import { actions } from "../boot/actions";
import { getPrice } from "./price-provider";
const parse = require("csv-parse/lib/sync");

export const processExchangeTradesFile = async function(data) {
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
            .id(op.Date + op.Symbol + op.Price + op.Amount)
            .substring(2, 9)
        : op.ExchangeId;
    const date = op.Date.substring(2, 10);
    const account = op.Account == "" ? op.Memo : op.Account;
    if (op.Currency != "USD") {
      //split into a buy tx and a sell tx, converting to USD

      const fee = op.Action == "BUY" ? parseFloat(op.Fee) : -parseFloat(op.Fee);
      const price = await getPrice(op.Currency, date);

      mappedData.push({
        timestamp,
        price: parseFloat(op.Price) * price,
        date,
        amount: parseFloat(op.Volume),
        memo: op.Memo,
        account,
        fee: parseFloat(op.Fee) * price,
        asset: op.Symbol,
        action: op.Action.toUpperCase(),
        gross:
          Math.round(
            (fee + parseFloat(op.Price) * parseFloat(op.Volume)) * 100 * price
          ) / 100,
        txId: txId + "-0"
      });
      //additonal tx for fee asset
      const amount = Math.abs(parseFloat(op.Total));
      mappedData.push({
        timestamp,
        price: price,
        date: op.Date.substring(2, 10),
        amount,
        memo: op.Memo,
        account,
        fee: 0.0,
        asset: op.Currency,
        action: op.Action.toUpperCase() == "BUY" ? "SELL" : "BUY",
        gross: Math.round(price * amount * 100) / 100,
        txId: txId + "-1"
      });
    } else {
      mappedData.push({
        timestamp,
        price: parseFloat(op.Price),
        date: op.Date.substring(2, 10),
        amount: parseFloat(op.Volume),
        memo: op.Memo,
        account,
        fee: parseFloat(op.Fee),
        feeCurrency: op.FeeCurrency,
        asset: op.Symbol,
        action: op.Action.toUpperCase(),
        gross:
          Math.round(
            (parseFloat(op.Fee) +
              parseFloat(op.Price) * parseFloat(op.Volume)) *
              100
          ) / 100,
        txId
      });
    }
  }

  actions.merge("exchangeTrades", mappedData);
};

// function ExchangeTransaction(tx) {
//   Object.assign(this, tx);
//   this.timestamp = parseInt(tx.timestamp);
//   this.date = new Date(this.timestamp * 1000).toISOString().slice(2, 10);
//   this.amount = parseFloat(this.amount);
//   this.price = parseFloat(this.price);
//   this.fee = parseFloat(this.fee);
//   this.gross = parseFloat(this.gross);
//   this.timestamp = parseInt(tx.timestamp);
// }

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
    align: "right"
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
