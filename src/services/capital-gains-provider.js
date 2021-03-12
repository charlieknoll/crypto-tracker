import { getChainTransactions } from "./chain-tx-provider";
import { getTokenTransactions } from "./token-tx-provider";
import { getExchangeTrades } from "./exchange-tx-provider";
import { actions } from "../boot/actions";
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
  sellTxs = sellTxs.map(tx => {
    const sellTx = Object.assign({}, tx);
    sellTx.account = tx.fromName;
    sellTx.amount = tx.amount + tx.fee;
    sellTx.fee = 0.0;
    sellTx.action = "SPEND:" + (tx.action ?? tx.toAccount.name);
    return sellTx;
  });

  let feeTxs = chainTxs.filter(
    tx =>
      tx.fee > 0.0 &&
      ((tx.toAccount.type != "Spending" && tx.fromName != "GENESIS") ||
        tx.isError)
  );

  //TODO map ethGasFee to amount, fee = 0.0, asset = ETH
  feeTxs = feeTxs.map(tx => {
    const feeTx = Object.assign({}, tx);
    feeTx.timestamp = tx.timestamp - 1;
    feeTx.amount = tx.ethGasFee;
    feeTx.fee = 0.0;
    feeTx.gross = tx.fee;
    feeTx.action = tx.isError
      ? "ERROR FEE"
      : tx.methodName == "TRANSFER"
      ? "TRANSFER FEE"
      : tx.toAccount.type == "Token"
      ? "TOKEN FEE"
      : "FEE";
    feeTx.account = tx.fromName;
    return feeTx;
  });

  let offChainFeeTxs = offchainTransfers.filter(tx => tx.transferFee > 0.0);
  const _offChainFeeTxs = [];
  for (const tx of offChainFeeTxs) {
    if (tx.transferFeeCurrency != "USD") {
      tx.price = await getPrice(tx.transferFeeCurrency, tx.date);
      tx.gross = tx.transferFee * tx.price;
      tx.amount = tx.transferFee;
      tx.action = "FEE";
      tx.fee = 0.0;
      tx.asset = tx.transferFeeCurrency;
      _offChainFeeTxs.push(tx);
    }
  }

  let _sellTokenTxs = tokenTxs.filter(
    tx => tx.action.includes("SELL") && tx.displayAmount != 0.0
  );
  _sellTokenTxs = _sellTokenTxs.map(tx => {
    const sellTx = Object.assign({}, tx);
    sellTx.account = tx.fromAccount.name;
    sellTx.amount = tx.displayAmount;
    return sellTx;
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
  buyTxs = buyTxs.map(tx => {
    const buyTx = Object.assign({}, tx);
    buyTx.account = tx.fromName;
    buyTx.amount = tx.amount + tx.fee;
    buyTx.fee = 0.0;
    buyTx.action = "INCOME:" + (tx.action ?? tx.fromName);
    return buyTx;
  });

  let _buyTokenTxs = tokenTxs.filter(
    tx =>
      (tx.action.includes("BUY") || tx.action.includes("INCOME")) &&
      tx.displayAmount != 0.0
  );
  _buyTokenTxs = _buyTokenTxs.map(tx => {
    const buyTx = Object.assign({}, tx);
    buyTx.account = tx.toAccount.name;
    buyTx.amount = tx.displayAmount;
    return buyTx;
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
  let tokenTxs = await getTokenTransactions();
  const exchangeTrades = await getExchangeTrades();
  const openingPositions = (await actions.getData("openingPositions")) ?? [];
  const offchainTransfers = (await actions.getData("offchainTransfers")) ?? [];
  tokenTxs = tokenTxs.filter(tx => tx.tracked);
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
      const remainingAmount = tx.amount - tx.allocatedAmount;
      const allocatedAmount =
        remainingAmount <= buyTx.amount - buyTx.disposedAmount
          ? remainingAmount
          : buyTx.amount - buyTx.disposedAmount;
      buyTx.disposedAmount += allocatedAmount;
      tx.allocatedAmount += allocatedAmount;
      //TODO determine long vs short
      const daysHeld =
        (new Date(tx.date).getTime() - new Date(buyTx.date).getTime()) /
        1000 /
        60 /
        60 /
        24;
      const gain =
        (allocatedAmount / tx.amount) * tx.proceeds -
        (allocatedAmount / buyTx.amount) * buyTx.cost;

      if (daysHeld > 365) {
        tx.longTermGain += gain;
        tx.longLots += 1;
      } else {
        tx.shortTermGain += gain;
        tx.shortLots += 1;
      }
      i++;
      buyTx = buyTxs.find(
        btx => btx.asset == tx.asset && btx.disposedAmount < btx.amount
      );
      runningGain += gain;
      tx.runningGain = runningGain;
    }
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
    align: "right",
    format: (val, row) => `${(parseFloat(val) ?? 0.0).toFixed(4)}`
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
    field: "longTermGain",
    align: "right",
    format: (val, row) => `$${(val ?? 0.0).toFixed(2)}`
  },
  {
    name: "longLots",
    label: "L Lots",
    field: "longLots",
    align: "right"
  },
  {
    name: "shortLots",
    label: "S Lots",
    field: "shortLots",
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
