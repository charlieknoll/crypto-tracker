let exchangeTxs = require("../data/exchangetxs.json").result;

function ExchangeTransaction(tx) {
  Object.assign(this, tx);
  this.timestamp = parseInt(tx.timestamp);
  this.date = new Date(this.timestamp * 1000).toISOString().slice(2, 10);
  this.amount = parseFloat(this.amount);
  this.price = parseFloat(this.price);
  this.fee = parseFloat(this.fee);
  this.gross = parseFloat(this.gross);
  this.timestamp = parseInt(tx.timestamp);
}

export const exchangeHistory = function() {
  const mappedTxs = [];

  for (const t of exchangeTxs) {
    mappedTxs.push(new ExchangeTransaction(t, 0));
  }

  return mappedTxs;
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
