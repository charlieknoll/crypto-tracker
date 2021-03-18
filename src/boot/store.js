import Vue from "vue";
import { AddressbarColor, LocalStorage } from "quasar";
import { empty } from "../utils/stringUtil";

//Trick the linter:
let settings = {};
settings = LocalStorage.getItem("settings") ?? {};
const taxYears = [];
const currentYear = new Date().getFullYear();
const startYear = settings.startYear ?? 2013;
for (let i = startYear; i <= currentYear; i++) {
  taxYears.push(i);
}
taxYears.push("All");
if (!settings.apikey) settings.apikey = process.env.ETHERSCAN_API_KEY;
if (settings.trackSpentTokens == undefined) settings.trackSpentTokens = true;

const _store = Vue.observable({
  settings,
  //start old settings
  // apikey: LocalStorage.getItem("apikey") ?? process.env.ETHERSCAN_API_KEY,
  // cbpApikey:
  //   LocalStorage.getItem("cbpApikey") ?? process.env.COINBASE_PRO_API_KEY,
  // cbpSecret:
  //   LocalStorage.getItem("cbpSecret") ?? process.env.COINBASE_PRO_API_SECRET,
  // cbpPassphrase:
  //   LocalStorage.getItem("cbpPassphrase") ??
  //   process.env.COINBASE_PRO_PASSPHRASE,
  // startYear,
  // baseCurrencies: LocalStorage.getItem("baseCurrencies") ?? "",
  // trackedTokens: LocalStorage.getItem("trackedTokens") ?? "",
  // trackSpentTokens: LocalStorage.getItem("trackSpentTokens") ?? true,
  //end old settings
  assets: [],
  selectedAssets: [],
  selectedAccounts: [],
  accounts: [],
  taxYears,
  importing: false,
  pricesNeedsBackup: LocalStorage.getItem("pricesNeedsBackup") ?? false,
  addressesNeedsBackup: LocalStorage.getItem("addressesNeedsBackup") ?? false,
  settingsNeedsBackup: LocalStorage.getItem("settingsNeedsBackup") ?? false,
  addresses: LocalStorage.getItem("addresses") ?? [],
  openingPositions: LocalStorage.getItem("openingPositions") ?? [],
  offchainTransfers: LocalStorage.getItem("offchainTransfers") ?? [],
  exchangeTrades: LocalStorage.getItem("exchangeTrades") ?? [],
  taxYear: LocalStorage.getItem("taxYear") ?? 2020,
  onLine: navigator.onLine,
  logs: [],
  validApikey: function() {
    return !empty(this.settings.apikey);
  }
});
_store.updated = true;
export const store = _store;
window.ononline = () => (store.onLine = true);
window.onoffline = () => (store.onLine = false);
Vue.prototype.$store = store;
