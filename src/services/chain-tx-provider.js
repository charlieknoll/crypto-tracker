import { store } from "../boot/store";
import { ethers } from "ethers";
import { getPrice } from "./price-provider";
import { actions } from "../boot/actions";
const BigNumber = ethers.BigNumber;
import getMethodName from "./methods";
import { LocalStorage } from "quasar";

export const ChainTransaction = function() {
  this.init = async function(tx) {
    this.toAccount = actions.addImportedAddress({ address: tx.to });
    this.fromAccount = actions.addImportedAddress({ address: tx.from });
    this.hash = tx.hash.toLowerCase();
    this.txId = tx.hash.substring(0, 8);

    this.toName = this.toAccount ? this.toAccount.name : tx.to.substring(0, 8);
    this.isError = tx.isError == "1";
    this.fromName = this.fromAccount
      ? this.fromAccount.name
      : tx.from.substring(0, 8);
    this.amount = ethers.utils.formatEther(BigNumber.from(tx.value)) + " ETH";
    this.methodName = getMethodName(tx.input);
    //TODO handle income and spending if necessary
    if (this.methodName == "") this.methodName = "TRANSFER";

    //this.timestamp = new Date(parseInt(tx.timeStamp) * 1000).toUTCString(); //new Date(parseInt(tx.timestamp));
    this.timestamp = parseInt(tx.timeStamp);
    this.date = new Date(this.timestamp * 1000).toISOString().slice(0, 10);
    //Determine if it is INCOME (curve redemption), SPEND (GitCoin), EXPENSE, BUY, SELL
    this.price = await getPrice("ETH", this.date.slice(2, 10));
    this.fee =
      Math.round(
        ethers.utils.formatEther(
          BigNumber.from(tx.gasUsed)
            .mul(BigNumber.from(tx.gasPrice))
            .mul(BigNumber.from(Math.round(parseFloat(this.price) * 100)))
        )
      ) / 100;
    return this;
  };
};
export const getChainTransactions = async function() {
  const data = LocalStorage.getItem("chainTransactions") ?? [];
  const mappedTxs = [];
  for (const t of data) {
    const tx = new ChainTransaction();
    await tx.init(t);
    mappedTxs.push(tx);
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
    name: "from",
    label: "From",
    field: "fromName",
    align: "left"
  },
  {
    name: "to",
    label: "To",
    field: "toName",
    align: "left"
  },
  {
    name: "method",
    label: "Method",
    field: "methodName",
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
    name: "price",
    label: "price",
    field: "price",
    align: "right",
    format: (val, row) => `$${val ? parseFloat(val).toFixed(2) : "0.00"}`
  },
  {
    name: "fee",
    label: "fee",
    field: "fee",
    align: "right",
    format: (val, row) => `$${val ? parseFloat(val).toFixed(2) : "0.00"}`
  },
  {
    name: "error",
    label: "",
    field: "isError",
    align: "left"
  }
];
