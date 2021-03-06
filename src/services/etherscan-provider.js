import axios from "axios";
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { throttle } from "../utils/cacheUtils";
let lastRequestTime = 0;

async function getTokenTransactions(oa) {
  const tokenTxApiUrl =
    "https://api.etherscan.io/api?module=account&action=tokentx&address=" +
    `${oa.address}&startblock=${oa.lastBlockSync}&endblock=99999999&sort=asc&apikey=${store.apikey}`;

  const result = await axios.get(tokenTxApiUrl);
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
  return txs;
}
async function getAccountTransactions(oa) {
  const normalTxApiUrl =
    "https://api.etherscan.io/api?module=account&action=txlist&address=" +
    `${oa.address}&startblock=${oa.lastBlockSync}&endblock=99999999&sort=asc&apikey=${store.apikey}`;

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
  //There will be multiple txs for transfers between owned accounts so tx's must be merged
  actions.mergeArrayToData(
    "chainTransactions",
    txs,
    (a, b) => a.hash == b.hash
  );
}

async function getAccountInternalTransactions(oa) {
  const internalTxApiUrl =
    "https://api.etherscan.io/api?module=account&action=txlistinternal&address=" +
    `${oa.address}&startblock=${oa.lastBlockSync}&endblock=99999999&sort=asc&apikey=${store.apikey}`;

  const result = await axios.get(internalTxApiUrl);
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
  //There will be multiple txs for transfers between owned accounts so tx's must be merged
  actions.mergeArrayToData(
    "internalTransactions",
    txs,
    (a, b) => a.hash == b.hash
  );
}

export const getTransactions = async function() {
  const ownedAccounts = store.addresses.filter(a => a.type == "Owned");

  //loop through "Owned accounts"
  const currentBlock = await getCurrentBlock();
  let tokenTxs = [...(actions.getData("tokenTransactions") ?? [])];

  for (const oa of ownedAccounts) {
    try {
      //get normal tx's
      lastRequestTime = await throttle(lastRequestTime, 500);
      await getAccountTransactions(oa);
      lastRequestTime = await throttle(lastRequestTime, 500);
      await getAccountInternalTransactions(oa);
      lastRequestTime = await throttle(lastRequestTime, 500);
      tokenTxs = tokenTxs.concat(await getTokenTransactions(oa));
      //setLastBlockSync
      oa.lastBlockSync = currentBlock;
    } catch (err) {
      console.log("error getting txs: ", err);
    }
  }
  actions.setObservableData("addresses", store.addresses);
  tokenTxs.sort((a, b) => a.timestamp - b.timestamp);
  actions.setData("tokenTransactions", tokenTxs);
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
