import axios from "axios";
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { throttle } from "../utils/cacheUtils";
let lastRequestTime = 0;

export const getTransactions = async function() {
  const ownedAccounts = store.addresses.filter(a => a.type == "Owned");

  //loop through "Owned accounts"
  const currentBlock = await getCurrentBlock();
  for (const oa of ownedAccounts) {
    //get normal tx's
    lastRequestTime = await throttle(lastRequestTime, 500);
    const normalTxApiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${oa.address}&startblock=${oa.lastBlockSync}&endblock=99999999&sort=asc&apikey=${store.apikey}`;
    try {
      const result = await axios.get(normalTxApiUrl);
      if (
        result.data.status != "1" &&
        result.data.message != "No transactions found"
      ) {
        throw new Error("Invalid return status: " + result.data.message);
      }
      const txs = result.data.result;
      for (const tx of txs) {
        if (tx.timeStamp) {
          tx.timestamp = parseInt(tx.timeStamp);
        }
      }

      //process txs
      actions.mergeArrayToData(
        "chainTransactions",
        txs,
        (a, b) => a.hash == b.hash
      );

      //setLastBlockSync
      oa.lastBlockSync = currentBlock;
    } catch (err) {
      console.log("error getting txs: ", err);
    }
  }
  actions.setObservableData("addresses", store.addresses);
  //send to tx provider
  //get tokenTx's
  //send to tokenTx provider
};
export const getCurrentBlock = async function() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const apikey = store.apikey;

  const apiUrl = `https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before&apikey=${apikey}`;
  try {
    const result = await axios.get(apiUrl);
    if (result.data.status != "1")
      throw new Error("Invalid return status: " + result.data.message);
    const currentBlock = parseInt(result.data.result);

    return currentBlock;
  } catch (err) {
    console.log("error getting current block: ", err);
  }
};
