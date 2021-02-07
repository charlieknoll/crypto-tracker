import { LocalStorage } from "quasar";
import { store } from "../boot/store";
import { tokenHistory } from "./token-tx-provider";
let _tokenHistory = tokenHistory();

import { history } from "./tx-provider";

import { exchangeHistory } from "./exchange-tx-provider";

function MappedTransaction(tx) {
  Object.assign(this, tx);
}

export const gainsHistory = function() {
  //Add all SELL transactions to an array and sort by timestamp

  //start with tx's and insert any token txs

  //TODO map to common field names
  let mappedTxs = history().filter(tx => tx.methodName.includes("SELL"));

  _tokenHistory = _tokenHistory.filter(tx => tx.action.includes("SELL"));
  mappedTxs = mappedTxs.concat(_tokenHistory);
  mappedTxs = mappedTxs.concat(
    exchangeHistory().filter(tx => tx.action.includes("SELL"))
  );
  mappedTxs = mappedTxs.sort((a, b) => a.timestamp < b.timestamp);
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
    name: "account",
    label: "Account",
    field: "account",
    align: "left"
  },
  {
    name: "txId",
    label: "Id",
    field: "txId",
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
    name: "shortTermGain",
    label: "Short Term Gain",
    field: "shortTermGain",
    align: "right",
    format: (val, row) => `$${(val ?? 0.0).toFixed(2)}`
  },
  {
    name: "longTermGain",
    label: "Long Term Gain",
    field: "LongTermGain",
    align: "right",
    format: (val, row) => `$${(val ?? 0.0).toFixed(2)}`
  },
  {
    name: "acquiredDate",
    label: "Acquired Date",
    field: "acquiredDate",
    align: "left"
  },
  {
    name: "unitsRemaining",
    label: "Units Remaining",
    field: "unitsRemaining",
    align: "right"
  }
];
