import { processOpeningPositionsFile } from "./opening-positions-provider";
import { processExchangeTradesFile } from "./exchange-tx-provider";
const parse = require("csv-parse/lib/sync");
import Address from "../models/address";
import { actions } from "../boot/actions";
function processAddressFile(content) {
  const stageOpeningData = parse(content, {
    trim: true,
    columns: true,
    skip_empty_lines: true
  });
  const addresses = stageOpeningData.map(a => new Address(a));
  actions.setObservableData("addresses", addresses);
}
export const processFile = async function(name, content) {
  //TODO route file to proper processor
  if (name.substring(0, 5) == "openi") {
    processOpeningPositionsFile(content);
  }
  if (name.substring(0, 5) == "trade") {
    await processExchangeTradesFile(content);
  }
  if (name.substring(0, 9) == "addresses") {
    processAddressFile(content);
  }
  //return message
};
