//Fetches real-time market data from exchanges
const axios = require("axios");

class ExchangeService {
  constructor() {
    // Python microservice
    this.pythonServiceURL =
      process.env.PYTHON_SERVICE_URL || "http://localhost:5000";

    // Fallback endpoints if Python service is unavailable
    this.exchangeEndpoints = {
      OKX: {
        symbols: "https://www.okx.com/api/v5/public/instruments?instType=SPOT",
        price: "https://www.okx.com/api/v5/market/ticker",
      },
      Bybit: {
        symbols:
          "https://api.bybit.com/v5/market/instruments-info?category=spot",
        price: "https://api.bybit.com/v5/market/tickers",
      },
      Binance: {
        symbols: "https://api.binance.com/api/v3/exchangeInfo",
        price: "https://api.binance.com/api/v3/ticker/price",
      },
      Deribit: {
        symbols: "https://www.deribit.com/api/v2/public/get_instruments",
        price: "https://www.deribit.com/api/v2/public/ticker",
      },
    };
  }

  async getSymbols(exchange) {
    try {
      // Try to use Python microservice first
      const response = await axios.get(
        `${this.pythonServiceURL}/symbols/${exchange}`,
        {
          timeout: 5000,
        }
      );

      return response.data.symbols;
    } catch (error) {
      console.warn(
        `Python service unavailable, falling back to direct API calls: ${error.message}`
      );

      // Fallback to direct API calls
      return this.getSymbolsDirect(exchange);
    }
  }

  async getPrice(exchange, symbol) {
    try {
      // Try to use Python microservice first
      const response = await axios.get(
        `${this.pythonServiceURL}/price/${exchange}/${symbol}`,
        {
          timeout: 5000,
        }
      );

      return response.data.price;
    } catch (error) {
      console.warn(
        `Python service unavailable, falling back to direct API calls: ${error.message}`
      );

      // Fallback to direct API calls
      return this.getPriceDirect(exchange, symbol);
    }
  }

  // Original methods renamed as fallback methods
  async getSymbolsDirect(exchange) {
    try {
      const endpoint = this.exchangeEndpoints[exchange]?.symbols;
      if (!endpoint) {
        throw new Error(`Unsupported exchange: ${exchange}`);
      }

      const response = await axios.get(endpoint, {
        timeout: 10000,
        headers: {
          "User-Agent": "VoiceTradingBot/1.0",
        },
      });

      return this.parseSymbols(exchange, response.data);
    } catch (error) {
      console.error(`Error fetching symbols for ${exchange}:`, error.message);
      throw new Error(`Failed to fetch symbols from ${exchange}`);
    }
  }

  async getPriceDirect(exchange, symbol) {
    try {
      const endpoint = this.exchangeEndpoints[exchange]?.price;
      if (!endpoint) {
        throw new Error(`Unsupported exchange: ${exchange}`);
      }

      const response = await axios.get(endpoint, {
        params: this.getPriceParams(exchange, symbol),
        timeout: 10000,
        headers: {
          "User-Agent": "VoiceTradingBot/1.0",
        },
      });

      return this.parsePrice(exchange, response.data, symbol);
    } catch (error) {
      console.error(
        `Error fetching price for ${symbol} on ${exchange}:`,
        error.message
      );
      throw new Error(`Failed to fetch price from ${exchange}`);
    }
  }

  parseSymbols(exchange, data) {
    switch (exchange) {
      case "OKX":
        return data.data?.slice(0, 50).map((item) => item.instId) || [];
      case "Bybit":
        return data.result?.list?.slice(0, 50).map((item) => item.symbol) || [];
      case "Binance":
        return data.symbols?.slice(0, 50).map((item) => item.symbol) || [];
      case "Deribit":
        return (
          data.result?.slice(0, 50).map((item) => item.instrument_name) || []
        );
      default:
        return [];
    }
  }

  parsePrice(exchange, data, symbol) {
    switch (exchange) {
      case "OKX":
        const okxTicker = data.data?.find((item) => item.instId === symbol);
        return okxTicker?.last || null;
      case "Bybit":
        const bybitTicker = data.result?.list?.find(
          (item) => item.symbol === symbol
        );
        return bybitTicker?.lastPrice || null;
      case "Binance":
        if (Array.isArray(data)) {
          const binanceTicker = data.find((item) => item.symbol === symbol);
          return binanceTicker?.price || null;
        }
        return data.price || null;
      case "Deribit":
        return data.result?.last_price || null;
      default:
        return null;
    }
  }

  getPriceParams(exchange, symbol) {
    switch (exchange) {
      case "OKX":
        return { instId: symbol };
      case "Bybit":
        return { category: "spot", symbol: symbol };
      case "Binance":
        return { symbol: symbol };
      case "Deribit":
        return { instrument_name: symbol };
      default:
        return {};
    }
  }
}

module.exports = new ExchangeService();
