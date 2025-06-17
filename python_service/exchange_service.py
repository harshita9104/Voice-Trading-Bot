#Specialized service for cryptocurrency exchange interactions
from flask import Flask, jsonify, request
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

class ExchangeService:
    def __init__(self):
        self.exchange_endpoints = {
            "OKX": {
                "symbols": "https://www.okx.com/api/v5/public/instruments?instType=SPOT",
                "price": "https://www.okx.com/api/v5/market/ticker"
            },
            "Bybit": {
                "symbols": "https://api.bybit.com/v5/market/instruments-info?category=spot",
                "price": "https://api.bybit.com/v5/market/tickers"
            },
            "Binance": {
                "symbols": "https://api.binance.com/api/v3/exchangeInfo",
                "price": "https://api.binance.com/api/v3/ticker/price"
            },
            "Deribit": {
                "symbols": "https://www.deribit.com/api/v2/public/get_instruments",
                "price": "https://www.deribit.com/api/v2/public/ticker"
            }
        }
#handles api rate limits and error and standardises data format across exchanges
    def get_symbols(self, exchange):
        try:
            endpoint = self.exchange_endpoints.get(exchange, {}).get("symbols")
            if not endpoint:
                raise ValueError(f"Unsupported exchange: {exchange}")

            response = requests.get(
                endpoint,
                timeout=10,
                headers={"User-Agent": "VoiceTradingBot/1.0"}
            )
            response.raise_for_status()
            data = response.json()

            return self.parse_symbols(exchange, data)
        except Exception as e:
            print(f"Error fetching symbols for {exchange}: {str(e)}")
            raise ValueError(f"Failed to fetch symbols from {exchange}")

    def get_price(self, exchange, symbol):
        try:
            endpoint = self.exchange_endpoints.get(exchange, {}).get("price")
            if not endpoint:
                raise ValueError(f"Unsupported exchange: {exchange}")

            params = self.get_price_params(exchange, symbol)
            response = requests.get(
                endpoint,
                params=params,
                timeout=10,
                headers={"User-Agent": "VoiceTradingBot/1.0"}
            )
            response.raise_for_status()
            data = response.json()

            return self.parse_price(exchange, data, symbol)
        except Exception as e:
            print(f"Error fetching price for {symbol} on {exchange}: {str(e)}")
            raise ValueError(f"Failed to fetch price from {exchange}")

    def parse_symbols(self, exchange, data):
        if exchange == "OKX":
            return [item["instId"] for item in data.get("data", [])[:50]]
        elif exchange == "Bybit":
            return [item["symbol"] for item in data.get("result", {}).get("list", [])[:50]]
        elif exchange == "Binance":
            return [item["symbol"] for item in data.get("symbols", [])[:50]]
        elif exchange == "Deribit":
            return [item["instrument_name"] for item in data.get("result", [])[:50]]
        return []

    def parse_price(self, exchange, data, symbol):
        if exchange == "OKX":
            okx_ticker = next((item for item in data.get("data", []) if item.get("instId") == symbol), None)
            return okx_ticker.get("last") if okx_ticker else None
        elif exchange == "Bybit":
            bybit_ticker = next((item for item in data.get("result", {}).get("list", []) if item.get("symbol") == symbol), None)
            return bybit_ticker.get("lastPrice") if bybit_ticker else None
        elif exchange == "Binance":
            if isinstance(data, list):
                binance_ticker = next((item for item in data if item.get("symbol") == symbol), None)
                return binance_ticker.get("price") if binance_ticker else None
            return data.get("price")
        elif exchange == "Deribit":
            return data.get("result", {}).get("last_price")
        return None

    def get_price_params(self, exchange, symbol):
        if exchange == "OKX":
            return {"instId": symbol}
        elif exchange == "Bybit":
            return {"category": "spot", "symbol": symbol}
        elif exchange == "Binance":
            return {"symbol": symbol}
        elif exchange == "Deribit":
            return {"instrument_name": symbol}
        return {}


exchange_service = ExchangeService()

@app.route('/exchanges', methods=['GET'])
def get_exchanges():
    exchanges = ["OKX", "Bybit", "Deribit", "Binance"]
    return jsonify({"exchanges": exchanges})

@app.route('/symbols/<exchange>', methods=['GET'])
def get_symbols(exchange):
    try:
        symbols = exchange_service.get_symbols(exchange)
        return jsonify({"symbols": symbols})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/price/<exchange>/<symbol>', methods=['GET'])
def get_price(exchange, symbol):
    try:
        price = exchange_service.get_price(exchange, symbol)
        return jsonify({"price": price})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PYTHON_SERVICE_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)