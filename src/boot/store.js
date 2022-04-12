import { LocalStorage } from "quasar";
import { empty } from "../utils/stringUtil";
import { boot } from "quasar/wrappers";
import { reactive } from "vue";
// window.Buffer = require("buffer/").Buffer;
// import { Transform } from "stream";
// window.Transform = Transform;
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
if (!settings.bscApikey) settings.bscApikey = process.env.BSCSCAN_API_KEY;
if (settings.trackSpentTokens == undefined) settings.trackSpentTokens = true;
// var tempAddresses = LocalStorage.getItem("addresses") ?? [];
// tempAddresses = tempAddresses.map((a) => {
//   if (!a.chains) a.chains = "ETH";
//   return a;
// });
// LocalStorage.set("addresses", tempAddresses);
// var data = LocalStorage.getItem("internalTransactions") ?? [];
// var data = data.map((t) => {
//   t.gasType = "ETH";
//   return t;
// });
// LocalStorage.set("internalTransactions", data);
const _store = reactive({
  settings,
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
  validApikey: function () {
    return !empty(this.settings.apikey);
  },
});
_store.updated = true;
export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$store = _store;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});
const store = _store;
export { store };
window.ononline = () => (store.onLine = true);
window.onoffline = () => (store.onLine = false);
