import Vue from "vue";
//import {  } from '../services/imageService'
import { LocalStorage } from "quasar";
import { store } from "./store";
import Address from "../models/address";

export const actions = {
  store: store,
  setObservableData: function(key, val) {
    if (val === "null" || val === null) return;
    //store[key] = val;
    Vue.set(store, key, val);
    LocalStorage.set(key, val);
  },
  setData: function(key, val) {
    if (val === "null" || val === null) return;
    LocalStorage.set(key, val);
  },
  getData: function(key) {
    return LocalStorage.getItem(key);
  },
  mergeArrayToData: function(key, val, compareFunc) {
    const array = LocalStorage.getItem(key) ?? [];
    //delete all existing between timestamps?
    for (const v of val) {
      if (
        !array.find(function(a) {
          return compareFunc(a, v);
        })
      ) {
        array.push(v);
      }
    }
    //sort on timestamp
    array.sort((a, b) => a.timestamp - b.timestamp);
    //setLocalStorage
    LocalStorage.set(key, array);
  },
  addImportedAddress: function(a) {
    let address = store.addresses.find(
      s => s.address.toLowerCase() === a.address.toLowerCase()
    );
    if (address) return address;
    address = new Address(a);
    address.imported = true;
    address.name = a.address.substring(0, 8);
    store.addresses.push(address);
    this.setData("addresses", store.addresses);
  }
};

Vue.prototype.$actions = actions;
