import { getChainTransactions } from "./chain-tx-provider";
import { getTokenTransactions } from "./token-tx-provider";
import { getExchangeTrades } from "./exchange-tx-provider";
import { actions } from "../boot/actions";
import { getPrice } from "./price-provider";
import { formatCurrency, formatDecimalNumber } from "../utils/moneyUtils";
async function getSellTxs(
  chainTxs,
  tokenTxs,
  exchangeTrades,
  offchainTransfers
) {
  let sellTxs = chainTxs.filter(
    tx => (tx.taxCode == "SPENDING" || tx.taxCode == "EXPENSE") && !tx.isError
  );
  sellTxs = sellTxs.map(tx => {
    const sellTx = Object.assign({}, tx);
    sellTx.account = tx.fromName;
    sellTx.amount = tx.amount + tx.fee;
    sellTx.fee = 0.0;
    tx.action = tx.methodName;
    return sellTx;
  });

  let feeTxs = chainTxs.filter(
    tx =>
      tx.fee > 0.0 &&
      ((tx.taxCode != "SPENDING" &&
        tx.taxCode != "EXPENSE" &&
        tx.fromName != "GENESIS") ||
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
      : tx.taxCode == "TRANSFER" && tx.toAccount.type != "Token"
      ? "TRANSFER FEE"
      : tx.taxCode == "TRANSFER" && tx.toAccount.type == "Token"
      ? "TF:" + toAccount.name
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
      tx.action = "TRANSFER FEE";
      tx.fee = 0.0;
      tx.asset = tx.transferFeeCurrency;
      _offChainFeeTxs.push(tx);
    }
  }

  let _sellTokenTxs = tokenTxs.filter(
    tx => tx.taxCode == "SELL" && tx.displayAmount != 0.0
  );
  _sellTokenTxs = _sellTokenTxs.map(tx => {
    const sellTx = Object.assign({}, tx);
    sellTx.account = tx.fromAccount.name;
    sellTx.amount = tx.displayAmount;
    sellTx.action = tx.taxCode;
    return sellTx;
  });

  sellTxs = sellTxs.concat(feeTxs);
  sellTxs = sellTxs.concat(_offChainFeeTxs);
  sellTxs = sellTxs.concat(_sellTokenTxs);
  sellTxs = sellTxs.concat(exchangeTrades.filter(tx => tx.action == "SELL"));
  //TODO add transfer fees to sell txs

  sellTxs = sellTxs.map(tx => {
    tx.proceeds = tx.gross - tx.fee;
    tx.allocatedAmount = 0.0;
    tx.feeAllocatedAmount = 0.0;
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
  let buyTxs = chainTxs.filter(tx => tx.taxCode == "INCOME" && tx.amount > 0.0);
  buyTxs = buyTxs.map(tx => {
    const buyTx = Object.assign({}, tx);
    buyTx.account = tx.fromName;
    buyTx.amount = tx.amount + tx.fee;
    buyTx.fee = 0.0;
    return buyTx;
  });

  let _buyTokenTxs = tokenTxs.filter(
    tx =>
      (tx.taxCode == "BUY" || tx.taxCode == "INCOME") && tx.displayAmount != 0.0
  );
  _buyTokenTxs = _buyTokenTxs.map(tx => {
    const buyTx = Object.assign({}, tx);
    buyTx.account = tx.toAccount.name;
    buyTx.amount = tx.displayAmount;
    return buyTx;
  });
  buyTxs = buyTxs.concat(_buyTokenTxs);
  let _buyExchangeTrades = exchangeTrades.filter(tx => tx.action == "BUY");
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
function allocateProceeds(tx, buyTxs) {
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
  }
}
function allocateTransferFee(tx, buyTxs) {
  let buyTx = buyTxs.find(
    btx => btx.asset == tx.asset && btx.disposedAmount < btx.amount
  );
  //TODO adjust cost basis for fees from sale tx
  let i = 0;

  //reset allocated
  tx.allocatedAmount = 0.0;
  while (tx.allocatedAmount != tx.amount && buyTx && i < 100) {
    const remainingAmount = tx.amount - tx.allocatedAmount;
    const allocatedAmount =
      remainingAmount <= buyTx.amount - buyTx.disposedAmount
        ? remainingAmount
        : buyTx.amount - buyTx.disposedAmount;

    const allocatedProceeds = (allocatedAmount / tx.amount) * tx.proceeds;

    tx.allocatedAmount += allocatedAmount;

    buyTx.cost += allocatedProceeds;

    i++;
    buyTx = buyTxs.find(
      btx =>
        btx.asset == tx.asset &&
        btx.disposedAmount < btx.amount &&
        btx.txId != buyTx.txId
    );
  }
}

function allocateTokenFee(tx, buyTxs) {
  let buyTx = buyTxs.find(
    btx => btx.asset == tx.toAccount.name && btx.disposedAmount < btx.amount
  );
  //TODO adjust cost basis for fees from sale tx
  let i = 0;

  //reset allocated
  tx.allocatedAmount = 0.0;
  while (tx.allocatedAmount != tx.amount && buyTx && i < 100) {
    const remainingAmount = tx.amount - tx.allocatedAmount;
    const allocatedAmount =
      remainingAmount <= buyTx.amount - buyTx.disposedAmount
        ? remainingAmount
        : buyTx.amount - buyTx.disposedAmount;

    const allocatedProceeds = (allocatedAmount / tx.amount) * tx.proceeds;

    tx.allocatedAmount += allocatedAmount;

    buyTx.cost += allocatedProceeds;

    i++;
    buyTx = buyTxs.find(
      btx =>
        btx.asset == tx.toAccount.name &&
        btx.disposedAmount < btx.amount &&
        btx.txId != buyTx.txId
    );
  }
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

  for (const tx of sellTxs) {
    allocateProceeds(tx, buyTxs);
    //IMPORTANT, TRANSFER FEES timestamp adjusted -1 so the fees get applied first
    if (tx.action == "TRANSFER FEE") {
      allocateTransferFee(tx, buyTxs);
    }
    //Only increase cost basis for tx's that did not transfer tokens (approve), token transfers, buys and
    //sells will be applied to the token cost basis
    if (
      tx.action == "TOKEN FEE" &&
      tokenTxs.findIndex(tt => tt.parentTx.hash == tx.hash) == -1
    ) {
      allocateTokenFee(tx, buyTxs);
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
    format: (val, row) => formatDecimalNumber(val, 4)
  },
  {
    name: "fee",
    label: "Fee",
    field: "fee",
    align: "right",
    format: (val, row) => formatCurrency(val)
  },
  {
    name: "gross",
    label: "Gross",
    field: "gross",
    align: "right",
    format: (val, row) => formatCurrency(val)
  },
  {
    name: "proceeds",
    label: "Proceeds",
    field: "proceeds",
    align: "right",
    format: (val, row) => formatCurrency(val)
  },
  {
    name: "shortTermGain",
    label: "Short Term Gain",
    field: "shortTermGain",
    align: "right",
    format: (val, row) => formatCurrency(val)
  },

  {
    name: "longTermGain",
    label: "Long Term Gain",
    field: "longTermGain",
    align: "right",
    format: (val, row) => formatCurrency(val)
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
  }
];
