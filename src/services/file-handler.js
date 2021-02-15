import { processOpeningPositionsFile } from "./opening-positions-provider";
import { processExchangeTradesFile } from "./exchange-tx-provider";
export const processFile = async function(name, content) {
  //TODO route file to proper processor
  if (name.substring(0, 5) == "openi") {
    processOpeningPositionsFile(content);
  }
  if (name.substring(0, 5) == "trade") {
    await processExchangeTradesFile(content);
  }

  //return message
};
