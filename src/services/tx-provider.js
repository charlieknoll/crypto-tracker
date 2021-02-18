import { LocalStorage } from "quasar";
import { store } from "../boot/store";
import { ethers } from "ethers";
import { getPrice } from "../services/price-provider";
import { actions } from "../boot/actions";
const BigNumber = ethers.BigNumber;
import getMethodName from "./methods";

function MappedTransaction(tx) {
  this.tx = tx;
  this.init = async function() {
    const tx = this.tx;
    actions.addImportedAddress({ address: tx.to });
    actions.addImportedAddress({ address: tx.from });
    this.hash = tx.hash.toLowerCase();
    this.txId = tx.hash.substring(0, 8);
    const toAccount = store.addresses.find(
      a => a.address.toLowerCase() == tx.to.toLowerCase()
    );
    this.toName = toAccount ? toAccount.name : tx.to.substring(0, 8);

    const fromAccount = store.addresses.find(
      a => a.address.toLowerCase() == tx.from.toLowerCase()
    );
    this.fromName = fromAccount ? fromAccount.name : tx.from.substring(0, 8);
    this.fromAccount = fromAccount;
    this.toAccount = toAccount;
    this.amount = ethers.utils.formatEther(BigNumber.from(tx.value)) + " ETH";
    this.methodName = getMethodName(tx.input);
    //TODO handle income and spending if necessary
    if (this.methodName == "") this.methodName = "TRANSFER";

    //this.timestamp = new Date(parseInt(tx.timeStamp) * 1000).toUTCString(); //new Date(parseInt(tx.timestamp));
    this.timestamp = parseInt(tx.timeStamp);
    this.date = new Date(this.timestamp * 1000).toISOString().slice(2, 10);
    //Determine if it is INCOME (curve redemption), SPEND (GitCoin), EXPENSE, BUY, SELL
    this.price = await getPrice("ETH", this.date);
    this.fee =
      Math.round(
        ethers.utils.formatEther(
          BigNumber.from(tx.gasUsed)
            .mul(BigNumber.from(tx.gasPrice))
            .mul(BigNumber.from(Math.round(parseFloat(this.price) * 100)))
        )
      ) / 100;
  };
}
export const processChainTransactionData = async function(data) {
  const mappedTxs = [];
  for (const t of data) {
    const tx = new MappedTransaction(t);
    await tx.init();
    mappedTxs.push(tx);
  }
  actions.merge("chainTransactions", mappedTxs);
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
    align: "right"
  },
  {
    name: "price",
    label: "price",
    field: "price",
    align: "right"
  },
  {
    name: "fee",
    label: "fee",
    field: "fee",
    align: "right",
    format: (val, row) => `$${val}`
  },
  {
    name: "error",
    label: "error",
    field: "isError"
  }
];
