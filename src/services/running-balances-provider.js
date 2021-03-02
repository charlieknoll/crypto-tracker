import { getChainTransactions } from "./chain-tx-provider";
import { getTokenTransactions } from "./token-tx-provider";
import { getExchangeTrades } from "./exchange-tx-provider";
import { actions } from "../boot/actions";

export const getRunningBalances = async function() {
  let mappedData = [];
  const openingPositions = (await actions.getData("openingPositions")) ?? [];
  const offchainTransfers = (await actions.getData("offchainTransfers")) ?? [];
  const chainTransactions = await getChainTransactions();
  const tokenTransactions = await getTokenTransactions();
  const exchangeTrades = await getExchangeTrades();

  for (const tx of openingPositions) {
    mappedData.push({
      txId: "opening-" + tx.txId,
      timestamp: tx.timestamp,
      account: tx.account,
      date: tx.date,
      amount: tx.amount,
      asset: tx.asset,
      price: tx.price,
      type: "Open"
    });
  }
  for (const tx of offchainTransfers) {
    mappedData.push({
      txId: "Tr-I-" + tx.txId,
      timestamp: tx.timestamp,
      account: tx.toAccount,
      date: tx.date,
      amount: tx.amount,
      asset: tx.asset,
      type: "Transfer In"
    });
    mappedData.push({
      txId: "Tr-O-" + tx.txId,
      timestamp: tx.timestamp,
      account: tx.fromAccount,
      date: tx.date,
      amount: -tx.amount,
      asset: tx.asset,
      type: "Transfer Out"
    });
  }
  for (const tx of chainTransactions) {
    if (tx.fromName == "GENESIS") continue;
    if (tx.toAccount.type.toLowerCase().includes("owned")) {
      mappedData.push({
        txId: "Ch-I-" + tx.txId,
        timestamp: tx.timestamp,
        account: tx.toAccount.name,
        date: tx.date,
        amount: tx.isError ? 0.0 : tx.ethAmount,
        asset: "ETH",
        price: tx.price,
        type: "Chain-in",
        hash: tx.hash
      });
    }
    if (tx.fromAccount.type.toLowerCase().includes("owned")) {
      mappedData.push({
        txId: "Ch-O-" + tx.txId,
        timestamp: tx.timestamp,
        account: tx.fromAccount.name,
        date: tx.date,
        amount: tx.isError ? -tx.ethGasFee : -tx.ethAmount - tx.ethGasFee,
        asset: "ETH",
        price: tx.price,
        type: "Chain-out",
        hash: tx.hash
      });
    }
  }
  const _tokenTransactions = tokenTransactions.filter(tt => tt.tracked);
  for (const tx of _tokenTransactions) {
    if (tx.isError) continue;
    if (tx.toAccount.name.toLowerCase().includes("owned")) {
      mappedData.push({
        txId: "Tk-I-" + tx.txId,
        timestamp: tx.timestamp,
        account: tx.toAccount.name,
        date: tx.date,
        amount: tx.decimalAmount,
        asset: tx.tokenSymbol,
        price: tx.price,
        type: "Token-in",
        hash: tx.hash
      });
    }
    if (tx.fromAccount.name.toLowerCase().includes("owned")) {
      mappedData.push({
        txId: "Tk-O-" + tx.txId,
        timestamp: tx.timestamp,
        account: tx.fromAccount.name,
        date: tx.date,
        amount: -tx.decimalAmount,
        asset: tx.tokenSymbol,
        price: tx.price,
        type: "Token-out",
        hash: tx.hash
      });
    }
  }
  for (const tx of exchangeTrades) {
    mappedData.push({
      txId:
        "Ex-" + (tx.action == "SELL" ? "O-" : "I-") + tx.txId.substring(0, 13),
      timestamp: tx.timestamp,
      account: tx.account,
      date: tx.date,
      amount: tx.action == "SELL" ? -tx.amount : tx.amount,
      asset: tx.asset,
      price: tx.price,
      type: tx.action
    });
  }
  mappedData = mappedData.sort((a, b) => a.timestamp - b.timestamp);
  //Sort by timestamp
  //TODO set running balances
  const assets = [];
  const accountAssets = [];

  for (const tx of mappedData) {
    let asset = assets.find(a => a.symbol == tx.asset);
    if (!asset) {
      asset = { symbol: tx.asset, amount: 0.0 };
      assets.push(asset);
    }
    asset.amount += tx.amount;
    tx.runningBalance = asset.amount;
    asset.endingTx = tx;
    let accountAsset = accountAssets.find(
      a => a.symbol == tx.asset && a.account == tx.account
    );
    if (!accountAsset) {
      accountAsset = { symbol: tx.asset, amount: 0.0, account: tx.account };
      accountAssets.push(accountAsset);
    }
    accountAsset.amount += tx.amount;
    accountAsset.endingTx = tx;
    tx.runningAccountBalance = accountAsset.amount;
  }
  for (const aa of accountAssets) {
    aa.endingTx.endingAccount = true;
  }
  for (const aa of assets) {
    aa.endingTx.ending = true;
  }
  return mappedData;
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
    name: "type",
    label: "Type",
    field: "type",
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
    name: "runningAccountBalance",
    label: "Running Acct Balance",
    field: "runningAccountBalance",
    align: "right",
    format: (val, row) => `${(val ?? 0.0).toFixed(4)}`
  },
  {
    name: "runningBalance",
    label: "Running Balance",
    field: "runningBalance",
    align: "right",
    format: (val, row) => `${(val ?? 0.0).toFixed(4)}`
  }
];
