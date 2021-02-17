import axios from "axios";
import { store } from "../boot/store";

export const getTransactions = function() {
  const normalTxApiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${}&startblock=${}&endblock=99999999&sort=asc&apikey=${}`;

  //loop through "Owned accounts"
  //get normal tx's
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
