import { LocalStorage } from "quasar";
import { store } from "../boot/store";
import { tokenHistory } from "./token-tx-provider";

import { history } from "./chain-tx-provider";

import { exchangeHistory } from "./exchange-tx-provider";

function MappedTransaction(tx) {
  Object.assign(this, tx);
}

export const gainsHistory = function() {
  //Add all SELL transactions to an array and sort by timestamp

  //start with tx's and insert any token txs

  //TODO map to common field names
  let mappedTxs = history().filter(tx => tx.methodName.includes("SELL"));

  let _tokenHistory = tokenHistory().filter(
    tx => tx.action.includes("SELL") && tx.displayAmount != 0.0
  );
  _tokenHistory = _tokenHistory.map(tx => {
    tx.asset = tx.tokenSymbol;
    tx.account = tx.fromAccount.name;
    tx.amount = tx.displayAmount;
    tx.proceeds = tx.gross - tx.fee;
    tx.allocatedAmount = 0.0;
    tx.shortTermGain = 0.0;
    tx.lots = 0;
    return tx;
  });
  mappedTxs = mappedTxs.concat(_tokenHistory);
  mappedTxs = mappedTxs.concat(
    exchangeHistory().filter(tx => tx.action.includes("SELL"))
  );
  mappedTxs.sort((a, b) => a.timestamp - b.timestamp);

  //Create BUY txs
  //TODO map buy fields on ETH tx's
  let buyTxs = history().filter(tx => tx.methodName.includes("BUY"));
  let _buyTokenHistory = tokenHistory().filter(
    tx => tx.action.includes("BUY") && tx.displayAmount != 0.0
  );
  _buyTokenHistory = _buyTokenHistory.map(tx => {
    tx.asset = tx.tokenSymbol;
    tx.account = tx.toAccount.name;
    tx.amount = tx.displayAmount;
    tx.cost = tx.gross + tx.fee;
    tx.disposedAmount = 0.0;
    return tx;
  });
  buyTxs = buyTxs.concat(_buyTokenHistory);
  let _exchangeHistory = exchangeHistory()
    .filter(tx => tx.action.includes("BUY"))
    .map(tx => {
      tx.cost = tx.gross + tx.fee;
      tx.disposedAmount = 0.0;
      return tx;
    });

  buyTxs = buyTxs.concat(_exchangeHistory);
  buyTxs.sort((a, b) => a.timestamp - b.timestamp);
  //Calc gains for each sell
  let runningGain = 0.0;
  for (const tx of mappedTxs) {
    //
    let buyTx = buyTxs.find(
      btx => btx.asset == tx.asset && btx.disposedAmount < btx.amount
    );
    let i = 0;
    while (tx.allocatedAmount != tx.amount && buyTx && i < 100) {
      const allocatedAmount =
        tx.amount <= buyTx.amount - buyTx.disposedAmount
          ? tx.amount
          : buyTx.amount - buyTx.disposedAmount;
      buyTx.disposedAmount += allocatedAmount;
      tx.allocatedAmount += allocatedAmount;
      //TODO determine long vs short
      tx.shortTermGain +=
        (allocatedAmount / tx.amount) * tx.proceeds -
        (allocatedAmount / buyTx.amount) * buyTx.cost;
      tx.lots += 1;
      i++;
      buyTx = buyTxs.find(
        btx => btx.asset == tx.asset && btx.disposedAmount < btx.amount
      );
    }
    runningGain += tx.shortTermGain;
    tx.runningGain = runningGain;
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
    name: "proceeds",
    label: "Proceeds",
    field: "proceeds",
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
    name: "runningGain",
    label: "Running Gain",
    field: "runningGain",
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
    name: "lots",
    label: "Lots",
    field: "lots",
    align: "right"
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
