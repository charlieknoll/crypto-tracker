//import {  } from '../services/imageService'
import { LocalStorage } from "quasar";
import { store } from "./store";
import Address from "../models/address";
import { boot } from "quasar/wrappers";
//import { set } from "vue";
const actions = {
  store: store,
  setObservableData: function (key, val) {
    if (val === "null" || val === null || val === undefined) return;
    //store[key] = val;
    //TODO fix Vue.set
    //Vue.set(store, key, val);
    store[key] = val;
    LocalStorage.set(key, val);
  },
  setData: function (key, val) {
    if (val === "null" || val === null) return;
    LocalStorage.set(key, val);
  },
  getData: function (key) {
    return LocalStorage.getItem(key);
  },
  getBaseCurrencies: function () {
    if (!store.settings.baseCurrencies) return [];
    return store.settings.baseCurrencies.replaceAll(" ", "").split(",");
  },
  refreshStoreData: function (key) {
    const val = this.getData(key);
    this.setData(key, val);
  },
  mergeArrayToData: function (key, val, compareFunc) {
    const array = LocalStorage.getItem(key) ?? [];
    //delete all existing between timestamps?
    for (const v of val) {
      const dv = array.find(function (a) {
        return compareFunc(a, v);
      });
      if (!dv) {
        array.push(v);
      } else {
        Object.assign(dv, v);
      }
    }

    //sort on timestamp
    array.sort((a, b) => a.timestamp - b.timestamp);
    //setLocalStorage
    LocalStorage.set(key, array);
  },
  addImportedAddress: function (a) {
    let address = store.addresses.find(
      (s) => s.address.toLowerCase() === a.address.toLowerCase()
    );
    if (address) return address;
    address = new Address(a);
    address.imported = true;
    address.name = a.address.substring(0, 8);
    address.type = "";
    store.addresses.push(address);
    this.setData("addresses", store.addresses);
    return address;
  },
  markUpdated: function () {
    const timestamp = new Date().getTime() - 1000;
    this.setData("lastSyncTimestamp", timestamp);
    return timestamp;
  },
};
export default boot(({ app }) => {
  app.config.globalProperties.$actions = actions;
});

export { actions };
// let lastSyncTimestamp = actions.markUpdated();
// const interval = setInterval(() => {
//   const _lastSyncTimestamp = actions.getData("lastSyncTimestamp");
//   if (lastSyncTimestamp < _lastSyncTimestamp) {
//     lastSyncTimestamp = _lastSyncTimestamp;
//     if (store.onload) {
//       store.onload();
//     }
//   }
// }, 500);
