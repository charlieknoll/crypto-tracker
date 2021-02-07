import Vue from "vue";
//import {  } from '../services/imageService'
import { LocalStorage } from "quasar";
import { store } from "./store";
import Address from "../models/address";

export const actions = {
  store: store,
  setLocalStorage: function(key, val) {
    if (val === "null" || val === null) return;
    store[key] = val;
    LocalStorage.set(key, val);
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
