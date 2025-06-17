//Integrates with Bland.ai for voice processing
const axios = require("axios");

class BlandService {
  constructor() {
    this.apiKey = process.env.BLAND_API_KEY;
    this.baseURL = "https://api.bland.ai/v1";
    this.activeCalls = new Map();
    this.exchangeService = require("./exchangeService");
  }

  // Creates web-based voice sessions for browser interaction
  async startCall() {
    try {
      if (!this.apiKey) {
        throw new Error("BLAND_API_KEY not configured");
      }

      // Configuration for web-based voice interaction
      // This creates a session that works entirely through the browser
      const callData = {
        task: this.getConversationPrompt(),
        voice: "maya",
        reduce_latency: true,
        webhook: `${process.env.BASE_URL}/bland/webhook`,
        wait_for_greeting: false,
        record: false,
        // Web-based configuration - no phone calls involved
        web: true,
        web_config: {
          auto_connect: true, // Connects automatically to user's microphone
          show_debug: false, // Clean interface for production
        },
      };

      console.log("=== INITIALIZING WEB VOICE SESSION ===");
      console.log("Creating browser-based voice interaction...");
      console.log(
        "Web configuration:",
        JSON.stringify(callData.web_config, null, 2)
      );
      console.log("=====================================");

      const response = await axios.post(`${this.baseURL}/calls`, callData, {
        headers: {
          Authorization: this.apiKey,
          "Content-Type": "application/json",
        },
      });

      console.log("Voice session created successfully:", response.data);

      const callId = response.data.call_id;

      // WebSocket URL for real-time browser communication
      let webSocketUrl = response.data.web_socket_url;

      if (!webSocketUrl) {
        // Create fallback WebSocket URL for browser connectivity
        webSocketUrl = `wss://api.bland.ai/v1/ws/${callId}`;
        console.log("Using fallback WebSocket URL for browser connection");
      }

      // Store session information for tracking
      this.activeCalls.set(callId, {
        status: "active",
        startTime: new Date(),
        transcript: [],
        orderData: {},
        webSocketUrl: webSocketUrl,
        connectionType: "web-browser", // Indicates browser-based session
      });

      return {
        callId: callId,
        webSocketUrl: webSocketUrl,
        status: "started",
        isWebCall: true,
        connectionType: "web-microphone",
      };
    } catch (error) {
      console.error(
        "Error starting web voice session:",
        error.response?.data || error.message
      );
      throw new Error("Failed to start web-based voice session");
    }
  }

  // Stops the web voice session
  async stopCall(callId) {
    try {
      await axios.post(
        `${this.baseURL}/calls/${callId}/stop`,
        {},
        {
          headers: {
            Authorization: this.apiKey,
          },
        }
      );

      this.activeCalls.delete(callId);
      return { success: true };
    } catch (error) {
      console.error(
        "Error stopping web session:",
        error.response?.data || error.message
      );
      throw new Error("Failed to stop web session");
    }
  }

  // Retrieves current status of the voice session
  async getCallStatus(callId) {
    try {
      const response = await axios.get(`${this.baseURL}/calls/${callId}`, {
        headers: {
          Authorization: this.apiKey,
        },
      });

      const callInfo = this.activeCalls.get(callId) || {};

      // Fetch market price if we have exchange and symbol information
      if (
        callInfo.orderData &&
        callInfo.orderData.exchange &&
        callInfo.orderData.symbol &&
        !callInfo.orderData.marketPrice
      ) {
        try {
          const price = await this.exchangeService.getPrice(
            callInfo.orderData.exchange,
            callInfo.orderData.symbol
          );
          if (price) {
            callInfo.orderData.marketPrice = price;
          }
        } catch (error) {
          console.error("Error fetching market price:", error);
        }
      }

      return {
        status: response.data.status,
        transcript: callInfo.transcript || [],
        currentStep: this.getCurrentStep(callInfo),
        orderData: callInfo.orderData || {},
      };
    } catch (error) {
      console.error(
        "Error getting session status:",
        error.response?.data || error.message
      );
      return {
        status: "error",
        transcript: [],
        currentStep: "Error",
        orderData: {},
      };
    }
  }

  // Processes incoming webhook data from Bland.ai
  handleWebhook(data) {
    const callId = data.call_id;
    if (!callId) return;

    const callInfo = this.activeCalls.get(callId) || {
      transcript: [],
      orderData: {},
    };

    // Update conversation transcript
    if (data.transcript) {
      callInfo.transcript = data.transcript;
    }

    // Extract trading information from user's speech
    if (data.transcript) {
      this.extractOrderData(data.transcript, callInfo.orderData);
    }

    this.activeCalls.set(callId, callInfo);
  }

  // Extracts trading information from conversation transcript
  // Handles user corrections like "I meant Bitcoin, not Ethereum"
  extractOrderData(transcript, orderData) {
    // Process the entire conversation to handle corrections and updates
    for (let i = 0; i < transcript.length; i++) {
      const message = transcript[i];
      if (message.role !== "user") continue;

      const content = message.content.toLowerCase();

      // Handle user corrections and changes
      if (
        content.includes("i meant") ||
        content.includes("not") ||
        content.includes("instead") ||
        content.includes("change")
      ) {
        this.handleCorrection(content, orderData);
        continue;
      }

      // Extract exchange selection
      const exchanges = ["okx", "bybit", "deribit", "binance"];
      for (const ex of exchanges) {
        if (content.includes(ex)) {
          orderData.exchange = ex.toUpperCase();
        }
      }

      // Extract trading symbol with flexible pattern matching
      const symbolPatterns = [
        /\b(btc[-\/]?usdt)\b/i,
        /\b(eth[-\/]?usdt)\b/i,
        /\b(sol[-\/]?usdt)\b/i,
        /\b(xrp[-\/]?usdt)\b/i,
        /\b(bnb[-\/]?usdt)\b/i,
        /\b(ada[-\/]?usdt)\b/i,
        /\b(doge[-\/]?usdt)\b/i,
        /\b([A-Z]{2,10}[-\/]?[A-Z]{2,10})\b/g,
      ];

      for (const pattern of symbolPatterns) {
        const match = content.match(pattern);
        if (match) {
          orderData.symbol = match[0].toUpperCase();
          break;
        }
      }

      // Extract quantity with improved recognition
      const quantityPatterns = [
        /(\d+(?:\.\d+)?)\s*(?:units?|coins?|tokens?)/i,
        /buy\s*(\d+(?:\.\d+)?)/i,
        /sell\s*(\d+(?:\.\d+)?)/i,
        /(\d+(?:\.\d+)?)\s*(?:btc|eth|sol|xrp|bnb|ada|doge)/i,
        /quantity\s*(?:of|is|:)?\s*(\d+(?:\.\d+)?)/i,
        /(\d+(?:\.\d+)?)\s*(?:units?|coins?|tokens?)?/i,
      ];

      for (const pattern of quantityPatterns) {
        const match = content.match(pattern);
        if (match) {
          orderData.quantity = match[1];
          break;
        }
      }

      // Extract price information
      const pricePatterns = [
        /(?:at|for|price|cost|worth)\s*(?:of|is|:)?\s*(?:\$|usd)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
        /(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:dollars?|usd|\$)/i,
        /price\s*(?:of|is|:)?\s*(?:\$|usd)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i,
      ];

      for (const pattern of pricePatterns) {
        const match = content.match(pattern);
        if (match) {
          // Clean up price format (remove commas)
          orderData.price = match[1].replace(/,/g, "");
          break;
        }
      }
    }
  }

  // Handles user corrections and updates to their order
  handleCorrection(content, orderData) {
    // Handle exchange corrections
    if (content.includes("exchange")) {
      const exchanges = ["okx", "bybit", "deribit", "binance"];
      for (const ex of exchanges) {
        if (content.includes(ex)) {
          orderData.exchange = ex.toUpperCase();
          break;
        }
      }
    }

    // Handle symbol corrections with common name mapping
    if (
      content.includes("symbol") ||
      content.includes("bitcoin") ||
      content.includes("ethereum") ||
      content.includes("coin")
    ) {
      // Map spoken names to trading symbols
      const symbolMap = {
        bitcoin: "BTC-USDT",
        btc: "BTC-USDT",
        ethereum: "ETH-USDT",
        eth: "ETH-USDT",
        solana: "SOL-USDT",
        sol: "SOL-USDT",
        ripple: "XRP-USDT",
        xrp: "XRP-USDT",
        "binance coin": "BNB-USDT",
        bnb: "BNB-USDT",
        cardano: "ADA-USDT",
        ada: "ADA-USDT",
        dogecoin: "DOGE-USDT",
        doge: "DOGE-USDT",
      };

      for (const [name, symbol] of Object.entries(symbolMap)) {
        if (content.includes(name)) {
          orderData.symbol = symbol;
          break;
        }
      }
    }

    // Handle quantity corrections
    if (content.includes("quantity") || content.includes("amount")) {
      const quantityPattern = /(\d+(?:\.\d+)?)/;
      const match = content.match(quantityPattern);
      if (match) {
        orderData.quantity = match[1];
      }
    }

    // Handle price corrections
    if (
      content.includes("price") ||
      content.includes("cost") ||
      content.includes("dollars")
    ) {
      const pricePattern = /(\d+(?:,\d+)*(?:\.\d+)?)/;
      const match = content.match(pricePattern);
      if (match) {
        orderData.price = match[1].replace(/,/g, "");
      }
    }
  }

  // Determines current step in the trading process
  getCurrentStep(callInfo) {
    const orderData = callInfo.orderData || {};

    if (!orderData.exchange) return "Selecting Exchange";
    if (!orderData.symbol) return "Choosing Symbol";
    if (!orderData.quantity || !orderData.price) return "Setting Order Details";
    return "Confirming Order";
  }

  // Defines the conversation flow for the trading bot
  getConversationPrompt() {
    return `You are a professional OTC trading desk assistant. You help users place Over-the-Counter digital asset orders through voice interaction in their web browser.

IMPORTANT: This is a web-based voice system. Users speak through their computer's microphone and hear responses through their speakers.

Follow this structured conversation flow:

1. GREETING: Welcome the user and explain you'll help them place an OTC order through voice commands.

2. EXCHANGE SELECTION: Ask them to choose from: OKX, Bybit, Deribit, or Binance. Wait for their selection before proceeding.

3. SYMBOL SELECTION: Once they choose an exchange, ask which cryptocurrency they want to trade. Suggest popular options like BTC-USDT, ETH-USDT, or SOL-USDT if they need help.

4. PRICE INFORMATION: After symbol selection, tell them you're checking the current market price. Say "Let me check the current price for [SYMBOL] on [EXCHANGE]..." then provide the price.

5. ORDER DETAILS: Ask for their desired quantity and price for the OTC order. If they only give one detail, ask for the missing information.

6. CONFIRMATION: Repeat all order details back to them for confirmation: "I'll place an order for [QUANTITY] [SYMBOL] at [PRICE] on [EXCHANGE]. Is this correct?"

Important conversation guidelines:
- Speak clearly and professionally
- Be patient and helpful
- Handle corrections gracefully (like "I meant Bitcoin, not Ethereum")
- Ask for clarification if anything is unclear
- Don't place real orders - just confirm the details
- Keep responses concise but informative
- Always wait for user response before moving to next step

Remember: This is a browser-based voice interface for OTC trading assistance.`;
  }
}

module.exports = new BlandService();
