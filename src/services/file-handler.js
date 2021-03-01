import { processOpeningPositionsFile } from "./opening-positions-provider";
import { processExchangeTradesFile } from "./exchange-tx-provider";
const parse = require("csv-parse/lib/sync");
import Address from "../models/address";
import { actions } from "../boot/actions";
import { Notify } from "quasar";

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
}
export const processFile = function(name, content) {
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
function updateNotif(notif, recordCt, filename) {
  notif({
    message: `Processed ${recordCt} records from ${filename}.`,
    timeout: 4000,
    spinner: false,
    icon: "done"
  });
}
export const processFiles = async function(fileArray, cb) {
  const reader = new FileReader();
  let currentFileName = null;
  reader.onload = function(event) {
    const notif = showNotify(currentFileName);
    const result = processFile(
      currentFileName,
      atob(event.target.result.split("base64,")[1])
    );
    updateNotif(notif, result, currentFileName);
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
