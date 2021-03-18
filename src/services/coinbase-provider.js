import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { throttle } from "../utils/cacheUtils";
import CoinbasePro from "coinbase-pro";
let lastRequestTime = 0;

export const importTrades = async function() {
  const apikey = store.cbpApikey;
  const passphrase = store.cbpPassphrase;
  const secret = store.cbpSecret;

  const authedClient = new CoinbasePro.AuthenticatedClient(
    apikey,
    secret,
    passphrase,
    apiUrl
  );
  //get accounts
  const accounts = await authedClient.getAccounts();

  const assets = store.assets;

  //foreach tracked asset
  const trades = [];
  for (const asset of assets) {
    //get account
    const account = accounts.find(a => a.currency == asset);

    //if account get trades
    if (account) {
      const trades = await authedClient.getAccountHistory(account.id);

      //push to trades object
    }
  }
  //merge trades to data

  // actions.mergeArrayToData(
  //   "internalTransactions",
  //   txs,
  //   (a, b) => a.hash == b.hash
  // );
};
