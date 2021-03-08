import { getChainTransactions } from "./chain-tx-provider";
import { getTokenTransactions } from "./token-tx-provider";
import { getExchangeTrades } from "./exchange-tx-provider";
import { getOpeningPositions } from "./opening-positions-provider";
import { getOffchainTransfers } from "./offchain-transfers-provider";

import { getPrice } from "./price-provider";

async function getSellTxs(
  chainTxs,
  tokenTxs,
  exchangeTrades,
  offchainTransfers
) {
  //TODO don't include error tx's in sellTx's
  let sellTxs = chainTxs.filter(
    tx => tx.toAccount.type == "Spending" && !tx.isError
  );
  let feeTxs = chainTxs.filter(
    tx =>
      tx.fee > 0.0 &&
      tx.toAccount.type != "Spending" &&
      tx.toAccount.type != "Token"
  );
  let offChainFeeTxs = offchainTransfers.filter(tx => tx.fee > 0.0);
  _offChainFeeTxs = [];
  for (const tx of offChainFeeTxs) {
    if (tx.feeCurrency != "USD") {
      const price = await getPrice(tx.feeCurrency, tx.date);
      tx.gross = tx.transferFee * price;
      tx.action = "FEE";
      tx.fee = 0.0;
      tx.asset = tx.feeCurrency;
      _offChainFeeTxs.push(tx);
    }
  }

  //TODO map ethGasFee to amount, fee = 0.0, asset = ETH
  feeTxs = chainTxs.map(tx => {
    tx.timestamp = tx.timestamp - 1;
    tx.amount = tx.ethGasFee;
    tx.fee = 0.0;
    tx.gross = tx.fee;
    tx.action = "FEE";
  });

  let _sellTokenTxs = tokenTxs.filter(
    tx => tx.action.includes("SELL") && tx.displayAmount != 0.0
  );
  _sellTokenTxs = _sellTokenTxs.map(tx => {
    tx.account = tx.fromAccount.name;
    tx.amount = tx.displayAmount;
    return tx;
  });

  sellTxs = sellTxs.concat(feeTxs);
  sellTxs = sellTxs.concat(_offChainFeeTxs);
  sellTxs = sellTxs.concat(_sellTokenTxs);
  sellTxs = sellTxs.concat(
    exchangeTrades.filter(tx => tx.action.includes("SELL"))
  );
  //TODO add transfer fees to sell txs

  sellTxs = sellTxs.map(tx => {
    tx.proceeds = tx.gross - tx.fee;
    tx.allocatedAmount = 0.0;
    tx.shortTermGain = 0.0;
    tx.longTermGain = 0.0;
    tx.longLots = 0;
    tx.shortLots = 0;
    return tx;
  });
  sellTxs.sort((a, b) => a.timestamp - b.timestamp);
  return sellTxs;
}
function getBuyTxs(chainTxs, tokenTxs, exchangeTrades, openingPositions) {
  //Create BUY txs
  let buyTxs = chainTxs.filter(
    tx => tx.fromAccount.type == "Income" && tx.amount > 0.0
  );

  let _buyTokenTxs = tokenTxs.filter(
    tx =>
      (tx.action.includes("BUY") || tx.action.includes("INCOME")) &&
      tx.displayAmount != 0.0
  );
  _buyTokenTxs = _buyTokenTxs.map(tx => {
    tx.account = tx.toAccount.name;
    tx.amount = tx.displayAmount;
    return tx;
  });
  buyTxs = buyTxs.concat(_buyTokenTxs);
  let _buyExchangeTrades = exchangeTrades.filter(tx =>
    tx.action.includes("BUY")
  );
  buyTxs = buyTxs.concat(_buyExchangeTrades);

  buyTxs = buyTxs.concat(openingPositions);

  buyTxs = buyTxs.map(tx => {
    tx.cost = tx.gross + tx.fee;
    tx.disposedAmount = 0.0;
    return tx;
  });
  buyTxs.sort((a, b) => a.timestamp - b.timestamp);
  return buyTxs;
}
export const getCapitalGains = async function() {
  const chainTxs = await getChainTransactions();
  const tokenTxs = await getTokenTransactions();
  const exchangeTrades = await getExchangeTrades();
  const openingPositions = await getOpeningPositions();
  const offchainTransfers = await getOffchainTransfers();

  let sellTxs = await getSellTxs(
    chainTxs,
    tokenTxs,
    exchangeTrades,
    offchainTransfers
  );
  let buyTxs = getBuyTxs(chainTxs, tokenTxs, exchangeTrades, openingPositions);

  //Calc gains for each sell

  let runningGain = 0.0;
  for (const tx of sellTxs) {
    //
    let buyTx = buyTxs.find(
      btx => btx.asset == tx.asset && btx.disposedAmount < btx.amount
    );
    //TODO adjust cost basis for fees from sale tx
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
  return sellTxs;
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
