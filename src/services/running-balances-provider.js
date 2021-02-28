import { actions } from "../boot/actions";
import { getPrice } from "./price-provider";
import { floatToMoney } from "../utils/moneyUtils";
import { getChainTransactions } from "./chain-tx-provider";
import { getTokenTransactions } from "./token-tx-provider";
import { getExchangeTrades } from "./exchange-tx-provider";

export const getRunningBalances = async function() {
  const mappedData = [];
  const openingPositions =
    (await this.$actions.getData("openingPositions")) ?? [];
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
      price: tx.price
    });
  }

  //Sort by timestamp
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
