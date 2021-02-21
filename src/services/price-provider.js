import { store } from "../boot/store";
import { actions } from "../boot/actions";
import axios from "axios";
import { throttle } from "../utils/cacheUtils";

const coinGeckoSymbolMap = {};
coinGeckoSymbolMap["BTC"] = "bitcoin";
coinGeckoSymbolMap["ETH"] = "ethereum";
coinGeckoSymbolMap["CRV"] = "curve-dao-token";
let lastRequestTime = 0;
export const getPrice = async function(symbol, tradeDate) {
  const prices = actions.getData("prices");
  const tradeDatePrice = prices.find(
    p => p.symbol == symbol && p.tradeDate == tradeDate
  );

  if (tradeDatePrice) {
    return tradeDatePrice.price;
  }

  //Get price from Coingecko
  if (!coinGeckoSymbolMap[symbol]) return -1;

  const cgTradeDate =
    tradeDate.substring(6, 8) +
    tradeDate.substring(2, 5) +
    "-20" +
    tradeDate.substring(0, 2);
  lastRequestTime = await throttle(lastRequestTime, 50); //100req's per minute
  let apiUrl = `https://api.coingecko.com/api/v3/coins/${coinGeckoSymbolMap[symbol]}/history?date=${cgTradeDate}&localization=false`;
  try {
    while (new Date().getTime() - lastRequestTime < 60000) {
      const result = await axios.get(apiUrl);
      if (result.status != 200) {
        //throw new Error("Invalid return status: " + result.data.message);
        console.log("Throttling for 10 seconds...");
        await throttle(lastRequestTime, 10000);
        continue;
      }
      const price = parseFloat(
        result.data.market_data
          ? result.data.market_data.current_price.usd
          : 0.0
      );
      prices.push({
        symbol,
        tradeDate,
        price
      });
      actions.setData("prices", prices);
      return price;
    }
  } catch (err) {
    console.log("error getting price: ", err);
  }
  return 0.0;
};
