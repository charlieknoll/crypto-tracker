import Vue from "vue";
//import {  } from '../services/imageService'
import { LocalStorage } from "quasar";
import { store } from "./store";
import Address from "../models/address";

export const actions = {
  store: store,
  setLocalStorage: function(key, val) {
    if (val === "null" || val === null) return;
    //store[key] = val;
    Vue.set(store, key, val);
    LocalStorage.set(key, val);
  },
  merge: function(key, val) {
    const storeArray = store[key];
    const array = [...storeArray];
    //add vals with txId not in array
    for (const item of val) {
      const index = array.findIndex(v => v.txId == item.txId);
      if (index < 0) {
        array.push(item);
      } else {
        array[index] = item;
      }
    }
    //sort on timestamp
    array.sort((a, b) => a.timestamp - b.timestamp);
    //setLocalStorage
    this.setLocalStorage(key, array);
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
    this.setLocalStorage("addresses", store.addresses);
  }
};

Vue.prototype.$actions = actions;
