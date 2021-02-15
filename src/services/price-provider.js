import { store } from "../boot/store";
import { actions } from "../boot/actions";
import axios from "axios";

const coinGeckoSymbolMap = {};
coinGeckoSymbolMap["BTC"] = "bitcoin";
coinGeckoSymbolMap["ETH"] = "ethereum";
coinGeckoSymbolMap["CRV"] = "curve-dao-token";

export const getPrice = async function(symbol, tradeDate) {
  const prices = [...store.prices];
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
  let apiUrl = `https://api.coingecko.com/api/v3/coins/${coinGeckoSymbolMap[symbol]}/history?date=${cgTradeDate}&localization=false`;
  try {
    const result = await axios.get(apiUrl);
    const price = parseFloat(result.data.market_data.current_price.usd);
    prices.push({
      symbol,
      date: tradeDate,
      price
    });
    actions.setLocalStorage("prices", prices);
    return price;
  } catch (err) {
    console.log("error getting price: ", err);
  }
};
