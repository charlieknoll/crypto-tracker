import { store } from "../boot/store";
import { actions } from "../boot/actions";
import { throttle } from "../utils/cacheUtils";

import AuthenticatedClient from "./cb/clients/authenticated";
import { Notify } from "quasar";
let lastRequestTime = 0;
function mapConversions(history, account) {
  return history
    .filter(h => h.type == "conversion")
    .map(c => {
      const tx = {};
      tx.txId = c.details.conversion_id;
      const tradeDate = new Date(c.created_at.substring(0, 19));
      tx.timestamp = tradeDate.getTime() / 1000;
      tx.date = c.created_at.substring(0, 10);
      tx.account = "Coinbase Pro";
      tx.asset = account.currency;
      tx.volume = parseFloat(c.amount);
      tx.action = tx.volume > 0 ? "BUY" : "SELL";
      tx.price = 1.0;
      tx.fee = 0.0;
      tx.feeCurrency = "USD";
      tx.currency = "USD";
      return tx;
    });
}
function mapFills(fills, account) {
  return fills.map(f => {
    const tx = {};
    tx.txId = "" + f.trade_id;
    const tradeDate = new Date(f.created_at.substring(0, 19));
    tx.timestamp = tradeDate.getTime() / 1000;
    tx.date = f.created_at.substring(0, 10);
    tx.account = tx.date < "2018-06-30" ? "GDAX" : "Coinbase Pro";
    tx.asset = f.product_id.split("-")[0];
    tx.volume = parseFloat(f.size);
    tx.action = f.side.toUpperCase();
    tx.price = parseFloat(f.price);
    tx.fee = parseFloat(f.fee);
    tx.feeCurrency = f.product_id.split("-")[1];
    tx.currency = f.product_id.split("-")[1];
    return tx;
  });
}
export const importCbpTrades = async function() {
  const apikey = store.settings.cbpApikey;
  const passphrase = store.settings.cbpPassphrase;
  const secret = store.settings.cbpSecret;
  const apiUrl = window.location.origin + "/cbp-api";

  const authedClient = new AuthenticatedClient(
    apikey,
    secret,
    passphrase,
    apiUrl
  );
  let accounts;
  const productIds = actions.getData("productIds") ?? [];
  const accountHistory = actions.getData("accountHistory") ?? [];
  const trades = [];
  try {
    accounts = await authedClient.getAccounts();
    //build list of productIds using account history
    for (const account of accounts) {
      if (account.currency == "USD") continue;
      //TODO use account "after" if incremental == true
      let after = 1;
      while (after > 0) {
        let args = {};
        if (after != 1) {
          args.after = after;
        }
        lastRequestTime = await throttle(lastRequestTime, 200);
        const _history = await authedClient.getAccountHistory(account.id, args);
        for (const h of _history.filter(h => h.type == "match")) {
          //TODO set before for first record found
          if (productIds.findIndex(p => p.id == h.details.product_id) == -1) {
            productIds.push({
              id: h.details.product_id,
              before: null
            });
          }
        }
        trades.push(...mapConversions(_history, account));
        after = authedClient.after ?? 0;
      }
    }
    //productIds.push({ id: "ETH-USD" });
    for (const productId of productIds) {
      let after = 1;
      while (after > 0) {
        let args = { product_id: productId.id };
        if (after != 1) {
          args.after = after;
        }
        lastRequestTime = await throttle(lastRequestTime, 200);
        const _fills = await authedClient.getFills(args);
        trades.push(...mapFills(_fills));
        after = authedClient.after ?? 0;
      }
    }

    //Get fills using list of productIds
    //TODO check the correct amount of trades: 1556 in download, 1562 in csv files
    //1562 has 16 extra for ETH-BTC = 1546
    //Are there 10 extra in download?
    // 1 extra USDC
    console.log(trades);
  } catch (error) {
    Notify.create({
      message: error.message,
      color: "negative",
      actions: [{ label: "Dismiss", color: "white" }],
      timeout: 0
    });
    return -1;
  }
  //merge trades to data

  // actions.mergeArrayToData(
  //   "internalTransactions",
  //   txs,
  //   (a, b) => a.hash == b.hash
  // );
};
