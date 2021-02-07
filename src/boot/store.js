import Vue from "vue";
import { AddressbarColor, LocalStorage } from "quasar";
import { empty } from "../utils/stringUtil";

import Address from "../models/address";

export const store = Vue.observable({
  apikey: LocalStorage.getItem("apikey") ?? process.env.ETHERSCAN_API_KEY,
  autoImport: LocalStorage.getItem("autoImport") ?? false,
  addresses: LocalStorage.getItem("addresses").map(a => new Address(a)) ?? [],

  onLine: navigator.onLine,
  logs: [],
  validApikey: function() {
    return !empty(this.apikey);
  }
});
window.ononline = () => (store.onLine = true);
window.onoffline = () => (store.onLine = false);

Vue.prototype.$store = store;
