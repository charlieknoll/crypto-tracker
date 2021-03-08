import { ethers } from "ethers";
import { getPrice } from "./price-provider";
import { actions } from "../boot/actions";
const BigNumber = ethers.BigNumber;
import getMethodName from "./methods";
import { LocalStorage } from "quasar";
import { weiToMoney, bnToFloat } from "src/utils/moneyUtils";

export const ChainTransaction = function() {
  this.init = async function(tx) {
    this.toAccount = actions.addImportedAddress({ address: tx.to });
    this.type = this.toAccount.type;
    this.fromAccount = actions.addImportedAddress({ address: tx.from });
    this.hash = tx.hash.toLowerCase();
    this.txId = tx.hash.substring(0, 8);
    if (tx.seqNo) {
      this.hash += "-" + tx.seqNo;
      this.txId += "-" + tx.seqNo;
    }
    this.asset = "ETH";
    this.toName = this.toAccount ? this.toAccount.name : tx.to.substring(0, 8);
    this.isError = tx.isError == "1";
    this.fromName = this.fromAccount
      ? this.fromAccount.name
      : tx.from.substring(0, 8);
    this.ethAmount = bnToFloat(BigNumber.from(tx.value), 18);
    this.amount = ethers.utils.formatEther(BigNumber.from(tx.value)) + " ETH";
    this.methodName = getMethodName(tx.input);
    //TODO handle income and spending if necessary
    if (this.methodName == "") this.methodName = "TRANSFER";

    //this.timestamp = new Date(parseInt(tx.timeStamp) * 1000).toUTCString(); //new Date(parseInt(tx.timestamp));
    this.timestamp = parseInt(tx.timeStamp);
    this.date = new Date(this.timestamp * 1000).toISOString().slice(0, 10);
    //Determine if it is INCOME (curve redemption), SPEND (GitCoin), EXPENSE, BUY, SELL
    this.price = await getPrice("ETH", this.date);
    this.gross = weiToMoney(BigNumber.from(tx.value), this.price);
    this.ethGasFee =
      tx.gasUsed == "0"
        ? 0.0
        : bnToFloat(
            BigNumber.from(tx.gasUsed).mul(BigNumber.from(tx.gasPrice)),
            18
          );
    this.fee =
      tx.gasUsed == "0"
        ? 0.0
        : weiToMoney(
            BigNumber.from(tx.gasUsed).mul(BigNumber.from(tx.gasPrice)),
            this.price
          );

    return this;
  };
};
export const getChainTransactions = async function() {
  const data = LocalStorage.getItem("chainTransactions") ?? [];
  actions.refreshStoreData("addresses");
  const internalTransactions =
    LocalStorage.getItem("internalTransactions") ?? [];
  let hash;
  let seqNo = 0;
  for (const it of internalTransactions) {
    if (it.hash != hash) seqNo = 0;
    hash = it.hash;
    seqNo += 1;
    it.seqNo = seqNo;
  }
  data.push(...internalTransactions);
  data.sort((a, b) => a.timestamp - b.timestamp);
  const mappedTxs = [];
  for (const t of data) {
    const tx = new ChainTransaction();
    //console.log(t.hash);
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
    format: (val, row) => `${(parseFloat(val) ?? 0.0).toFixed(4)}`
  },
  {
    name: "price",
    label: "ETH Price",
    field: "price",
    align: "right",
    format: (val, row) => `$${val ? parseFloat(val).toFixed(2) : "0.00"}`
  },
  {
    name: "fee",
    label: "Fee",
    field: "fee",
    align: "right",
    format: (val, row) => `$${val ? parseFloat(val).toFixed(2) : "0.00"}`
  },
  {
    name: "gross",
    label: "Gross",
    field: "gross",
    align: "right",
    format: (val, row) => `$${val ? parseFloat(val).toFixed(2) : "0.00"}`
  },
  {
    name: "error",
    label: "Error",
    field: "isError",
    align: "left",
    format: (val, row) => `${val ? "ERROR" : ""}`,
    style: "color: red; font-weight: bold;"
  }
];
