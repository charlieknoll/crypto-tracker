import { processOpeningPositionsFile } from "./opening-positions-provider";
import { processExchangeTradesFile } from "./exchange-tx-provider";
import { processOffchainTransfersFile } from "./offchain-transfers-provider";
const parse = require("csv-parse/lib/sync");
import Address from "../models/address";
import { actions } from "../boot/actions";
import { store } from "../boot/store";

import { Notify } from "quasar";
import address from "../models/address";

const waitFor = async function(fn, args, ms, interval) {
  const timeout = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  let timeoutCtr = 0;
  const iterations = ms / interval;

  while (timeoutCtr < iterations) {
    timeoutCtr++;
    if (await fn(...args)) return true;
    await timeout(interval);
  }
  return false;
};

function processAddressFile(content) {
  const stageOpeningData = parse(content, {
    trim: true,
    columns: true,
    skip_empty_lines: true
  });
  const addresses = stageOpeningData.map(a => new Address(a));
  actions.setObservableData("addresses", addresses);
  return addresses.length;
}
function processPricesFile(content) {
  const pricingData = parse(content, {
    trim: true,
    columns: true,
    skip_empty_lines: true
  });

  actions.setObservableData("prices", pricingData);
  return pricingData.length;
}
function processSettingsFile(content) {
  const settings = JSON.parse(content);
  store.settings = settings;
  actions.setObservableData("settings", settings);
  return 1;
}
function processAllDataFile(content) {
  const backup = JSON.parse(content);

  actions.setObservableData("taxYear", backup.taxYear);
  const addresses = backup.addresses.map(a => new Address(a));
  actions.setObservableData("addresses", addresses);
  actions.setObservableData("exchangeTrades", backup.exchangeTrades);
  actions.setData("tokenTransactions", backup.tokenTransactions);
  actions.setData("prices", backup.prices);
  actions.setData("chainTransactions", backup.chainTransactions);
  actions.setData("exchangeTransferFees", backup.exchangeTransferFees);
  actions.setObservableData("offchainTransfers", backup.offchainTransfers);
  actions.setObservableData("openingPositions", backup.openingPositions);
  actions.setObservableData("settings", backup.settings);
  return (
    addresses.length +
    backup.exchangeTrades.length +
    backup.tokenTransactions.length +
    backup.chainTransactions.length +
    backup.exchangeTransferFees.length +
    backup.offchainTransfers.length +
    backup.openingPositions.length +
    backup.prices.length
  );
}
export const processFile = function(name, content) {
  store.updated = true;
  //TODO route file to proper processor
  if (name.substring(0, 5) == "openi") {
    return processOpeningPositionsFile(content);
  }
  if (name.substring(0, 5) == "trade") {
    return processExchangeTradesFile(content);
  }
  if (name.substring(0, 9) == "addresses") {
    return processAddressFile(content);
  }
  if (name.substring(0, 9) == "transfers") {
    return processOffchainTransfersFile(content);
  }
  if (name.substring(0, 6) == "prices") {
    return processPricesFile(content);
  }
  if (name.substring(0, 8) == "settings") {
    return processSettingsFile(content);
  }
  if (name.substring(0, 8) == "all-data") {
    return processAllDataFile(content);
  }
  //return message
};
function showNotify(fileName) {
  const notif = Notify.create({
    group: false, // required to be updatable
    timeout: 0, // we want to be in control when it gets dismissed
    spinner: true,
    message: `Processing ${fileName}}...`
  });
  return notif;
}
function updateNotif(notif, message, iconName) {
  notif({
    message,
    timeout: 4000,
    spinner: false,
    icon: iconName,
    color: iconName == "done" ? "green" : "red"
  });
}
export const processFiles = async function(fileArray, cb) {
  const reader = new FileReader();
  let currentFileName = null;
  reader.onload = function(event) {
    const notif = showNotify(currentFileName);
    try {
      const result = processFile(
        currentFileName,
        atob(event.target.result.split("base64,")[1])
      );
      updateNotif(
        notif,
        `Processed ${result} records from ${currentFileName}.`,
        "done"
      );
    } catch (error) {
      updateNotif(notif, `${currentFileName}: ${error.message}`, "error");
    }
    currentFileName = null;
    //console.log(atob(event.target.result.split("base64,")[1]));
  };
  for (const f of fileArray) {
    currentFileName = f.name;
    reader.readAsDataURL(f);
    await waitFor(
      () => {
        return currentFileName == null;
      },
      "",
      5000,
      100
    );
  }
};
