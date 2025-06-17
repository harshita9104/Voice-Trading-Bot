# Voice Trading Bot

A high-performance, web-based voice trading bot that enables Over-the-Counter (OTC) digital asset trading through voice commands. Users interact with the system using their computer's microphone and speakers through a clean web interface.

## 🎯 Project Overview

This system simulates interactions with an OTC desk, allowing users to place orders through natural voice conversations. The bot guides users through the complete trading process from exchange selection to order confirmation.

##  Architecture

### Frontend
- **HTML/CSS/JavaScript**: Clean, responsive web interface
- **Real-time Updates**: Live conversation transcripts and order summaries
- **Microphone Integration**: Visual feedback for voice interaction status

### Backend
- **Node.js/Express**: Main application server
- **Bland.ai Integration**: Voice processing and conversation management
- **Python Microservice**: Cryptocurrency exchange API integration
- **WebSocket Support**: Real-time communication for voice sessions

### External Services
- **Bland.ai**: Voice AI platform for natural language processing
- **Multiple Exchanges**: OKX, Bybit, Binance, Deribit for market data
- **LocalTunnel**: HTTPS tunneling for webhook delivery

## 🚀 Features

### Voice Interaction
- Web-based voice interface (no phone calls required)
- Natural language processing for trading commands
- Error correction handling ("I meant Bitcoin, not Ethereum")
- Real-time conversation transcripts

### Trading Capabilities
- Support for major cryptocurrency exchanges
- Real-time market price fetching
- Order validation and confirmation
- Flexible symbol recognition (BTC, BTC-USDT, Bitcoin, etc.)

### User Experience
- Clean, professional web interface
- Visual microphone status indicators
- Step-by-step trading guidance
- Comprehensive order summaries

## 📋 Prerequisites

### Software Requirements
- **Node.js** (version 16 or higher)
- **Python** (version 3.8 or higher)
- **npm** (comes with Node.js)
- **Web browser** with microphone support

### API Access
- **Bland.ai account** with API key
- **Internet connection** for exchange API access
- **HTTPS tunnel** capability (LocalTunnel included)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd voice-trading-bot
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Set Up Python Environment
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install Python dependencies
cd python_service
pip install -r requirements.txt
cd ..
```

### 4. Configure Environment Variables
Create a `.env` file in the project root:
```bash
BLAND_API_KEY=your_bland_api_key_here
PORT=3000
BASE_URL=https://your-tunnel-url.loca.lt
PYTHON_SERVICE_URL=http://localhost:5000
PYTHON_SERVICE_PORT=5000
```

## ⚙️ Configuration

### Bland.ai Setup
1. Create account at [bland.ai](https://bland.ai)
2. Generate API key from dashboard
3. Add API key to `.env` file
4. Ensure web SDK access is enabled

### Exchange Configuration
The system supports these exchanges out of the box:
- **OKX**: Global cryptocurrency exchange
- **Bybit**: Derivatives and spot trading
- **Binance**: World's largest crypto exchange
- **Deribit**: Options and futures platform

No additional API keys required for basic price fetching.

##  Running the Application

### Option 1: Run All Services Together
```bash
npm run run-all
```
This command starts:
- LocalTunnel for HTTPS access
- Python exchange service
- Node.js web server

### Option 2: Run Services Individually

**Terminal 1 - Start Tunnel:**
```bash
npm run tunnel
```
Wait for tunnel URL, then update `.env` file with the URL.

**Terminal 2 - Start Python Service:**
```bash
# Activate virtual environment first
.venv\Scripts\activate
npm run start:python
```

**Terminal 3 - Start Web Server:**
```bash
npm start
```

### Option 3: Development Mode
```bash
npm run dev:all
```
Runs with auto-restart on file changes.

## 🎙️ Using the Voice Trading Bot

### 1. Access the Interface
Open your browser and navigate to your tunnel URL (e.g., `https://abc123.loca.lt`)

### 2. Start Voice Session
Click "Start Web Voice Session" button

### 3. Grant Microphone Permission
Allow microphone access when prompted by your browser

### 4. Begin Trading
Follow the voice prompts:
1. **Choose Exchange**: "I want to use Binance"
2. **Select Symbol**: "I want to trade Bitcoin" or "BTC-USDT"
3. **Review Price**: Bot will fetch and announce current market price
4. **Set Quantity**: "I want to buy 0.5 Bitcoin"
5. **Set Price**: "At $45,000 per Bitcoin"
6. **Confirm Order**: Review and confirm your order details

### 5. End Session
Click "End Voice Session" or let the conversation complete naturally

##  Development

### Project Structure
```
voice-trading-bot/
├── public/                 # Frontend files
│   ├── index.html         # Main web interface
│   ├── app.js            # Frontend JavaScript
│   └── styles.css        # Styling
├── routes/               # API endpoints
│   ├── api.js           # Exchange data routes
│   └── bland.js         # Voice session routes
├── services/            # Business logic
│   ├── blandService.js  # Voice AI integration
│   └── exchangeService.js # Market data fetching
├── python_service/      # Python microservice
│   ├── exchange_service.py # Exchange API handlers
│   └── requirements.txt   # Python dependencies
├── server.js           # Main application server
├── tunnel.js          # HTTPS tunnel setup
└── package.json       # Node.js configuration
```


### Voice Session Endpoints

**Start Session**
```http
POST /bland/start-call
Response: { callId, webSocketUrl, status }
```

**Stop Session**
```http
POST /bland/stop-call/:callId
Response: { success: true }
```

**Get Session Status**
```http
GET /bland/call-status/:callId
Response: { status, transcript, currentStep, orderData }
```

### Exchange Data Endpoints

**Get Exchanges**
```http
GET /api/exchanges
Response: { exchanges: ["OKX", "Bybit", "Deribit", "Binance"] }
```

**Get Trading Symbols**
```http
GET /api/symbols/:exchange
Response: { symbols: ["BTC-USDT", "ETH-USDT", ...] }
```

**Get Current Price**
```http
GET /api/price/:exchange/:symbol
Response: { price: "45000.50" }
```

##  Security Considerations

- API keys stored in environment variables
- HTTPS required for voice functionality
- No real trading orders executed
- Webhook validation implemented
- CORS properly configured

## Demo Video:

https://www.loom.com/share/3db3516d1b7347c1a49f45d4e89707fc?sid=87a8b13d-7f3b-4e5c-9e70-2721edaa57c1

## Configuration pathway 
## Selecting exchange
![image](https://github.com/user-attachments/assets/6b321025-ce9f-4cfd-8db3-cb4b1f0cb5f4)

## Selecting symbol

![image](https://github.com/user-attachments/assets/aaefb243-5676-4ef2-a1b7-48bf558be802)

## Fetching price

![image](https://github.com/user-attachments/assets/06ae96f0-091e-4c2f-839a-ce848b44420c)

## Quantity
![image](https://github.com/user-attachments/assets/ac7b56c6-fd49-4dcf-b3b2-97b9f06e6c98)

## Order Confirmation
![image](https://github.com/user-attachments/assets/b4cc19d5-fcc9-474f-8de7-2e8102b4fc9a)
